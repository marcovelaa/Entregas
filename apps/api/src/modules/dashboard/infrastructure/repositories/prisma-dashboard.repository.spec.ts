import { PrismaDashboardRepository } from './prisma-dashboard.repository';
import { PrismaService } from '../../../../common/prisma/prisma.service';

function createMockPrisma() {
  return {
    venta: { aggregate: jest.fn(), findMany: jest.fn(), groupBy: jest.fn() },
    inventario: { findMany: jest.fn(), aggregate: jest.fn() },
    producto: { count: jest.fn() },
  };
}

describe('PrismaDashboardRepository', () => {
  it('obtenerVentasHoy suma el total y cuenta ventas COMPLETADAS desde la fecha dada', async () => {
    const prisma = createMockPrisma();
    prisma.venta.aggregate.mockResolvedValue({ _sum: { total: 500 }, _count: { id: 4 } });
    const repo = new PrismaDashboardRepository(prisma as unknown as PrismaService);
    const desde = new Date(2026, 7, 5);

    const result = await repo.obtenerVentasHoy(desde);

    expect(result).toEqual({ total: 500, cantidad: 4 });
    expect(prisma.venta.aggregate).toHaveBeenCalledWith(
      expect.objectContaining({ where: { estado: 'COMPLETADA', creado_en: { gte: desde } } }),
    );
  });

  it('obtenerDistribucionPorMetodoPago agrega en la base con groupBy (cierra parte de 2.3)', async () => {
    const prisma = createMockPrisma();
    prisma.venta.groupBy.mockResolvedValue([
      { metodo_pago: 'efectivo', _sum: { total: 120 } },
      { metodo_pago: 'QR', _sum: { total: 40 } },
    ]);
    const repo = new PrismaDashboardRepository(prisma as unknown as PrismaService);
    const desde = new Date(2026, 7, 5);

    const result = await repo.obtenerDistribucionPorMetodoPago(desde);

    expect(prisma.venta.groupBy).toHaveBeenCalledWith({
      by: ['metodo_pago'],
      _sum: { total: true },
      where: { estado: 'COMPLETADA', creado_en: { gte: desde } },
    });
    expect(result).toEqual([
      { metodo: 'EFECTIVO', monto: 120 },
      { metodo: 'QR', monto: 40 },
    ]);
  });

  it('obtenerAlertasStock filtra por umbral, ordena ascendente y limita la cantidad', async () => {
    const prisma = createMockPrisma();
    prisma.inventario.findMany.mockResolvedValue([
      { id: 1n, cantidad_disponible: 2, stock_minimo: 5, producto: { nombre: 'Cuaderno', sku: 'CU-1' } },
    ]);
    const repo = new PrismaDashboardRepository(prisma as unknown as PrismaService);

    const result = await repo.obtenerAlertasStock(10, 5);

    expect(prisma.inventario.findMany).toHaveBeenCalledWith({
      where: { cantidad_disponible: { lte: 10 } },
      include: { producto: true },
      take: 5,
      orderBy: { cantidad_disponible: 'asc' },
    });
    expect(result).toEqual([{ id: '1', nombre: 'Cuaderno', sku: 'CU-1', stock: 2, stockMinimo: 5 }]);
  });

  it('obtenerVentasRecientes usa el nombre real del cliente (Cliente.nombre), sin campos inexistentes', async () => {
    const prisma = createMockPrisma();
    prisma.venta.findMany.mockResolvedValue([
      {
        id: 1n,
        numero_ticket: 'T-1',
        total: 99,
        metodo_pago: 'EFECTIVO',
        creado_en: new Date(2026, 7, 5),
        cliente: { nombre: 'Ana Pérez' },
      },
      {
        id: 2n,
        numero_ticket: 'T-2',
        total: 40,
        metodo_pago: 'QR',
        creado_en: new Date(2026, 7, 5),
        cliente: null,
      },
    ]);
    const repo = new PrismaDashboardRepository(prisma as unknown as PrismaService);

    const result = await repo.obtenerVentasRecientes(6);

    expect(result[0].clienteNombre).toBe('Ana Pérez');
    expect(result[1].clienteNombre).toBeNull();
  });
});
