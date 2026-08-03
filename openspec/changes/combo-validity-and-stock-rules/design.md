# Technical Design: Combo Validity & Stock Control Rules

## 1. Schema & Attribute Structure

Inside `Producto.atributos.reglas_venta`:
```typescript
interface ReglasVentaCombo {
  vigencia: {
    tipo: 'PERMANENTE' | 'FECHAS';
    fecha_inicio?: string; // ISO format YYYY-MM-DDTHH:mm
    fecha_fin?: string;    // ISO format YYYY-MM-DDTHH:mm
  };
  control_stock: {
    tipo: 'AUTO_BOM' | 'CUPO_FIJO';
    cupo_maximo?: number;  // Must satisfy: 1 <= cupo_maximo <= virtualStock
  };
}
```

## 2. Invariant Rules & Mathematical Validation

1. **BOM Ceiling Invariant**:
   Let $Stock_{BOM} = \min_{i=1}^n \left\lfloor \frac{StockDisponible_i}{CantidadRequerida_i} \right\rfloor$.
   The effective sellable stock is defined as:
   $$Stock_{Efectivo} = \begin{cases}
     Stock_{BOM}, & \text{if } tipo = \text{'AUTO\_BOM'} \\
     \min(cupo\_maximo, Stock_{BOM}), & \text{if } tipo = \text{'CUPO\_FIJO'}
   \end{cases}$$
   
2. **Form Guardrail**:
   - When user sets `cupo_maximo > Stock_{BOM}`, the form flags an explicit validation error: `"El cupo no puede superar las X unidades disponibles por inventario"`.
   - Prevent form submission if `tipo === 'CUPO_FIJO'` and `cupo_maximo > Stock_{BOM}` or `cupo_maximo <= 0`.
   - Provide a 1-click action: `Ajustar al máximo disponible (${Stock_{BOM}})`.

3. **Time Window Invariant**:
   - `fecha_inicio <= fecha_fin`.
   - A combo is active if and only if $now \ge fecha\_inicio$ and $now \le fecha\_fin$ (or `tipo === 'PERMANENTE'`).

## 3. UI/UX Component Architecture (`ComboEditorForm.tsx`)

A dedicated card **"4. Reglas de Venta: Vigencia & Límite de Stock"** with a sleek 2-column grid:
- **Left Column: ⏳ Vigencia & Duración Temporal**
  - Segmented toggle: `[ Permanente ]` | `[ Rango de Fechas / Horas ]`
  - If `FECHAS`:
    - Clean native date/time pickers (`Desde` y `Hasta`).
    - Quick preset buttons: `[ 7 días ]`, `[ 15 días ]`, `[ Fin de Mes ]`.
    - Live status badge: `🟢 Activo ahora`, `🟡 Programado`, `🔴 Expirado`.
- **Right Column: 📦 Control de Inventario & Cupo Máximo**
  - Segmented toggle: `[ Automático según componentes ]` | `[ Cupo Máximo Fijo ]`
  - Live indicator of `Stock BOM actual: X kits`.
  - If `CUPO_FIJO`:
    - Input number with instant boundary check and dynamic `max={virtualStock}`.
    - Helper text showing percentage of available stock allocated.
