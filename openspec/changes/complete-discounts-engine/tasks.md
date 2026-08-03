# Tasks: Complete Enterprise Discounts Engine Implementation

- [ ] **Task 1: Database Schema Extension & Migration**
  - Update `apps/api/prisma/schema.prisma` with `CanalDescuento` enum, `DescuentoVariante`, `DescuentoEmpaque`, and `DescuentoUso` models.
  - Run `npx prisma db push` / `npx prisma generate` in `apps/api`.

- [ ] **Task 2: Decoupled Discount Engine Domain Service**
  - Implement `DiscountEngineService` in `apps/api/src/modules/descuentos/domain/discount-engine.service.ts`.
  - Add item-level target matching (`PRODUCTO`, `VARIANTE`, `EMPAQUE`, `CATEGORIA`, `GLOBAL`).
  - Implement strategies: `PercentageStrategy`, `FixedAmountStrategy`, `BuyXGetYStrategy`.
  - Support per-customer usage check against `DescuentoUso`.

- [ ] **Task 3: Controller & Validation DTO Upgrades**
  - Update `DescuentoDto` in API controller to accept `varianteIds`, `empaqueIds`, `canal`, `max_monto_descuento`, `limite_usos_por_cliente`, `es_acumulable`, `prioridad`.
  - Refactor `POST /descuentos/validar` endpoint to delegate to `DiscountEngineService`.

- [ ] **Task 4: Sales Integration & Redemption Auditing**
  - Update `RegistrarVentaUseCase` (`apps/api/src/modules/ventas/`) to accept optional `codigo_cupon` / `descuento_id`.
  - Wrap sale creation, coupon count increment, and `DescuentoUso` creation inside an atomic Prisma `$transaction`.

- [ ] **Task 5: ERP Admin UI Overhaul**
  - Update `apps/admin/src/app/descuentos/page.tsx` with a multi-tab / modal form supporting Variants, Empaques, Categories, Channels, and Limits.
  - Add Edit promotion capability and detailed discount view.

- [ ] **Task 6: POS Real-Time Coupon Integration**
  - Update `apps/admin/src/app/caja/page.tsx` with coupon code input, automatic promotion badges, and live subtotal/discount breakdown.
