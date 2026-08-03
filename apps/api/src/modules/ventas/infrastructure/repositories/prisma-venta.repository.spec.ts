import { ConflictException } from '@nestjs/common';
import { PrismaService } from '../../../../common/prisma/prisma.service';
import { PrismaVentaRepository } from './prisma-venta.repository';
import { VentaCreateData } from '../../domain/repositories/venta.repository.interface';

type TxMock = {
  venta: {
    create: jest.Mock;
    findUnique: jest.Mock;
    update: jest.Mock;
  };
  producto: {
    findUnique: jest.Mock;
    updateMany: jest.Mock;
  };
  inventario: {
    findFirst: jest.Mock;
    updateMany: jest.Mock;
    update: jest.Mock;
  };
  movimientosInventario: { create: jest.Mock };
};

type CupoState = { cupoUsado: number };

function createTx(): TxMock {
  return {
    venta: { create: jest.fn(), findUnique: jest.fn(), update: jest.fn() },
    producto: { findUnique: jest.fn(), updateMany: jest.fn() },
    inventario: { findFirst: jest.fn(), updateMany: jest.fn(), update: jest.fn() },
    movimientosInventario: { create: jest.fn() },
  };
}

function createHarness(tx: TxMock) {
  const prisma = {
    $transaction: jest.fn(async (fn: (t: TxMock) => unknown) => fn(tx)),
  } as unknown as PrismaService;
  return { repo: new PrismaVentaRepository(prisma), prisma, tx };
}

function comboRow(overrides: Record<string, unknown> = {}) {
  return {
    id: 99n,
    nombre: 'Combo X',
    tipo_producto: 'COMBO',
    modo_venta: 'PERMANENTE',
    vigencia_inicio: null,
    vigencia_fin: null,
    cupo_maximo: null,
    cupo_usado: 0,
    componentes_combo: [
      {
        componente_prod_id: 7n,
        variante_id: null,
        cantidad: 2,
        componente_producto: { nombre: 'Cafe' },
      },
    ],
    ...overrides,
  };
}

function ventaRow() {
  return {
    id: 1n,
    cliente_id: null,
    usuario_id: 1n,
    cliente: null,
    detalles: [
      {
        id: 10n,
        venta_id: 1n,
        producto_id: 99n,
        variante_id: null,
        empaque_id: null,
        producto: { id: 99n, nombre: 'Combo X', categoria_id: 1n, marca_id: null },
        variante: null,
      },
    ],
  };
}

function anuladaRow() {
  return {
    id: 5n,
    estado: 'ANULADA',
    detalles: [{ id: 10n, venta_id: 5n, producto_id: 99n, variante_id: null, cantidad: 1 }],
  };
}

function completadaRow() {
  return { ...anuladaRow(), estado: 'COMPLETADA' };
}

/**
 * Mirrors the DB-level conditional-update semantics of cupo reservations:
 * - reservation (where.cupo_usado.lte + increment) succeeds only while
 *   cupoUsado <= cap - cantidad (atomic guard that kills the POS race),
 * - release (where.cupo_usado.gte + decrement) subtracts only when there is
 *   enough usage, otherwise the caller clamps via the gt-branch,
 * - plain increment (revertirAnulacion) never validates against the cap.
 */
function mockCupoStateful(tx: TxMock, state: CupoState) {
  tx.producto.updateMany.mockImplementation(
    async ({ where, data }: { where: Record<string, any>; data: Record<string, any> }) => {
      const used = state.cupoUsado;
      if (typeof where.cupo_usado?.lte === 'number') {
        if (used <= where.cupo_usado.lte) {
          state.cupoUsado = used + data.cupo_usado.increment;
          return { count: 1 };
        }
        return { count: 0 };
      }
      if (typeof where.cupo_usado?.gte === 'number') {
        if (used >= where.cupo_usado.gte) {
          state.cupoUsado = used - data.cupo_usado.decrement;
          return { count: 1 };
        }
        return { count: 0 };
      }
      if (typeof where.cupo_usado?.gt === 'number') {
        if (used > where.cupo_usado.gt) {
          state.cupoUsado = 0;
          return { count: 1 };
        }
        return { count: 0 };
      }
      if (data.cupo_usado?.increment !== undefined) {
        state.cupoUsado = used + data.cupo_usado.increment;
        return { count: 1 };
      }
      return { count: 0 };
    },
  );
}

function setupCrear(tx: TxMock, comboOverrides: Record<string, unknown> = {}) {
  tx.venta.create.mockResolvedValue(ventaRow());
  tx.producto.findUnique.mockResolvedValue(comboRow(comboOverrides));
  tx.inventario.findFirst.mockResolvedValue({ id: 5n, cantidad_disponible: 100, reservado: 0 });
  tx.inventario.updateMany.mockResolvedValue({ count: 1 });
  tx.movimientosInventario.create.mockResolvedValue({});
}

function setupAnular(tx: TxMock, comboOverrides: Record<string, unknown> = {}) {
  tx.venta.findUnique.mockResolvedValue(completadaRow());
  tx.producto.findUnique.mockResolvedValue(comboRow(comboOverrides));
  tx.inventario.findFirst.mockResolvedValue({ id: 5n, cantidad_disponible: 8, reservado: 0 });
  tx.inventario.update.mockResolvedValue({});
  tx.movimientosInventario.create.mockResolvedValue({});
}

function setupRevertir(tx: TxMock, comboOverrides: Record<string, unknown> = {}) {
  tx.venta.findUnique.mockResolvedValue(anuladaRow());
  tx.producto.findUnique.mockResolvedValue(comboRow(comboOverrides));
  tx.inventario.findFirst.mockResolvedValue({ id: 5n, cantidad_disponible: 10, reservado: 0 });
  tx.inventario.update.mockResolvedValue({});
  tx.movimientosInventario.create.mockResolvedValue({});
}

const ventaData: VentaCreateData = {
  usuario_id: '1',
  metodo_pago: 'EFECTIVO',
  monto_pagado: 50,
  detalles: [{ producto_id: '99', cantidad: 1, precio_unitario: 50 }],
};

async function expectConflict(promise: Promise<unknown>, message: string) {
  const error = await promise.catch((e: unknown) => e);
  expect(error).toBeInstanceOf(ConflictException);
  expect((error as Error).message).toBe(message);
}

describe('PrismaVentaRepository.crear - vigencia y cupo (2.7)', () => {
  it('ENF-1: rejects 409 when cupo is exhausted and cupo_usado is NOT incremented', async () => {
    const { repo, tx } = createHarness(createTx());
    const state: CupoState = { cupoUsado: 10 };
    mockCupoStateful(tx, state);
    setupCrear(tx, { cupo_maximo: 10, cupo_usado: 10 });

    await expectConflict(repo.crear(ventaData, 50, 0), 'Cupo agotado para el combo Combo X');

    expect(tx.producto.updateMany).toHaveBeenCalledWith({
      where: { id: 99n, cupo_maximo: { not: null }, cupo_usado: { lte: 9 } },
      data: { cupo_usado: { increment: 1 } },
    });
    expect(state.cupoUsado).toBe(10);
    expect(tx.inventario.updateMany).not.toHaveBeenCalled();
  });

  it('ENF-2: rejects 409 when vigencia_fin is in the past (RANGO_FECHAS)', async () => {
    const { repo, tx } = createHarness(createTx());
    setupCrear(tx, {
      modo_venta: 'RANGO_FECHAS',
      vigencia_inicio: new Date('2020-01-01T00:00:00.000Z'),
      vigencia_fin: new Date('2020-02-01T00:00:00.000Z'),
    });

    await expectConflict(repo.crear(ventaData, 50, 0), 'El combo Combo X no está en vigencia');

    expect(tx.producto.updateMany).not.toHaveBeenCalled();
    expect(tx.inventario.updateMany).not.toHaveBeenCalled();
  });

  it('rejects 409 when vigencia_inicio is in the future (FECHA_HORA)', async () => {
    const { repo, tx } = createHarness(createTx());
    setupCrear(tx, {
      modo_venta: 'FECHA_HORA',
      vigencia_inicio: new Date('2999-01-01T00:00:00.000Z'),
    });

    await expectConflict(repo.crear(ventaData, 50, 0), 'El combo Combo X no está en vigencia');
    expect(tx.inventario.updateMany).not.toHaveBeenCalled();
  });

  it('allows MIXTO with no date bounds (sale proceeds, stock deducted)', async () => {
    const { repo, tx } = createHarness(createTx());
    setupCrear(tx, { modo_venta: 'MIXTO', cupo_maximo: 10, cupo_usado: 3 });
    mockCupoStateful(tx, { cupoUsado: 3 });

    const result = await repo.crear(ventaData, 50, 0);

    expect(result.id).toBe('1');
    expect(tx.inventario.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({ data: { cantidad_disponible: { decrement: 2 } } }),
    );
  });

  it('ignores date bounds for PERMANENTE (past vigencia_fin does not block the sale)', async () => {
    const { repo, tx } = createHarness(createTx());
    setupCrear(tx, {
      modo_venta: 'PERMANENTE',
      vigencia_fin: new Date('2020-02-01T00:00:00.000Z'),
    });

    const result = await repo.crear(ventaData, 50, 0);

    expect(result.id).toBe('1');
    expect(tx.inventario.updateMany).toHaveBeenCalled();
  });

  it('allows a combo inside its active window and reserves cupo', async () => {
    const { repo, tx, prisma } = createHarness(createTx());
    const state: CupoState = { cupoUsado: 3 };
    mockCupoStateful(tx, state);
    setupCrear(tx, {
      modo_venta: 'RANGO_FECHAS',
      vigencia_inicio: new Date('2020-01-01T00:00:00.000Z'),
      vigencia_fin: new Date('2999-01-01T00:00:00.000Z'),
      cupo_maximo: 10,
      cupo_usado: 3,
    });

    const result = await repo.crear(ventaData, 50, 0);

    expect(result.id).toBe('1');
    expect(state.cupoUsado).toBe(4);
    expect(tx.producto.updateMany).toHaveBeenCalledWith({
      where: { id: 99n, cupo_maximo: { not: null }, cupo_usado: { lte: 9 } },
      data: { cupo_usado: { increment: 1 } },
    });
    expect(tx.movimientosInventario.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ tipo_movimiento: 'SALIDA', motivo: 'VENTA_COMBO (Combo X)' }),
      }),
    );
    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
  });

  it('STOCK-2: racing sales for the last cupo — exactly one wins, the other gets 409, cupo_usado never exceeds cupo_maximo', async () => {
    const { repo, tx } = createHarness(createTx());
    const state: CupoState = { cupoUsado: 9 };
    mockCupoStateful(tx, state);
    setupCrear(tx, { cupo_maximo: 10, cupo_usado: 9 });

    const first = await repo.crear(ventaData, 50, 0);
    expect(first.id).toBe('1');
    expect(state.cupoUsado).toBe(10);

    await expectConflict(repo.crear(ventaData, 50, 0), 'Cupo agotado para el combo Combo X');

    expect(state.cupoUsado).toBe(10);
    expect(tx.producto.updateMany).toHaveBeenCalledTimes(2);
  });

  it('rejects 409 when the requested quantity exceeds the remaining cupo', async () => {
    const { repo, tx } = createHarness(createTx());
    const state: CupoState = { cupoUsado: 9 };
    mockCupoStateful(tx, state);
    setupCrear(tx, { cupo_maximo: 10, cupo_usado: 9 });

    await expectConflict(
      repo.crear({ ...ventaData, detalles: [{ producto_id: '99', cantidad: 2, precio_unitario: 50 }] }, 100, 0),
      'Cupo agotado para el combo Combo X',
    );

    expect(tx.producto.updateMany).toHaveBeenCalledWith({
      where: { id: 99n, cupo_maximo: { not: null }, cupo_usado: { lte: 8 } },
      data: { cupo_usado: { increment: 2 } },
    });
    expect(state.cupoUsado).toBe(9);
  });

  it('legacy: combo without cupo_maximo skips the cupo reservation entirely', async () => {
    const { repo, tx } = createHarness(createTx());
    setupCrear(tx, { cupo_maximo: null, cupo_usado: 0 });

    const result = await repo.crear(ventaData, 50, 0);

    expect(result.id).toBe('1');
    expect(tx.producto.updateMany).not.toHaveBeenCalled();
    expect(tx.inventario.updateMany).toHaveBeenCalled();
  });
});

describe('PrismaVentaRepository.anular - liberación de cupo (2.8)', () => {
  it('releases cupo (10 -> 9) and restores BOM stock in the same transaction', async () => {
    const { repo, tx, prisma } = createHarness(createTx());
    const state: CupoState = { cupoUsado: 10 };
    mockCupoStateful(tx, state);
    setupAnular(tx, { cupo_maximo: 10, cupo_usado: 10 });

    const result = await repo.anular('5', '1', 'Devolución');

    expect(result.success).toBe(true);
    expect(state.cupoUsado).toBe(9);
    expect(tx.producto.updateMany).toHaveBeenCalledWith({
      where: { id: 99n, cupo_maximo: { not: null }, cupo_usado: { gte: 1 } },
      data: { cupo_usado: { decrement: 1 } },
    });
    expect(tx.inventario.update).toHaveBeenCalledWith({
      where: { id: 5n },
      data: { cantidad_disponible: 10 },
    });
    expect(tx.movimientosInventario.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ tipo_movimiento: 'ENTRADA' }) }),
    );
    expect(tx.venta.update).toHaveBeenCalledWith({
      where: { id: 5n },
      data: { estado: 'ANULADA', motivo_anulacion: 'Devolución' },
    });
    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
  });

  it('clamps cupo_usado at 0 when anulando has no usage left (never goes negative)', async () => {
    const { repo, tx } = createHarness(createTx());
    const state: CupoState = { cupoUsado: 0 };
    mockCupoStateful(tx, state);
    setupAnular(tx, { cupo_maximo: 10, cupo_usado: 0 });

    const result = await repo.anular('5', '1', 'Devolución');

    expect(result.success).toBe(true);
    expect(state.cupoUsado).toBe(0);
    expect(tx.producto.updateMany).toHaveBeenNthCalledWith(1, {
      where: { id: 99n, cupo_maximo: { not: null }, cupo_usado: { gte: 1 } },
      data: { cupo_usado: { decrement: 1 } },
    });
    expect(tx.producto.updateMany).toHaveBeenNthCalledWith(2, {
      where: { id: 99n, cupo_maximo: { not: null }, cupo_usado: { gt: 0 } },
      data: { cupo_usado: 0 },
    });
  });
});

describe('PrismaVentaRepository.revertirAnulacion - restauración de cupo (2.8)', () => {
  it('restores cupo (9 -> 10) and re-deducts BOM stock in the same transaction', async () => {
    const { repo, tx, prisma } = createHarness(createTx());
    const state: CupoState = { cupoUsado: 9 };
    mockCupoStateful(tx, state);
    setupRevertir(tx, { cupo_maximo: 10, cupo_usado: 9 });

    const result = await repo.revertirAnulacion('5', '1');

    expect(result.success).toBe(true);
    expect(state.cupoUsado).toBe(10);
    expect(tx.producto.updateMany).toHaveBeenCalledWith({
      where: { id: 99n, cupo_maximo: { not: null } },
      data: { cupo_usado: { increment: 1 } },
    });
    expect(tx.inventario.update).toHaveBeenCalledWith({
      where: { id: 5n },
      data: { cantidad_disponible: 8 },
    });
    expect(tx.movimientosInventario.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ tipo_movimiento: 'SALIDA', motivo: 'REVERSION_ANULACION_COMBO (Combo X)' }),
      }),
    );
    expect(tx.venta.update).toHaveBeenCalledWith({
      where: { id: 5n },
      data: { estado: 'COMPLETADA', motivo_anulacion: null },
    });
    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
  });

  it('restores cupo even when cupo_maximo was later lowered below usage (Open Q1: no cap validation)', async () => {
    const { repo, tx } = createHarness(createTx());
    const state: CupoState = { cupoUsado: 9 };
    mockCupoStateful(tx, state);
    setupRevertir(tx, { cupo_maximo: 9, cupo_usado: 9 });

    const result = await repo.revertirAnulacion('5', '1');

    expect(result.success).toBe(true);
    expect(state.cupoUsado).toBe(10);
  });
});
