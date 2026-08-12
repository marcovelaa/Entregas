import { ConflictException } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { PrismaService } from '../src/common/prisma/prisma.service';
import { PrismaVentaRepository } from '../src/modules/ventas/infrastructure/repositories/prisma-venta.repository';

function databaseUrl(): string {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;

  const envFile = readFileSync(resolve(process.cwd(), '.env'), 'utf8');
  const match = envFile.match(/^DATABASE_URL=(?:"([^"]+)"|'([^']+)'|(.+))$/m);
  const url = match?.[1] ?? match?.[2] ?? match?.[3];
  if (!url) throw new Error('DATABASE_URL is required for the PostgreSQL concurrency test');
  return url.trim();
}

describe('PostgreSQL discount usage cap concurrency', () => {
  let primary: PrismaClient;
  let secondary: PrismaClient;
  let usuarioId: bigint;
  let categoriaId: bigint;
  let rolId: bigint;
  let productoId: bigint;
  let descuentoLimitadoId: bigint;
  const descuentoIds: bigint[] = [];
  const suffix = Date.now().toString() + '-' + process.pid.toString();
  const limitedMarker = 'race-' + suffix;

  function repositoryFor(client: PrismaClient) {
    return new PrismaVentaRepository(
      client as PrismaService,
      {
        evaluate: jest.fn().mockResolvedValue({
          id: descuentoLimitadoId.toString(),
          nombre: 'Limited ' + suffix,
          codigo: limitedMarker,
          tipo: 'MONTO_FIJO',
          alcance: 'GLOBAL',
          canal: 'POS',
          montoDescontado: 5,
          totalOriginal: 10,
          totalFinal: 5,
          itemsElegiblesCount: 1,
        }),
      } as any,
    );
  }

  function saleInput(discountId: bigint, marker: string) {
    return {
      usuario_id: usuarioId.toString(),
      metodo_pago: 'EFECTIVO',
      monto_pagado: 5,
      descuento_id: discountId.toString(),
      detalles: [{ producto_id: productoId.toString(), cantidad: 1, precio_unitario: 10 }],
      codigo_cupon: marker,
    };
  }

  beforeAll(async () => {
    const url = databaseUrl();
    primary = new PrismaClient({ datasources: { db: { url } } });
    secondary = new PrismaClient({ datasources: { db: { url } } });
    await Promise.all([primary.$connect(), secondary.$connect()]);

    const categoria = await primary.categoria.create({
      data: { nombre: 'Concurrency ' + suffix, slug: 'concurrency-' + suffix },
    });
    categoriaId = categoria.id;

    const rol = await primary.rol.create({ data: { nombre: 'Concurrency ' + suffix } });
    rolId = rol.id;

    const usuario = await primary.usuario.create({
      data: {
        rol_id: rolId,
        nombres: 'Concurrency',
        apellidos: 'Test',
        email: 'concurrency-' + suffix + '@example.test',
        password_hash: 'not-used-by-test',
      },
    });
    usuarioId = usuario.id;

    const producto = await primary.producto.create({
      data: {
        categoria_id: categoriaId,
        sku: 'concurrency-' + suffix,
        nombre: 'Concurrency product',
        unidad_medida: 'UNIDAD',
        precio_base: 10,
      },
    });
    productoId = producto.id;
    await primary.inventario.create({
      data: { producto_id: productoId, cantidad_disponible: 100, reservado: 0 },
    });

    const descuento = await primary.descuento.create({
      data: {
        nombre: 'Limited ' + suffix,
        codigo_cupon: limitedMarker,
        tipo: 'MONTO_FIJO',
        valor: 5,
        alcance: 'GLOBAL',
        canal: 'POS',
        fecha_inicio: new Date(Date.now() - 60_000),
        fecha_fin: new Date(Date.now() + 60_000),
        limite_usos: 2,
        usos_actuales: 1,
      },
    });
    descuentoLimitadoId = descuento.id;
    descuentoIds.push(descuento.id);
  });

  afterAll(async () => {
    if (primary) {
      if (descuentoIds.length) {
        await primary.descuentoUso.deleteMany({ where: { descuento_id: { in: descuentoIds } } });
      }
      if (usuarioId) {
        await primary.venta.deleteMany({ where: { usuario_id: usuarioId } });
      }
      if (productoId) {
        await primary.movimientosInventario.deleteMany({ where: { producto_id: productoId } });
        await primary.inventario.deleteMany({ where: { producto_id: productoId } });
        await primary.producto.delete({ where: { id: productoId } });
      }
      if (descuentoIds.length) {
        await primary.descuento.deleteMany({ where: { id: { in: descuentoIds } } });
      }
      if (usuarioId) await primary.usuario.delete({ where: { id: usuarioId } });
      if (rolId) await primary.rol.delete({ where: { id: rolId } });
      if (categoriaId) await primary.categoria.delete({ where: { id: categoriaId } });
    }
    await Promise.all([primary?.$disconnect(), secondary?.$disconnect()]);
  });

  it('allows exactly one of two independent checkout transactions to consume the last available use', async () => {
    const results = await Promise.allSettled([
      repositoryFor(primary).crear(saleInput(descuentoLimitadoId, limitedMarker)),
      repositoryFor(secondary).crear(saleInput(descuentoLimitadoId, limitedMarker)),
    ]);

    expect(results.filter((result) => result.status === 'fulfilled')).toHaveLength(1);
    expect(results.filter((result) => result.status === 'rejected')).toHaveLength(1);
    const rejected = results.find((result) => result.status === 'rejected');
    if (rejected?.status === 'rejected') expect(rejected.reason).toBeInstanceOf(ConflictException);

    const descuento = await primary.descuento.findUniqueOrThrow({ where: { id: descuentoLimitadoId } });
    expect(descuento.usos_actuales).toBe(descuento.limite_usos);
    expect(await primary.descuentoUso.count({ where: { descuento_id: descuentoLimitadoId } })).toBe(1);
    expect(await primary.venta.count({ where: { usuario_id: usuarioId, codigo_cupon: limitedMarker } })).toBe(1);
  });

  it('increments an unlimited discount with limite_usos set to null', async () => {
    const unlimitedMarker = 'unlimited-' + suffix;
    const descuento = await primary.descuento.create({
      data: {
        nombre: 'Unlimited ' + suffix,
        codigo_cupon: unlimitedMarker,
        tipo: 'MONTO_FIJO',
        valor: 5,
        alcance: 'GLOBAL',
        canal: 'POS',
        fecha_inicio: new Date(Date.now() - 60_000),
        fecha_fin: new Date(Date.now() + 60_000),
        limite_usos: null,
        usos_actuales: 0,
      },
    });
    descuentoIds.push(descuento.id);

    const repository = new PrismaVentaRepository(
      primary as PrismaService,
      {
        evaluate: jest.fn().mockResolvedValue({
          id: descuento.id.toString(),
          nombre: descuento.nombre,
          codigo: unlimitedMarker,
          tipo: 'MONTO_FIJO',
          alcance: 'GLOBAL',
          canal: 'POS',
          montoDescontado: 5,
          totalOriginal: 10,
          totalFinal: 5,
          itemsElegiblesCount: 1,
        }),
      } as any,
    );

    await expect(repository.crear(saleInput(descuento.id, unlimitedMarker))).resolves.toBeDefined();

    const persisted = await primary.descuento.findUniqueOrThrow({ where: { id: descuento.id } });
    expect(persisted.limite_usos).toBeNull();
    expect(persisted.usos_actuales).toBe(1);
  });
});
