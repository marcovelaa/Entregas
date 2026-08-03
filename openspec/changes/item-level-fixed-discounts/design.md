# Technical Design: Item-Level Fixed Amount Discounts

## 1. Domain Modeling
Prisma schema enum extension:
```prisma
enum TipoDescuento {
  PORCENTAJE
  MONTO_FIJO
  MONTO_FIJO_POR_UNIDAD
  COMBO
  LLEVA_X_PAGA_Y
}
```

## 2. Calculation Mechanics (`DiscountEngineService`)
For an evaluated discount `d` where `d.tipo === 'MONTO_FIJO_POR_UNIDAD'`:
```typescript
const unitDiscount = Number(d.valor);
let rawSavings = 0;

for (const item of matchingItems) {
  // Prevent unit discount exceeding individual item unit price
  const effectivePerUnit = Math.min(item.precioUnitario, unitDiscount);
  rawSavings += effectivePerUnit * item.cantidad;
}

if (d.max_monto_descuento) {
  savings = Math.min(rawSavings, Number(d.max_monto_descuento));
} else {
  savings = rawSavings;
}
```

## 3. UI & Simulation Behavior (`LivePromoSimulator`)
In the promo simulator:
- Label: `Bs. {valor.toFixed(2)} OFF / unidad`
- Formula text breakdown:
  - If capped: `Cálculo: {eligibleUnits} unidad(es) × Bs. {valor} = Bs. {rawDiscount} → Límite de tope aplicado: Bs. {maxMontoDescuento}`
  - If uncapped: `Cálculo: {eligibleUnits} unidad(es) elegible(s) × Bs. {valor.toFixed(2)} = Bs. {rawDiscount.toFixed(2)} de ahorro total.`
