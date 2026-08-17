import { INestApplication, ValidationPipe } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
const cookieParser = require('cookie-parser');
const request = require('supertest');
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/common/prisma/prisma.service';
import { getJwtSecret } from '../src/modules/iam/auth/jwt.config';

describe('Ventas authorization boundary (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let userId: bigint;
  let roleId: bigint;
  let insufficientPermissionToken: string;
  const suffix = `${Date.now()}-${process.pid}`;

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

    const role = await prisma.rol.create({
      data: { nombre: `Ventas auth ${suffix}`, activo: true },
    });
    roleId = role.id;

    const user = await prisma.usuario.create({
      data: {
        rol_id: role.id,
        nombres: 'Ventas',
        apellidos: 'Authorization',
        email: `ventas-auth-${suffix}@example.test`,
        password_hash: 'not-used-by-test',
        activo: true,
      },
    });
    userId = user.id;

    insufficientPermissionToken = app.get(JwtService).sign(
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
      if (userId) await prisma.usuario.delete({ where: { id: userId } });
      if (roleId) await prisma.rol.delete({ where: { id: roleId } });
      await prisma.$disconnect();
    }
    if (app) await app.close();
  });

  it('rejects unauthenticated access to the sales list', async () => {
    await request(app.getHttpServer()).get('/api/ventas').expect(401);
  });

  it('rejects authenticated users without ventas:ver', async () => {
    await request(app.getHttpServer())
      .get('/api/ventas')
      .set('Authorization', `Bearer ${insufficientPermissionToken}`)
      .expect(403);
  });
});
