# Design: Crear Usuario - Código Referido Robusto

## Technical Approach

Mirror the existing email-uniqueness chain exactly: DTO constraint →
repository lookup → use-case guard → `DomainException` subclass →
`DomainExceptionFilter` STATUS_MAP → clean 409. No schema, migration, route,
or DI-wiring change. Frontend adds one optional controlled input plus an
in-form error banner replacing the blanket `alert(...)`.

## Architecture Decisions

### Decision: Use-case guard instead of catching P2002

**Choice**: Query `findByCodigoReferido` before persisting; throw a domain
exception. **Alternatives**: keep relying on `PrismaExceptionFilter` P2002; catch
P2002 in the use case and re-map. **Rationale**: `UsuarioDuplicadoException` for
email already sets the house pattern; a DB-error translation layer would be a
second, inconsistent convention. Race-condition risk stays covered because the
`usuarios_codigo_referido_key` UNIQUE INDEX and `PrismaExceptionFilter` remain
the untouched backstop.

### Decision: Email duplicate wins when both are duplicated

**Choice**: keep `findByEmail` first; the código check runs after it.
**Alternatives**: código first; aggregate both errors. **Rationale**: email is the
login identity, and reordering would silently change the error today's callers
already receive. Aggregation has no precedent in this codebase.

### Decision: Both guards run before bcrypt hashing

**Choice**: rol → email → código → `bcrypt.hash` → `Usuario.crear` → `save`.
**Alternatives**: check código after hashing (minimal diff). **Rationale**: one early
validation block avoids paying ~100 ms of bcrypt cost on a request that is
already doomed, and keeps all rejection paths free of side effects.

### Decision: Exact-string match, empty string treated as absent

**Choice**: guard runs only under `if (dto.codigoReferido)`; no trim/case
normalization. **Alternatives**: normalize to uppercase. **Rationale**: `Usuario.crear`
already collapses falsy to `null`, so a truthy guard matches entity semantics;
normalizing would change what gets stored and is out of scope.

## Data Flow

    Admin form ──POST /usuarios──→ CrearUsuarioDto (@MaxLength(50))
                                          │ 400 on overflow
                                          ▼
                              CrearUsuarioUseCase.execute()
                          rol → findByEmail → findByCodigoReferido
                                          │ throws
                                          ▼
                    DomainExceptionFilter (STATUS_MAP → 409, clean message)
                                          │
                                          ▼
                        errorBanner in create modal (no alert)

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `apps/api/src/modules/iam/application/dtos/crear-usuario.dto.ts` | Modify | Add `@MaxLength(50)` on `codigoReferido`; add `MaxLength` to the `class-validator` import |
| `apps/api/src/modules/iam/domain/exceptions/iam.exceptions.ts` | Modify | Add `export class CodigoReferidoDuplicadoException extends DomainException {}` (empty body; inherits `constructor(message: string)`) |
| `apps/api/src/common/filters/domain-exception.filter.ts` | Modify | Import it and add `[CodigoReferidoDuplicadoException, HttpStatus.CONFLICT]` to STATUS_MAP |
| `apps/api/src/modules/iam/domain/repositories/usuario.repository.interface.ts` | Modify | Add `findByCodigoReferido` right after `findByEmail` |
| `apps/api/src/modules/iam/infrastructure/repositories/prisma-usuario.repository.ts` | Modify | Implement it with `findUnique` + `mapToDomain` |
| `apps/api/src/modules/iam/application/use-cases/usuarios/crear-usuario.use-case.ts` | Modify | Add the guard after the email check |
| `apps/api/src/modules/iam/application/use-cases/usuarios/crear-usuario.use-case.spec.ts` | Create | Use-case coverage (none today) |
| `apps/api/src/modules/iam/auth/auth.service.spec.ts` | Modify | Add `findByCodigoReferido: jest.fn()` to the existing mock literal (lines 33-41) — otherwise the widened interface breaks compilation |
| `apps/admin/src/app/configuracion/usuarios/page.tsx` | Modify | Field, POST body, error state |
| `apps/admin/src/app/configuracion/usuarios/page.module.css` | Modify | Add `.errorBanner` (copy of `DiscountForm.module.css:256-264`) |

## Interfaces / Contracts

```typescript
// usuario.repository.interface.ts
findByCodigoReferido(codigoReferido: string): Promise<Usuario | null>;

// prisma-usuario.repository.ts
async findByCodigoReferido(codigoReferido: string): Promise<Usuario | null> {
  const user = await this.prisma.usuario.findUnique({
    where: { codigo_referido: codigoReferido },
  });
  return user ? this.mapToDomain(user) : null;
}

// crear-usuario.use-case.ts — after the findByEmail guard, before bcrypt
if (dto.codigoReferido) {
  const existeCodigo = await this.usuarioRepository.findByCodigoReferido(
    dto.codigoReferido,
  );
  if (existeCodigo) {
    throw new CodigoReferidoDuplicadoException(
      `El código de referido ${dto.codigoReferido} ya está en uso.`,
    );
  }
}
```

`findUnique` is legal because `codigo_referido` is `@unique` in
`schema.prisma:33`; the non-nullable `string` parameter keeps it out of
Prisma's null-on-unique restriction.

**Frontend contract** (`page.tsx`): `formData` gains `codigoReferido: ''`; new
`const [createError, setCreateError] = useState<string | null>(null)`. The new
`div.formGroup` is the **last** field in the create form — after "Contraseña
temporal", before `formActions` — with label `Código de referido (opcional)`,
`type="text"`, `maxLength={50}`, no `required`. POST body sends
`codigoReferido: formData.codigoReferido.trim() || undefined`. `handleCreate`
calls `setCreateError(null)` first; its `catch` sets the banner instead of
`alert`, normalizing class-validator array payloads:
`Array.isArray(m) ? m.join(', ') : m`. Render
`{createError && <div className={styles.errorBanner}>{createError}</div>}` at
the top of the form. Reset and modal close clear both `codigoReferido` and
`createError`.

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Unit | `CrearUsuarioUseCase` | New spec, `auth.service.spec.ts` harness style: plain `new CrearUsuarioUseCase(usuarioRepo, rolRepo)` with `jest.Mocked<IUsuarioRepository>` / `jest.Mocked<IRolRepository>` literals, no `TestingModule` |
| Integration | 400 on 51-char código; 409 body/message | Manual/QA against the running API |
| E2E | Create-form field + banner | Manual QA in the admin backoffice |

Required cases in `crear-usuario.use-case.spec.ts`:

1. Rol inexistente → `RolNoEncontradoException` (regression guard).
2. Happy path sin código → `save` called with `codigoReferido: null`;
   `findByCodigoReferido` **not** called.
3. Happy path con código → `findByCodigoReferido` called with the exact string;
   `save` receives that same value.
4. Email duplicado → `UsuarioDuplicadoException`; `save` not called.
5. Código duplicado → `CodigoReferidoDuplicadoException`; `save` not called.
6. Ambos duplicados → `UsuarioDuplicadoException` (email wins);
   `findByCodigoReferido` not called.
7. Case-sensitivity → repo returns `null` for `'ABC'` when `'abc'` exists;
   creation succeeds (proves no normalization).

## Threat Matrix

N/A — no routing, shell, subprocess, VCS/PR automation, executable-file
classification, or process-integration boundary. `POST /usuarios` and its
`@RequierePermiso('iam:usuarios:cambiar_rol')` guard are unchanged.

## Migration / Rollout

No migration required. The column and its UNIQUE INDEX already exist
(`20260803083000_init/migration.sql:23,397`).

**Rollback**: revert the frontend commit, the backend commit, or both, in any
order — they are independent. Frontend-only revert leaves backend validation
intact. Backend-only revert leaves the form field working, since the DTO still
accepts `codigoReferido` and duplicates fall back to the generic
`PrismaExceptionFilter` 409. No data is written that needs undoing.

## Open Questions

- [ ] None.
