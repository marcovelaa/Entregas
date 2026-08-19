import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
const request = require('supertest');
const cookieParser = require('cookie-parser');
import { AppModule } from './../src/app.module';
import { PrismaService } from './../src/common/prisma/prisma.service';
import { getJwtSecret } from './../src/modules/iam/auth/jwt.config';

(BigInt.prototype as any).toJSON = function () {
  return Number(this);
};

describe('Compras y Proveedores Operables (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  const suffix = `${Date.now()}-${process.pid}`;
  let adminToken: string;
  let usuarioId: string;
  let rolId: string;
  let proveedorId: string;
  let productoId: string;
  let inventarioId: string;
  let compraId: string;
  let detalleId: string;

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

    // 1. Create admin role & user with compras permissions
    const rol = await prisma.rol.create({
      data: { nombre: `Rol Compras ${suffix}`, activo: true },
    });
    rolId = rol.id.toString();

    const usuario = await prisma.usuario.create({
      data: {
        rol_id: rol.id,
        nombres: 'Operador',
        apellidos: 'Compras',
        email: `compras-op-${suffix}@test.com`,
        password_hash: 'not-used',
        activo: true,
      },
    });
    usuarioId = usuario.id.toString();

    const jwtService = app.get(JwtService);
    adminToken = jwtService.sign(
      {
        sub: usuario.id.toString(),
        email: usuario.email,
        rolId: rol.id.toString(),
        rolNombre: 'ADMIN',
        permisos: ['compras:crear', 'compras:ver'],
      },
      { secret: getJwtSecret() },
    );

    // 2. Create proveedor & producto
    const proveedor = await prisma.proveedor.create({
      data: {
        nombre: `Proveedor Test ${suffix}`,
        contacto: 'Juan Pérez',
        email: `prov-${suffix}@test.com`,
      },
    });
    proveedorId = proveedor.id.toString();

    const producto = await prisma.producto.create({
      data: {
        nombre: `Producto Compra ${suffix}`,
        sku: `SKU-CMP-${suffix}`,
        precio_base: 100.0,
        costo_promedio: 0.0,
        activo: true,
        categoria: {
          create: {
            nombre: `Cat Cmp ${suffix}`,
            slug: `cat-cmp-${suffix}`,
          },
        },
      },
    });
    productoId = producto.id.toString();

    const inv = await prisma.inventario.create({
      data: {
        producto_id: producto.id,
        cantidad_disponible: 0,
        reservado: 0,
      },
    });
    inventarioId = inv.id.toString();
  });

  afterAll(async () => {
    if (compraId) {
      await prisma.compraDetalle.deleteMany({
        where: { compra_id: BigInt(compraId) },
      });
      await prisma.compra.delete({ where: { id: BigInt(compraId) } });
    }
    if (productoId) {
      await prisma.movimientosInventario.deleteMany({
        where: { producto_id: BigInt(productoId) },
      });
    }
    if (inventarioId) {
      await prisma.inventario.delete({ where: { id: BigInt(inventarioId) } });
    }
    if (productoId) {
      const prod = await prisma.producto.findUnique({
        where: { id: BigInt(productoId) },
        select: { categoria_id: true },
      });
      await prisma.producto.delete({ where: { id: BigInt(productoId) } });
      if (prod?.categoria_id) {
        await prisma.categoria.delete({ where: { id: prod.categoria_id } });
      }
    }
    if (proveedorId) {
      await prisma.proveedor.delete({ where: { id: BigInt(proveedorId) } });
    }
    if (usuarioId) {
      await prisma.usuario.delete({ where: { id: BigInt(usuarioId) } });
    }
    if (rolId) {
      await prisma.rol.delete({ where: { id: BigInt(rolId) } });
    }

    await prisma.$disconnect();
    await app.close();
  });

  it('1. Crea orden de compra en estado EMITIDA con costo de transporte', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/compras')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        proveedor_id: proveedorId,
        numero_recibo: `FAC-${suffix}`,
        costo_transporte: 20,
        estado: 'EMITIDA',
        observaciones: 'Compra de prueba e2e',
        detalles: [
          {
            producto_id: productoId,
            cantidad: 10,
            costo_unitario: 50,
          },
        ],
      })
      .expect(201);

    expect(res.body.compraId).toBeDefined();
    compraId = res.body.compraId;

    // Obtener detalle para la recepción
    const compra = await prisma.compra.findUnique({
      where: { id: BigInt(compraId) },
      include: { detalles: true },
    });
    expect(compra!.estado).toBe('EMITIDA');
    detalleId = compra!.detalles[0].id.toString();
  });

  it('2. Procesa recepción parcial de 5 unidades incrementando inventario y costo promedio', async () => {
    const res = await request(app.getHttpServer())
      .patch(`/api/compras/${compraId}/recibir`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        detalles_recibidos: [
          {
            detalle_id: detalleId,
            cantidad_recibida: 5,
          },
        ],
      })
      .expect(200);

    expect(res.body.estado).toBe('RECEPCION_PARCIAL');

    // Verificar que el inventario se incrementó en 5 unidades
    const inv = await prisma.inventario.findUnique({
      where: { id: BigInt(inventarioId) },
    });
    expect(inv!.cantidad_disponible).toBe(5);

    // Verificar costo promedio ponderado (50 costo + 2 prorrateo flete por unidad = 52)
    const prod = await prisma.producto.findUnique({
      where: { id: BigInt(productoId) },
    });
    expect(Number(prod!.costo_promedio)).toBe(52);
  });

  it('3. Procesa recepción del saldo restante pasando la orden a RECIBIDA', async () => {
    const res = await request(app.getHttpServer())
      .patch(`/api/compras/${compraId}/recibir`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        detalles_recibidos: [
          {
            detalle_id: detalleId,
            cantidad_recibida: 5,
          },
        ],
      })
      .expect(200);

    expect(res.body.estado).toBe('RECIBIDA');

    // Verificar stock final en 10 unidades
    const inv = await prisma.inventario.findUnique({
      where: { id: BigInt(inventarioId) },
    });
    expect(inv!.cantidad_disponible).toBe(10);
  });

  describe('RBAC', () => {
    const signToken = (permisos: string[]) =>
      `Bearer ${app.get(JwtService).sign(
        {
          sub: usuarioId,
          email: `compras-op-${suffix}@test.com`,
          rolId,
          rolNombre: 'ADMIN',
          permisos,
        },
        { secret: getJwtSecret() },
      )}`;

    it('GET /api/compras - exige autenticación + compras:ver (no es público)', async () => {
      await request(app.getHttpServer()).get('/api/compras').expect(401);

      await request(app.getHttpServer())
        .get('/api/compras')
        .set('Authorization', signToken(['catalogo:ver']))
        .expect(403);

      await request(app.getHttpServer())
        .get('/api/compras')
        .set('Authorization', signToken(['compras:ver']))
        .expect(200);
    });

    it('GET /api/compras/:id - exige autenticación + compras:ver (no es público)', async () => {
      await request(app.getHttpServer())
        .get(`/api/compras/${compraId}`)
        .expect(401);

      await request(app.getHttpServer())
        .get(`/api/compras/${compraId}`)
        .set('Authorization', signToken(['compras:ver']))
        .expect(200);
    });

    it('PATCH /api/compras/:id/anular - exige compras:anular, no compras:crear', async () => {
      await request(app.getHttpServer())
        .patch(`/api/compras/${compraId}/anular`)
        .set('Authorization', signToken(['compras:crear']))
        .send({ motivo: 'test rbac' })
        .expect(403);

      const res = await request(app.getHttpServer())
        .patch(`/api/compras/${compraId}/anular`)
        .set('Authorization', signToken(['compras:anular']))
        .send({ motivo: 'test rbac' });
      expect(res.status).not.toBe(403);
    });
  });
});
