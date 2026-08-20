import { NotFoundException } from '@nestjs/common';
import { ObtenerDescuentoUseCase } from './obtener-descuento.use-case';
import { IDescuentoRepository } from '../../domain/repositories/descuento.repository.interface';

describe('ObtenerDescuentoUseCase', () => {
  it('throws NotFoundException (404) instead of {success:false} (unified error contract)', async () => {
    const repo = { buscarPorId: jest.fn().mockResolvedValue(null) };
    const useCase = new ObtenerDescuentoUseCase(
      repo as unknown as IDescuentoRepository,
    );

    await expect(useCase.execute('999')).rejects.toThrow(NotFoundException);
  });

  it('returns the mapped descuento when found', async () => {
    const repo = {
      buscarPorId: jest.fn().mockResolvedValue({
        id: '5',
        nombre: 'Promo',
        descripcion: null,
        codigo_cupon: 'OFF10',
        tipo: 'PORCENTAJE',
        valor: 10,
        max_monto_descuento: null,
        alcance: 'GLOBAL',
        canal: 'TODOS',
        cantidad_requerida: 1,
        cantidad_paga: 1,
        monto_minimo_compra: null,
        limite_usos: null,
        limite_usos_por_cliente: 1,
        usos_actuales: 0,
        prioridad: 0,
        fecha_inicio: new Date('2026-01-01'),
        fecha_fin: new Date('2026-12-31'),
        activo: true,
        dias_semana: [],
        hora_inicio: null,
        hora_fin: null,
        productos: [],
        variantes: [],
        empaques: [],
        categorias: [],
      }),
    };
    const useCase = new ObtenerDescuentoUseCase(
      repo as unknown as IDescuentoRepository,
    );

    const result = await useCase.execute('5');
    expect(result.success).toBe(true);
    expect(result.data.codigoCupon).toBe('OFF10');
  });
});
