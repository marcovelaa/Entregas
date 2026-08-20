import { NotFoundException } from '@nestjs/common';
import { ObtenerAnaliticaDescuentoUseCase } from './obtener-analitica-descuento.use-case';
import {
  DescuentoEntity,
  IDescuentoRepository,
} from '../../domain/repositories/descuento.repository.interface';

describe('ObtenerAnaliticaDescuentoUseCase', () => {
  const descuentoBase: Partial<DescuentoEntity> = {
    id: '5',
    nombre: 'Promo',
    tipo: 'PORCENTAJE',
    codigo_cupon: 'OFF10',
    canal: 'TODOS',
    activo: true,
  };

  it('throws NotFoundException (404) instead of {success:false} (unified error contract)', async () => {
    const repo = {
      buscarPorId: jest.fn().mockResolvedValue(null),
      buscarUsosConDetalle: jest.fn(),
    };
    const useCase = new ObtenerAnaliticaDescuentoUseCase(
      repo as unknown as IDescuentoRepository,
    );

    await expect(useCase.execute('999')).rejects.toThrow(NotFoundException);
    expect(repo.buscarUsosConDetalle).not.toHaveBeenCalled();
  });

  it('aggregates totals, top products and daily history from usage records', async () => {
    const repo = {
      buscarPorId: jest.fn().mockResolvedValue(descuentoBase),
      buscarUsosConDetalle: jest.fn().mockResolvedValue([
        {
          id: '1',
          ventaId: '100',
          clienteNombre: 'Juan',
          montoDescontado: 5,
          montoVenta: 50,
          fecha: new Date('2026-08-02T10:00:00.000Z'),
          productos: [
            { id: '1', nombre: 'Cuaderno', cantidad: 2, subtotal: 30 },
          ],
        },
        {
          id: '2',
          ventaId: '101',
          clienteNombre: 'Ana',
          montoDescontado: 3,
          montoVenta: 30,
          fecha: new Date('2026-08-01T10:00:00.000Z'),
          productos: [
            { id: '1', nombre: 'Cuaderno', cantidad: 1, subtotal: 15 },
          ],
        },
      ]),
    };
    const useCase = new ObtenerAnaliticaDescuentoUseCase(
      repo as unknown as IDescuentoRepository,
    );

    const result = await useCase.execute('5');

    expect(result.success).toBe(true);
    expect(result.data.totalUsos).toBe(2);
    expect(result.data.totalVentasBs).toBe(80);
    expect(result.data.totalDescontadoBs).toBe(8);
    expect(result.data.ticketPromedioBs).toBe(40);
    expect(result.data.topProductos[0]).toMatchObject({
      nombre: 'Cuaderno',
      cantidad: 3,
      totalBs: 45,
    });
    expect(
      result.data.historialDiario.map((h: { fecha: string }) => h.fecha),
    ).toEqual(['2026-08-01', '2026-08-02']);
    expect(result.data.ultimosCanjes).toHaveLength(2);
  });

  it('returns zeroed aggregates without dividing by zero when there is no usage', async () => {
    const repo = {
      buscarPorId: jest.fn().mockResolvedValue(descuentoBase),
      buscarUsosConDetalle: jest.fn().mockResolvedValue([]),
    };
    const useCase = new ObtenerAnaliticaDescuentoUseCase(
      repo as unknown as IDescuentoRepository,
    );

    const result = await useCase.execute('5');

    expect(result.data.totalUsos).toBe(0);
    expect(result.data.ticketPromedioBs).toBe(0);
    expect(result.data.topProductos).toEqual([]);
  });
});
