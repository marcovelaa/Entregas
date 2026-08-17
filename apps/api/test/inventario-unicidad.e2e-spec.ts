import { Prisma, PrismaClient } from '@prisma/client';
import { ensureInventoryStockTarget } from '../src/common/prisma/inventory-stock-target';

describe('Inventario producto-variante uniqueness (database)', () => {
  const prisma = new PrismaClient();
  const suffix = `${Date.now()}-${process.pid}`;
  let categoryId: bigint | undefined;
  let productId: bigint | undefined;
  let variantId: bigint | undefined;

  beforeAll(async () => {
    const category = await prisma.categoria.create({
      data: {
        nombre: `Inventory uniqueness ${suffix}`,
        slug: `inventory-uniqueness-${suffix}`,
      },
    });
    categoryId = category.id;

    const product = await prisma.producto.create({
      data: {
        categoria_id: category.id,
        nombre: `Inventory uniqueness ${suffix}`,
        sku: `INV-UNIQUE-${suffix}`,
        precio_base: 10,
      },
    });
    productId = product.id;
  });

  afterAll(async () => {
    if (productId) {
      await prisma.inventario.deleteMany({ where: { producto_id: productId } });
      if (variantId) await prisma.variante.delete({ where: { id: variantId } });
      await prisma.producto.delete({ where: { id: productId } });
    }
    if (categoryId)
      await prisma.categoria.delete({ where: { id: categoryId } });
    await prisma.$disconnect();
  });

  it('rejects a second base-product inventory row with NULL variante_id and allows a variant row', async () => {
    if (!productId) throw new Error('Test product was not created.');

    const [firstTarget, concurrentTarget] = await Promise.all([
      ensureInventoryStockTarget(prisma, productId, null),
      ensureInventoryStockTarget(prisma, productId, null),
    ]);

    expect(concurrentTarget.id).toBe(firstTarget.id);
    expect(
      await prisma.inventario.count({ where: { producto_id: productId } }),
    ).toBe(1);

    await expect(
      prisma.inventario.create({
        data: {
          producto_id: productId,
          cantidad_disponible: 2,
          reservado: 0,
        },
      }),
    ).rejects.toMatchObject({
      code: 'P2002',
    } satisfies Partial<Prisma.PrismaClientKnownRequestError>);

    const variant = await prisma.variante.create({
      data: {
        producto_id: productId,
        nombre: `Variant ${suffix}`,
        sku_base: `INV-UNIQUE-VAR-${suffix}`,
      },
    });
    variantId = variant.id;

    await prisma.inventario.create({
      data: {
        producto_id: productId,
        variante_id: variant.id,
        cantidad_disponible: 2,
        reservado: 0,
      },
    });

    expect(
      await prisma.inventario.count({ where: { producto_id: productId } }),
    ).toBe(2);
  });
});
