# Implementation Tasks: Item-Level Fixed Discounts

- [ ] **Task 1: Database & Prisma Schema Update**
  - Update `enum TipoDescuento` in `apps/api/prisma/schema.prisma` to include `MONTO_FIJO_POR_UNIDAD`.
  - Run `npx prisma db push` and `npx prisma generate` in `apps/api`.
- [ ] **Task 2: Domain Engine Update**
  - Update `DiscountEngineService.evaluate()` in `apps/api/src/modules/descuentos/domain/discount-engine.service.ts` to compute per-unit fixed discounts with edge-case floor protection and maximum cap support.
- [ ] **Task 3: Admin UI & Form Enhancements**
  - Update `DiscountForm.tsx` to include `MONTO_FIJO_POR_UNIDAD` in the discount type selector and handle its inputs (value per unit and optional max cap).
  - Update `LivePromoSimulator.tsx` to dynamically simulate per-unit calculations and formula descriptions.
- [ ] **Task 4: Verification & Automated Tests**
  - Write and run automated verification script to validate that purchasing multiple items with `MONTO_FIJO_POR_UNIDAD` computes exactly $N \times \text{discount}$, handles price floor bounds, and respects max limits.
