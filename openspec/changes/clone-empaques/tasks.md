# Tasks: Clone Empaques

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~150-200 |
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
| 1 | Clone Empaques | Single PR | `npx tsc --noEmit` | Manual UI test | Independent commit |

## Phase 1: Backend DTO and Interface

- [x] 1.1 **Create `ClonarEmpaquesDto`**: In `apps/api/src/modules/catalogo/application/dtos/empaque.dto.ts`, add DTO with `origen_variante_id` (number) and `destino_variante_ids` (number array).
- [x] 1.2 **Update `IEmpaqueRepository`**: In `apps/api/src/modules/catalogo/domain/repositories/empaque.repository.interface.ts`, add `buscarPorVariante(varianteId: bigint): Promise<EmpaqueEntity[]>` if it doesn't exist, and add `crearMultiples(empaques: Partial<EmpaqueEntity>[]): Promise<EmpaqueEntity[]>`.

## Phase 2: Backend Implementation (Repository & Use Case)

- [x] 2.1 **Implement `crearMultiples`**: In `apps/api/src/modules/catalogo/infrastructure/repositories/prisma-empaque.repository.ts`, use Prisma transaction or `createManyAndReturn` to insert and return the cloned empaques.
- [x] 2.2 **Create `ClonarEmpaquesUseCase`**: In `apps/api/src/modules/catalogo/application/use-cases/empaques/clonar-empaques.use-case.ts`, fetch origin empaques, map over destinations, generate unique SKUs (`${origenSku}-CLONE-${rand}`), set `codigo_barras` to null, and save them via `crearMultiples`.
- [x] 2.3 **Add Endpoint**: In `apps/api/src/modules/catalogo/infrastructure/controllers/empaques.controller.ts`, add `@Post('clonar')` endpoint that delegates to `ClonarEmpaquesUseCase`.
- [x] 2.4 **Register Use Case**: Add `ClonarEmpaquesUseCase` to `catalogo.module.ts`.

## Phase 3: Frontend Implementation

- [x] 3.1 **Update `EmpaquesSection.tsx` UI**: Add a `<select>` or dropdown showing other variants of the product (received as props or fetched) next to the "Añadir Empaque" button.
- [x] 3.2 **Implement `handleClone`**: In `EmpaquesSection.tsx`, call `api.post('/empaques/clonar')` with the selected origin variant and current destination variant, then call `fetchEmpaques()`.

## Phase 4: Verification

- [x] 4.1 **Run TS Check**: Execute `npx tsc --noEmit` in `apps/api` to ensure no typing errors.
