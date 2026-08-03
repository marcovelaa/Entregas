# Proposal: Fix Catalog Robustness

## Intent

Address 7 identified issues in the catalog module (Producto → Variante → Empaque) found during architecture audit. Issues range from runtime crashes (BigInt serialization) to deployment blockers (hardcoded URLs) and missing input validation.

## Scope

### In Scope
- Fix BigInt serialization in `VariantesController` (Critical)
- Add uniqueness validation in `CrearVarianteUseCase` (Important)
- Add `@MaxLength(255)` to all string DTOs for Variante and Empaque (Important)
- Extract hardcoded `localhost:3001` URLs to `NEXT_PUBLIC_API_URL` env var (Important)
- Return Decimal prices as strings from `EmpaquesController` (Nice-to-have)
- Clean dead "presentaciones" comment (Nice-to-have)
- Add bulk variante creation endpoint `POST /variantes/bulk` (Nice-to-have)

### Out of Scope
- Refactoring BigInt globally (interceptor/transformer) — deferred
- Adding Dinero.js or similar money library — deferred

## Capabilities

### New Capabilities
- `variante-bulk-create`: Bulk creation endpoint for multiple variantes in a single request

### Modified Capabilities
- `catalogo-gestion`: Improved validation, serialization, and error handling for Variante/Empaque CRUD
- `multi-dimensional-variants`: Frontend URL abstraction for deployment readiness

## Approach

Pure refactor — no schema changes. Fix controllers, use cases, DTOs, and frontend fetch calls. Each fix is independent and can be applied/reverted individually.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `apps/api/.../controllers/variantes.controller.ts` | Modified | BigInt serialization + bulk endpoint |
| `apps/api/.../use-cases/variantes/crear-variante.use-case.ts` | Modified | Uniqueness validation |
| `apps/api/.../dtos/variante.dto.ts` | Modified | @MaxLength constraints |
| `apps/api/.../dtos/empaque.dto.ts` | Modified | @MaxLength constraints |
| `apps/api/.../controllers/empaques.controller.ts` | Modified | String price serialization |
| `apps/admin/.../VariantesSection.tsx` | Modified | ENV var for upload URL |
| `apps/frontend/.../producto/[id]/page.tsx` | Modified | ENV var + clean comment |
| `apps/frontend/.../material-escolar/page.tsx` | Modified | ENV var |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Frontend price parsing breaks with string prices | Low | Frontend already uses `Number()` on display |
| Bulk endpoint misused for large payloads | Low | Add array size validation in DTO (max 50) |

## Rollback Plan

Each fix is an independent commit. Revert any individual commit without affecting others. No schema migrations involved.

## Dependencies

- None. All changes are internal refactors.

## Success Criteria

- [ ] `npx tsc --noEmit` passes with zero errors
- [ ] Variantes API returns properly serialized JSON (no BigInt in response)
- [ ] Duplicate SKU on variante creation returns 400 (not 500)
- [ ] Frontend works with `NEXT_PUBLIC_API_URL` env var
- [ ] Bulk creation of 5 variantes succeeds in single request
