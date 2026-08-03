-- CreateEnum
CREATE TYPE "ModoVenta" AS ENUM ('PERMANENTE', 'RANGO_FECHAS', 'FECHA_HORA', 'CUPO_FIJO', 'MIXTO');

-- AlterTable
ALTER TABLE "productos" ADD COLUMN     "cupo_maximo" INTEGER,
ADD COLUMN     "cupo_usado" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "modo_venta" "ModoVenta" NOT NULL DEFAULT 'PERMANENTE',
ADD COLUMN     "vigencia_fin" TIMESTAMPTZ(3),
ADD COLUMN     "vigencia_inicio" TIMESTAMPTZ(3);

-- CreateIndex
CREATE INDEX "productos_activo_tipo_producto_vigencia_fin_idx" ON "productos"("activo", "tipo_producto", "vigencia_fin");

