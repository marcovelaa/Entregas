# Diseño del Módulo de Catálogo e Inventario

Para soportar ventas presenciales y online, necesitamos una base sólida de productos.

```prisma
model Categoria {
  id             BigInt     @id @default(autoincrement())
  nombre         String     @unique @db.VarChar(100)
  descripcion    String?    @db.Text
  activo         Boolean    @default(true)
  
  productos      Producto[]
  
  @@map("categorias")
}

model Producto {
  id             BigInt     @id @default(autoincrement())
  codigo_sku     String     @unique @db.VarChar(50)
  nombre         String     @db.VarChar(150)
  descripcion    String?    @db.Text
  
  // Precios
  precio_venta   Decimal    @db.Decimal(10, 2)
  precio_costo   Decimal?   @db.Decimal(10, 2)
  
  origen         OrigenProducto @default(COMPRADO)
  
  categoria_id   BigInt?
  activo         Boolean    @default(true)
  
  categoria      Categoria? @relation(fields: [categoria_id], references: [id])
  inventarios    Inventario[]
  
  creado_en      DateTime   @default(now())
  actualizado_en DateTime   @updatedAt

  @@map("productos")
}

enum OrigenProducto {
  ELABORADO
  COMPRADO
}

model Sucursal {
  id             BigInt     @id @default(autoincrement())
  nombre         String     @db.VarChar(100)
  direccion      String?    @db.Text
  es_principal   Boolean    @default(true)
  activo         Boolean    @default(true)
  
  inventarios    Inventario[]

  @@map("sucursales")
}

model Inventario {
  producto_id    BigInt
  sucursal_id    BigInt
  
  stock_actual   Int        @default(0)
  stock_minimo   Int        @default(0)
  
  producto       Producto   @relation(fields: [producto_id], references: [id], onDelete: Cascade)
  sucursal       Sucursal   @relation(fields: [sucursal_id], references: [id], onDelete: Cascade)

  @@id([producto_id, sucursal_id])
  @@map("inventarios")
}
```
