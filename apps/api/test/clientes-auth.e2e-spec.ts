import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
const request = require('supertest');
const cookieParser = require('cookie-parser');
import { AppModule } from './../src/app.module';
import { PrismaService } from './../src/common/prisma/prisma.service';

(BigInt.prototype as any).toJSON = function () {
  return Number(this);
};

describe('Clientes Auth + Direcciones (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  const suffix = `${Date.now()}-${process.pid}`;
  const emailA = `cliente-a-${suffix}@example.test`;
  const emailB = `cliente-b-${suffix}@example.test`;
  const createdClienteIds: string[] = [];

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.use(cookieParser());
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    prisma = app.get(PrismaService);
    await app.init();
  });

  afterAll(async () => {
    await prisma.direccion.deleteMany({ where: { cliente_id: { in: createdClienteIds.map(BigInt) } } });
    await prisma.clienteResetToken.deleteMany({ where: { cliente_id: { in: createdClienteIds.map(BigInt) } } });
    await prisma.cliente.deleteMany({ where: { id: { in: createdClienteIds.map(BigInt) } } });
    await prisma.$disconnect();
    await app.close();
  });

  it('registra un cliente y setea cookies httpOnly', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/clientes/auth/registro')
      .send({ nombres: 'Cliente', apellidos: 'A', email: emailA, password: 'password123' })
      .expect(201);

    expect(response.body.cliente.email).toBe(emailA);
    const setCookie = response.headers['set-cookie'].join(';');
    expect(setCookie).toContain('cliente_access_token=');
    expect(setCookie).toContain('HttpOnly');

    const cliente = await prisma.cliente.findFirst({ where: { email: emailA } });
    createdClienteIds.push(cliente!.id.toString());
  });

  it('rechaza el registro con un email ya usado', async () => {
    await request(app.getHttpServer())
      .post('/api/clientes/auth/registro')
      .send({ nombres: 'Otra', apellidos: 'Persona', email: emailA, password: 'password123' })
      .expect(409);
  });

  it('login con credenciales inválidas devuelve 401', async () => {
    await request(app.getHttpServer())
      .post('/api/clientes/auth/login')
      .send({ email: emailA, password: 'incorrecta' })
      .expect(401);
  });

  it('login con credenciales válidas permite ver y editar el perfil propio', async () => {
    const agent = request.agent(app.getHttpServer());
    await agent.post('/api/clientes/auth/login').send({ email: emailA, password: 'password123' }).expect(200);

    const perfil = await agent.get('/api/clientes/me').expect(200);
    expect(perfil.body.email).toBe(emailA);
    expect(perfil.body.password_hash).toBeUndefined();

    await agent.patch('/api/clientes/me').send({ telefono: '70000000' }).expect(200);
  });

  it('CRUD de direcciones: el cliente A no puede tocar una dirección del cliente B', async () => {
    const agentA = request.agent(app.getHttpServer());
    await agentA.post('/api/clientes/auth/login').send({ email: emailA, password: 'password123' }).expect(200);

    await request(app.getHttpServer())
      .post('/api/clientes/auth/registro')
      .send({ nombres: 'Cliente', apellidos: 'B', email: emailB, password: 'password123' })
      .expect(201);
    const clienteB = await prisma.cliente.findFirst({ where: { email: emailB } });
    createdClienteIds.push(clienteB!.id.toString());

    const agentB = request.agent(app.getHttpServer());
    await agentB.post('/api/clientes/auth/login').send({ email: emailB, password: 'password123' }).expect(200);

    const direccionB = await agentB
      .post('/api/clientes/me/direcciones')
      .send({
        alias: 'Casa',
        destinatario_nombre: 'Cliente',
        destinatario_apellidos: 'B',
        direccion_completa: 'Av. Siempre Viva 123',
        ciudad: 'Santa Cruz',
        telefono: '70000001',
      })
      .expect(201);

    await agentA.put(`/api/clientes/me/direcciones/${direccionB.body.id}`).send({ alias: 'Robada' }).expect(404);
    await agentA.delete(`/api/clientes/me/direcciones/${direccionB.body.id}`).expect(404);
  });

  it('recuperación de contraseña de punta a punta en modo no productivo', async () => {
    const solicitud = await request(app.getHttpServer())
      .post('/api/clientes/auth/solicitar-recuperacion')
      .send({ email: emailA })
      .expect(200);
    expect(solicitud.body.devToken).toBeDefined();

    await request(app.getHttpServer())
      .post('/api/clientes/auth/restablecer-password')
      .send({ token: solicitud.body.devToken, password: 'otraPassword456' })
      .expect(200);

    await request(app.getHttpServer())
      .post('/api/clientes/auth/login')
      .send({ email: emailA, password: 'otraPassword456' })
      .expect(200);
  });
});
