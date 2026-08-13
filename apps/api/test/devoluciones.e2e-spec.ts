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

describe('Devoluciones / RMA (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  const suffix = `${Date.now()}-${process.pid}`;
  let clienteId: string;
  let clienteToken: string;
  let adminToken: string;
  let usuarioId: string;
  let rolId: string;
  let productoId: string;
  let inventarioId: string;
  let pedidoId: string;
  let pedidoDetalleId: string;
  let devolucionId: string;

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

    // 1. Create a customer & login
    const email = `cliente-dev-${suffix}@test.com`;
    const regRes = await request(app.getHttpServer())
      .post('/api/clientes/auth/registro')
      .send({
        nombres: 'Cliente',
        apellidos: 'Devolucion',
        email,
        password: 'Password123!',
      })
      .expect(201);
    clienteId = regRes.body.cliente?.id || regRes.body.id;

    const loginRes = await request(app.getHttpServer())
      .post('/api/clientes/auth/login')
      .send({ email, password: 'Password123!' })
      .expect(200);
    const rawCookie = loginRes.headers['set-cookie'].find((c: string) =>
      c.startsWith('cliente_access_token='),
    );
    clienteToken = rawCookie.split(';')[0];

    // 2. Create active admin user & sign JWT token with proper secret
    const rol = await prisma.rol.create({
      data: { nombre: `Rol Dev ${suffix}`, activo: true },
    });
    rolId = rol.id.toString();

    const usuario = await prisma.usuario.create({
      data: {
        rol_id: rol.id,
        nombres: 'Admin',
        apellidos: 'Devoluciones',
        email: `admin-dev-${suffix}@test.com`,
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
        permisos: ['ventas:ver', 'ventas:editar'],
      },
      { secret: getJwtSecret() },
    );

    // 3. Create product & inventory
    const producto = await prisma.producto.create({
      data: {
        nombre: `Producto Devolución ${suffix}`,
        sku: `SKU-DEV-${suffix}`,
        precio_base: 100.0,
        activo: true,
        categoria: {
          create: {
            nombre: `Cat Dev ${suffix}`,
            slug: `cat-dev-${suffix}`,
          },
        },
      },
    });
    productoId = producto.id.toString();

    const inv = await prisma.inventario.create({
      data: {
        producto_id: producto.id,
        cantidad_disponible: 10,
        reservado: 0,
      },
    });
    inventarioId = inv.id.toString();

    // 4. Create delivered order for customer
    const pedido = await prisma.pedido.create({
      data: {
        cliente_id: BigInt(clienteId),
        estado: 'ENTREGADO',
        direccion_envio_snapshot: {
          destinatario_nombre: 'Cliente',
          destinatario_apellidos: 'Devolucion',
          direccion_completa: 'Calle Test 123',
          ciudad: 'La Paz',
          telefono: '70000000',
        },
        costo_envio: 10,
        subtotal: 100,
        total: 110,
        metodo_pago: 'QR',
        detalles: {
          create: {
            producto_id: producto.id,
            nombre_producto: `Producto Devolución ${suffix}`,
            precio_unitario: 100,
            cantidad: 2,
            subtotal: 200,
          },
        },
      },
      include: { detalles: true },
    });
    pedidoId = pedido.id.toString();
    pedidoDetalleId = pedido.detalles[0].id.toString();
  });

  afterAll(async () => {
    if (devolucionId) {
      await prisma.devolucionDetalle.deleteMany({
        where: { devolucion_id: BigInt(devolucionId) },
      });
      await prisma.devolucion.deleteMany({
        where: { id: BigInt(devolucionId) },
      });
    }
    if (pedidoId) {
      await prisma.pedidoHistorialEstado.deleteMany({
        where: { pedido_id: BigInt(pedidoId) },
      });
      await prisma.pedidoDetalle.deleteMany({
        where: { pedido_id: BigInt(pedidoId) },
      });
      await prisma.pedido.delete({ where: { id: BigInt(pedidoId) } });
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
    if (usuarioId) {
      await prisma.usuario.delete({ where: { id: BigInt(usuarioId) } });
    }
    if (rolId) {
      await prisma.rol.delete({ where: { id: BigInt(rolId) } });
    }
    if (clienteId) {
      await prisma.cliente.delete({ where: { id: BigInt(clienteId) } });
    }

    await prisma.$disconnect();
    await app.close();
  });

  it('1. Cliente solicita devolución de 1 unidad del pedido entregado', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/clientes/me/devoluciones')
      .set('Cookie', [clienteToken])
      .send({
        pedido_id: pedidoId,
        motivo: 'Producto vino rayado',
        detalles: [
          {
            pedido_detalle_id: pedidoDetalleId,
            producto_id: productoId,
            cantidad: 1,
            motivo_item: 'Rayón en tapa',
          },
        ],
      })
      .expect(201);

    expect(res.body.id).toBeDefined();
    expect(res.body.estado).toBe('SOLICITADA');
    devolucionId = res.body.id;
  });

  it('2. Cliente lista sus devoluciones', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/clientes/me/devoluciones')
      .set('Cookie', [clienteToken])
      .expect(200);

    expect(res.body.length).toBeGreaterThanOrEqual(1);
    expect(res.body[0].pedido_id).toBe(pedidoId);
  });

  it('3. Operador ERP evalúa y aprueba devolución con restock de inventario', async () => {
    const invAntes = await prisma.inventario.findUnique({
      where: { id: BigInt(inventarioId) },
    });

    const res = await request(app.getHttpServer())
      .patch(`/api/devoluciones/${devolucionId}/evaluar`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        estado: 'APROBADA',
        resolucion: 'REEMBOLSO',
        destino_fisico: 'INVENTARIO_RESTOCK',
        monto_reembolso: 100,
        notas_evaluacion: 'Aprobado tras inspección visual',
      })
      .expect(200);

    expect(res.body.estado).toBe('APROBADA');
    expect(res.body.resolucion).toBe('REEMBOLSO');

    // Verificar que la cantidad disponible de inventario se incrementó en 1 unidad
    const invDespues = await prisma.inventario.findUnique({
      where: { id: BigInt(inventarioId) },
    });
    expect(invDespues!.cantidad_disponible).toBe(
      invAntes!.cantidad_disponible + 1,
    );
  });
});
