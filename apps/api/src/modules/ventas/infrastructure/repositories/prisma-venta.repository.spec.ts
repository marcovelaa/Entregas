import { BadRequestException, ConflictException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../../../../common/prisma/prisma.service';
import { PrismaVentaRepository } from './prisma-venta.repository';
import { VentaCreateData } from '../../domain/repositories/venta.repository.interface';

type TxMock = {
  venta: {
    create: jest.Mock;
    findUnique: jest.Mock;
    update: jest.Mock;
    updateMany: jest.Mock;
  };
  producto: {
    findUnique: jest.Mock;
    findMany: jest.Mock;
    updateMany: jest.Mock;
  };
  inventario: {
    findFirst: jest.Mock;
    findMany: jest.Mock;
    updateMany: jest.Mock;
    update: jest.Mock;
  };
  variante: {
    findFirst: jest.Mock;
    findUnique: jest.Mock;
    findMany: jest.Mock;
  };
  empaque: {
    findUnique: jest.Mock;
    findMany: jest.Mock;
  };
  usuario: {
    findUnique: jest.Mock;
  };
  descuento: {
    findUnique: jest.Mock;
    updateMany: jest.Mock;
  };
  descuentoUso: { create: jest.Mock };
  movimientosInventario: { create: jest.Mock };
  $executeRaw: jest.Mock;
};

type CupoState = { cupoUsado: number };

function createTx(): TxMock {
  return {
    venta: { create: jest.fn(), findUnique: jest.fn(), update: jest.fn(), updateMany: jest.fn() },
    producto: { findUnique: jest.fn(), findMany: jest.fn(), updateMany: jest.fn() },
    inventario: { findFirst: jest.fn(), findMany: jest.fn(), updateMany: jest.fn(), update: jest.fn() },
    variante: { findFirst: jest.fn(), findUnique: jest.fn(), findMany: jest.fn() },
    empaque: { findUnique: jest.fn(), findMany: jest.fn() },
    usuario: { findUnique: jest.fn() },
    descuento: { findUnique: jest.fn(), updateMany: jest.fn() },
    descuentoUso: { create: jest.fn() },
    movimientosInventario: { create: jest.fn() },
    $executeRaw: jest.fn(),
  };
}

function createHarness(tx: TxMock, discountEngine?: { evaluate: jest.Mock }) {
  const prisma = {
    venta: tx.venta,
    producto: tx.producto,
    empaque: tx.empaque,
    variante: tx.variante,
    inventario: tx.inventario,
    usuario: tx.usuario,
    descuento: tx.descuento,
    descuentoUso: tx.descuentoUso,
    movimientosInventario: tx.movimientosInventario,
    $executeRaw: tx.$executeRaw,
    $transaction: jest.fn(async (fn: (t: TxMock) => unknown) => fn(tx)),
  } as unknown as PrismaService;
  const engine = (discountEngine ?? { evaluate: jest.fn().mockResolvedValue(null) }) as any;
  return { repo: new PrismaVentaRepository(prisma, engine), prisma, tx, discountEngine: engine };
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

function mockCupoStateful(tx: TxMock, state: CupoState) {
  tx.producto.updateMany.mockImplementation(
    async ({
      where,
      data,
    }: {
      where: { id: bigint; cupo_maximo?: { not: null }; cupo_usado?: { lte?: number; gte?: number; gt?: number } };
      data: { cupo_usado: { increment?: number; decrement?: number } | number };
    }) => {
      const used = state.cupoUsado;

      if (typeof data.cupo_usado === 'number') {
        if (where.cupo_usado?.gt !== undefined && used <= where.cupo_usado.gt) {
          return { count: 0 };
        }
        state.cupoUsado = data.cupo_usado;
        return { count: 1 };
      }

      if (data.cupo_usado.decrement !== undefined) {
        const threshold = where.cupo_usado?.gte ?? 0;
        if (used < threshold) return { count: 0 };
        state.cupoUsado = Math.max(0, used - data.cupo_usado.decrement);
        return { count: 1 };
      }

      if (data.cupo_usado.increment !== undefined) {
        const ceiling = where.cupo_usado?.lte;
        if (ceiling !== undefined && used > ceiling) return { count: 0 };
        state.cupoUsado = used + data.cupo_usado.increment;
        return { count: 1 };
      }
      return { count: 0 };
    },
  );
}

function setupCrear(tx: TxMock, comboOverrides: Record<string, unknown> = {}) {
  tx.venta.create.mockResolvedValue(ventaRow());
  tx.producto.findMany.mockResolvedValue([comboRow(comboOverrides)]);
  tx.variante.findMany.mockResolvedValue([{ id: 701n, producto_id: 7n, activo: true }]);
  tx.inventario.findMany.mockResolvedValue([
    { id: 5n, producto_id: 7n, variante_id: 701n, cantidad_disponible: 100, reservado: 0 },
  ]);
  tx.inventario.updateMany.mockResolvedValue({ count: 1 });
  tx.movimientosInventario.create.mockResolvedValue({});
}

function setupAnular(tx: TxMock, comboOverrides: Record<string, unknown> = {}) {
  tx.venta.findUnique.mockResolvedValue(completadaRow());
  tx.producto.findMany.mockResolvedValue([comboRow(comboOverrides)]);
  tx.variante.findMany.mockResolvedValue([{ id: 701n, producto_id: 7n, activo: true }]);
  tx.inventario.findMany.mockResolvedValue([{ id: 5n, producto_id: 7n, variante_id: 701n, cantidad_disponible: 8, reservado: 0 }]);
  tx.venta.updateMany.mockResolvedValue({ count: 1 });
  tx.inventario.update.mockResolvedValue({});
  tx.movimientosInventario.create.mockResolvedValue({});
}

function setupRevertir(tx: TxMock, comboOverrides: Record<string, unknown> = {}) {
  tx.venta.findUnique.mockResolvedValue(anuladaRow());
  tx.producto.findMany.mockResolvedValue([comboRow(comboOverrides)]);
  tx.variante.findMany.mockResolvedValue([{ id: 701n, producto_id: 7n, activo: true }]);
  tx.inventario.findMany.mockResolvedValue([{ id: 5n, producto_id: 7n, variante_id: 701n, cantidad_disponible: 10, reservado: 0 }]);
  tx.venta.updateMany.mockResolvedValue({ count: 1 });
  tx.inventario.updateMany.mockResolvedValue({ count: 1 });
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

    await expectConflict(repo.crear(ventaData), 'Cupo agotado para el combo Combo X');

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

    await expectConflict(repo.crear(ventaData), 'El combo Combo X no está en vigencia');

    expect(tx.producto.updateMany).not.toHaveBeenCalled();
    expect(tx.inventario.updateMany).not.toHaveBeenCalled();
  });

  it('rejects 409 when vigencia_inicio is in the future (FECHA_HORA)', async () => {
    const { repo, tx } = createHarness(createTx());
    setupCrear(tx, {
      modo_venta: 'FECHA_HORA',
      vigencia_inicio: new Date('2999-01-01T00:00:00.000Z'),
    });

    await expectConflict(repo.crear(ventaData), 'El combo Combo X no está en vigencia');
    expect(tx.inventario.updateMany).not.toHaveBeenCalled();
  });

  it('allows MIXTO with no date bounds (sale proceeds, stock deducted)', async () => {
    const { repo, tx } = createHarness(createTx());
    setupCrear(tx, { modo_venta: 'MIXTO', cupo_maximo: 10, cupo_usado: 3 });
    mockCupoStateful(tx, { cupoUsado: 3 });

    const result = await repo.crear(ventaData);

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

    const result = await repo.crear(ventaData);

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

    const result = await repo.crear(ventaData);

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

    const first = await repo.crear(ventaData);
    expect(first.id).toBe('1');
    expect(state.cupoUsado).toBe(10);

    await expectConflict(repo.crear(ventaData), 'Cupo agotado para el combo Combo X');

    expect(state.cupoUsado).toBe(10);
    expect(tx.producto.updateMany).toHaveBeenCalledTimes(2);
  });

  it('rejects 409 when the requested quantity exceeds the remaining cupo', async () => {
    const { repo, tx } = createHarness(createTx());
    const state: CupoState = { cupoUsado: 9 };
    mockCupoStateful(tx, state);
    setupCrear(tx, { cupo_maximo: 10, cupo_usado: 9 });

    await expectConflict(
      repo.crear({ ...ventaData, monto_pagado: 100, detalles: [{ producto_id: '99', cantidad: 2, precio_unitario: 50 }] }),
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

    const result = await repo.crear(ventaData);

    expect(result.id).toBe('1');
    expect(tx.producto.updateMany).not.toHaveBeenCalled();
    expect(tx.inventario.updateMany).toHaveBeenCalled();
  });

  it('resolves component base variant when variante_id is null and decrements atomically', async () => {
    const { repo, tx } = createHarness(createTx());
    setupCrear(tx, { cupo_maximo: null });

    const result = await repo.crear(ventaData);

    expect(result.id).toBe('1');
    expect(tx.variante.findMany).toHaveBeenCalledWith({
      where: { producto_id: { in: [7n] }, activo: true },
      orderBy: { id: 'asc' },
    });
    expect(tx.inventario.updateMany).toHaveBeenCalledWith({
      where: { id: 5n, cantidad_disponible: { gte: 2 } },
      data: { cantidad_disponible: { decrement: 2 } },
    });
  });

  it('preloads catalog and discount evaluation before the write transaction starts', async () => {
    const discountEngine = { evaluate: jest.fn() };
    const { repo, tx, prisma } = createHarness(createTx(), discountEngine);
    const transactionMock = prisma.$transaction as unknown as jest.Mock;
    discountEngine.evaluate.mockImplementation(async () => {
      expect(transactionMock).not.toHaveBeenCalled();
      return null;
    });
    setupCrear(tx, { precio_base: 50 });

    const result = await repo.crear({
      ...ventaData,
      descuento_id: '9',
    });

    expect(result.id).toBe('1');
    expect(discountEngine.evaluate).toHaveBeenCalledTimes(1);
    expect(tx.producto.findMany.mock.invocationCallOrder[0]).toBeLessThan(
      transactionMock.mock.invocationCallOrder[0],
    );
    expect(tx.variante.findMany.mock.invocationCallOrder[0]).toBeLessThan(
      transactionMock.mock.invocationCallOrder[0],
    );
    expect(tx.inventario.findMany.mock.invocationCallOrder[0]).toBeLessThan(
      transactionMock.mock.invocationCallOrder[0],
    );
  });

  it('throws error when concurrent update decreases stock below required units', async () => {
    const { repo, tx } = createHarness(createTx());
    setupCrear(tx, { cupo_maximo: null });
    tx.inventario.updateMany.mockResolvedValue({ count: 0 });

    await expect(repo.crear(ventaData)).rejects.toThrow(
      /Conflicto de concurrencia: stock insuficiente/,
    );
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
      data: { cantidad_disponible: { increment: 2 } },
    });
    expect(tx.movimientosInventario.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ tipo_movimiento: 'ENTRADA' }) }),
    );
    expect(tx.venta.updateMany).toHaveBeenCalledWith({
      where: { id: 5n, estado: 'COMPLETADA' },
      data: { estado: 'ANULADA', motivo_anulacion: 'Devolución' },
    });
    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
  });

  it('preloads cancellation reads before the transaction and keeps only atomic writes inside it', async () => {
    const { repo, tx, prisma } = createHarness(createTx());
    setupAnular(tx, { cupo_maximo: 10, cupo_usado: 10 });
    tx.producto.updateMany.mockResolvedValue({ count: 1 });

    await repo.anular('5', '1', 'Devolución');

    const transactionMock = prisma.$transaction as unknown as jest.Mock;
    for (const query of [tx.venta.findUnique, tx.producto.findMany, tx.variante.findMany, tx.inventario.findMany]) {
      expect(query.mock.invocationCallOrder[0]).toBeLessThan(transactionMock.mock.invocationCallOrder[0]);
    }
    expect(tx.producto.findUnique).not.toHaveBeenCalled();
    expect(tx.variante.findFirst).not.toHaveBeenCalled();
    expect(tx.inventario.findFirst).not.toHaveBeenCalled();
  });

  it('does not return stock when the conditional cancellation state transition loses a race', async () => {
    const { repo, tx } = createHarness(createTx());
    setupAnular(tx);
    tx.venta.updateMany.mockResolvedValue({ count: 0 });

    await expectConflict(repo.anular('5', '1', 'Devolución'), 'La venta ya se encuentra anulada');
    expect(tx.inventario.update).not.toHaveBeenCalled();
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
    expect(tx.inventario.updateMany).toHaveBeenCalledWith({
      where: { id: 5n, cantidad_disponible: { gte: 2 } },
      data: { cantidad_disponible: { decrement: 2 } },
    });
    expect(tx.movimientosInventario.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ tipo_movimiento: 'SALIDA', motivo: 'REVERSION_ANULACION_COMBO (Combo X)' }),
      }),
    );
    expect(tx.venta.updateMany).toHaveBeenCalledWith({
      where: { id: 5n, estado: 'ANULADA' },
      data: { estado: 'COMPLETADA', motivo_anulacion: null },
    });
    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
  });

  it('preloads reversal reads before the transaction and retains the conditional stock guard', async () => {
    const { repo, tx, prisma } = createHarness(createTx());
    setupRevertir(tx, { cupo_maximo: 10, cupo_usado: 9 });

    await repo.revertirAnulacion('5', '1');

    const transactionMock = prisma.$transaction as unknown as jest.Mock;
    for (const query of [tx.venta.findUnique, tx.producto.findMany, tx.variante.findMany, tx.inventario.findMany]) {
      expect(query.mock.invocationCallOrder[0]).toBeLessThan(transactionMock.mock.invocationCallOrder[0]);
    }
    expect(tx.inventario.updateMany).toHaveBeenCalledWith({
      where: { id: 5n, cantidad_disponible: { gte: 2 } },
      data: { cantidad_disponible: { decrement: 2 } },
    });
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

describe('PrismaVentaRepository.crear - rebaja manual de precio y aprobación de administrador', () => {
  it('permite venta sin rebaja (precio aplicado == catálogo) sin pedir credenciales ni aprobación', async () => {
    const { repo, tx } = createHarness(createTx());
    setupCrear(tx, { precio_base: 50 });

    const result = await repo.crear({
      usuario_id: '1',
      metodo_pago: 'EFECTIVO',
      monto_pagado: 50,
      detalles: [{ producto_id: '99', cantidad: 1, precio_unitario: 50 }],
    });

    expect(result.id).toBe('1');
    expect(tx.venta.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          detalles: {
            create: [
              expect.objectContaining({
                precio_unitario: 50,
                precio_unitario_catalogo: 50,
                aprobado_por_usuario_id: null,
              }),
            ],
          },
        }),
      }),
    );
  });

  it('registra venta con rebaja cuando se selecciona un aprobador con rol Administrador', async () => {
    const { repo, tx } = createHarness(createTx());
    setupCrear(tx, { precio_base: 50 });

    tx.usuario.findUnique.mockResolvedValue({
      id: 100n,
      email: 'admin@entregas.bo',
      activo: true,
      rol: { nombre: 'Administrador' },
    });

    const result = await repo.crear({
      usuario_id: '1',
      metodo_pago: 'EFECTIVO',
      monto_pagado: 40,
      aprobador_usuario_id: '100',
      motivo_ajuste: 'Descuento cliente frecuente',
      detalles: [{ producto_id: '99', cantidad: 1, precio_unitario: 40 }],
    });

    expect(result.id).toBe('1');
    expect(tx.usuario.findUnique).toHaveBeenCalledWith({
      where: { id: 100n },
      include: { rol: true },
    });
    expect(tx.venta.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          detalles: {
            create: [
              expect.objectContaining({
                precio_unitario: 40,
                precio_unitario_catalogo: 50,
                aprobado_por_usuario_id: 100n,
                motivo_ajuste: 'Descuento cliente frecuente',
              }),
            ],
          },
        }),
      }),
    );
  });

  it('rechaza venta con rebaja si no se selecciona ningún aprobador (BadRequestException) sin alterar DB ni inventario', async () => {
    const { repo, tx } = createHarness(createTx());
    setupCrear(tx, { precio_base: 50 });

    await expect(
      repo.crear({
        usuario_id: '1',
        metodo_pago: 'EFECTIVO',
        monto_pagado: 40,
        detalles: [{ producto_id: '99', cantidad: 1, precio_unitario: 40 }],
      }),
    ).rejects.toThrow(BadRequestException);

    expect(tx.venta.create).not.toHaveBeenCalled();
    expect(tx.movimientosInventario.create).not.toHaveBeenCalled();
  });

  it('rechaza venta con rebaja si el aprobador seleccionado no existe o está inactivo (NotFoundException) sin alterar DB ni inventario', async () => {
    const { repo, tx } = createHarness(createTx());
    setupCrear(tx, { precio_base: 50 });

    tx.usuario.findUnique.mockResolvedValue(null);

    await expect(
      repo.crear({
        usuario_id: '1',
        metodo_pago: 'EFECTIVO',
        monto_pagado: 40,
        aprobador_usuario_id: '999',
        detalles: [{ producto_id: '99', cantidad: 1, precio_unitario: 40 }],
      }),
    ).rejects.toThrow(NotFoundException);

    expect(tx.venta.create).not.toHaveBeenCalled();
    expect(tx.movimientosInventario.create).not.toHaveBeenCalled();
  });

  it('rechaza venta con rebaja si el usuario aprobador posee rol Vendedor (UnauthorizedException) sin alterar DB ni inventario', async () => {
    const { repo, tx } = createHarness(createTx());
    setupCrear(tx, { precio_base: 50 });

    tx.usuario.findUnique.mockResolvedValue({
      id: 200n,
      email: 'vendedor@entregas.bo',
      activo: true,
      rol: { nombre: 'Vendedor' },
    });

    await expect(
      repo.crear({
        usuario_id: '1',
        metodo_pago: 'EFECTIVO',
        monto_pagado: 40,
        aprobador_usuario_id: '200',
        detalles: [{ producto_id: '99', cantidad: 1, precio_unitario: 40 }],
      }),
    ).rejects.toThrow(UnauthorizedException);

    expect(tx.venta.create).not.toHaveBeenCalled();
    expect(tx.movimientosInventario.create).not.toHaveBeenCalled();
  });
});

describe('PrismaVentaRepository.crear - validación server-side del descuento (1.2)', () => {
  it('no llama al discount engine ni aplica descuento si no se manda descuento_id ni codigo_cupon', async () => {
    const evaluate = jest.fn();
    const { repo, tx } = createHarness(createTx(), { evaluate });
    setupCrear(tx, { precio_base: 50 });

    await repo.crear(ventaData);

    expect(evaluate).not.toHaveBeenCalled();
    expect(tx.venta.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ descuento_total: 0, codigo_cupon: null }) }),
    );
    expect(tx.descuentoUso.create).not.toHaveBeenCalled();
  });

  it('ignora el descuento_total que manda el cliente y usa el monto calculado por el discount engine', async () => {
    const evaluate = jest.fn().mockResolvedValue({
      id: '10',
      nombre: 'Promo Fidelidad',
      codigo: 'FIEL10',
      tipo: 'PORCENTAJE',
      alcance: 'GLOBAL',
      canal: 'POS',
      montoDescontado: 15,
      totalOriginal: 50,
      totalFinal: 35,
      itemsElegiblesCount: 1,
    });
    const { repo, tx } = createHarness(createTx(), { evaluate });
    setupCrear(tx, { precio_base: 50 });
    tx.$executeRaw.mockResolvedValue(1);

    await repo.crear({
      usuario_id: '1',
      metodo_pago: 'EFECTIVO',
      monto_pagado: 35,
      descuento_id: '10',
      descuento_total: 999999, // valor manipulado por el cliente, debe ser ignorado
      detalles: [{ producto_id: '99', cantidad: 1, precio_unitario: 50 }],
    } as any);

    expect(evaluate).toHaveBeenCalledWith(
      expect.objectContaining({ items: [expect.objectContaining({ cantidad: 1, precioUnitario: 50 })] }),
    );
    expect(tx.venta.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ total: 35, descuento_total: 15, codigo_cupon: 'FIEL10' }),
      }),
    );
    expect(tx.$executeRaw).toHaveBeenCalledTimes(1);
    expect(tx.descuento.findUnique).not.toHaveBeenCalled();
    expect(tx.descuento.updateMany).not.toHaveBeenCalled();
    expect(tx.descuentoUso.create).toHaveBeenCalledWith({
      data: { descuento_id: 10n, venta_id: 1n, cliente_id: null, monto_descontado: 15 },
    });
  });

  it('rechaza con ConflictException cuando el cupo del descuento ya está agotado, sin registrar el uso', async () => {
    const evaluate = jest.fn().mockResolvedValue({
      id: '10',
      nombre: 'Promo Agotada',
      codigo: null,
      tipo: 'MONTO_FIJO',
      alcance: 'GLOBAL',
      canal: 'POS',
      montoDescontado: 5,
      totalOriginal: 50,
      totalFinal: 45,
      itemsElegiblesCount: 1,
    });
    const { repo, tx } = createHarness(createTx(), { evaluate });
    setupCrear(tx, { precio_base: 50 });
    tx.$executeRaw.mockResolvedValue(0);

    await expect(
      repo.crear({
        usuario_id: '1',
        metodo_pago: 'EFECTIVO',
        monto_pagado: 45,
        descuento_id: '10',
        detalles: [{ producto_id: '99', cantidad: 1, precio_unitario: 50 }],
      }),
    ).rejects.toThrow(ConflictException);

    expect(tx.$executeRaw).toHaveBeenCalledTimes(1);
    expect(tx.descuentoUso.create).not.toHaveBeenCalled();
  });

  it('permite solo una venta cuando dos checkouts compiten por el último uso del descuento', async () => {
    const evaluate = jest.fn().mockResolvedValue({
      id: '10',
      nombre: 'Último uso',
      codigo: 'ULTIMO',
      tipo: 'MONTO_FIJO',
      alcance: 'GLOBAL',
      canal: 'POS',
      montoDescontado: 5,
      totalOriginal: 50,
      totalFinal: 45,
      itemsElegiblesCount: 1,
    });
    const { repo, tx } = createHarness(createTx(), { evaluate });
    setupCrear(tx, { precio_base: 50 });
    tx.$executeRaw.mockResolvedValueOnce(1).mockResolvedValueOnce(0);

    const venta = {
      usuario_id: '1',
      metodo_pago: 'EFECTIVO',
      monto_pagado: 45,
      descuento_id: '10',
      detalles: [{ producto_id: '99', cantidad: 1, precio_unitario: 50 }],
    } as any;

    const [primera, segunda] = await Promise.allSettled([repo.crear(venta), repo.crear(venta)]);

    expect(primera.status).toBe('fulfilled');
    expect(segunda.status).toBe('rejected');
    if (segunda.status === 'rejected') expect(segunda.reason).toBeInstanceOf(ConflictException);
    expect(tx.$executeRaw).toHaveBeenCalledTimes(2);
    expect(tx.descuentoUso.create).toHaveBeenCalledTimes(1);
  });

  it('si el discount engine no encuentra un descuento válido, la venta sigue sin aplicar rebaja alguna', async () => {
    const evaluate = jest.fn().mockResolvedValue(null);
    const { repo, tx } = createHarness(createTx(), { evaluate });
    setupCrear(tx, { precio_base: 50 });

    const result = await repo.crear({
      usuario_id: '1',
      metodo_pago: 'EFECTIVO',
      monto_pagado: 50,
      descuento_id: '999', // descuento inexistente o ya no vigente
      detalles: [{ producto_id: '99', cantidad: 1, precio_unitario: 50 }],
    });

    expect(result.id).toBe('1');
    expect(tx.venta.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ total: 50, descuento_total: 0 }) }),
    );
    expect(tx.descuento.updateMany).not.toHaveBeenCalled();
    expect(tx.descuentoUso.create).not.toHaveBeenCalled();
  });
});

describe('PrismaVentaRepository.crear - batching de lecturas dentro de la transacción (2.2)', () => {
  it('para un carrito de 2 productos distintos, batchea producto/variante/inventario en una sola llamada cada uno', async () => {
    const { repo, tx } = createHarness(createTx());
    tx.venta.create.mockResolvedValue(ventaRow());
    tx.producto.findMany.mockResolvedValue([
      { id: 99n, nombre: 'Producto A', tipo_producto: 'SIMPLE', precio_base: 10, precio_promocional: null, componentes_combo: [] },
      { id: 55n, nombre: 'Producto B', tipo_producto: 'SIMPLE', precio_base: 20, precio_promocional: null, componentes_combo: [] },
    ]);
    tx.variante.findMany.mockResolvedValue([
      { id: 701n, producto_id: 99n, activo: true },
      { id: 702n, producto_id: 55n, activo: true },
    ]);
    tx.inventario.findMany.mockResolvedValue([
      { id: 5n, producto_id: 99n, variante_id: 701n, cantidad_disponible: 100, reservado: 0 },
      { id: 6n, producto_id: 55n, variante_id: 702n, cantidad_disponible: 100, reservado: 0 },
    ]);
    tx.inventario.updateMany.mockResolvedValue({ count: 1 });
    tx.movimientosInventario.create.mockResolvedValue({});

    const result = await repo.crear({
      usuario_id: '1',
      metodo_pago: 'EFECTIVO',
      monto_pagado: 30,
      detalles: [
        { producto_id: '99', cantidad: 1, precio_unitario: 10 },
        { producto_id: '55', cantidad: 1, precio_unitario: 20 },
      ],
    });

    expect(result.id).toBe('1');

    // Reads: one batched call per resource, regardless of cart size.
    expect(tx.producto.findMany).toHaveBeenCalledTimes(1);
    expect(tx.producto.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: { in: [99n, 55n] } } }),
    );
    expect(tx.variante.findMany).toHaveBeenCalledTimes(1);
    expect(tx.variante.findMany).toHaveBeenCalledWith({
      where: { producto_id: { in: [99n, 55n] }, activo: true },
      orderBy: { id: 'asc' },
    });
    expect(tx.inventario.findMany).toHaveBeenCalledTimes(1);

    // Writes: still one atomic call per movement — that's the concurrency guard, unchanged.
    expect(tx.inventario.updateMany).toHaveBeenCalledTimes(2);
    expect(tx.movimientosInventario.create).toHaveBeenCalledTimes(2);
  });
});
