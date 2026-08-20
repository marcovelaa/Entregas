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

describe('Descuentos RBAC (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let usuarioId: string;
  let rolId: string;
  const createdDescuentoIds: string[] = [];
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
      data: { nombre: `Descuentos RBAC ${suffix}` },
    });
    rolId = rol.id.toString();
    const usuario = await prisma.usuario.create({
      data: {
        rol_id: rol.id,
        nombres: 'Descuentos',
        apellidos: 'RBAC',
        email: `descuentos-rbac-${suffix}@example.test`,
        password_hash: 'not-used-by-test',
      },
    });
    usuarioId = usuario.id.toString();
  });

  afterAll(async () => {
    await prisma.descuento.deleteMany({
      where: { id: { in: createdDescuentoIds.map(BigInt) } },
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
        email: `descuentos-rbac-${suffix}@example.test`,
        rolId,
        rolNombre: `Descuentos RBAC ${suffix}`,
        permisos,
      },
      { secret: getJwtSecret(), expiresIn: '8h' },
    )}`;

  const crearDescuento = async (nombre: string) => {
    const res = await request(app.getHttpServer())
      .post('/api/descuentos')
      .set('Authorization', signToken(['descuentos:crear']))
      .send({
        nombre,
        tipo: 'PORCENTAJE',
        valor: 10,
        fechaInicio: '2026-01-01',
        fechaFin: '2026-12-31',
      })
      .expect(201);
    const id = res.body.data.id;
    createdDescuentoIds.push(id);
    return id;
  };

  it('PATCH /api/descuentos/:id - exige descuentos:editar, no descuentos:crear', async () => {
    const id = await crearDescuento(`Descuento Edit ${suffix}`);

    await request(app.getHttpServer())
      .patch(`/api/descuentos/${id}`)
      .set('Authorization', signToken(['descuentos:crear']))
      .send({ nombre: 'bloqueado' })
      .expect(403);

    const res = await request(app.getHttpServer())
      .patch(`/api/descuentos/${id}`)
      .set('Authorization', signToken(['descuentos:editar']))
      .send({ nombre: 'editado' });
    expect(res.status).not.toBe(403);
  });

  it('PUT /api/descuentos/:id - exige descuentos:editar, no descuentos:crear', async () => {
    const id = await crearDescuento(`Descuento Put ${suffix}`);

    await request(app.getHttpServer())
      .put(`/api/descuentos/${id}`)
      .set('Authorization', signToken(['descuentos:crear']))
      .send({ nombre: 'bloqueado' })
      .expect(403);

    const res = await request(app.getHttpServer())
      .put(`/api/descuentos/${id}`)
      .set('Authorization', signToken(['descuentos:editar']))
      .send({ nombre: 'editado put' });
    expect(res.status).not.toBe(403);
  });

  it('DELETE /api/descuentos/:id - exige descuentos:eliminar, no descuentos:crear', async () => {
    const id = await crearDescuento(`Descuento Delete ${suffix}`);

    await request(app.getHttpServer())
      .delete(`/api/descuentos/${id}`)
      .set('Authorization', signToken(['descuentos:crear']))
      .expect(403);

    const res = await request(app.getHttpServer())
      .delete(`/api/descuentos/${id}`)
      .set('Authorization', signToken(['descuentos:eliminar']));
    expect(res.status).not.toBe(403);
  });

  it('GET /api/descuentos - exige autenticación y descuentos:ver, no es público', async () => {
    await request(app.getHttpServer()).get('/api/descuentos').expect(401);

    await request(app.getHttpServer())
      .get('/api/descuentos')
      .set('Authorization', signToken(['descuentos:crear']))
      .expect(403);

    const res = await request(app.getHttpServer())
      .get('/api/descuentos')
      .set('Authorization', signToken(['descuentos:ver']));
    expect(res.status).not.toBe(403);
  });

  it('GET /api/descuentos/:id - exige autenticación y descuentos:ver, no es público', async () => {
    const id = await crearDescuento(`Descuento Get ${suffix}`);

    await request(app.getHttpServer()).get(`/api/descuentos/${id}`).expect(401);

    await request(app.getHttpServer())
      .get(`/api/descuentos/${id}`)
      .set('Authorization', signToken(['descuentos:crear']))
      .expect(403);

    const res = await request(app.getHttpServer())
      .get(`/api/descuentos/${id}`)
      .set('Authorization', signToken(['descuentos:ver']));
    expect(res.status).not.toBe(403);
  });

  it('GET /api/descuentos/:id/analitica - exige autenticación y descuentos:ver, no es público', async () => {
    const id = await crearDescuento(`Descuento Analitica ${suffix}`);

    await request(app.getHttpServer())
      .get(`/api/descuentos/${id}/analitica`)
      .expect(401);

    await request(app.getHttpServer())
      .get(`/api/descuentos/${id}/analitica`)
      .set('Authorization', signToken(['descuentos:crear']))
      .expect(403);

    const res = await request(app.getHttpServer())
      .get(`/api/descuentos/${id}/analitica`)
      .set('Authorization', signToken(['descuentos:ver']));
    expect(res.status).not.toBe(403);
  });

  it('POST /api/descuentos/validar - exige autenticación y descuentos:validar, no es público', async () => {
    await request(app.getHttpServer())
      .post('/api/descuentos/validar')
      .send({ items: [] })
      .expect(401);

    await request(app.getHttpServer())
      .post('/api/descuentos/validar')
      .set('Authorization', signToken(['descuentos:crear']))
      .send({ items: [] })
      .expect(403);

    const res = await request(app.getHttpServer())
      .post('/api/descuentos/validar')
      .set('Authorization', signToken(['descuentos:validar']))
      .send({ items: [] });
    expect(res.status).not.toBe(403);
  });
});
