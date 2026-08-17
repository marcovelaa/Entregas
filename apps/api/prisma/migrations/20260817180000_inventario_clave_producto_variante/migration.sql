-- `ubicacion` is legacy descriptive metadata. The current inventory model has one
-- stock target per producto/variante, including products without a variant.
-- Reconcile any historical duplicate targets before replacing the ineffective
-- nullable-location unique index. Quantities and active reservation references
-- are preserved on the oldest canonical inventory row.
DO $$
DECLARE
  duplicate_group RECORD;
BEGIN
  FOR duplicate_group IN
    SELECT
      producto_id,
      variante_id,
      MIN(id) AS canonical_id,
      SUM(cantidad_disponible) AS cantidad_disponible_total,
      SUM(reservado) AS reservado_total,
      MAX(stock_minimo) AS stock_minimo_maximo
    FROM "inventario"
    GROUP BY producto_id, variante_id
    HAVING COUNT(*) > 1
  LOOP
    UPDATE "reservas_inventario_detalles" AS detalle
    SET inventario_id = duplicate_group.canonical_id
    WHERE detalle.inventario_id IN (
      SELECT id
      FROM "inventario"
      WHERE producto_id = duplicate_group.producto_id
        AND variante_id IS NOT DISTINCT FROM duplicate_group.variante_id
        AND id <> duplicate_group.canonical_id
    );

    UPDATE "inventario"
    SET
      cantidad_disponible = duplicate_group.cantidad_disponible_total,
      reservado = duplicate_group.reservado_total,
      stock_minimo = duplicate_group.stock_minimo_maximo
    WHERE id = duplicate_group.canonical_id;

    DELETE FROM "inventario"
    WHERE producto_id = duplicate_group.producto_id
      AND variante_id IS NOT DISTINCT FROM duplicate_group.variante_id
      AND id <> duplicate_group.canonical_id;
  END LOOP;
END $$;

DROP INDEX "inventario_producto_id_variante_id_ubicacion_key";

-- PostgreSQL 15+: unlike a normal UNIQUE index, NULLS NOT DISTINCT rejects a
-- second base-product row where variante_id is NULL.
CREATE UNIQUE INDEX "inventario_producto_id_variante_id_key"
ON "inventario"("producto_id", "variante_id") NULLS NOT DISTINCT;
