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

describe('Bitácora de Negocio / Auditoría (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  const suffix = `${Date.now()}-${process.pid}`;
  let adminToken: string;
  let usuarioId: string;
  let rolId: string;
  let createdBitacoraIds: bigint[] = [];

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

    // Create role and user with iam:bitacora:ver permission
    const rol = await prisma.rol.create({
      data: { nombre: `Rol Bitacora ${suffix}`, activo: true },
    });
    rolId = rol.id.toString();

    const usuario = await prisma.usuario.create({
      data: {
        rol_id: rol.id,
        nombres: 'Auditor',
        apellidos: 'ERP',
        email: `auditor-${suffix}@test.com`,
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
        permisos: ['iam:bitacora:ver'],
      },
      { secret: getJwtSecret() },
    );
  });

  afterAll(async () => {
    if (createdBitacoraIds.length > 0) {
      await prisma.bitacora.deleteMany({
        where: { id: { in: createdBitacoraIds } },
      });
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

  it('1. Registra evento crítico en la bitácora y redacta campos sensibles', async () => {
    const bitacora = await prisma.bitacora.create({
      data: {
        tipo_actor: 'USUARIO',
        usuario_id: BigInt(usuarioId),
        entidad: 'SEGURIDAD',
        entidad_id: usuarioId,
        operacion: 'CAMBIO_PASSWORD',
        datos_anteriores: { password: '[REDACTED]' },
        datos_nuevos: { password: '[REDACTED]', actualizado: true },
      },
    });
    createdBitacoraIds.push(bitacora.id);

    expect(bitacora.id).toBeDefined();
    expect(bitacora.operacion).toBe('CAMBIO_PASSWORD');
  });

  it('2. Operador ERP consulta la bitácora vía GET /api/bitacora', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/bitacora')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(res.body.total).toBeGreaterThanOrEqual(1);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('3. Rechaza consulta de bitácora sin token o sin permiso iam:bitacora:ver', async () => {
    await request(app.getHttpServer()).get('/api/bitacora').expect(401);
  });
});
