-- Compatibility rollout for databases that applied the initial reservation migration
-- before the staged constraints were introduced. The cleanup is idempotent.
UPDATE "inventario"
SET "cantidad_disponible" = GREATEST("cantidad_disponible", 0)
WHERE "cantidad_disponible" < 0;

UPDATE "inventario"
SET "reservado" = LEAST(GREATEST("reservado", 0), "cantidad_disponible")
WHERE "reservado" < 0 OR "reservado" > "cantidad_disponible";

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'inventario_reservado_within_stock_check'
      AND conrelid = 'inventario'::regclass
  ) THEN
    ALTER TABLE "inventario"
      ADD CONSTRAINT "inventario_reservado_within_stock_check"
      CHECK ("reservado" >= 0 AND "reservado" <= "cantidad_disponible") NOT VALID;
  END IF;
END $$;
ALTER TABLE "inventario" VALIDATE CONSTRAINT "inventario_reservado_within_stock_check";

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'reservas_inventario_estado_check'
      AND conrelid = 'reservas_inventario'::regclass
  ) THEN
    ALTER TABLE "reservas_inventario"
      ADD CONSTRAINT "reservas_inventario_estado_check"
      CHECK ("estado" IN ('ACTIVA', 'CONSUMIDA', 'LIBERADA', 'EXPIRADA')) NOT VALID;
  END IF;
END $$;
ALTER TABLE "reservas_inventario" VALIDATE CONSTRAINT "reservas_inventario_estado_check";
