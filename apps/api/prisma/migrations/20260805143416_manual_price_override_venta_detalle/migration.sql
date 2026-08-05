-- AlterTable
ALTER TABLE "venta_detalles" ADD COLUMN     "aprobado_por_usuario_id" BIGINT,
ADD COLUMN     "motivo_ajuste" TEXT,
ADD COLUMN     "precio_unitario_catalogo" DECIMAL(14,2) NOT NULL DEFAULT 0;

-- AddForeignKey
ALTER TABLE "venta_detalles" ADD CONSTRAINT "venta_detalles_aprobado_por_usuario_id_fkey" FOREIGN KEY ("aprobado_por_usuario_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
