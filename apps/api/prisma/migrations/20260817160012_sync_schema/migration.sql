-- AlterTable
ALTER TABLE "bitacora" ADD COLUMN     "cliente_id" BIGINT,
ADD COLUMN     "public_id" UUID NOT NULL,
ADD COLUMN     "request_id" VARCHAR(100),
ADD COLUMN     "tipo_actor" VARCHAR(20) NOT NULL DEFAULT 'USUARIO',
ALTER COLUMN "ip" SET DATA TYPE VARCHAR(50);

-- AlterTable
ALTER TABLE "compra_detalles" DROP COLUMN "cantidad",
ADD COLUMN     "cantidad_recibida" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "cantidad_solicitada" INTEGER NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE "compras" ADD COLUMN     "actualizado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "costo_transporte" DECIMAL(14,2) NOT NULL DEFAULT 0,
ADD COLUMN     "public_id" UUID,
ADD COLUMN     "subtotal" DECIMAL(14,2) NOT NULL DEFAULT 0,
ALTER COLUMN "estado" SET DEFAULT 'BORRADOR';

-- AlterTable
ALTER TABLE "empaques" ADD COLUMN     "costo_promedio" DECIMAL(14,2) NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "productos" ADD COLUMN     "costo_promedio" DECIMAL(14,2) NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "reservas_inventario" ALTER COLUMN "public_id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "variantes" ADD COLUMN     "costo_promedio" DECIMAL(14,2) NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "ventas" ADD COLUMN     "caja_id" BIGINT,
ADD COLUMN     "canal_venta" VARCHAR(20) NOT NULL DEFAULT 'PRESENCIAL';

-- CreateTable
CREATE TABLE "pedidos" (
    "id" BIGSERIAL NOT NULL,
    "numero_pedido" VARCHAR(100) NOT NULL,
    "cliente_id" BIGINT,
    "reserva_id" BIGINT,
    "preparador_id" BIGINT,
    "repartidor_id" BIGINT,
    "estado" VARCHAR(50) NOT NULL DEFAULT 'PENDIENTE_PAGO',
    "direccion_envio_snapshot" JSONB NOT NULL,
    "costo_envio" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "subtotal" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "descuento_total" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "total" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "metodo_pago" VARCHAR(50) NOT NULL DEFAULT 'QR',
    "notas" TEXT,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_en" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pedidos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pedido_detalles" (
    "id" BIGSERIAL NOT NULL,
    "pedido_id" BIGINT NOT NULL,
    "producto_id" BIGINT NOT NULL,
    "variante_id" BIGINT,
    "empaque_id" BIGINT,
    "nombre_producto" VARCHAR(255) NOT NULL,
    "sku" VARCHAR(100),
    "precio_unitario" DECIMAL(14,2) NOT NULL,
    "cantidad" INTEGER NOT NULL,
    "subtotal" DECIMAL(14,2) NOT NULL,
    "imagen_url" TEXT,

    CONSTRAINT "pedido_detalles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pedido_historial_estados" (
    "id" BIGSERIAL NOT NULL,
    "pedido_id" BIGINT NOT NULL,
    "estado_anterior" VARCHAR(50),
    "estado_nuevo" VARCHAR(50) NOT NULL,
    "cambiado_por_usuario_id" BIGINT,
    "cambiado_por_cliente_id" BIGINT,
    "motivo" TEXT,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pedido_historial_estados_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pagos_qr" (
    "id" BIGSERIAL NOT NULL,
    "public_id" UUID NOT NULL,
    "pedido_id" BIGINT NOT NULL,
    "reserva_id" BIGINT,
    "idempotency_key" VARCHAR(100) NOT NULL,
    "qr_contenido" TEXT NOT NULL,
    "monto" DECIMAL(14,2) NOT NULL,
    "moneda" VARCHAR(10) NOT NULL DEFAULT 'BOB',
    "estado" VARCHAR(30) NOT NULL DEFAULT 'PENDIENTE',
    "referencia_bisa" VARCHAR(100),
    "expira_en" TIMESTAMP(3) NOT NULL,
    "confirmado_en" TIMESTAMP(3),
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_en" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pagos_qr_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pagos_webhook_logs" (
    "id" BIGSERIAL NOT NULL,
    "event_id" VARCHAR(100),
    "origen" VARCHAR(50) NOT NULL DEFAULT 'BANCO_BISA',
    "payload" JSONB NOT NULL,
    "headers" JSONB,
    "procesado" BOOLEAN NOT NULL DEFAULT false,
    "error_mensaje" TEXT,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pagos_webhook_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "devoluciones" (
    "id" BIGSERIAL NOT NULL,
    "public_id" UUID NOT NULL,
    "pedido_id" BIGINT NOT NULL,
    "cliente_id" BIGINT NOT NULL,
    "estado" VARCHAR(30) NOT NULL DEFAULT 'SOLICITADA',
    "motivo" TEXT NOT NULL,
    "resolucion" VARCHAR(50),
    "destino_fisico" VARCHAR(50),
    "monto_reembolso" DECIMAL(14,2),
    "notas_evaluacion" TEXT,
    "evaluado_por_usuario_id" BIGINT,
    "evaluado_en" TIMESTAMP(3),
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_en" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "devoluciones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "devolucion_detalles" (
    "id" BIGSERIAL NOT NULL,
    "devolucion_id" BIGINT NOT NULL,
    "pedido_detalle_id" BIGINT NOT NULL,
    "producto_id" BIGINT NOT NULL,
    "cantidad" INTEGER NOT NULL,
    "motivo_item" TEXT,

    CONSTRAINT "devolucion_detalles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cajas" (
    "id" BIGSERIAL NOT NULL,
    "usuario_id" BIGINT NOT NULL,
    "fecha_apertura" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_cierre" TIMESTAMP(3),
    "monto_apertura" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "monto_cierre_esp" DECIMAL(14,2),
    "monto_cierre_real" DECIMAL(14,2),
    "diferencia" DECIMAL(14,2),
    "estado" VARCHAR(50) NOT NULL DEFAULT 'ABIERTA',
    "observaciones" TEXT,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_en" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cajas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "movimientos_caja" (
    "id" BIGSERIAL NOT NULL,
    "caja_id" BIGINT NOT NULL,
    "usuario_id" BIGINT NOT NULL,
    "tipo_movimiento" VARCHAR(50) NOT NULL,
    "concepto" VARCHAR(255) NOT NULL,
    "monto" DECIMAL(14,2) NOT NULL,
    "metodo_pago" VARCHAR(50) NOT NULL DEFAULT 'EFECTIVO',
    "comprobante_url" TEXT,
    "referencia_id" VARCHAR(100),
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "movimientos_caja_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gastos_operativos" (
    "id" BIGSERIAL NOT NULL,
    "usuario_id" BIGINT NOT NULL,
    "categoria" VARCHAR(100) NOT NULL,
    "descripcion" VARCHAR(255) NOT NULL,
    "monto" DECIMAL(14,2) NOT NULL,
    "fecha_gasto" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "comprobante_url" TEXT,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_en" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "gastos_operativos_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "pedidos_numero_pedido_key" ON "pedidos"("numero_pedido");

-- CreateIndex
CREATE UNIQUE INDEX "pedidos_reserva_id_key" ON "pedidos"("reserva_id");

-- CreateIndex
CREATE INDEX "pedidos_cliente_id_idx" ON "pedidos"("cliente_id");

-- CreateIndex
CREATE INDEX "pedidos_estado_creado_en_idx" ON "pedidos"("estado", "creado_en");

-- CreateIndex
CREATE INDEX "pedido_detalles_pedido_id_idx" ON "pedido_detalles"("pedido_id");

-- CreateIndex
CREATE INDEX "pedido_detalles_producto_id_idx" ON "pedido_detalles"("producto_id");

-- CreateIndex
CREATE INDEX "pedido_historial_estados_pedido_id_idx" ON "pedido_historial_estados"("pedido_id");

-- CreateIndex
CREATE UNIQUE INDEX "pagos_qr_public_id_key" ON "pagos_qr"("public_id");

-- CreateIndex
CREATE UNIQUE INDEX "pagos_qr_pedido_id_key" ON "pagos_qr"("pedido_id");

-- CreateIndex
CREATE UNIQUE INDEX "pagos_qr_idempotency_key_key" ON "pagos_qr"("idempotency_key");

-- CreateIndex
CREATE UNIQUE INDEX "pagos_qr_referencia_bisa_key" ON "pagos_qr"("referencia_bisa");

-- CreateIndex
CREATE INDEX "pagos_qr_estado_expira_en_idx" ON "pagos_qr"("estado", "expira_en");

-- CreateIndex
CREATE INDEX "pagos_webhook_logs_event_id_idx" ON "pagos_webhook_logs"("event_id");

-- CreateIndex
CREATE INDEX "pagos_webhook_logs_creado_en_idx" ON "pagos_webhook_logs"("creado_en");

-- CreateIndex
CREATE UNIQUE INDEX "devoluciones_public_id_key" ON "devoluciones"("public_id");

-- CreateIndex
CREATE INDEX "devoluciones_pedido_id_idx" ON "devoluciones"("pedido_id");

-- CreateIndex
CREATE INDEX "devoluciones_cliente_id_idx" ON "devoluciones"("cliente_id");

-- CreateIndex
CREATE INDEX "devoluciones_estado_idx" ON "devoluciones"("estado");

-- CreateIndex
CREATE INDEX "devolucion_detalles_devolucion_id_idx" ON "devolucion_detalles"("devolucion_id");

-- CreateIndex
CREATE INDEX "devolucion_detalles_pedido_detalle_id_idx" ON "devolucion_detalles"("pedido_detalle_id");

-- CreateIndex
CREATE INDEX "cajas_estado_fecha_apertura_idx" ON "cajas"("estado", "fecha_apertura");

-- CreateIndex
CREATE INDEX "movimientos_caja_caja_id_tipo_movimiento_idx" ON "movimientos_caja"("caja_id", "tipo_movimiento");

-- CreateIndex
CREATE INDEX "gastos_operativos_categoria_fecha_gasto_idx" ON "gastos_operativos"("categoria", "fecha_gasto");

-- CreateIndex
CREATE UNIQUE INDEX "bitacora_public_id_key" ON "bitacora"("public_id");

-- CreateIndex
CREATE INDEX "bitacora_entidad_entidad_id_idx" ON "bitacora"("entidad", "entidad_id");

-- CreateIndex
CREATE INDEX "bitacora_usuario_id_idx" ON "bitacora"("usuario_id");

-- CreateIndex
CREATE INDEX "bitacora_cliente_id_idx" ON "bitacora"("cliente_id");

-- CreateIndex
CREATE INDEX "bitacora_creado_en_idx" ON "bitacora"("creado_en");

-- CreateIndex
CREATE INDEX "compra_detalles_compra_id_idx" ON "compra_detalles"("compra_id");

-- CreateIndex
CREATE INDEX "compra_detalles_producto_id_idx" ON "compra_detalles"("producto_id");

-- CreateIndex
CREATE UNIQUE INDEX "compras_public_id_key" ON "compras"("public_id");

-- CreateIndex
CREATE INDEX "compras_proveedor_id_idx" ON "compras"("proveedor_id");

-- CreateIndex
CREATE INDEX "compras_estado_idx" ON "compras"("estado");

-- AddForeignKey
ALTER TABLE "bitacora" ADD CONSTRAINT "bitacora_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bitacora" ADD CONSTRAINT "bitacora_cliente_id_fkey" FOREIGN KEY ("cliente_id") REFERENCES "clientes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ventas" ADD CONSTRAINT "ventas_caja_id_fkey" FOREIGN KEY ("caja_id") REFERENCES "cajas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pedidos" ADD CONSTRAINT "pedidos_cliente_id_fkey" FOREIGN KEY ("cliente_id") REFERENCES "clientes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pedidos" ADD CONSTRAINT "pedidos_reserva_id_fkey" FOREIGN KEY ("reserva_id") REFERENCES "reservas_inventario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pedidos" ADD CONSTRAINT "pedidos_preparador_id_fkey" FOREIGN KEY ("preparador_id") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pedidos" ADD CONSTRAINT "pedidos_repartidor_id_fkey" FOREIGN KEY ("repartidor_id") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pedido_detalles" ADD CONSTRAINT "pedido_detalles_pedido_id_fkey" FOREIGN KEY ("pedido_id") REFERENCES "pedidos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pedido_detalles" ADD CONSTRAINT "pedido_detalles_producto_id_fkey" FOREIGN KEY ("producto_id") REFERENCES "productos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pedido_detalles" ADD CONSTRAINT "pedido_detalles_variante_id_fkey" FOREIGN KEY ("variante_id") REFERENCES "variantes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pedido_detalles" ADD CONSTRAINT "pedido_detalles_empaque_id_fkey" FOREIGN KEY ("empaque_id") REFERENCES "empaques"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pedido_historial_estados" ADD CONSTRAINT "pedido_historial_estados_pedido_id_fkey" FOREIGN KEY ("pedido_id") REFERENCES "pedidos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pedido_historial_estados" ADD CONSTRAINT "pedido_historial_estados_cambiado_por_usuario_id_fkey" FOREIGN KEY ("cambiado_por_usuario_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pedido_historial_estados" ADD CONSTRAINT "pedido_historial_estados_cambiado_por_cliente_id_fkey" FOREIGN KEY ("cambiado_por_cliente_id") REFERENCES "clientes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pagos_qr" ADD CONSTRAINT "pagos_qr_pedido_id_fkey" FOREIGN KEY ("pedido_id") REFERENCES "pedidos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pagos_qr" ADD CONSTRAINT "pagos_qr_reserva_id_fkey" FOREIGN KEY ("reserva_id") REFERENCES "reservas_inventario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "devoluciones" ADD CONSTRAINT "devoluciones_pedido_id_fkey" FOREIGN KEY ("pedido_id") REFERENCES "pedidos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "devoluciones" ADD CONSTRAINT "devoluciones_cliente_id_fkey" FOREIGN KEY ("cliente_id") REFERENCES "clientes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "devoluciones" ADD CONSTRAINT "devoluciones_evaluado_por_usuario_id_fkey" FOREIGN KEY ("evaluado_por_usuario_id") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "devolucion_detalles" ADD CONSTRAINT "devolucion_detalles_devolucion_id_fkey" FOREIGN KEY ("devolucion_id") REFERENCES "devoluciones"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "devolucion_detalles" ADD CONSTRAINT "devolucion_detalles_pedido_detalle_id_fkey" FOREIGN KEY ("pedido_detalle_id") REFERENCES "pedido_detalles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "devolucion_detalles" ADD CONSTRAINT "devolucion_detalles_producto_id_fkey" FOREIGN KEY ("producto_id") REFERENCES "productos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cajas" ADD CONSTRAINT "cajas_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimientos_caja" ADD CONSTRAINT "movimientos_caja_caja_id_fkey" FOREIGN KEY ("caja_id") REFERENCES "cajas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimientos_caja" ADD CONSTRAINT "movimientos_caja_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gastos_operativos" ADD CONSTRAINT "gastos_operativos_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

