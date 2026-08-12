-- Repair legacy values before enforcing the stock-reservation invariant.
UPDATE "inventario"
SET "cantidad_disponible" = GREATEST("cantidad_disponible", 0)
WHERE "cantidad_disponible" < 0;

UPDATE "inventario"
SET "reservado" = LEAST(GREATEST("reservado", 0), "cantidad_disponible")
WHERE "reservado" < 0 OR "reservado" > "cantidad_disponible";

-- Add first, validate second: deployments never fail halfway through a table rewrite.
ALTER TABLE "inventario"
  ADD CONSTRAINT "inventario_reservado_within_stock_check"
  CHECK ("reservado" >= 0 AND "reservado" <= "cantidad_disponible") NOT VALID;
ALTER TABLE "inventario"
  VALIDATE CONSTRAINT "inventario_reservado_within_stock_check";

ALTER TABLE "reservas_inventario"
  ADD CONSTRAINT "reservas_inventario_estado_check"
  CHECK ("estado" IN ('ACTIVA', 'CONSUMIDA', 'LIBERADA', 'EXPIRADA')) NOT VALID;
ALTER TABLE "reservas_inventario"
  VALIDATE CONSTRAINT "reservas_inventario_estado_check";
