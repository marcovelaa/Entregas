# Change Proposal: Complete Enterprise Discounts Engine

## 1. Context & Motivation
The existing `Descuentos` module suffers from structural and calculation limitations:
- Prisma schema only supports `GLOBAL`, `CATEGORIA`, and `PRODUCTO` targets, omitting specific `Variante` (variant) and `Empaque` (packaging unit/box) relationships.
- The validation engine (`/descuentos/validar`) evaluates percentage/fixed discounts against the entire cart total rather than filtering by target items.
- $N \times M$ ($3 \times 2$) logic incorrectly uses the unit price of the first item in the cart instead of calculating the lowest-priced eligible item.
- Lacks a redemption tracking ledger (`DescuentoUso`), preventing usage limits per customer and sales auditability.
- POS (`apps/admin/src/app/caja`) and E-Commerce checkout are disconnected from the discount validation engine.

## 2. Objectives
- Expand Prisma database models to support targeted discounts by `Variante` and `Empaque`, channel restriction (`POS`, `ECOMMERCE`, `TODOS`), and redemption audit (`DescuentoUso`).
- Build a robust, strategy-patterned `DiscountEngineService` in NestJS API that supports:
  - Percentage discounts with optional max amount caps.
  - Fixed amount discounts.
  - Buy X Get Y ($N \times M$) with automatic lowest-price item deduction.
  - Volume/tiered discounts (buy 5+ get X% off).
  - Minimum purchase spend thresholds and coupon usage limits per customer.
- Integrate discount evaluation into `RegistrarVentaUseCase` and POS real-time cart.
- Overhaul ERP Admin discount management UI (`apps/admin/src/app/descuentos`) for full CRUD with Variant, Packaging, and Channel selection.

## 3. Impacted Systems
- Database: `apps/api/prisma/schema.prisma`
- Backend API: `apps/api/src/modules/descuentos/`, `apps/api/src/modules/ventas/`
- Admin ERP UI: `apps/admin/src/app/descuentos/`, `apps/admin/src/app/caja/`
