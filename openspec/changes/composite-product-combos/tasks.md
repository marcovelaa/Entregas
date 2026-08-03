# Tasks: Composite Products / Virtual Bundles ("Combos con Receta")

- [ ] **Task 1: Database & Prisma Schema Updates**
  - Add `enum TipoProducto { SIMPLE, COMBO, SERVICIO }` and field `tipo_producto` to `Producto`.
  - Create model `ProductoComponente` with foreign keys to parent combo and child components.
  - Run `npx prisma db push` and `npx prisma generate`.
- [ ] **Task 2: API & Backend Services Updates**
  - Extend `ProductosService` to handle creating/updating combos with their `componentes_combo`.
  - Update `InventarioService` to calculate dynamic virtual stock for combos.
  - Update `VentasService` to atomically deduct child component stock and log Kardex entries when a combo is sold.
- [ ] **Task 3: Admin Catalog & POS UI Integration**
  - Add "Crear Combo / Kit" builder in Admin Catalog (`/catalogo`).
  - Render Combos in `/caja` (POS) with bundle badge and real-time virtual stock.
- [ ] **Task 4: Automated Verification & Unit Tests**
  - Verify combo creation, virtual stock calculations, and atomic multi-item Kardex deductions.
