import type { Prisma } from '@prisma/client';

type InventorySqlClient = Pick<Prisma.TransactionClient, '$queryRaw'>;

export type InventoryStockTarget = {
  id: bigint;
  cantidad_disponible: number;
  reservado: number;
};

/**
 * Creates or returns the sole inventory row for a product/variant stock target.
 *
 * Prisma cannot express a compound `findUnique` selector when one of its
 * columns is nullable. The PostgreSQL index uses `NULLS NOT DISTINCT`, so this
 * SQL upsert keeps the base-product (`variante_id IS NULL`) path atomic too.
 */
export async function ensureInventoryStockTarget(
  client: InventorySqlClient,
  productoId: bigint,
  varianteId: bigint | null,
  ubicacion: string | null = null,
): Promise<InventoryStockTarget> {
  const rows = await client.$queryRaw<InventoryStockTarget[]>`
    INSERT INTO "inventario" (
      "producto_id",
      "variante_id",
      "cantidad_disponible",
      "reservado",
      "stock_minimo",
      "ubicacion",
      "creado_en",
      "actualizado_en"
    )
    VALUES (${productoId}, ${varianteId}, 0, 0, 5, ${ubicacion}, NOW(), NOW())
    ON CONFLICT ("producto_id", "variante_id")
    DO UPDATE SET "actualizado_en" = "inventario"."actualizado_en"
    RETURNING "id", "cantidad_disponible", "reservado"
  `;

  const inventory = rows[0];
  if (!inventory) {
    throw new Error('Inventory stock target upsert returned no row');
  }

  return inventory;
}
