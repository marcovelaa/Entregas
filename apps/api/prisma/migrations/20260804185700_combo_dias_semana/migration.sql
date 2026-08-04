-- AlterTable: add dias_semana to productos (combo availability days filter)
ALTER TABLE "productos" ADD COLUMN "dias_semana" INTEGER[] NOT NULL DEFAULT '{}';
