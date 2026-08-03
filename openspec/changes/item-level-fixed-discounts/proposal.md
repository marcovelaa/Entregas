# Proposal: Item-Level Fixed Amount Discounts (`MONTO_FIJO_POR_UNIDAD`)

## Context & Motivation
Currently, the discount engine supports `PORCENTAJE`, `MONTO_FIJO`, `COMBO`, and `LLEVA_X_PAGA_Y`.
`MONTO_FIJO` applies a flat discount against the eligible subtotal of the cart (order-level or target-level capped discount).
When a merchant wants to offer a fixed monetary deduction per unit purchased (e.g. "$10 OFF on every Math Book 2 purchased", where buying 2 books gives $20 OFF, reducing total from $200 to $180), there was no direct type.

## Scope & Changes
1. **Domain Model & Database**:
   - Extend `TipoDescuento` enum with `MONTO_FIJO_POR_UNIDAD`.
   - Update Prisma schema and synchronize Postgres DB via `prisma db push` / `prisma generate`.
2. **Discount Engine (`DiscountEngineService`)**:
   - Implement unit-level deduction: `Ahorro = sum(min(item.precioUnitario, valor) * item.cantidad)`.
   - Preserve optional max cap (`max_monto_descuento`).
3. **Admin UI & Promo Simulator**:
   - Add "Monto Fijo por Unidad (Bs. OFF por ítem)" to `DiscountForm.tsx`.
   - Implement real-time live preview & formula breakdown in `LivePromoSimulator.tsx`.
4. **Validation & POS / Checkout Integration**:
   - Ensure `/descuentos/validar` and `/ventas` checkout flows consume the new discount strategy consistently.
