-- CreateIndex
CREATE INDEX "descuento_usos_descuento_id_cliente_id_idx" ON "descuento_usos"("descuento_id", "cliente_id");

-- CreateIndex
CREATE INDEX "movimientos_inventario_producto_id_idx" ON "movimientos_inventario"("producto_id");

-- CreateIndex
CREATE INDEX "movimientos_inventario_variante_id_idx" ON "movimientos_inventario"("variante_id");

-- CreateIndex
CREATE INDEX "movimientos_inventario_documento_origen_id_idx" ON "movimientos_inventario"("documento_origen_id");

-- CreateIndex
CREATE INDEX "movimientos_inventario_creado_en_idx" ON "movimientos_inventario"("creado_en");

-- CreateIndex
CREATE INDEX "venta_detalles_venta_id_idx" ON "venta_detalles"("venta_id");

-- CreateIndex
CREATE INDEX "venta_detalles_producto_id_idx" ON "venta_detalles"("producto_id");

-- CreateIndex
CREATE INDEX "ventas_estado_creado_en_idx" ON "ventas"("estado", "creado_en");
