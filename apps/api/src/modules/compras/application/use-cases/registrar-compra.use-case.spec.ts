import { RegistrarCompraUseCase } from './registrar-compra.use-case';
import type { ICompraRepository } from '../../domain/repositories/compra.repository.interface';
import type { IInventarioRepository } from '../../../inventario/domain/repositories/inventario.repository.interface';
import type { IProductoRepository } from '../../../catalogo/domain/repositories/producto.repository.interface';
import type { IVarianteRepository } from '../../../catalogo/domain/repositories/variante.repository.interface';
import { UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../../../../common/prisma/prisma.service';

function createHarness() {
  const FAKE_TX = { __fakeTx: true };
  const compraRepo = { crear: jest.fn().mockResolvedValue({ id: 1n }), listar: jest.fn(), obtenerPorId: jest.fn() } as unknown as jest.Mocked<ICompraRepository>;
  const inventarioRepo = { listarStock: jest.fn(), listarMovimientos: jest.fn(), registrarMovimiento: jest.fn() } as unknown as jest.Mocked<IInventarioRepository>;
  const productoRepo = { actualizarPrecioVenta: jest.fn() } as unknown as jest.Mocked<IProductoRepository>;
  const varianteRepo = { actualizarPrecioVenta: jest.fn() } as unknown as jest.Mocked<IVarianteRepository>;
  const prisma = {
    $transaction: jest.fn((fn: (tx: unknown) => unknown) => fn(FAKE_TX)),
  } as unknown as PrismaService;

  const useCase = new RegistrarCompraUseCase(compraRepo, inventarioRepo, productoRepo, varianteRepo, prisma);
  return { useCase, compraRepo, inventarioRepo, productoRepo, varianteRepo, prisma, FAKE_TX };
}

describe('RegistrarCompraUseCase', () => {
  it('crea la compra y registra un movimiento de inventario por cada detalle, dentro de la misma tx', async () => {
    const { useCase, compraRepo, inventarioRepo, FAKE_TX } = createHarness();

    await useCase.execute({
      detalles: [{ producto_id: '1', cantidad: 10, costo_unitario: 5 }],
    } as any, '42');

    expect(compraRepo.crear).toHaveBeenCalledWith(
      expect.objectContaining({ total: 50, usuario_id: 42n }),
      FAKE_TX,
    );
    expect(inventarioRepo.registrarMovimiento).toHaveBeenCalledWith(
      expect.objectContaining({
        producto_id: 1n,
        tipo_movimiento: 'INGRESO_COMPRA',
        cantidad: 10,
        usuario_id: 42n,
      }),
      FAKE_TX,
    );
  });

  it('actualiza el precio de venta del PRODUCTO cuando el detalle no tiene variante_id', async () => {
    const { useCase, productoRepo, varianteRepo, FAKE_TX } = createHarness();

    await useCase.execute({
      detalles: [{ producto_id: '1', cantidad: 10, costo_unitario: 5, precio_venta: 12 }],
    } as any, '42');

    expect(productoRepo.actualizarPrecioVenta).toHaveBeenCalledWith(1n, 12, FAKE_TX);
    expect(varianteRepo.actualizarPrecioVenta).not.toHaveBeenCalled();
  });

  // Regresión: el código original hacía `tx.variante.update({ data: {} })` — un no-op silencioso
  // que nunca escribía el precio. Este test falla si esa regresión reaparece.
  it('actualiza el precio de venta de la VARIANTE (no del producto) cuando el detalle trae variante_id', async () => {
    const { useCase, productoRepo, varianteRepo, FAKE_TX } = createHarness();

    await useCase.execute({
      detalles: [{ producto_id: '1', variante_id: '701', cantidad: 10, costo_unitario: 5, precio_venta: 15 }],
    } as any, '42');

    expect(varianteRepo.actualizarPrecioVenta).toHaveBeenCalledWith(701n, 15, FAKE_TX);
    expect(productoRepo.actualizarPrecioVenta).not.toHaveBeenCalled();
  });

  it('no toca el precio de venta cuando el detalle no trae precio_venta', async () => {
    const { useCase, productoRepo, varianteRepo } = createHarness();

    await useCase.execute({
      detalles: [{ producto_id: '1', cantidad: 10, costo_unitario: 5 }],
    } as any, '42');

    expect(productoRepo.actualizarPrecioVenta).not.toHaveBeenCalled();
    expect(varianteRepo.actualizarPrecioVenta).not.toHaveBeenCalled();
  });

  it('rejects a missing actor instead of recording the fallback user', async () => {
    const { useCase, prisma } = createHarness();

    await expect(
      useCase.execute(
        { detalles: [{ producto_id: '1', cantidad: 10, costo_unitario: 5 }] } as any,
        undefined as never,
      ),
    ).rejects.toBeInstanceOf(UnauthorizedException);
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });
});
