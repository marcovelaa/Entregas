import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
const request = require('supertest');
const cookieParser = require('cookie-parser');
import { AppModule } from './../src/app.module';
import { PrismaService } from './../src/common/prisma/prisma.service';

(BigInt.prototype as any).toJSON = function () {
  return Number(this);
};

describe('Pedidos (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  const suffix = `${Date.now()}-${process.pid}`;
  const emailCliente = `pedido-cliente-${suffix}@example.test`;
  let clienteId: string;
  let productoId: string;
  const createdPedidoIds: string[] = [];

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

    // Create a product for order testing
    const producto = await prisma.producto.create({
      data: {
        nombre: `Producto Test Pedido ${suffix}`,
        sku: `SKU-${suffix}`,
        precio_base: 45.0,
        activo: true,
        categoria: {
          create: {
            nombre: `Cat Pedido ${suffix}`,
            slug: `cat-pedido-${suffix}`,
          },
        },
      },
    });
    productoId = producto.id.toString();
  });

  afterAll(async () => {
    if (createdPedidoIds.length > 0) {
      await prisma.pedidoHistorialEstado.deleteMany({
        where: { pedido_id: { in: createdPedidoIds.map(BigInt) } },
      });
      await prisma.pedidoDetalle.deleteMany({
        where: { pedido_id: { in: createdPedidoIds.map(BigInt) } },
      });
      await prisma.pedido.deleteMany({
        where: { id: { in: createdPedidoIds.map(BigInt) } },
      });
    }

    if (clienteId) {
      await prisma.cliente.delete({ where: { id: BigInt(clienteId) } });
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

  it('permite a un cliente autenticado crear un pedido y consultar sus detalles', async () => {
    // 1. Registro del cliente
    await request(app.getHttpServer())
      .post('/api/clientes/auth/registro')
      .send({
        nombres: 'Cliente',
        apellidos: 'Pedido',
        email: emailCliente,
        password: 'password123',
      })
      .expect(201);

    const cliente = await prisma.cliente.findFirst({
      where: { email: emailCliente },
    });
    clienteId = cliente!.id.toString();

    // 2. Login con agente
    const agent = request.agent(app.getHttpServer());
    await agent
      .post('/api/clientes/auth/login')
      .send({ email: emailCliente, password: 'password123' })
      .expect(200);

    // 3. Crear pedido desde el cliente autenticado
    const response = await agent
      .post('/api/clientes/me/pedidos')
      .send({
        direccion_envio: {
          destinatario_nombre: 'Cliente',
          destinatario_apellidos: 'Pedido',
          direccion_completa: 'Av. Las Palmas 456',
          ciudad: 'Santa Cruz',
          telefono: '76543210',
          referencia: 'Frente al parque',
        },
        costo_envio: 20,
        detalles: [
          {
            producto_id: productoId,
            nombre_producto: `Producto Test Pedido ${suffix}`,
            precio_unitario: 45.0,
            cantidad: 2,
          },
        ],
      })
      .expect(201);

    const pedido = response.body;
    expect(pedido.id).toBeDefined();
    expect(pedido.estado).toBe('PENDIENTE_PAGO');
    expect(pedido.total).toBe(110); // (45 * 2) + 20
    expect(pedido.direccion_envio_snapshot.ciudad).toBe('Santa Cruz');
    createdPedidoIds.push(pedido.id);

    // 4. Listar pedidos del cliente
    const lista = await agent.get('/api/clientes/me/pedidos').expect(200);
    expect(lista.body.length).toBeGreaterThanOrEqual(1);
    expect(lista.body[0].id).toBe(pedido.id);

    // 5. Obtener detalle por id
    const detalle = await agent
      .get(`/api/clientes/me/pedidos/${pedido.id}`)
      .expect(200);
    expect(detalle.body.numero_pedido).toBe(pedido.numero_pedido);
  });
});
