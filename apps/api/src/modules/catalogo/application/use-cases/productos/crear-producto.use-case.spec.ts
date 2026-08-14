import { BadRequestException } from '@nestjs/common';
import { CrearProductoUseCase } from './crear-producto.use-case';
import { IProductoRepository } from '../../../domain/repositories/producto.repository.interface';

function crearRepoMock(overrides: Partial<IProductoRepository> = {}) {
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

describe('CrearProductoUseCase - vigencia UTC y guardrail de cupo (2.4)', () => {
  it('persists vigencia_fin "2026-08-10" as 2026-08-10T04:00:00Z (RULES-2)', async () => {
    const repo = crearRepoMock({
      crear: jest.fn().mockResolvedValue({ id: 1n }),
    });
    const uc = new CrearProductoUseCase(repo);

    await uc.execute({
      nombre: 'Combo',
      precio_base: 100,
      categoria_id: 1,
      tipo_producto: 'COMBO',
      vigencia_fin: '2026-08-10',
    } as any);

    expect(repo.crear).toHaveBeenCalledWith(
      expect.objectContaining({
        vigencia_fin: new Date('2026-08-10T04:00:00.000Z'),
      }),
    );
  });

  it('persists local datetime "2026-08-10T23:59" as 2026-08-11T03:59:00Z (America/La_Paz -4h)', async () => {
    const repo = crearRepoMock({
      crear: jest.fn().mockResolvedValue({ id: 1n }),
    });
    const uc = new CrearProductoUseCase(repo);

    await uc.execute({
      nombre: 'Combo',
      precio_base: 100,
      categoria_id: 1,
      tipo_producto: 'COMBO',
      vigencia_fin: '2026-08-10T23:59',
    } as any);

    expect(repo.crear).toHaveBeenCalledWith(
      expect.objectContaining({
        vigencia_fin: new Date('2026-08-11T03:59:00.000Z'),
      }),
    );
  });

  it('leaves vigencia fields undefined when not provided', async () => {
    const repo = crearRepoMock({
      crear: jest.fn().mockResolvedValue({ id: 1n }),
    });
    const uc = new CrearProductoUseCase(repo);

    await uc.execute({
      nombre: 'Simple',
      precio_base: 50,
      categoria_id: 1,
    });

    const createData = (repo.crear as jest.Mock).mock.calls[0][0];
    expect(createData.vigencia_inicio).toBeUndefined();
    expect(createData.vigencia_fin).toBeUndefined();
  });

  it('throws BadRequestException when cupo_maximo exceeds stockBOM (10/1 y 30/2 -> 10 kits, cupo 11)', async () => {
    const repo = crearRepoMock({
      buscarStocksComponentes: jest.fn().mockResolvedValue([
        {
          producto_id: 10n,
          variante_id: null,
          cantidad_disponible: 10,
          reservado: 0,
        },
        {
          producto_id: 11n,
          variante_id: null,
          cantidad_disponible: 30,
          reservado: 0,
        },
      ]),
      crear: jest.fn().mockResolvedValue({ id: 1n }),
    });
    const uc = new CrearProductoUseCase(repo);

    await expect(
      uc.execute({
        nombre: 'Combo',
        precio_base: 100,
        categoria_id: 1,
        tipo_producto: 'COMBO',
        cupo_maximo: 11,
        componentes_combo: [
          { componente_prod_id: 10, cantidad: 1 },
          { componente_prod_id: 11, cantidad: 2 },
        ],
      } as any),
    ).rejects.toThrow(BadRequestException);
    expect(repo.crear).not.toHaveBeenCalled();
  });

  it('accepts cupo_maximo equal to stockBOM and persists it', async () => {
    const repo = crearRepoMock({
      buscarStocksComponentes: jest.fn().mockResolvedValue([
        {
          producto_id: 10n,
          variante_id: null,
          cantidad_disponible: 10,
          reservado: 0,
        },
      ]),
      crear: jest.fn().mockResolvedValue({ id: 1n }),
    });
    const uc = new CrearProductoUseCase(repo);

    await uc.execute({
      nombre: 'Combo',
      precio_base: 100,
      categoria_id: 1,
      tipo_producto: 'COMBO',
      cupo_maximo: 10,
      componentes_combo: [{ componente_prod_id: 10, cantidad: 1 }],
    } as any);

    expect(repo.crear).toHaveBeenCalledWith(
      expect.objectContaining({ cupo_maximo: 10 }),
    );
  });

  it('matches stock by variante_id for variante components', async () => {
    const repo = crearRepoMock({
      buscarStocksComponentes: jest.fn().mockResolvedValue([
        {
          producto_id: 10n,
          variante_id: null,
          cantidad_disponible: 50,
          reservado: 0,
        },
        {
          producto_id: 10n,
          variante_id: 7n,
          cantidad_disponible: 2,
          reservado: 0,
        },
      ]),
      crear: jest.fn().mockResolvedValue({ id: 1n }),
    });
    const uc = new CrearProductoUseCase(repo);

    await expect(
      uc.execute({
        nombre: 'Combo',
        precio_base: 100,
        categoria_id: 1,
        tipo_producto: 'COMBO',
        cupo_maximo: 3,
        componentes_combo: [
          { componente_prod_id: 10, variante_id: 7, cantidad: 1 },
        ],
      } as any),
    ).rejects.toThrow(BadRequestException);
  });

  it('skips the guardrail for non-COMBO products (no stock fetch)', async () => {
    const repo = crearRepoMock({
      buscarStocksComponentes: jest.fn(),
      crear: jest.fn().mockResolvedValue({ id: 1n }),
    });
    const uc = new CrearProductoUseCase(repo);

    await uc.execute({
      nombre: 'Simple',
      precio_base: 50,
      categoria_id: 1,
      tipo_producto: 'SIMPLE',
      cupo_maximo: 999,
    } as any);

    expect(repo.buscarStocksComponentes).not.toHaveBeenCalled();
    expect(repo.crear).toHaveBeenCalled();
  });

  it('treats a COMBO without components as stockBOM 0 (cupo 0 passes, cupo 1 throws)', async () => {
    const repo = crearRepoMock({
      buscarStocksComponentes: jest.fn().mockResolvedValue([]),
      crear: jest.fn().mockResolvedValue({ id: 1n }),
    });
    const uc = new CrearProductoUseCase(repo);

    await expect(
      uc.execute({
        nombre: 'Combo',
        precio_base: 100,
        categoria_id: 1,
        tipo_producto: 'COMBO',
        cupo_maximo: 1,
      } as any),
    ).rejects.toThrow(BadRequestException);

    await uc.execute({
      nombre: 'Combo',
      precio_base: 100,
      categoria_id: 1,
      tipo_producto: 'COMBO',
      cupo_maximo: 0,
    } as any);
    expect(repo.crear).toHaveBeenCalledWith(
      expect.objectContaining({ cupo_maximo: 0 }),
    );
  });
});
