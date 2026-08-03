# Technical Design: Composite Products / Virtual Bundles ("Combos con Receta")

## 1. Data Modeling (Prisma Schema)

```prisma
enum TipoProducto {
  SIMPLE
  COMBO
  SERVICIO
}

model Producto {
  // ... existing fields ...
  tipo_producto        TipoProducto          @default(SIMPLE)
  
  // Relations
  componentes_combo    ProductoComponente[]  @relation("ComboPadre")
  usado_en_combos      ProductoComponente[]  @relation("ComponenteHijo")
}

model ProductoComponente {
  id                  BigInt   @id @default(autoincrement())
  combo_producto_id   BigInt
  componente_prod_id  BigInt
  variante_id         BigInt?
  empaque_id          BigInt?
  cantidad            Int      @default(1)
  creado_en           DateTime @default(now())

  combo_producto      Producto  @relation("ComboPadre", fields: [combo_producto_id], references: [id], onDelete: Cascade)
  componente_producto Producto  @relation("ComponenteHijo", fields: [componente_prod_id], references: [id], onDelete: Restrict)
  variante            Variante? @relation(fields: [variante_id], references: [id], onDelete: Restrict)
  empaque             Empaque?  @relation(fields: [empaque_id], references: [id], onDelete: Restrict)

  @@map("producto_componentes")
}
```

## 2. Dynamic Inventory & Virtual Stock Calculation
For any product with `tipo_producto === 'COMBO'`:
```typescript
function calculateVirtualComboStock(components: { stockDisponible: number; cantidadRequerida: number }[]): number {
  if (components.length === 0) return 0;
  return Math.min(...components.map(c => Math.floor(c.stockDisponible / c.cantidadRequerida)));
}
```

## 3. Atomic Sale Execution (POS & E-Commerce Checkout)
In `VentasService.crearVenta()`:
```typescript
for (const detail of ventaInput.detalles) {
  const prod = await prisma.producto.findUnique({
    where: { id: detail.producto_id },
    include: { componentes_combo: { include: { componente_producto: true } } }
  });

  if (prod.tipo_producto === 'COMBO') {
    for (const comp of prod.componentes_combo) {
      const unitsToDeduct = detail.cantidad * comp.cantidad;
      // Deduct from component's physical inventory
      await prisma.inventario.updateMany({
        where: { producto_id: comp.componente_prod_id, variante_id: comp.variante_id },
        data: { cantidad_disponible: { decrement: unitsToDeduct } }
      });
      // Register Kardex movement
      await prisma.movimientosInventario.create({
        data: {
          producto_id: comp.componente_prod_id,
          variante_id: comp.variante_id,
          tipo: 'SALIDA',
          cantidad: unitsToDeduct,
          motivo: `Venta Combo #${ticket} (${prod.nombre})`
        }
      });
    }
  } else {
    // Normal single product inventory deduction
  }
}
```

## 4. UI Architecture
1. **Catalog Admin (`/catalogo`)**:
   - Filter by product type: "Todos", "Simples", "Combos".
   - Combo Creator Modal: search products, define bundle quantity per item, see regular sum vs package price, upload bundle cover photo.
2. **POS (`/caja`)**:
   - Combos appear in quick product grid with a special "COMBO" badge and current virtual stock.
3. **E-Commerce**:
   - Product Card with "Combo Set" tag, list of included items, and price savings.
