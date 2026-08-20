import { ListarDescuentosUseCase } from './listar-descuentos.use-case';
import { IDescuentoRepository } from '../../domain/repositories/descuento.repository.interface';

describe('ListarDescuentosUseCase', () => {
  it('maps repository entities to the stable camelCase response shape', async () => {
    const repo = {
      buscarTodos: jest.fn().mockResolvedValue([
        {
          id: '1',
          nombre: 'Promo',
          descripcion: null,
          codigo_cupon: null,
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
        },
      ]),
    };
    const useCase = new ListarDescuentosUseCase(
      repo as unknown as IDescuentoRepository,
    );

    const result = await useCase.execute();

    expect(result.success).toBe(true);
    expect(result.data).toHaveLength(1);
    expect(result.data[0]).toMatchObject({
      id: '1',
      codigoCupon: null,
      maxMontoDescuento: null,
      cantidadRequerida: 1,
    });
  });
});
