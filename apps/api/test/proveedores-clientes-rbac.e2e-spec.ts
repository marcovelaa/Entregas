import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
const request = require('supertest');
import { AppModule } from './../src/app.module';
import { PrismaService } from './../src/common/prisma/prisma.service';
import { getJwtSecret } from '../src/modules/iam/auth/jwt.config';

(BigInt.prototype as any).toJSON = function () {
  return Number(this);
};

describe('Proveedores/Clientes RBAC (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let usuarioId: string;
  let rolId: string;
  const createdProveedorIds: string[] = [];
  const createdClienteIds: string[] = [];
  const suffix = `${Date.now()}-${process.pid}`;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    prisma = app.get(PrismaService);
    await app.init();

    const rol = await prisma.rol.create({
      data: { nombre: `Prov Cli RBAC ${suffix}` },
    });
    rolId = rol.id.toString();
    const usuario = await prisma.usuario.create({
      data: {
        rol_id: rol.id,
        nombres: 'Prov',
        apellidos: 'Cli',
        email: `prov-cli-rbac-${suffix}@example.test`,
        password_hash: 'not-used-by-test',
      },
    });
    usuarioId = usuario.id.toString();
  });

  afterAll(async () => {
    await prisma.proveedor.deleteMany({
      where: { id: { in: createdProveedorIds.map(BigInt) } },
    });
    await prisma.cliente.deleteMany({
      where: { id: { in: createdClienteIds.map(BigInt) } },
    });
    await prisma.usuario.deleteMany({ where: { id: BigInt(usuarioId) } });
    await prisma.rol.deleteMany({ where: { id: BigInt(rolId) } });
    await prisma.$disconnect();
    await app.close();
  });

  const signToken = (permisos: string[]) =>
    `Bearer ${app.get(JwtService).sign(
      {
        sub: usuarioId,
        email: `prov-cli-rbac-${suffix}@example.test`,
        rolId,
        rolNombre: `Prov Cli RBAC ${suffix}`,
        permisos,
      },
      { secret: getJwtSecret(), expiresIn: '8h' },
    )}`;

  it('PATCH /api/proveedores/:id - exige proveedores:editar, no proveedores:crear', async () => {
    const createRes = await request(app.getHttpServer())
      .post('/api/proveedores')
      .set('Authorization', signToken(['proveedores:crear']))
      .send({ nombre: `Proveedor RBAC ${suffix}` })
      .expect(201);
    const id = createRes.body.id;
    createdProveedorIds.push(id);

    await request(app.getHttpServer())
      .patch(`/api/proveedores/${id}`)
      .set('Authorization', signToken(['proveedores:crear']))
      .send({ nombre: 'bloqueado' })
      .expect(403);

    const res = await request(app.getHttpServer())
      .patch(`/api/proveedores/${id}`)
      .set('Authorization', signToken(['proveedores:editar']))
      .send({ nombre: 'editado' });
    expect(res.status).not.toBe(403);
  });

  it('PUT /api/clientes/:id - exige clientes:editar, no clientes:crear', async () => {
    const createRes = await request(app.getHttpServer())
      .post('/api/clientes')
      .set('Authorization', signToken(['clientes:crear']))
      .send({ nombres: 'Cliente', apellidos: `RBAC ${suffix}` })
      .expect(201);
    const id = createRes.body.data.id;
    createdClienteIds.push(id);

    await request(app.getHttpServer())
      .put(`/api/clientes/${id}`)
      .set('Authorization', signToken(['clientes:crear']))
      .send({ nombres: 'bloqueado' })
      .expect(403);

    const res = await request(app.getHttpServer())
      .put(`/api/clientes/${id}`)
      .set('Authorization', signToken(['clientes:editar']))
      .send({ nombres: 'editado' });
    expect(res.status).not.toBe(403);
  });

  it('GET /api/proveedores - exige autenticación y proveedores:ver, no es público', async () => {
    await request(app.getHttpServer()).get('/api/proveedores').expect(401);

    await request(app.getHttpServer())
      .get('/api/proveedores')
      .set('Authorization', signToken(['proveedores:crear']))
      .expect(403);

    const res = await request(app.getHttpServer())
      .get('/api/proveedores')
      .set('Authorization', signToken(['proveedores:ver']));
    expect(res.status).not.toBe(403);
  });

  it('GET /api/clientes - exige autenticación y clientes:ver, no es público', async () => {
    await request(app.getHttpServer()).get('/api/clientes').expect(401);

    await request(app.getHttpServer())
      .get('/api/clientes')
      .set('Authorization', signToken(['clientes:crear']))
      .expect(403);

    const res = await request(app.getHttpServer())
      .get('/api/clientes')
      .set('Authorization', signToken(['clientes:ver']));
    expect(res.status).not.toBe(403);
  });
});
