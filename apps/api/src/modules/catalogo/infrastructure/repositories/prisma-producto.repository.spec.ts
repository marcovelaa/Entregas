import { PrismaProductoRepository } from './prisma-producto.repository';

function buildRepo() {
  const prisma = {
    $transaction: jest.fn((queries: unknown[]) => Promise.all(queries)),
    producto: {
      create: jest.fn(),
      findMany: jest.fn().mockResolvedValue([]),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
      createMany: jest.fn(),
      count: jest.fn().mockResolvedValue(0),
    },
    inventario: { findMany: jest.fn().mockResolvedValue([]) },
  };
  return { prisma, repo: new PrismaProductoRepository(prisma as any) };
}

function condicionVigencia(where: any): any {
  return (where.AND as any[]).find((c) => Array.isArray(c.OR));
}

const MODOS_CON_VIGENCIA = ['RANGO_FECHAS', 'FECHA_HORA', 'MIXTO'];

describe('PrismaProductoRepository - publica filter applies vigencia only to window modes (R3-1)', () => {
  it('does NOT apply a vigencia date condition to PERMANENTE combos with past vigencia_fin', async () => {
    const { prisma, repo } = buildRepo();

    await repo.buscarTodos({ visibilidad: 'publica' });

    const where = prisma.producto.findMany.mock.calls[0][0].where;
    expect(where.vigencia_fin).toBeUndefined();
    expect(where.vigencia_inicio).toBeUndefined();

    const cond = condicionVigencia(where);
    expect(cond.OR).toEqual(
      expect.arrayContaining([{ modo_venta: { notIn: MODOS_CON_VIGENCIA } }]),
    );
  });

  it('applies the full vigencia window (inicio <= now AND fin >= now) for RANGO_FECHAS products', async () => {
    const { prisma, repo } = buildRepo();

    await repo.buscarTodos({ visibilidad: 'publica' });

    const where = prisma.producto.findMany.mock.calls[0][0].where;
    const cond = condicionVigencia(where);
    const branchVentana = cond.OR.find((b: any) => Array.isArray(b.AND));

    expect(branchVentana.AND).toEqual(
      expect.arrayContaining([
        {
          OR: [
            { vigencia_inicio: null },
            { vigencia_inicio: { lte: expect.any(Date) } },
          ],
        },
        {
          OR: [
            { vigencia_fin: null },
            { vigencia_fin: { gte: expect.any(Date) } },
          ],
        },
      ]),
    );
  });

  it('keeps activo: true and tipo_producto conditions in the publica where', async () => {
    const { prisma, repo } = buildRepo();

    await repo.buscarTodos({ visibilidad: 'publica', tipo_producto: 'COMBO' });

    const where = prisma.producto.findMany.mock.calls[0][0].where;
    expect(where.tipo_producto).toBe('COMBO');
    expect(where.AND).toEqual(expect.arrayContaining([{ activo: true }]));
  });

  it('does NOT filter by modo_venta: null (field is non-nullable, @default(PERMANENTE))', async () => {
    const { prisma, repo } = buildRepo();

    await repo.buscarTodos({ visibilidad: 'publica' });

    const where = prisma.producto.findMany.mock.calls[0][0].where;
    const cond = condicionVigencia(where);
    // A null filter on a non-nullable field is a PrismaClientValidationError
    // (400) — it must never be emitted.
    expect(cond.OR).not.toEqual(expect.arrayContaining([{ modo_venta: null }]));
    // PERMANENTE/CUPO_FIJO pass through the notIn branch without a date window.
    expect(cond.OR).toEqual(
      expect.arrayContaining([{ modo_venta: { notIn: MODOS_CON_VIGENCIA } }]),
    );
  });
});
