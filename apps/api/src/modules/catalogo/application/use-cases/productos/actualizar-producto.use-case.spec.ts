import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ActualizarProductoUseCase } from './actualizar-producto.use-case';
import { IProductoRepository } from '../../../domain/repositories/producto.repository.interface';

function actualizarRepoMock(overrides: Partial<IProductoRepository> = {}) {
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

function comboPersistido(overrides: Record<string, any> = {}) {
  return {
    id: 1n,
    public_id: 'abc',
    categoria_id: 1n,
    sku: 'SKU-1',
    nombre: 'Combo',
    unidad_medida: 'UNIDAD',
    atributos: {},
    precio_base: 100,
    activo: true,
    tipo_producto: 'COMBO',
    componentes_combo: [],
    ...overrides,
  };
}

describe('ActualizarProductoUseCase - vigencia UTC y guardrail de cupo (2.4)', () => {
  it('parses vigencia strings to UTC on update (RULES-2)', async () => {
    const repo = actualizarRepoMock({
      buscarPorId: jest.fn().mockResolvedValue(comboPersistido()),
      actualizar: jest.fn().mockResolvedValue({ id: 1n }),
    });
    const uc = new ActualizarProductoUseCase(repo);

    await uc.execute(1n, {
      vigencia_inicio: '2026-08-01',
      vigencia_fin: '2026-08-10',
    });

    expect(repo.actualizar).toHaveBeenCalledWith(
      1n,
      expect.objectContaining({
        vigencia_inicio: new Date('2026-08-01T04:00:00.000Z'),
        vigencia_fin: new Date('2026-08-10T04:00:00.000Z'),
      }),
    );
  });

  it('clears vigencia_fin when null is sent (null passthrough)', async () => {
    const repo = actualizarRepoMock({
      buscarPorId: jest.fn().mockResolvedValue(comboPersistido()),
      actualizar: jest.fn().mockResolvedValue({ id: 1n }),
    });
    const uc = new ActualizarProductoUseCase(repo);

    await uc.execute(1n, { vigencia_fin: null } as any);

    const updateData = (repo.actualizar as jest.Mock).mock.calls[0][1];
    expect(updateData.vigencia_fin).toBeNull();
  });

  it('throws BadRequestException when cupo_maximo exceeds stockBOM of the persisted BOM (5 kits, cupo 6)', async () => {
    const repo = actualizarRepoMock({
      buscarPorId: jest.fn().mockResolvedValue(
        comboPersistido({
          componentes_combo: [
            {
              cantidad: 1,
              componente_producto: {
                Inventario: [{ cantidad_disponible: 5, reservado: 0 }],
              },
            },
          ],
        }),
      ),
      actualizar: jest.fn().mockResolvedValue({ id: 1n }),
    });
    const uc = new ActualizarProductoUseCase(repo);

    await expect(uc.execute(1n, { cupo_maximo: 6 } as any)).rejects.toThrow(
      BadRequestException,
    );
    expect(repo.buscarStocksComponentes).not.toHaveBeenCalled();
    expect(repo.actualizar).not.toHaveBeenCalled();
  });

  it('accepts cupo_maximo equal to the persisted BOM stock', async () => {
    const repo = actualizarRepoMock({
      buscarPorId: jest.fn().mockResolvedValue(
        comboPersistido({
          componentes_combo: [
            {
              cantidad: 1,
              componente_producto: {
                Inventario: [{ cantidad_disponible: 5, reservado: 0 }],
              },
            },
          ],
        }),
      ),
      actualizar: jest.fn().mockResolvedValue({ id: 1n }),
    });
    const uc = new ActualizarProductoUseCase(repo);

    await uc.execute(1n, { cupo_maximo: 5 });

    expect(repo.actualizar).toHaveBeenCalledWith(
      1n,
      expect.objectContaining({ cupo_maximo: 5 }),
    );
  });

  it('validates against the NEW BOM when componentes_combo is supplied (2 kits, cupo 3)', async () => {
    const repo = actualizarRepoMock({
      buscarPorId: jest.fn().mockResolvedValue(
        comboPersistido({
          componentes_combo: [
            {
              cantidad: 1,
              componente_producto: {
                Inventario: [{ cantidad_disponible: 99, reservado: 0 }],
              },
            },
          ],
        }),
      ),
      buscarStocksComponentes: jest.fn().mockResolvedValue([
        {
          producto_id: 20n,
          variante_id: null,
          cantidad_disponible: 2,
          reservado: 0,
        },
      ]),
      actualizar: jest.fn().mockResolvedValue({ id: 1n }),
    });
    const uc = new ActualizarProductoUseCase(repo);

    await expect(
      uc.execute(1n, {
        cupo_maximo: 3,
        componentes_combo: [{ componente_prod_id: 20, cantidad: 1 }],
      } as any),
    ).rejects.toThrow(BadRequestException);
    expect(repo.buscarStocksComponentes).toHaveBeenCalledWith([20n]);
  });

  it('skips the guardrail for non-COMBO products', async () => {
    const repo = actualizarRepoMock({
      buscarPorId: jest
        .fn()
        .mockResolvedValue(comboPersistido({ tipo_producto: 'SIMPLE' })),
      actualizar: jest.fn().mockResolvedValue({ id: 1n }),
    });
    const uc = new ActualizarProductoUseCase(repo);

    await uc.execute(1n, { cupo_maximo: 999 });

    expect(repo.buscarStocksComponentes).not.toHaveBeenCalled();
    expect(repo.actualizar).toHaveBeenCalled();
  });

  it('rethrows NotFoundException when the product does not exist', async () => {
    const repo = actualizarRepoMock({
      buscarPorId: jest.fn().mockResolvedValue(null),
    });
    const uc = new ActualizarProductoUseCase(repo);

    await expect(uc.execute(1n, { nombre: 'X' } as any)).rejects.toThrow(
      NotFoundException,
    );
  });
});
