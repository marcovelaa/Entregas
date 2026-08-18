# Verification Report: crear-usuario-codigo-referido

**Change**: `crear-usuario-codigo-referido`
**Mode**: Full artifact set (proposal/spec/design/tasks all present)
**Verified**: 2026-08-18
**Verifier**: sdd-verify (independent re-execution, not trusting apply report)

## Completeness Table

| Task | Status | Verified how |
|---|---|---|
| 1.1–1.5, 2.1 | done | Source inspection matches tasks.md exactly |
| 3.1–3.3 | done | Test file + use-case guard inspected; suite re-run |
| 4.1–4.6 | done | Source inspection of `page.tsx` / `page.module.css` |
| 5.1 | done (substituted) | Re-ran `cd apps/api && npx jest` myself |
| 5.2 | **not done** — explicit manual-QA gap, not automatable here | N/A |
| 5.3 | **not done** — explicit manual-QA gap, not automatable here | N/A |

16/18 tasks complete and code-verified. 5.2/5.3 were never claimed as automated; treating them as pending human QA per instructions, not as a verify failure.

## Real Command Evidence (independently re-run, not copied from apply report)

### `cd apps/api && npx jest crear-usuario.use-case.spec.ts auth.service.spec.ts`
```
Test Suites: 3 passed, 3 total
Tests:       28 passed, 28 total
Time:        4.089 s
```
Note: 3 suites, not 2 — the substring pattern `auth.service.spec.ts` also matches `cliente-auth.service.spec.ts` (unrelated module, coincidental match, still green). `crear-usuario.use-case.spec.ts` (7 cases) + `auth.service.spec.ts` (7 cases) + `cliente-auth.service.spec.ts` account for the 28.

### `cd apps/api && npx jest` (full suite)
```
Test Suites: 1 failed, 33 passed, 34 total
Tests:       1 failed, 225 passed, 226 total
Time:        4.493 s
```
The 1 failure is `src/modules/pedidos/domain/entities/estado-pedido.enum.spec.ts` ("rechaza transiciones inválidas"), in the unrelated `pedidos` module. Confirmed unrelated: `git status --short` / `git diff --stat` show zero changes touch anything under `pedidos/`; every changed file is scoped to `iam` (backend) or `apps/admin/.../usuarios` (frontend). Zero regressions in the `iam` module. This matches the apply report's claim.

### `cd apps/api && npx tsc --noEmit`
Pre-existing errors only, all in files untouched by this change (`actor-attribution.spec.ts`, `registrar-venta.use-case.spec.ts`, `descuento-uso-concurrencia.e2e-spec.ts`, `reserva-inventario.e2e-spec.ts` — all `VentaCreateData`/argument-count mismatches in `ventas`/`iam auth` test fixtures, unrelated to `codigoReferido`). Zero errors in any file this change touches.

### `cd apps/admin && npx tsc --noEmit`
Zero output — 0 errors. Clean.

## Requirements → Scenarios → Test Evidence Traceability

### Requirement: Código Referido Length Validation
- Scenario "within limit accepted": covered **structurally** by `@MaxLength(50)` in `crear-usuario.dto.ts:38`, enforced by NestJS's global `ValidationPipe` + `class-validator` (framework-level, not re-tested by this change's own suite). No dedicated unit/e2e test in this diff exercises this scenario at runtime.
- Scenario "exceeding limit rejected (400)": **not covered by an automated runtime test** in this repo. `rg` found no `.spec.ts`/`.e2e-spec.ts` file that posts a >50-char `codigoReferido` and asserts a 400 response. This is exactly what task 5.2 exists to cover manually. **Gap, not a regression** — the decorator is present and correct by inspection, but requirement compliance for the 400 path is unverified by automated test.

### Requirement: Código Referido Uniqueness Enforcement
- Scenario "duplicate rejected with domain error (409)": covered at the **use-case** layer by `crear-usuario.use-case.spec.ts` — `'rechaza con CodigoReferidoDuplicadoException cuando el código ya existe, sin guardar'` (PASS). The HTTP-level 409 mapping (`DomainExceptionFilter` STATUS_MAP) is verified by **source inspection only** (see trap spot-check below) — no e2e test asserts an actual `POST /usuarios` returns 409 with a clean body. That HTTP-level assertion is task 5.2's job.
- Scenario "distinct código accepted": covered by `'consulta findByCodigoReferido con el string exacto y persiste ese mismo valor cuando se envía código'` (PASS).

### Requirement: Código Referido Remains Optional
- Scenario "user created without código referido": covered by `'crea el usuario con codigoReferido null cuando no se envía código, sin consultar duplicados de código'` (PASS) — asserts both `save` receives `codigoReferido: null` and `findByCodigoReferido` is never called.

### Requirement: Admin Create-User Form Código Referido Input
- Scenario "operator submits código through form": **not covered by an automated test** — no RTL/jest test exists for `page.tsx` in this codebase (frontend has no component-test infra for this page). Verified only by source inspection (`codigoReferido: formData.codigoReferido.trim() || undefined` wired into the POST body) + clean `tsc --noEmit`. This is task 5.3's job.
- Scenario "client-side max length": verified by source inspection (`maxLength={50}` on the input, `page.tsx:315`) — not an automated runtime test (jsdom typing simulation), same gap as above.
- Scenario "duplicate error banner": verified by source inspection (`error.response?.data?.message` normalized via `Array.isArray(message) ? message.join(', ') : message`, rendered via `{createError && <div className={styles.errorBanner}>{createError}</div>}`) — not an automated runtime test. Same gap.

### Additional test coverage beyond the 7 required cases (bonus, all PASS)
1. Rol inexistente → `RolNoEncontradoException` (regression guard)
2. Both duplicated → `UsuarioDuplicadoException` wins, `findByCodigoReferido` not called (email-first precedence, matches design decision)
3. Case-sensitivity — `'ABC'` doesn't collide with existing `'abc'` (no normalization, matches design decision)

All 7 required use-case cases from design.md's Testing Strategy are present and passing.

## Trap Spot-Checks (independently re-read from working tree, not trusted from apply claims)

1. **`apps/api/src/common/filters/domain-exception.filter.ts`** — confirmed present:
   ```ts
   [CodigoReferidoDuplicadoException, HttpStatus.CONFLICT],
   ```
   at line 21 of `STATUS_MAP`, with the corresponding import at line 4. PASS.

2. **`apps/api/src/modules/iam/auth/auth.service.spec.ts`** — confirmed present:
   ```ts
   findByCodigoReferido: jest.fn(),
   ```
   at line 37 of the `usuarioRepo` mock literal. PASS — this is why `auth.service.spec.ts` still compiles/passes against the widened `IUsuarioRepository` interface.

## Design Coherence

Implementation matches `design.md` exactly:
- Guard order: rol → email → código → bcrypt (confirmed in `crear-usuario.use-case.ts:18-46`)
- `if (dto.codigoReferido)` truthy guard, no trim/case normalization (confirmed)
- `findByCodigoReferido` via `findUnique` + `mapToDomain` in the Prisma repo (confirmed present, not re-pasted here — matches design's interface contract)
- Frontend field is the last `formGroup` before `formActions`, label/type/maxLength/no-`required` all match (confirmed at `page.tsx:309-319`)
- Error banner replaces `alert()`, clears on reset/close (confirmed at `page.tsx:74-77, 250-251, 327-328`)

No deviations found.

## Issues

**CRITICAL**: None.

**WARNING**: None — the two open items (5.2, 5.3) were explicitly scoped as manual/QA-only in tasks.md and design.md's own Testing Strategy table ("Manual/QA against the running API", "Manual QA in the admin backoffice"), never claimed as automated. Per this verification's brief, they are reported as a known, explicit gap for human sign-off, not scored as a verify failure.

**SUGGESTION**:
- Consider adding a lightweight e2e test (`apps/api/test/*.e2e-spec.ts`) that posts a >50-char `codigoReferido` and a duplicate `codigoReferido` against a real Nest app instance, to close the HTTP-layer gap (400/409 mapping) with an automated regression guard instead of permanent manual QA. Not required by this change's scope, but would eliminate the recurring need for 5.2-style manual checks on future touches to this path.
- Consider a minimal RTL smoke test for the create-user form (banner renders on 409, field caps at 50 chars) to close the same gap on the frontend side (5.3).

## Pending Human Sign-Off (explicit, not a blocker for the automated portion)

- [ ] 5.2 — `POST /usuarios` with 51-char `codigoReferido` → 400 naming `codigoReferido`; duplicate código → 409 clean message (not raw Prisma text). Requires a running API + database.
- [ ] 5.3 — Admin backoffice: submit `codigoReferido`, verify 50-char client cap, verify duplicate error renders as banner (not `alert`). Requires a running admin dev server + browser.

## Verdict

**PASS WITH WARNINGS** (automated portion). All automatable requirements/scenarios are implemented, tested, and green. The two documented manual-QA tasks (5.2, 5.3) remain open by design — they require a live server/browser that this environment cannot run — and are called out here as pending human sign-off rather than folded into the PASS.

Recommendation: archive is appropriate once a human completes 5.2/5.3, or accepts the risk of shipping without live-server confirmation given the strength of unit-test + static-analysis coverage and the fact both code paths mirror an already-proven pattern (email uniqueness) 1:1.
