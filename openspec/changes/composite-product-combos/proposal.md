# Proposal: Composite Products / Virtual Bundles ("Combos con Receta")

## 1. Context & Business Need
In retail and e-commerce, promotions and bundles operate on two distinct levels:
1. **Promotions / Campaigns (Discounts Engine)**: Dynamic checkout-level rules (e.g. 20% OFF, 2x1 on Notebooks, Coupon "SUMMER20").
2. **Bundles / Composite Products (Catalog Kits)**: Dedicated sellable products composed of a recipe (Bill of Materials) of other catalog products (e.g. "Combo Escolar 2026", "Kit Gamer").

Treating Combos as mere cart discounts creates significant limitations:
- No dedicated product card in e-commerce with rich images, description, and direct "Add Combo to Cart" button.
- No direct barcode or single-click selection in POS / Cashier.
- Inability to automatically calculate bundle inventory based on the minimum available stock of component items.
- Inaccurate stock deduction upon sale.

## 2. Scope of the Solution (Camino 1: Virtual Catalog Bundles)
1. **Catalog Domain & Database**:
   - Introduce `tipo_producto` enum (`SIMPLE`, `COMBO`, `SERVICIO`) on `Producto`.
   - Create `ProductoComponente` model linking a combo to its child products/variants with specific recipe quantities.
2. **Virtual Stock Calculation (Kardex & Inventory)**:
   - Dynamic formula: `StockDisponible(Combo) = min(StockDisponible(Hijo_i) / CantidadRequerida(Hijo_i))`.
3. **Transaction-Safe Sale Execution (`VentasService`)**:
   - When a combo is sold in POS or E-commerce, atomically deduct inventory for each component child item and record traceability in `MovimientosInventario`.
4. **Admin UI & Catalog Management**:
   - Add Combo Builder in Admin Catalog to assemble products, preview component totals vs bundle price, and manage bundle recipes.
5. **E-Commerce & POS Presentation**:
   - Render composite products with bundle badges, component item breakdown, and automatic stock gating.
