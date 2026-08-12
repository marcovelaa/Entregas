-- CreateTable
CREATE TABLE "reservas_inventario" (
    "id" BIGSERIAL NOT NULL,
    "public_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "usuario_id" BIGINT NOT NULL,
    "venta_id" BIGINT,
    "estado" VARCHAR(20) NOT NULL DEFAULT 'ACTIVA',
    "expira_en" TIMESTAMP(3) NOT NULL,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_en" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reservas_inventario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reservas_inventario_detalles" (
    "id" BIGSERIAL NOT NULL,
    "reserva_id" BIGINT NOT NULL,
    "inventario_id" BIGINT NOT NULL,
    "cantidad" INTEGER NOT NULL,

    CONSTRAINT "reservas_inventario_detalles_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "reservas_inventario_public_id_key" ON "reservas_inventario"("public_id");
CREATE UNIQUE INDEX "reservas_inventario_venta_id_key" ON "reservas_inventario"("venta_id");
CREATE INDEX "reservas_inventario_estado_expira_en_idx" ON "reservas_inventario"("estado", "expira_en");
CREATE UNIQUE INDEX "reservas_inventario_detalles_reserva_id_inventario_id_key" ON "reservas_inventario_detalles"("reserva_id", "inventario_id");
CREATE INDEX "reservas_inventario_detalles_inventario_id_idx" ON "reservas_inventario_detalles"("inventario_id");

-- AddForeignKey
ALTER TABLE "reservas_inventario" ADD CONSTRAINT "reservas_inventario_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "reservas_inventario" ADD CONSTRAINT "reservas_inventario_venta_id_fkey" FOREIGN KEY ("venta_id") REFERENCES "ventas"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "reservas_inventario_detalles" ADD CONSTRAINT "reservas_inventario_detalles_reserva_id_fkey" FOREIGN KEY ("reserva_id") REFERENCES "reservas_inventario"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "reservas_inventario_detalles" ADD CONSTRAINT "reservas_inventario_detalles_inventario_id_fkey" FOREIGN KEY ("inventario_id") REFERENCES "inventario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
