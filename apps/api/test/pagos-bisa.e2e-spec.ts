import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
const request = require('supertest');
const cookieParser = require('cookie-parser');
import { AppModule } from './../src/app.module';
import { PrismaService } from './../src/common/prisma/prisma.service';

(BigInt.prototype as any).toJSON = function () {
  return Number(this);
};

describe('Pagos BISA (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  const suffix = `${Date.now()}-${process.pid}`;
  let pedidoId: string;
  let productoId: string;
  let pagoQrId: string;
  let referenciaBisa: string;

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

    // Create a product
    const producto = await prisma.producto.create({
      data: {
        nombre: `Producto Test Pago ${suffix}`,
        sku: `SKU-PAGO-${suffix}`,
        precio_base: 50.0,
        activo: true,
        categoria: {
          create: {
            nombre: `Cat Pago ${suffix}`,
            slug: `cat-pago-${suffix}`,
          },
        },
      },
    });
    productoId = producto.id.toString();

    // Create an order
    const pedido = await prisma.pedido.create({
      data: {
        estado: 'PENDIENTE_PAGO',
        direccion_envio_snapshot: {
          destinatario_nombre: 'Test',
          destinatario_apellidos: 'Pago',
          direccion_completa: 'Calle Test 123',
          ciudad: 'Cochabamba',
          telefono: '71111111',
        },
        costo_envio: 10,
        subtotal: 50,
        total: 60,
        metodo_pago: 'QR',
        detalles: {
          create: {
            producto_id: producto.id,
            nombre_producto: `Producto Test Pago ${suffix}`,
            precio_unitario: 50,
            cantidad: 1,
            subtotal: 50,
          },
        },
      },
    });
    pedidoId = pedido.id.toString();
  });

  afterAll(async () => {
    await prisma.pagoWebhookLog.deleteMany({});
    if (pagoQrId) {
      await prisma.pagoQR.deleteMany({
        where: { id: BigInt(pagoQrId) },
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
      const prod = await prisma.producto.findUnique({
        where: { id: BigInt(productoId) },
        select: { categoria_id: true },
      });
      await prisma.producto.delete({ where: { id: BigInt(productoId) } });
      if (prod?.categoria_id) {
        await prisma.categoria.delete({ where: { id: prod.categoria_id } });
      }
    }

    await prisma.$disconnect();
    await app.close();
  });

  it('1. Genera un QR de pago simulado', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/pagos/qr/generar')
      .send({ pedido_id: pedidoId })
      .expect(201);

    expect(res.body.qr_contenido).toContain('simulador-bisa.test');
    expect(res.body.referencia_bisa).toBeDefined();
    pagoQrId = res.body.id;
    referenciaBisa = res.body.referencia_bisa;
  });

  it('2. Consulta el estado del QR generado', async () => {
    const res = await request(app.getHttpServer())
      .get(`/api/pagos/qr/${pagoQrId}/estado`)
      .expect(200);

    expect(res.body.estado).toBe('PENDIENTE');
  });

  it('3. Procesa el webhook del Banco BISA marcando el pedido como PAGADO de forma idempotente', async () => {
    // Primer envío del webhook
    const res1 = await request(app.getHttpServer())
      .post('/api/pagos/bisa/webhook')
      .send({
        referencia_bisa: referenciaBisa,
        estado: 'CONFIRMADO',
        monto: 60,
      })
      .expect(200);

    expect(res1.body.procesado).toBe(true);

    // Verificar que el pedido pasó a PAGADO
    const pedidoActualizado = await prisma.pedido.findUnique({
      where: { id: BigInt(pedidoId) },
    });
    expect(pedidoActualizado!.estado).toBe('PAGADO');

    // Segundo envío redundante del webhook (IDEMPOTENCIA)
    const res2 = await request(app.getHttpServer())
      .post('/api/pagos/bisa/webhook')
      .send({
        referencia_bisa: referenciaBisa,
        estado: 'CONFIRMADO',
        monto: 60,
      })
      .expect(200);

    expect(res2.body.procesado).toBe(false);
  });
});
