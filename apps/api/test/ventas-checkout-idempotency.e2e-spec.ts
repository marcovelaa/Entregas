import { INestApplication, ValidationPipe } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
const cookieParser = require('cookie-parser');
const request = require('supertest');
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/common/prisma/prisma.service';
import { getJwtSecret } from '../src/modules/iam/auth/jwt.config';

(BigInt.prototype as unknown as { toJSON: () => number }).toJSON = function () {
  return Number(this);
};

describe('POS checkout ticket and idempotency (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let userId: bigint;
  let roleId: bigint;
  let categoryId: bigint;
  let productId: bigint;
  let inventoryId: bigint;
  let createdCashId: bigint | undefined;
  let accessToken: string;
  const suffix = `${Date.now()}-${process.pid}`;
  const idempotencyKey = `checkout-retry-${suffix}`;
  const createdSaleIds: bigint[] = [];

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.use(cookieParser());
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true }),
    );
    prisma = app.get(PrismaService);
    await app.init();

    const role = await prisma.rol.create({
      data: { nombre: `POS idempotency ${suffix}`, activo: true },
    });
    roleId = role.id;

    const user = await prisma.usuario.create({
      data: {
        rol_id: role.id,
        nombres: 'POS',
        apellidos: 'Idempotency',
        email: `pos-idempotency-${suffix}@example.test`,
        password_hash: 'not-used-by-test',
        activo: true,
      },
    });
    userId = user.id;

    const category = await prisma.categoria.create({
      data: {
        nombre: `POS idempotency ${suffix}`,
        slug: `pos-idempotency-${suffix}`,
      },
    });
    categoryId = category.id;

    const product = await prisma.producto.create({
      data: {
        categoria_id: category.id,
        nombre: `Producto POS ${suffix}`,
        sku: `POS-IDEMP-${suffix}`,
        precio_base: 10,
        activo: true,
      },
    });
    productId = product.id;

    const inventory = await prisma.inventario.create({
      data: {
        producto_id: product.id,
        cantidad_disponible: 5,
        reservado: 0,
      },
    });
    inventoryId = inventory.id;

    const activeCash = await prisma.caja.findFirst({
      where: { estado: 'ABIERTA' },
      orderBy: { fecha_apertura: 'desc' },
    });
    if (!activeCash) {
      const cash = await prisma.caja.create({
        data: {
          usuario_id: user.id,
          monto_apertura: 0,
          estado: 'ABIERTA',
        },
      });
      createdCashId = cash.id;
    }

    accessToken = app.get(JwtService).sign(
      {
        sub: user.id.toString(),
        email: user.email,
        rolId: role.id.toString(),
        rolNombre: role.nombre,
        permisos: ['ventas:crear'],
      },
      { secret: getJwtSecret() },
    );
  });

  afterAll(async () => {
    if (prisma) {
      const sales = userId
        ? await prisma.venta.findMany({
            where: { usuario_id: userId },
            select: { id: true },
          })
        : [];
      createdSaleIds.push(...sales.map((sale) => sale.id));

      if (createdSaleIds.length > 0) {
        await prisma.movimientoCaja.deleteMany({
          where: { referencia_id: { in: createdSaleIds.map(String) } },
        });
        await prisma.movimientosInventario.deleteMany({
          where: {
            tipo_documento_origen: 'VENTA',
            documento_origen_id: { in: createdSaleIds },
          },
        });
        await prisma.venta.deleteMany({
          where: { id: { in: createdSaleIds } },
        });
      }
      if (inventoryId)
        await prisma.inventario.delete({ where: { id: inventoryId } });
      if (productId) await prisma.producto.delete({ where: { id: productId } });
      if (categoryId)
        await prisma.categoria.delete({ where: { id: categoryId } });
      if (createdCashId)
        await prisma.caja.delete({ where: { id: createdCashId } });
      if (userId) await prisma.usuario.delete({ where: { id: userId } });
      if (roleId) await prisma.rol.delete({ where: { id: roleId } });
      await prisma.$disconnect();
    }
    if (app) await app.close();
  });

  it('assigns unique tickets concurrently and returns the original sale on a repeated checkout key', async () => {
    const checkout = (key: string) =>
      request(app.getHttpServer())
        .post('/api/ventas')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          idempotency_key: key,
          metodo_pago: 'EFECTIVO',
          monto_pagado: 10,
          detalles: [
            {
              producto_id: productId.toString(),
              cantidad: 1,
              precio_unitario: 10,
            },
          ],
        });

    const [first, retry] = await Promise.all([
      checkout(idempotencyKey),
      checkout(idempotencyKey),
    ]);
    expect(first.status).toBe(201);
    expect(retry.status).toBe(201);
    expect(first.body.data.id).toBe(retry.body.data.id);
    expect(first.body.data.numero_ticket).toMatch(/^TK-\d+$/);

    const [second, third] = await Promise.all([
      checkout(`checkout-second-${suffix}`),
      checkout(`checkout-third-${suffix}`),
    ]);
    expect(second.status).toBe(201);
    expect(third.status).toBe(201);

    const saleIds = [
      first.body.data.id,
      second.body.data.id,
      third.body.data.id,
    ];
    const tickets = [
      first.body.data.numero_ticket,
      second.body.data.numero_ticket,
      third.body.data.numero_ticket,
    ];
    expect(new Set(saleIds).size).toBe(3);
    expect(new Set(tickets).size).toBe(3);

    const persistedSales = await prisma.venta.findMany({
      where: { usuario_id: userId },
      select: { id: true, idempotency_key: true },
    });
    expect(persistedSales).toHaveLength(3);
    expect(
      persistedSales.filter((sale) => sale.idempotency_key === idempotencyKey),
    ).toHaveLength(1);

    const inventory = await prisma.inventario.findUnique({
      where: { id: inventoryId },
      select: { cantidad_disponible: true, reservado: true },
    });
    expect(inventory).toEqual({ cantidad_disponible: 2, reservado: 0 });

    const movements = await prisma.movimientosInventario.count({
      where: {
        tipo_documento_origen: 'VENTA',
        documento_origen_id: { in: persistedSales.map((sale) => sale.id) },
      },
    });
    expect(movements).toBe(3);
  });
});
