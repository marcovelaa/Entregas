# Change: Combo Validity & Stock Control Rules

## Why
Businesses need full control over promotional combos and virtual kits:
1. **Time-limited campaigns**: Launching promotional packs for specific timeframes (e.g. Back to School, Black Friday, weekend flashes) with automatic activation/expiration.
2. **Fixed promotional quotas (Caps)**: Capping the maximum units of a combo sold at discount, without ever exceeding real physical inventory of the underlying components ($Stock_{combo} \le Stock_{BOM}$).
3. **Compound rules**: Mixing duration (date/time) and fixed quota simultaneously.

## Scope
1. **Data Model**: Enrich `Producto.atributos.reglas_venta` with `vigencia` (PERMANENTE vs FECHAS with ISO start/end) and `control_stock` (AUTO_BOM vs CUPO_FIJO with strict guardrail).
2. **Admin UI (`ComboEditorForm.tsx`)**:
   - New Section "4. Reglas de Venta: Vigencia & Stock":
     - Validity mode toggle: Permanent vs Date/Time range with human helpers.
     - Stock mode toggle: 100% Dynamic BOM vs Fixed Campaign Quota with dynamic `max={virtualStock}` validator and warning guardrail.
   - Summary & Live Preview updates: display active sales rules and calculated effective stock.
3. **Storefront & POS Integration**:
   - Filter and display availability according to validity window and stock cap.
