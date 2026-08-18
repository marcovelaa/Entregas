# Tasks: Crear Usuario - Código Referido Robusto

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~230-300 (dominated by new `crear-usuario.use-case.spec.ts`, ~130-170 lines for 7 cases) |
| 400-line budget risk | Low |
| Chained PRs recommended | No |
| Suggested split | Single PR |
| Delivery strategy | ask-on-risk |
| Chain strategy | N/A |

Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: N/A
400-line budget risk: Low

### Suggested Work Units

| Unit | Goal | Likely PR | Focused test command | Runtime harness | Rollback boundary |
|------|------|-----------|----------------------|-----------------|-------------------|
| 1 | Backend: DTO limit, uniqueness guard, exception mapping, repo method, use-case spec | PR 1 (commit 1) | `cd apps/api && npx jest crear-usuario.use-case.spec.ts auth.service.spec.ts` | Manual: `POST /usuarios` with 51-char `codigoReferido` → 400; duplicate → 409 clean message | Revert backend commit; Prisma UNIQUE constraint stays as DB-only backstop |
| 2 | Frontend: create-form field + error banner | PR 1 (commit 2) | `cd apps/admin && npx tsc --noEmit` | Manual QA: open "Crear Usuario", submit duplicate código, verify banner (not `alert`) | Revert frontend commit; backend validation unaffected |

## Phase 1: Domain & Contract Foundations

- [x] 1.1 Add `@MaxLength(50)` to `codigoReferido` in `apps/api/src/modules/iam/application/dtos/crear-usuario.dto.ts`; add `MaxLength` to the `class-validator` import. *(Requirement: Código Referido Length Validation)*
- [x] 1.2 Add `export class CodigoReferidoDuplicadoException extends DomainException {}` to `apps/api/src/modules/iam/domain/exceptions/iam.exceptions.ts` (empty body, inherits `constructor(message)`). *(Requirement: Código Referido Uniqueness Enforcement)*
- [x] 1.3 Add `findByCodigoReferido(codigoReferido: string): Promise<Usuario | null>` to `IUsuarioRepository` in `usuario.repository.interface.ts`, right after `findByEmail`.
- [x] 1.4 **[non-obvious]** Import `CodigoReferidoDuplicadoException` in `apps/api/src/common/filters/domain-exception.filter.ts` and add `[CodigoReferidoDuplicadoException, HttpStatus.CONFLICT]` to `STATUS_MAP`. Without this, the exception falls through to the filter's default status instead of the required 409.
- [x] 1.5 **[non-obvious]** Add `findByCodigoReferido: jest.fn()` to the existing `usuarioRepo` mock literal in `apps/api/src/modules/iam/auth/auth.service.spec.ts` (lines 33-41). The widened `IUsuarioRepository` interface otherwise breaks this file's compilation.

## Phase 2: Repository Implementation

- [x] 2.1 Implement `findByCodigoReferido` in `apps/api/src/modules/iam/infrastructure/repositories/prisma-usuario.repository.ts` using `this.prisma.usuario.findUnique({ where: { codigo_referido: codigoReferido } })` + existing `mapToDomain`.

## Phase 3: Use-Case Guard (TDD)

- [x] 3.1 RED — Create `apps/api/src/modules/iam/application/use-cases/usuarios/crear-usuario.use-case.spec.ts`, mirroring `auth.service.spec.ts`'s harness (plain `new CrearUsuarioUseCase(usuarioRepo, rolRepo)`, `jest.Mocked<IUsuarioRepository>`/`jest.Mocked<IRolRepository>` literals, no `TestingModule`). Cover all 7 required cases: (1) rol inexistente → `RolNoEncontradoException`; (2) sin código → `save` called with `codigoReferido: null`, `findByCodigoReferido` not called; (3) con código → `findByCodigoReferido` called with exact string, `save` receives same value; (4) email duplicado → `UsuarioDuplicadoException`, `save` not called; (5) código duplicado → `CodigoReferidoDuplicadoException`, `save` not called; (6) ambos duplicados → `UsuarioDuplicadoException` wins, `findByCodigoReferido` not called; (7) case-sensitivity → repo returns `null` for `'ABC'` when `'abc'` exists, creation succeeds. Confirm cases 3/5/6/7 fail against today's use-case (RED). *(Requirements: Código Referido Uniqueness Enforcement, Código Referido Remains Optional)* — RED confirmed: 3/7 failed (cases 3, 5, 7); case 6 passed trivially pre-guard because the email check already short-circuited before any código logic existed.
- [x] 3.2 GREEN — In `crear-usuario.use-case.ts`, add the código guard after the `findByEmail` check and before `bcrypt.hash`: `if (dto.codigoReferido) { const existeCodigo = await this.usuarioRepository.findByCodigoReferido(dto.codigoReferido); if (existeCodigo) throw new CodigoReferidoDuplicadoException(...) }`; import `CodigoReferidoDuplicadoException`.
- [x] 3.3 REFACTOR — Run `cd apps/api && npx jest crear-usuario.use-case.spec.ts auth.service.spec.ts`; confirm all 7 new cases and the existing `auth.service.spec.ts` suite pass with zero regressions. Result: 28/28 passed. Code already matched the mirrored email-guard style; no refactor needed.

## Phase 4: Frontend Form

- [x] 4.1 Add `.errorBanner` class to `apps/admin/src/app/configuracion/usuarios/page.module.css`, copied from `DiscountForm.module.css:256-264`.
- [x] 4.2 Add `codigoReferido: ''` to the create-form `formData` state and `const [createError, setCreateError] = useState<string | null>(null)` in `page.tsx`.
- [x] 4.3 Add the `codigoReferido` `formGroup` as the last field in the create form (after "Contraseña temporal", before `formActions`): label `Código de referido (opcional)`, `type="text"`, `maxLength={50}`, not `required`. *(Requirement: Admin Create-User Form Código Referido Input)*
- [x] 4.4 Wire the POST body: `codigoReferido: formData.codigoReferido.trim() || undefined`.
- [x] 4.5 Replace the generic `alert(...)` in `handleCreate`'s catch with `setCreateError(...)`, normalizing class-validator array payloads (`Array.isArray(m) ? m.join(', ') : m`); call `setCreateError(null)` at the start of `handleCreate`; render `{createError && <div className={styles.errorBanner}>{createError}</div>}` at the top of the form. *(Requirement: Admin Create-User Form Código Referido Input)*
- [x] 4.6 Clear both `codigoReferido` and `createError` on form reset and modal close.

## Phase 5: Verification

- [x] 5.1 Run `npx turbo run test` at repo root; confirm zero regressions across the `iam` module. **Deviation**: `npx turbo run test` itself fails repo-wide with `Could not find task 'test' in project` — pre-existing gap, `test` is not declared in `turbo.json`'s `tasks` (only `build`/`lint`/`check-types`/`dev` are; confirmed unrelated to this change via `git stash`). Substituted with `cd apps/api && npx jest` (the only workspace package with a `test` script besides `packages/combo-rules`, which is untouched): 225/226 passed, zero regressions in `iam`; the 1 failure (`estado-pedido.enum.spec.ts`, `pedidos` module) is pre-existing and confirmed unrelated via `git stash`.
- [ ] 5.2 Manual/QA: `POST /usuarios` with a 51-char `codigoReferido` → verify 400 naming `codigoReferido`; duplicate código → verify 409 with a clean message (not raw Prisma text). **Not executed** — requires a running API + database; outside this automated apply phase's capability. Code path verified statically and via unit tests.
- [ ] 5.3 Manual QA in admin backoffice: submit `codigoReferido` through "Crear Usuario", verify the 50-char client cap, and verify the duplicate error renders as a banner (not `alert`). **Not executed** — requires a running admin dev server + browser; outside this automated apply phase's capability. `apps/admin && npx tsc --noEmit` passes clean (0 errors).
