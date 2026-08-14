import { ObtenerProductoUseCase } from './obtener-producto.use-case';
import {
  IProductoRepository,
  ProductoEntity,
} from '../../../domain/repositories/producto.repository.interface';

function repoMock(overrides: Partial<IProductoRepository> = {}) {
  return {
    crear: jest.fn(),
    buscarTodos: jest.fn(),
    buscarPorId: jest.fn(),
    buscarPorPublicId: jest.fn(),
    buscarPorSku: jest.fn(),
    actualizar: jest.fn(),
    desactivar: jest.fn(),
    eliminar: jest.fn(),
    contarVariantesAsociadas: jest.fn(),
    buscarStocksComponentes: jest.fn(),
    ...overrides,
  } as unknown as IProductoRepository;
}

function bom(stock: number, cantidad = 1) {
  return {
    cantidad,
    componente_producto: {
      Inventario: [{ cantidad_disponible: stock, reservado: 0 }],
    },
  };
}

function combo(overrides: Record<string, any> = {}): ProductoEntity {
  return {
    id: 1n,
    public_id: 'pub-1',
    categoria_id: 1n,
    sku: 'SKU-1',
    nombre: 'Combo',
    unidad_medida: 'UNIDAD',
    atributos: {},
    precio_base: 100,
    activo: true,
    tipo_producto: 'COMBO',
    modo_venta: 'PERMANENTE',
    cupo_usado: 0,
    cupo_maximo: null,
    vigencia_inicio: null,
    vigencia_fin: null,
    componentes_combo: [],
    ...overrides,
  };
}

function simple(overrides: Record<string, any> = {}): ProductoEntity {
  return combo({
    ...overrides,
    tipo_producto: 'SIMPLE',
    id: 2n,
    public_id: 'pub-2',
    sku: 'SKU-2',
    nombre: 'Simple',
  });
}

describe('ObtenerProductoUseCase - stock_vendible/estado_venta para combos (R2-1)', () => {
  it('returns stock_vendible and estado_venta for a COMBO product', async () => {
    const repo = repoMock({
      buscarPorId: jest
        .fn()
        .mockResolvedValue(combo({ componentes_combo: [bom(20)] })),
    });
    const uc = new ObtenerProductoUseCase(repo);

    const result = await uc.execute('1');

    expect(result).toEqual(
      expect.objectContaining({ stock_vendible: 20, estado_venta: 'ACTIVO' }),
    );
  });

  it('returns sellable 0 / AGOTADO for a COMBO without sellable stock', async () => {
    const repo = repoMock({
      buscarPorId: jest
        .fn()
        .mockResolvedValue(combo({ componentes_combo: [] })),
    });
    const uc = new ObtenerProductoUseCase(repo);

    const result = await uc.execute('1');

    expect(result).toEqual(
      expect.objectContaining({ stock_vendible: 0, estado_venta: 'AGOTADO' }),
    );
  });

  it('leaves SIMPLE products untouched (no additive fields invented)', async () => {
    const repo = repoMock({
      buscarPorId: jest.fn().mockResolvedValue(simple()),
    });
    const uc = new ObtenerProductoUseCase(repo);

    const result = await uc.execute('2');

    expect('stock_vendible' in result).toBe(false);
    expect('estado_venta' in result).toBe(false);
  });

  it('falls back to public_id lookup when the id lookup misses', async () => {
    const repo = repoMock({
      buscarPorId: jest.fn().mockResolvedValue(null),
      buscarPorPublicId: jest
        .fn()
        .mockResolvedValue(combo({ id: 9n, componentes_combo: [bom(5)] })),
    });
    const uc = new ObtenerProductoUseCase(repo);

    const result = await uc.execute('pub-1');

    expect(repo.buscarPorPublicId).toHaveBeenCalledWith('pub-1');
    expect(result).toEqual(
      expect.objectContaining({
        id: 9n,
        stock_vendible: 5,
        estado_venta: 'ACTIVO',
      }),
    );
  });

  it('throws NotFoundException when the product does not exist', async () => {
    const repo = repoMock({
      buscarPorId: jest.fn().mockResolvedValue(null),
      buscarPorPublicId: jest.fn().mockResolvedValue(null),
    });
    const uc = new ObtenerProductoUseCase(repo);

    await expect(uc.execute('missing')).rejects.toThrow('no encontrado');
  });
});
