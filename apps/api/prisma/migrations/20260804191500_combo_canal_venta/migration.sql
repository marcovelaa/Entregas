-- CreateEnum
CREATE TYPE "CanalVenta" AS ENUM ('AMBOS', 'ECOMMERCE', 'POS');

-- AlterTable
ALTER TABLE "productos" ADD COLUMN "canal_venta" "CanalVenta" NOT NULL DEFAULT 'AMBOS';
