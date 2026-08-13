import { RegistrarCompraUseCase } from './registrar-compra.use-case';
import { RecibirCompraUseCase } from './recibir-compra.use-case';
import type { ICompraRepository } from '../../domain/repositories/compra.repository.interface';
import { UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../../../../common/prisma/prisma.service';

function createHarness() {
  const FAKE_TX = {
    compra: {
      update: jest.fn().mockResolvedValue({ id: 1n, subtotal: 50, costo_transporte: 10 }),
    },
    compraDetalle: {
      update: jest.fn().mockResolvedValue({}),
      findMany: jest.fn().mockResolvedValue([{ cantidad_solicitada: 10, cantidad_recibida: 10 }]),
    },
    inventario: {
      findFirst: jest.fn().mockResolvedValue({ id: 100n, cantidad_disponible: 10 }),
      create: jest.fn().mockResolvedValue({ id: 100n, cantidad_disponible: 0 }),
      update: jest.fn().mockResolvedValue({}),
    },
    producto: {
      findUnique: jest.fn().mockResolvedValue({ costo_promedio: 5.0 }),
      update: jest.fn().mockResolvedValue({}),
    },
    movimientosInventario: {
      create: jest.fn().mockResolvedValue({}),
    },
  };

  const compraRepo = {
    crear: jest.fn().mockResolvedValue({ id: 1n, estado: 'BORRADOR', total: 50 }),
    listar: jest.fn(),
    obtenerPorId: jest.fn(),
  } as unknown as jest.Mocked<ICompraRepository>;

  const prisma = {
    $transaction: jest.fn((fn: (tx: unknown) => unknown) => fn(FAKE_TX)),
    compra: {
      findUnique: jest.fn().mockResolvedValue({
        id: 1n,
        estado: 'EMITIDA',
        costo_transporte: 10,
        subtotal: 50,
        total: 60,
        detalles: [
          {
            id: 101n,
            compra_id: 1n,
            producto_id: 500n,
            cantidad_solicitada: 10,
            cantidad_recibida: 0,
            precio_costo: 5,
          },
        ],
      }),
    },
  } as unknown as PrismaService;

  const bitacoraService = {
    registrar: jest.fn().mockResolvedValue({}),
  } as any;

  const registrarUseCase = new RegistrarCompraUseCase(
    compraRepo,
    prisma,
    bitacoraService,
  );

  const recibirUseCase = new RecibirCompraUseCase(prisma, bitacoraService);

  return {
    registrarUseCase,
    recibirUseCase,
    compraRepo,
    prisma,
    bitacoraService,
    FAKE_TX,
  };
}

describe('Compras Use Cases', () => {
  describe('RegistrarCompraUseCase', () => {
    it('crea orden de compra en estado BORRADOR por defecto', async () => {
      const { registrarUseCase, compraRepo, FAKE_TX } = createHarness();

      const res = await registrarUseCase.execute(
        {
          detalles: [{ producto_id: '500', cantidad: 10, costo_unitario: 5 }],
        },
        '42',
      );

      expect(res.success).toBe(true);
      expect(compraRepo.crear).toHaveBeenCalledWith(
        expect.objectContaining({ total: 50, estado: 'BORRADOR', usuario_id: 42n }),
        FAKE_TX,
      );
    });

    it('rechaza ejecución si falta el usuario autenticado', async () => {
      const { registrarUseCase, prisma } = createHarness();

      await expect(
        registrarUseCase.execute(
          {
            detalles: [{ producto_id: '500', cantidad: 10, costo_unitario: 5 }],
          } as any,
          undefined as never,
        ),
      ).rejects.toBeInstanceOf(UnauthorizedException);
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });
  });

  describe('RecibirCompraUseCase', () => {
    it('procesa recepción de compra, prorratea transporte y calcula costo promedio ponderado', async () => {
      const { recibirUseCase, FAKE_TX } = createHarness();

      const res = await recibirUseCase.execute(
        '1',
        {
          detalles_recibidos: [{ detalle_id: '101', cantidad_recibida: 10 }],
        },
        '42',
      );

      expect(res.success).toBe(true);
      expect(FAKE_TX.producto.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 500n },
        }),
      );
      expect(FAKE_TX.inventario.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 100n },
          data: { cantidad_disponible: { increment: 10 } },
        }),
      );
      expect(FAKE_TX.movimientosInventario.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            producto_id: 500n,
            tipo_movimiento: 'ENTRADA',
            cantidad: 10,
          }),
        }),
      );
    });
  });
});
