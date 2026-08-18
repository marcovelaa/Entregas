# Exploration: crear-usuario-codigo-referido

## Current State

End-to-end flow for `POST /usuarios` and `codigoReferido`:

1. `apps/api/src/modules/iam/application/dtos/crear-usuario.dto.ts:35-37` — `codigoReferido?: string` has `@IsOptional() @IsString()` only, no `@MaxLength`. Column is `VARCHAR(50)`.
2. `apps/api/src/modules/iam/infrastructure/controllers/usuarios.controller.ts:50-66` — `POST /usuarios` guarded by `@RequierePermiso('iam:usuarios:cambiar_rol')` (backoffice-only, not customer self-registration).
3. `apps/api/src/modules/iam/application/use-cases/usuarios/crear-usuario.use-case.ts:17-46` — validates `rolId`, checks email uniqueness via `findByEmail` → `UsuarioDuplicadoException` (409), hashes password, calls `Usuario.crear(...)` passing `dto.codigoReferido` verbatim (line 42) with no uniqueness check.
4. `apps/api/src/modules/iam/domain/entities/usuario.entity.ts:18-42` — `Usuario.crear()` only does `codigoReferido || null`. No generation logic exists anywhere in the codebase.
5. `apps/api/src/modules/iam/domain/repositories/usuario.repository.interface.ts:5-13` — `IUsuarioRepository` has `findByEmail` but no `findByCodigoReferido`.
6. `apps/api/src/modules/iam/infrastructure/repositories/prisma-usuario.repository.ts:55-69` — `save()` maps directly to `codigo_referido`, relies solely on the Postgres unique constraint.
7. `apps/api/prisma/schema.prisma:33` — `codigo_referido String? @unique @db.VarChar(50)`.
8. `apps/api/prisma/migrations/20260803083000_init/migration.sql:23,397` — column + `usuarios_codigo_referido_key` UNIQUE INDEX confirmed applied (not just schema-only).
9. `apps/api/src/common/filters/prisma-exception.filter.ts:16-24` — P2002 → generic 409 `"Ya existe un registro con ese valor en 'codigo_referido'"`. This is what fires today on a duplicate (DB-level catch, not business-level).
10. `apps/api/src/common/filters/domain-exception.filter.ts:13-20` — maps `UsuarioDuplicadoException`/`EmailDuplicadoException` → 409 with a clean domain message. This is the exact pattern to replicate for `codigoReferido`.

**New finding**: `apps/admin/src/app/configuracion/usuarios/page.tsx` is the only "Crear Usuario" UI in the repo. Its create-form state (lines 16-21), POST body (59-65), and JSX inputs (246-303) have **no `codigoReferido` field at all**. Same for edit: `UpdateUsuarioDto` has no `codigoReferido`, and `EditarUsuarioUseCase.execute()` never touches it — the field is unreachable to edit once set. Today "manual assignment" is only possible via a raw API call (Postman/curl); the real backoffice UI cannot set it. Error handling is a blanket `alert(error.response?.data?.message || "Error al crear usuario")` (line 71) — no per-field validation or client-side length cap.

A repo-wide grep for `codigoReferido|codigo_referido` outside build artifacts returns exactly 7 files, all pure plumbing (schema, entity, use case, DTO, controller, Prisma repo, migration). Nothing in `ventas`/`pedidos`/`descuentos` consumes it for any business rule yet.

## Affected Areas

- `apps/api/src/modules/iam/application/dtos/crear-usuario.dto.ts` — add `@MaxLength(50)`.
- `apps/api/src/modules/iam/domain/repositories/usuario.repository.interface.ts` — add `findByCodigoReferido` signature.
- `apps/api/src/modules/iam/infrastructure/repositories/prisma-usuario.repository.ts` — add `findByCodigoReferido` implementation.
- `apps/api/src/modules/iam/application/use-cases/usuarios/crear-usuario.use-case.ts` — add conditional uniqueness check (mirrors `findByEmail`).
- `apps/api/src/modules/iam/application/use-cases/usuarios/crear-usuario.use-case.spec.ts` (new) — zero existing coverage.
- `apps/admin/src/app/configuracion/usuarios/page.tsx` — add `codigoReferido` input to the create form (edit form/`UpdateUsuarioDto`/`EditarUsuarioUseCase` only if edit scope is confirmed with the user).

## Approaches

1. **Backend-only fix** — `@MaxLength(50)` on the DTO + use-case-level `findByCodigoReferido` uniqueness check mirroring the existing email pattern.
   - Pros: small, safe, matches existing conventions, easily testable.
   - Cons: backoffice UI still has zero field to type `codigoReferido` — manual assignment stays Postman-only.
   - Effort: Low.

2. **Backend fix + frontend create-form field** — same as (1) plus a `codigoReferido` input (with `maxLength={50}`) in the "Crear Usuario" modal, wired into the POST body.
   - Pros: actually makes manual assignment usable through the real UI, not just direct API calls.
   - Cons: touches `apps/admin` too; needs explicit scope confirmation.
   - Effort: Low-Medium.

3. **Full fix including edit support** — (1) + (2) + `codigoReferido` in `UpdateUsuarioDto`/`EditarUsuarioUseCase`/edit form.
   - Pros: fixes the "immutable after creation" gap.
   - Cons: expands scope past "crear usuario"; the change name implies creation-only.
   - Effort: Medium.

## Recommendation

Approach 2. A backend-only fix (1) leaves the stated goal — working manual assignment — practically unmet, since the actual backoffice UI has no way to enter the code at all today. Approach 3 (edit support) should be raised as an explicit scope question in `sdd-propose`, not assumed, since the change name and prior confirmation from the user point to creation-time scope only.

## Risks

- Scope ambiguity: "que funcione correctamente" could mean backend-only or could reasonably include making the field enterable in the UI — needs explicit confirmation in `sdd-propose`.
- Switching duplicate-`codigoReferido` handling from the generic `PrismaExceptionFilter` 409 to the domain-level `DomainExceptionFilter` 409 changes the response message text — verify no client depends on the old generic Postgres-derived message.
- `codigoReferido` is entirely absent from the edit flow — once set at creation it cannot be corrected without direct DB/API access; flagged as a likely out-of-scope gap, not silently included.
- Zero test coverage today in `iam/application/use-cases/usuarios/` — the fix should ship with a new use-case spec following the `auth.service.spec.ts` mock-harness convention (plain class + `jest.Mocked<IUsuarioRepository>`, no NestJS `TestingModule`).

## Ready for Proposal

Yes — investigation is complete and specific enough for `sdd-propose`. The proposal should explicitly ask the user to confirm scope: backend-only vs. backend+frontend-create (recommended) vs. also edit support.
