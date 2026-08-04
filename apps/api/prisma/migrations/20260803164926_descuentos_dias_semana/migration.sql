-- AlterTable
ALTER TABLE "descuentos" ADD COLUMN     "dias_semana" INTEGER[] DEFAULT ARRAY[]::INTEGER[],
ADD COLUMN     "hora_fin" VARCHAR(5),
ADD COLUMN     "hora_inicio" VARCHAR(5);
