# Proposal: Crear Usuario - Código Referido Robusto

## Intent

`codigoReferido` on user creation has two gaps. Backend: the DTO has no
`@MaxLength` even though the column is `VARCHAR(50)` and `@unique`, and
duplicates are only caught by the raw Postgres P2002 constraint surfaced
through the generic `PrismaExceptionFilter` message — not a clean domain
check like the existing email-uniqueness pattern. Frontend: the only
"Crear Usuario" UI in the repo (`apps/admin/.../usuarios/page.tsx`) has no
input for `codigoReferido` at all, so manual assignment — the intended
workflow — is only possible via direct API calls (Postman/curl), not
through the real backoffice tool. This is a hardening fix to make manual
assignment actually usable and consistent with existing validation
conventions, not a redesign.

## Scope

### In Scope
- `@MaxLength(50)` on `codigoReferido` in `CrearUsuarioDto`
- `findByCodigoReferido` on `IUsuarioRepository` + Prisma implementation
- Use-case-level uniqueness check in `CrearUsuarioUseCase`, mirroring the
  email check, throwing a new `CodigoReferidoDuplicadoException` wired
  through `domain-exception.filter.ts` (409, clean message)
- New `crear-usuario.use-case.spec.ts` (zero coverage today), following
  the `auth.service.spec.ts` mock-harness style
- `codigoReferido` input (client `maxLength={50}`) in the admin
  "Crear Usuario" form, wired into the POST body, with the backend's
  duplicate-code error surfaced clearly (not a generic alert)

### Out of Scope
- Editing `codigoReferido` after creation — `UpdateUsuarioDto`,
  `EditarUsuarioUseCase`, and the edit form stay untouched
- Any auto-generation logic — assignment stays manual by design

## Capabilities

### New Capabilities
None

### Modified Capabilities
- `iam-backend`: user creation now validates `codigoReferido` length and
  enforces uniqueness at the use-case/domain layer, returning a clean
  domain error instead of relying solely on the raw DB constraint error.

## Approach

Mirror the existing email-uniqueness pattern end to end: DTO validation →
repository lookup → use-case check → domain exception → filter mapping.
On the frontend, extend the existing create form with one more controlled
input; no new components or endpoints.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `apps/api/.../dtos/crear-usuario.dto.ts` | Modified | Add `@MaxLength(50)` |
| `apps/api/.../domain/repositories/usuario.repository.interface.ts` | Modified | Add `findByCodigoReferido` |
| `apps/api/.../infrastructure/repositories/prisma-usuario.repository.ts` | Modified | Implement `findByCodigoReferido` |
| `apps/api/.../domain/exceptions/iam.exceptions.ts` | Modified | Add `CodigoReferidoDuplicadoException` |
| `apps/api/.../common/filters/domain-exception.filter.ts` | Modified | Map new exception to 409 |
| `apps/api/.../use-cases/usuarios/crear-usuario.use-case.ts` | Modified | Add uniqueness check |
| `apps/api/.../use-cases/usuarios/crear-usuario.use-case.spec.ts` | New | Use-case coverage |
| `apps/admin/src/app/configuracion/usuarios/page.tsx` | Modified | Add create-form field + error surfacing |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Duplicate-code error message text changes for any existing client parsing it | Low | No known client parses the old generic Postgres message; verify in spec/QA |
| Frontend field left optional but not clearly labeled, confusing operators | Low | Reuse existing form-field patterns/labels already in the page |

## Rollback Plan

Backend and frontend changes are independent commits with no schema
migration. Revert the frontend commit to remove the input without
affecting backend validation; revert the backend commit to fall back to
DB-only duplicate detection. No data changes to roll back.

## Dependencies

None.

## Success Criteria

- [ ] Creating a user with a `codigoReferido` over 50 chars is rejected
      with a 400 validation error
- [ ] Creating a user with a duplicate `codigoReferido` returns a clean
      409 domain error (not the generic Prisma message)
- [ ] `crear-usuario.use-case.spec.ts` covers both new checks
- [ ] The admin "Crear Usuario" form has a working `codigoReferido` field
      that surfaces the duplicate error to the operator
