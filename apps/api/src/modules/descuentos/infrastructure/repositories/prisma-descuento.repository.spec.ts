import { PrismaDescuentoRepository } from './prisma-descuento.repository';
import { PrismaService } from '../../../../common/prisma/prisma.service';

function createMockPrisma() {
  return {
    descuento: { findMany: jest.fn() },
    descuentoUso: { count: jest.fn() },
  };
}

function descuentoRow(overrides: Record<string, unknown> = {}) {
  return {
    id: 10n,
    nombre: 'Descuento de prueba',
    codigo_cupon: null,
    tipo: 'MONTO_FIJO',
    alcance: 'GLOBAL',
    canal: 'TODOS',
    valor: 10,
    max_monto_descuento: null,
    cantidad_requerida: 1,
    cantidad_paga: 1,
    monto_minimo_compra: null,
    limite_usos: null,
    limite_usos_por_cliente: null,
    usos_actuales: 0,
    prioridad: 0,
    dias_semana: [],
    hora_inicio: null,
    hora_fin: null,
    productos: [{ producto_id: 101n }],
    variantes: [{ variante_id: 701n }],
    empaques: [{ empaque_id: 501n }],
    categorias: [{ categoria_id: 3n }],
    ...overrides,
  };
}

describe('PrismaDescuentoRepository.buscarReglasVigentes', () => {
  it('filtra por activo/vigencia/cupón/día en el WHERE (SQL-side, no en memoria) — cierra 3.1', async () => {
    const prisma = createMockPrisma();
    prisma.descuento.findMany.mockResolvedValue([]);
    const repo = new PrismaDescuentoRepository(prisma as unknown as PrismaService);

    const now = new Date(2026, 7, 3, 15, 0, 0); // lunes
    await repo.buscarReglasVigentes({ now, codigoCupon: 'promo10' });

    expect(prisma.descuento.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          activo: true,
          fecha_inicio: { lte: now },
          fecha_fin: { gte: now },
          codigo_cupon: 'PROMO10',
          OR: [{ dias_semana: { isEmpty: true } }, { dias_semana: { has: now.getDay() } }],
        },
      }),
    );
  });

  it('usa codigo_cupon: null en el WHERE cuando no se pasa cupón', async () => {
    const prisma = createMockPrisma();
    prisma.descuento.findMany.mockResolvedValue([]);
    const repo = new PrismaDescuentoRepository(prisma as unknown as PrismaService);

    await repo.buscarReglasVigentes({ now: new Date() });

    expect(prisma.descuento.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ codigo_cupon: null }) }),
    );
  });

  it('mapea BigInt -> string y Decimal -> number, sin filtrar en memoria', async () => {
    const prisma = createMockPrisma();
    prisma.descuento.findMany.mockResolvedValue([
      descuentoRow({ id: 10n, valor: 15.5, max_monto_descuento: 50, monto_minimo_compra: 20 }),
    ]);
    const repo = new PrismaDescuentoRepository(prisma as unknown as PrismaService);

    const [regla] = await repo.buscarReglasVigentes({ now: new Date() });

    expect(regla).toEqual(
      expect.objectContaining({
        id: '10',
        valor: 15.5,
        max_monto_descuento: 50,
        monto_minimo_compra: 20,
        productos: [{ producto_id: '101' }],
        variantes: [{ variante_id: '701' }],
        empaques: [{ empaque_id: '501' }],
        categorias: [{ categoria_id: '3' }],
      }),
    );
  });
});

describe('PrismaDescuentoRepository.contarUsosPorCliente', () => {
  it('cuenta los usos de un descuento filtrando por descuento_id y cliente_id (ambos como BigInt)', async () => {
    const prisma = createMockPrisma();
    prisma.descuentoUso.count.mockResolvedValue(2);
    const repo = new PrismaDescuentoRepository(prisma as unknown as PrismaService);

    const count = await repo.contarUsosPorCliente('10', '55');

    expect(count).toBe(2);
    expect(prisma.descuentoUso.count).toHaveBeenCalledWith({
      where: { descuento_id: 10n, cliente_id: 55n },
    });
  });
});
