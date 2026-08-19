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

describe('Pedidos ERP RBAC (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let usuarioId: string;
  let rolId: string;
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
      data: { nombre: `Pedidos ERP RBAC ${suffix}` },
    });
    rolId = rol.id.toString();
    const usuario = await prisma.usuario.create({
      data: {
        rol_id: rol.id,
        nombres: 'Pedidos',
        apellidos: 'ERP',
        email: `pedidos-erp-rbac-${suffix}@example.test`,
        password_hash: 'not-used-by-test',
      },
    });
    usuarioId = usuario.id.toString();
  });

  afterAll(async () => {
    await prisma.usuario.deleteMany({ where: { id: BigInt(usuarioId) } });
    await prisma.rol.deleteMany({ where: { id: BigInt(rolId) } });
    await prisma.$disconnect();
    await app.close();
  });

  const signToken = (permisos: string[]) =>
    `Bearer ${app.get(JwtService).sign(
      {
        sub: usuarioId,
        email: `pedidos-erp-rbac-${suffix}@example.test`,
        rolId,
        rolNombre: `Pedidos ERP RBAC ${suffix}`,
        permisos,
      },
      { secret: getJwtSecret(), expiresIn: '8h' },
    )}`;

  it('GET /api/pedidos - exige autenticación + ventas:ver (no es público)', async () => {
    await request(app.getHttpServer()).get('/api/pedidos').expect(401);

    await request(app.getHttpServer())
      .get('/api/pedidos')
      .set('Authorization', signToken(['catalogo:ver']))
      .expect(403);

    await request(app.getHttpServer())
      .get('/api/pedidos')
      .set('Authorization', signToken(['ventas:ver']))
      .expect(200);
  });
});
