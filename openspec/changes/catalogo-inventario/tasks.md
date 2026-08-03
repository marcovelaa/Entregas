# Tasks: Catálogo e Inventario

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~1200-1500 |
| 400-line budget risk | High |
| Chained PRs recommended | Yes |
| Suggested split | PR 1 (Catalogo) → PR 2 (Inventario) → PR 3 (Frontend) |
| Delivery strategy | single-pr |
| Chain strategy | pending |

Decision needed before apply: Yes
Chained PRs recommended: Yes
Chain strategy: pending
400-line budget risk: High

### Suggested Work Units

| Unit | Goal | Likely PR | Focused test command | Runtime harness | Rollback boundary |
|------|------|-----------|----------------------|-----------------|-------------------|
| 1 | Backend: Catalogo Module | PR 1 | `npm run test:e2e -- catalogo` | `npm run start:dev` | Revert `apps/api/src/modules/catalogo` |
| 2 | Backend: Inventario Module | PR 2 | `npm run test:e2e -- inventario` | `npm run start:dev` | Revert `apps/api/src/modules/inventario` |
| 3 | Frontend: Admin UI | PR 3 | `npm run test -- catalogo inventario` | `npm run dev` | Revert `apps/admin/src/app/(admin)` |

## Phase 1: Backend (Catalogo)

- [x] 1.1 Crear `apps/api/src/modules/catalogo/catalogo.module.ts`
- [x] 1.2 [RED] Test e2e: Falla al crear Marca con slug duplicado
- [x] 1.3 Crear DTOs, Controller, UseCases y Repository (Prisma) para `Marca`
- [x] 1.4 [RED] Test e2e: Falla al asignar `categoria_padre_id` circular a Categoria
- [x] 1.5 Crear DTOs, Controller, UseCases y Repository (Prisma) para `Categoria`
- [x] 1.6 [RED] Test e2e: Falla al crear Producto si `precio_promocional` >= `precio_base`
- [x] 1.7 Crear DTOs, Controller, UseCases y Repository (Prisma) para `Producto` (incluyendo validaciones JSONB)
- [x] 1.8 Crear DTOs, Controller, UseCases y Repository (Prisma) para `ProductoImagen`
- [x] 1.9 [RED] Test e2e: Falla al crear Presentacion con multiplicador 0
- [x] 1.10 Crear DTOs, Controller, UseCases y Repository (Prisma) para `Presentacion`

## Phase 2: Backend (Inventario)

- [x] 2.1 Crear `apps/api/src/modules/inventario/inventario.module.ts`
- [x] 2.2 Crear DTOs, Controller, UseCases y Repository (Prisma) para consultas de `Inventario` (stock actual)
- [x] 2.3 [RED] Test e2e: Falla el registro de movimiento si resulta en stock negativo
- [x] 2.4 [RED] Test e2e: Falla si hay `tipo_documento` pero no `documento_id` en movimiento
- [x] 2.5 Crear `RegistrarMovimientoUseCase` y `InventarioRepository` con `Prisma.$transaction` (actualizar stock + asentar movimiento)

## Phase 3: Frontend (Admin UI)

- [x] 3.1 Crear ruta base para catálogo en `apps/admin/src/app/(admin)/catalogo/page.tsx`
- [x] 3.2 Implementar UI para CRUD de Marcas y Categorías
- [x] 3.3 Implementar UI para CRUD de Productos (formularios, carga de imágenes) y Presentaciones
- [x] 3.4 Crear ruta base para inventario en `apps/admin/src/app/(admin)/inventario/page.tsx`
- [x] 3.5 Implementar vista del Kardex y modal de ajustes de inventario

