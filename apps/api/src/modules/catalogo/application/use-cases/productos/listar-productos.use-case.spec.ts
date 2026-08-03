import { ListarProductosUseCase } from './listar-productos.use-case';
import { IProductoRepository, ProductoEntity } from '../../../domain/repositories/producto.repository.interface';

function listarRepoMock(overrides: Partial<IProductoRepository> = {}) {
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
  return { cantidad, componente_producto: { Inventario: [{ cantidad_disponible: stock, reservado: 0 }] } };
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
  return combo({ ...overrides, tipo_producto: 'SIMPLE', id: 2n, public_id: 'pub-2', sku: 'SKU-2', nombre: 'Simple' });
}

describe('ListarProductosUseCase - stock_vendible/estado_venta y visibilidad (2.5)', () => {
  it('passes visibilidad through to the repository filters', async () => {
    const repo = listarRepoMock({
      buscarTodos: jest.fn().mockResolvedValue({ data: [], total: 0 }),
    });
    const uc = new ListarProductosUseCase(repo);

    await uc.execute({ visibilidad: 'publica' } as any, 1, 20);

    expect(repo.buscarTodos).toHaveBeenCalledWith(
      expect.objectContaining({ visibilidad: 'publica' }),
      1,
      20,
    );
  });

  it('excludes from publica a combo with cupo agotado (cupo_usado >= cupo_maximo) (RULES-3)', async () => {
    const repo = listarRepoMock({
      buscarTodos: jest
        .fn()
        .mockResolvedValue({
          data: [
            combo({ cupo_maximo: 10, cupo_usado: 10, componentes_combo: [bom(20)] }),
            combo({ id: 3n, cupo_maximo: 10, cupo_usado: 0, componentes_combo: [bom(20)] }),
          ],
          total: 2,
        }),
    });
    const uc = new ListarProductosUseCase(repo);

    const result = await uc.execute({ visibilidad: 'publica' } as any);

    expect(result.data).toHaveLength(1);
    expect(result.data[0].id).toBe(3n);
  });

  it('excludes from publica an inactive combo (estado INACTIVO)', async () => {
    const repo = listarRepoMock({
      buscarTodos: jest.fn().mockResolvedValue({
        data: [combo({ activo: false, componentes_combo: [bom(20)] })],
        total: 1,
      }),
    });
    const uc = new ListarProductosUseCase(repo);

    const result = await uc.execute({ visibilidad: 'publica' } as any);

    expect(result.data).toHaveLength(0);
  });

  it('excludes from publica an expired combo (vigencia_fin pasada, RANGO_FECHAS) (RULES-3)', async () => {
    const repo = listarRepoMock({
      buscarTodos: jest.fn().mockResolvedValue({
        data: [
          combo({
            modo_venta: 'RANGO_FECHAS',
            vigencia_fin: new Date('2020-01-01T00:00:00.000Z'),
            componentes_combo: [bom(20)],
          }),
        ],
        total: 1,
      }),
    });
    const uc = new ListarProductosUseCase(repo);

    const result = await uc.execute({ visibilidad: 'publica' } as any);

    expect(result.data).toHaveLength(0);
  });

  it('shows a legacy combo (cupo null) in publica with stock_vendible = stockBOM and estado ACTIVO (NFR-2)', async () => {
    const repo = listarRepoMock({
      buscarTodos: jest.fn().mockResolvedValue({
        data: [combo({ componentes_combo: [bom(20)] })],
        total: 1,
      }),
    });
    const uc = new ListarProductosUseCase(repo);

    const result = await uc.execute({ visibilidad: 'publica' } as any);

    expect(result.data).toHaveLength(1);
    expect(result.data[0]).toEqual(
      expect.objectContaining({ stock_vendible: 20, estado_venta: 'ACTIVO' }),
    );
  });

  it('computes sellable capped by cupo: stockBOM 20, cupo_maximo 5, cupo_usado 1 -> 4 (STOCK-1)', async () => {
    const repo = listarRepoMock({
      buscarTodos: jest.fn().mockResolvedValue({
        data: [combo({ cupo_maximo: 5, cupo_usado: 1, componentes_combo: [bom(20)] })],
        total: 1,
      }),
    });
    const uc = new ListarProductosUseCase(repo);

    const result = await uc.execute({ visibilidad: 'publica' } as any);

    expect(result.data[0]).toEqual(expect.objectContaining({ stock_vendible: 4, estado_venta: 'ACTIVO' }));
  });

  it('computes sellable capped by BOM: stockBOM 3, cupo_maximo 50, cupo_usado 0 -> 3 (STOCK-1)', async () => {
    const repo = listarRepoMock({
      buscarTodos: jest.fn().mockResolvedValue({
        data: [combo({ cupo_maximo: 50, cupo_usado: 0, componentes_combo: [bom(3)] })],
        total: 1,
      }),
    });
    const uc = new ListarProductosUseCase(repo);

    const result = await uc.execute({ visibilidad: 'admin' } as any);

    expect(result.data[0]).toEqual(expect.objectContaining({ stock_vendible: 3, estado_venta: 'ACTIVO' }));
  });

  it('lists VENCIDO and AGOTADO combos for admin WITH their estado_venta (RULES-3)', async () => {
    const repo = listarRepoMock({
      buscarTodos: jest.fn().mockResolvedValue({
        data: [
          combo({ id: 1n, modo_venta: 'RANGO_FECHAS', vigencia_fin: new Date('2020-01-01T00:00:00.000Z'), componentes_combo: [bom(20)] }),
          combo({ id: 4n, cupo_maximo: 10, cupo_usado: 10, componentes_combo: [bom(20)] }),
          combo({ id: 5n, cupo_maximo: 10, cupo_usado: 0, componentes_combo: [bom(20)] }),
        ],
        total: 3,
      }),
    });
    const uc = new ListarProductosUseCase(repo);

    const result = await uc.execute({ visibilidad: 'admin' } as any);

    expect(result.data).toHaveLength(3);
    expect(result.data.find((p) => p.id === 1n)).toEqual(expect.objectContaining({ estado_venta: 'VENCIDO', stock_vendible: 0 }));
    expect(result.data.find((p) => p.id === 4n)).toEqual(expect.objectContaining({ estado_venta: 'AGOTADO', stock_vendible: 0 }));
    expect(result.data.find((p) => p.id === 5n)).toEqual(expect.objectContaining({ estado_venta: 'ACTIVO', stock_vendible: 10 }));
  });

  it('does not filter agotado combos for admin (default visibilidad)', async () => {
    const repo = listarRepoMock({
      buscarTodos: jest.fn().mockResolvedValue({
        data: [combo({ cupo_maximo: 10, cupo_usado: 10, componentes_combo: [bom(20)] })],
        total: 1,
      }),
    });
    const uc = new ListarProductosUseCase(repo);

    const result = await uc.execute(undefined as any);

    expect(result.data).toHaveLength(1);
    expect(result.data[0]).toEqual(expect.objectContaining({ estado_venta: 'AGOTADO' }));
  });

  it('leaves SIMPLE products untouched (no additive fields invented)', async () => {
    const repo = listarRepoMock({
      buscarTodos: jest.fn().mockResolvedValue({
        data: [simple({ Inventario: [{ cantidad_disponible: 7, reservado: 0 }] })],
        total: 1,
      }),
    });
    const uc = new ListarProductosUseCase(repo);

    const result = await uc.execute({ visibilidad: 'publica' } as any);

    expect(result.data).toHaveLength(1);
    expect('stock_vendible' in result.data[0]).toBe(false);
    expect('estado_venta' in result.data[0]).toBe(false);
  });

  it('respects a future vigencia_fin as still sellable for publica', async () => {
    const repo = listarRepoMock({
      buscarTodos: jest.fn().mockResolvedValue({
        data: [
          combo({
            modo_venta: 'RANGO_FECHAS',
            vigencia_inicio: new Date('2026-01-01T00:00:00.000Z'),
            vigencia_fin: new Date('2099-12-31T00:00:00.000Z'),
            componentes_combo: [bom(20)],
          }),
        ],
        total: 1,
      }),
    });
    const uc = new ListarProductosUseCase(repo);

    const result = await uc.execute({ visibilidad: 'publica' } as any);

    expect(result.data).toHaveLength(1);
    expect(result.data[0]).toEqual(expect.objectContaining({ stock_vendible: 20, estado_venta: 'ACTIVO' }));
  });
});
