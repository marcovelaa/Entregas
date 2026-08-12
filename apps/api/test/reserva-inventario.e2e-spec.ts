import { ConflictException, ForbiddenException } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { PrismaService } from '../src/common/prisma/prisma.service';
import { InventoryReservationsService } from '../src/modules/ventas/application/services/inventory-reservations.service';
import { PrismaVentaRepository } from '../src/modules/ventas/infrastructure/repositories/prisma-venta.repository';

function databaseUrl(): string {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;
  const envFile = readFileSync(resolve(process.cwd(), '.env'), 'utf8');
  const match = envFile.match(/^DATABASE_URL=(?:"([^"]+)"|'([^']+)'|(.+))$/m);
  const url = match?.[1] ?? match?.[2] ?? match?.[3];
  if (!url)
    throw new Error(
      'DATABASE_URL is required for inventory reservation integration tests',
    );
  return url.trim();
}

describe('PostgreSQL inventory reservations', () => {
  let primary: PrismaClient;
  let secondary: PrismaClient;
  let usuarioId: bigint;
  let otroUsuarioId: bigint;
  let categoriaId: bigint;
  let rolId: bigint;
  let productoId: bigint;
  let inventarioId: bigint;
  const suffix = `${Date.now()}-${process.pid}`;

  function reservationsFor(client: PrismaClient) {
    return new InventoryReservationsService(client as PrismaService);
  }

  beforeAll(async () => {
    const url = databaseUrl();
    primary = new PrismaClient({ datasources: { db: { url } } });
    secondary = new PrismaClient({ datasources: { db: { url } } });
    await Promise.all([primary.$connect(), secondary.$connect()]);

    const categoria = await primary.categoria.create({
      data: { nombre: `Reservation ${suffix}`, slug: `reservation-${suffix}` },
    });
    categoriaId = categoria.id;
    const rol = await primary.rol.create({
      data: { nombre: `Reservation ${suffix}` },
    });
    rolId = rol.id;
    const usuario = await primary.usuario.create({
      data: {
        rol_id: rolId,
        nombres: 'Reservation',
        apellidos: 'Test',
        email: `reservation-${suffix}@example.test`,
        password_hash: 'not-used-by-test',
      },
    });
    usuarioId = usuario.id;
    const otroUsuario = await primary.usuario.create({
      data: {
        rol_id: rolId,
        nombres: 'Other Reservation',
        apellidos: 'Test',
        email: `reservation-other-${suffix}@example.test`,
        password_hash: 'not-used-by-test',
      },
    });
    otroUsuarioId = otroUsuario.id;
    const producto = await primary.producto.create({
      data: {
        categoria_id: categoriaId,
        sku: `reservation-${suffix}`,
        nombre: 'Reservation product',
        unidad_medida: 'UNIDAD',
        precio_base: 10,
      },
    });
    productoId = producto.id;
    const inventario = await primary.inventario.create({
      data: { producto_id: productoId, cantidad_disponible: 1, reservado: 0 },
    });
    inventarioId = inventario.id;
  });

  afterAll(async () => {
    if (primary) {
      if (usuarioId)
        await primary.venta.deleteMany({
          where: { usuario_id: { in: [usuarioId, otroUsuarioId] } },
        });
      if (usuarioId)
        await primary.reservaInventario.deleteMany({
          where: { usuario_id: { in: [usuarioId, otroUsuarioId] } },
        });
      if (productoId) {
        await primary.movimientosInventario.deleteMany({
          where: { producto_id: productoId },
        });
        await primary.inventario.deleteMany({
          where: { producto_id: productoId },
        });
        await primary.producto.delete({ where: { id: productoId } });
      }
      if (otroUsuarioId)
        await primary.usuario.delete({ where: { id: otroUsuarioId } });
      if (usuarioId) await primary.usuario.delete({ where: { id: usuarioId } });
      if (rolId) await primary.rol.delete({ where: { id: rolId } });
      if (categoriaId)
        await primary.categoria.delete({ where: { id: categoriaId } });
    }
    await Promise.all([primary?.$disconnect(), secondary?.$disconnect()]);
  });

  const item = () => [{ producto_id: productoId.toString(), cantidad: 1 }];

  it('allows exactly one competing reservation for the final unit and releases it on cancellation', async () => {
    const results = await Promise.allSettled([
      reservationsFor(primary).create(usuarioId.toString(), item()),
      reservationsFor(secondary).create(usuarioId.toString(), item()),
    ]);

    expect(
      results.filter((result) => result.status === 'fulfilled'),
    ).toHaveLength(1);
    expect(
      results.filter((result) => result.status === 'rejected'),
    ).toHaveLength(1);
    const rejected = results.find((result) => result.status === 'rejected');
    if (rejected?.status === 'rejected')
      expect(rejected.reason).toBeInstanceOf(ConflictException);

    const winning = results.find((result) => result.status === 'fulfilled');
    if (winning?.status !== 'fulfilled')
      throw new Error('Expected one winning reservation');
    expect(
      (
        await primary.inventario.findUniqueOrThrow({
          where: { id: inventarioId },
        })
      ).reservado,
    ).toBe(1);

    await expect(
      reservationsFor(primary).cancel(
        winning.value.public_id,
        usuarioId.toString(),
      ),
    ).resolves.toEqual({
      public_id: winning.value.public_id,
      estado: 'LIBERADA',
    });
    expect(
      (
        await primary.inventario.findUniqueOrThrow({
          where: { id: inventarioId },
        })
      ).reservado,
    ).toBe(0);
  });

  it('rejects cancellation by a different authenticated owner', async () => {
    const reservation = await reservationsFor(primary).create(
      usuarioId.toString(),
      item(),
    );

    await expect(
      reservationsFor(primary).cancel(
        reservation.public_id,
        otroUsuarioId.toString(),
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(
      (
        await primary.inventario.findUniqueOrThrow({
          where: { id: inventarioId },
        })
      ).reservado,
    ).toBe(1);
    await reservationsFor(primary).cancel(
      reservation.public_id,
      usuarioId.toString(),
    );
  });

  it('releases expired reservations before an ordinary sale and an annulment reversal evaluate stock', async () => {
    const repository = new PrismaVentaRepository(
      primary as PrismaService,
      { evaluate: jest.fn().mockResolvedValue(null) } as any,
      reservationsFor(primary),
    );
    const expiredForSale = await reservationsFor(primary).create(
      usuarioId.toString(),
      item(),
    );
    await primary.reservaInventario.update({
      where: { public_id: expiredForSale.public_id },
      data: { expira_en: new Date(Date.now() - 1_000) },
    });

    const sale = await repository.crear({
      usuario_id: usuarioId.toString(),
      metodo_pago: 'EFECTIVO',
      monto_pagado: 10,
      detalles: [
        {
          producto_id: productoId.toString(),
          cantidad: 1,
          precio_unitario: 10,
        },
      ],
    });
    expect(
      await primary.inventario.findUniqueOrThrow({
        where: { id: inventarioId },
      }),
    ).toMatchObject({
      cantidad_disponible: 0,
      reservado: 0,
    });
    expect(
      (
        await primary.reservaInventario.findUniqueOrThrow({
          where: { public_id: expiredForSale.public_id },
        })
      ).estado,
    ).toBe('EXPIRADA');

    await repository.anular(
      sale.id,
      usuarioId.toString(),
      'Prueba de reversión',
    );
    const expiredForReversal = await reservationsFor(primary).create(
      usuarioId.toString(),
      item(),
    );
    await primary.reservaInventario.update({
      where: { public_id: expiredForReversal.public_id },
      data: { expira_en: new Date(Date.now() - 1_000) },
    });
    await repository.revertirAnulacion(sale.id, usuarioId.toString());

    expect(
      await primary.inventario.findUniqueOrThrow({
        where: { id: inventarioId },
      }),
    ).toMatchObject({
      cantidad_disponible: 0,
      reservado: 0,
    });
    expect(
      (
        await primary.reservaInventario.findUniqueOrThrow({
          where: { public_id: expiredForReversal.public_id },
        })
      ).estado,
    ).toBe('EXPIRADA');
  });

  it('rejects unknown reservation states at the database boundary', async () => {
    await primary.inventario.update({
      where: { id: inventarioId },
      data: { cantidad_disponible: 1, reservado: 0 },
    });
    const reservation = await reservationsFor(primary).create(
      usuarioId.toString(),
      item(),
    );
    await expect(primary.$executeRaw`
      UPDATE reservas_inventario
      SET estado = 'DESCONOCIDA'
      WHERE public_id = ${reservation.public_id}::uuid
    `).rejects.toThrow();
    await reservationsFor(primary).cancel(
      reservation.public_id,
      usuarioId.toString(),
    );
  });

  it('commits exactly one of two independent transactions consuming the same active reservation', async () => {
    await primary.inventario.update({
      where: { id: inventarioId },
      data: { cantidad_disponible: 1, reservado: 0 },
    });
    const reservation = await reservationsFor(primary).create(
      usuarioId.toString(),
      item(),
    );
    const beforeSales = await primary.venta.count({
      where: { usuario_id: usuarioId },
    });
    const saleInput = {
      usuario_id: usuarioId.toString(),
      metodo_pago: 'QR',
      monto_pagado: 10,
      reserva_id: reservation.public_id,
      detalles: [
        {
          producto_id: productoId.toString(),
          cantidad: 1,
          precio_unitario: 10,
        },
      ],
    };
    const primaryRepository = new PrismaVentaRepository(
      primary as PrismaService,
      { evaluate: jest.fn().mockResolvedValue(null) } as any,
      reservationsFor(primary),
    );
    const secondaryRepository = new PrismaVentaRepository(
      secondary as PrismaService,
      { evaluate: jest.fn().mockResolvedValue(null) } as any,
      reservationsFor(secondary),
    );

    const results = await Promise.allSettled([
      primaryRepository.crear(saleInput),
      secondaryRepository.crear(saleInput),
    ]);

    expect(
      results.filter((result) => result.status === 'fulfilled'),
    ).toHaveLength(1);
    expect(
      results.filter((result) => result.status === 'rejected'),
    ).toHaveLength(1);
    const rejected = results.find((result) => result.status === 'rejected');
    if (rejected?.status === 'rejected')
      expect(rejected.reason).toBeInstanceOf(ConflictException);

    const persistedReservation =
      await primary.reservaInventario.findUniqueOrThrow({
        where: { public_id: reservation.public_id },
      });
    expect(persistedReservation.estado).toBe('CONSUMIDA');
    expect(persistedReservation.venta_id).not.toBeNull();
    expect(
      await primary.venta.count({ where: { usuario_id: usuarioId } }),
    ).toBe(beforeSales + 1);
    expect(
      await primary.venta.count({
        where: { id: persistedReservation.venta_id! },
      }),
    ).toBe(1);
    expect(
      await primary.inventario.findUniqueOrThrow({
        where: { id: inventarioId },
      }),
    ).toMatchObject({
      cantidad_disponible: 0,
      reservado: 0,
    });
  });

  it('enforces reservation ownership and prevents double consumption', async () => {
    await primary.inventario.update({
      where: { id: inventarioId },
      data: { cantidad_disponible: 1, reservado: 0 },
    });
    const reservations = reservationsFor(primary);
    const reservation = await reservations.create(usuarioId.toString(), item());
    const repository = new PrismaVentaRepository(
      primary as PrismaService,
      { evaluate: jest.fn().mockResolvedValue(null) } as any,
      reservations,
    );
    const saleInput = (actorId: bigint) => ({
      usuario_id: actorId.toString(),
      metodo_pago: 'QR',
      monto_pagado: 10,
      reserva_id: reservation.public_id,
      detalles: [
        {
          producto_id: productoId.toString(),
          cantidad: 1,
          precio_unitario: 10,
        },
      ],
    });

    await expect(
      repository.crear(saleInput(otroUsuarioId)),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(
      await primary.inventario.findUniqueOrThrow({
        where: { id: inventarioId },
      }),
    ).toMatchObject({
      cantidad_disponible: 1,
      reservado: 1,
    });

    await repository.crear(saleInput(usuarioId));
    await expect(repository.crear(saleInput(usuarioId))).rejects.toBeInstanceOf(
      ConflictException,
    );
    expect(
      (
        await primary.reservaInventario.findUniqueOrThrow({
          where: { public_id: reservation.public_id },
        })
      ).estado,
    ).toBe('CONSUMIDA');
  });
});
