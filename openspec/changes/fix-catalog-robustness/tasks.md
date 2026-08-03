# Tasks: Fix Catalog Robustness

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~180-250 |
| 400-line budget risk | Low |
| Chained PRs recommended | No |
| Suggested split | Single PR |
| Delivery strategy | single-pr |
| Chain strategy | N/A |

Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: N/A
400-line budget risk: Low

### Suggested Work Units

| Unit | Goal | Likely PR | Focused test command | Runtime harness | Rollback boundary |
|------|------|-----------|----------------------|-----------------|-------------------|
| 1 | All 7 fixes | Single PR | `npx tsc --noEmit` | Manual: create variante with duplicate SKU, verify 400 | Independent commits per fix |

## Phase 1: Backend Validation & Serialization

- [x] 1.1 **BigInt serialization in VariantesController**: Map all returned objects in `apps/api/src/modules/catalogo/infrastructure/controllers/variantes.controller.ts` to convert `id`, `producto_id` to `.toString()` (match EmpaquesController pattern)
- [x] 1.2 **Uniqueness validation in CrearVarianteUseCase**: Add `buscarPorSku(sku_base)` check in `apps/api/src/modules/catalogo/application/use-cases/variantes/crear-variante.use-case.ts`, throw `BadRequestException` on duplicate
- [x] 1.3 **Add `buscarPorSkuBase` method** to `IVarianteRepository` and `PrismaVarianteRepository` if not present
- [x] 1.4 **@MaxLength(255) on Variante DTOs**: Add `@MaxLength(255)` to `nombre`, `sku_base` in `apps/api/src/modules/catalogo/application/dtos/variante.dto.ts`
- [x] 1.5 **@MaxLength(255) on Empaque DTOs**: Add `@MaxLength(255)` to `nombre`, `sku`, `codigo_barras` in `apps/api/src/modules/catalogo/application/dtos/empaque.dto.ts`
- [x] 1.6 **String price serialization**: Return `precio` and `precio_promocional` as string in `apps/api/src/modules/catalogo/infrastructure/controllers/empaques.controller.ts`

## Phase 2: Bulk Endpoint

- [x] 2.1 **Create `CrearVariantesBulkDto`**: Array DTO with `@ArrayMaxSize(50)` in `variante.dto.ts`
- [x] 2.2 **Create `CrearVariantesBulkUseCase`**: Loop + validate uniqueness per item in `apps/api/src/modules/catalogo/application/use-cases/variantes/`
- [x] 2.3 **Add `POST /variantes/bulk` route** in `VariantesController`
- [x] 2.4 **Register bulk use case** in `catalogo.module.ts`
- [x] 2.5 **Update VariantesSection.tsx**: Replace `for...of` POST loop with single `api.post('/variantes/bulk', ...)`

## Phase 3: Frontend URL Abstraction

- [x] 3.1 **Create `.env.local`** in `apps/admin/` and `apps/frontend/` with `NEXT_PUBLIC_API_URL=http://localhost:3001`
- [x] 3.2 **Replace hardcoded URLs** in `apps/admin/.../VariantesSection.tsx` (upload fetch)
- [x] 3.3 **Replace hardcoded URLs** in `apps/frontend/.../producto/[id]/page.tsx`
- [x] 3.4 **Replace hardcoded URLs** in `apps/frontend/.../material-escolar/page.tsx`

## Phase 4: Cleanup

- [x] 4.1 **Remove dead comment** `{/* Variants / Presentaciones selector */}` in `apps/frontend/.../producto/[id]/page.tsx`
- [x] 4.2 **Run `npx tsc --noEmit`** in `apps/api` — verify zero errors
- [x] 4.3 **Delete** `apps/api/create-empaques.js` scaffold script (no longer needed)
