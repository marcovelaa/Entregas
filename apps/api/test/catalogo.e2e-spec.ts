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

describe('Catalogo (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let authHeader: string;
  let testUsuarioId: number;
  let testRolId: number;
  const createdProductoIds: number[] = [];
  const createdCategoriaIds: number[] = [];
  const createdMarcaIds: number[] = [];
  const suffix = `${Date.now()}-${process.pid}`;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
      }),
    );
    prisma = app.get(PrismaService);
    await app.init();

    const rol = await prisma.rol.create({
      data: { nombre: `Catalogo E2E ${suffix}` },
    });
    testRolId = Number(rol.id);
    const usuario = await prisma.usuario.create({
      data: {
        rol_id: rol.id,
        nombres: 'Catalogo',
        apellidos: 'E2E',
        email: `catalogo-e2e-${suffix}@example.test`,
        password_hash: 'not-used-by-test',
      },
    });
    testUsuarioId = Number(usuario.id);

    const jwtService = app.get(JwtService);
    const token = jwtService.sign(
      {
        sub: usuario.id.toString(),
        email: usuario.email,
        rolId: rol.id.toString(),
        rolNombre: rol.nombre,
        permisos: ['catalogo:crear', 'catalogo:editar', 'catalogo:eliminar'],
      },
      { secret: getJwtSecret(), expiresIn: '8h' },
    );
    authHeader = `Bearer ${token}`;
  });

  afterAll(async () => {
    // Only deletes rows this suite itself created, by id — this runs against
    // the shared dev database, not a disposable test database.
    await prisma.producto.deleteMany({
      where: { id: { in: createdProductoIds.map(BigInt) } },
    });
    await prisma.categoria.deleteMany({
      where: { id: { in: createdCategoriaIds.map(BigInt) } },
    });
    await prisma.marca.deleteMany({
      where: { id: { in: createdMarcaIds.map(BigInt) } },
    });
    if (testUsuarioId) {
      await prisma.usuario.deleteMany({ where: { id: BigInt(testUsuarioId) } });
    }
    if (testRolId) {
      await prisma.rol.deleteMany({ where: { id: BigInt(testRolId) } });
    }
    await prisma.$disconnect();
    await app.close();
  });

  describe('Marcas', () => {
    it('/api/marcas (POST) - Falla al crear Marca con slug duplicado', async () => {
      const marcaDto = {
        nombre: 'Marca E2E',
        slug: 'marca-e2e',
      };
      const createRes = await request(app.getHttpServer())
        .post('/api/marcas')
        .set('Authorization', authHeader)
        .send(marcaDto)
        .expect(201);
      createdMarcaIds.push(createRes.body.id);

      await request(app.getHttpServer())
        .post('/api/marcas')
        .set('Authorization', authHeader)
        .send(marcaDto)
        .expect(400);
    });
  });

  describe('Categorias', () => {
    it('/api/categorias (POST) - Falla al asignar categoria_padre_id circular a Categoria', async () => {
      const rootRes = await request(app.getHttpServer())
        .post('/api/categorias')
        .set('Authorization', authHeader)
        .send({ nombre: 'Root Cat', slug: 'root-cat' })
        .expect(201);
      createdCategoriaIds.push(rootRes.body.id);

      const rootId = rootRes.body.id;

      const childRes = await request(app.getHttpServer())
        .post('/api/categorias')
        .set('Authorization', authHeader)
        .send({ nombre: 'Child Cat', slug: 'child-cat', categoria_padre_id: rootId })
        .expect(201);
      createdCategoriaIds.push(childRes.body.id);

      await request(app.getHttpServer())
        .patch(`/api/categorias/${rootId}`)
        .set('Authorization', authHeader)
        .send({ categoria_padre_id: rootId })
        .expect(400);
    });
  });

  describe('Productos', () => {
    it('/api/productos (POST) - Falla al crear Producto si precio_promocional >= precio_base', async () => {
      const catRes = await request(app.getHttpServer())
        .post('/api/categorias')
        .set('Authorization', authHeader)
        .send({ nombre: 'Cat Prod', slug: 'cat-prod' })
        .expect(201);
      createdCategoriaIds.push(catRes.body.id);

      const marcaRes = await request(app.getHttpServer())
        .post('/api/marcas')
        .set('Authorization', authHeader)
        .send({ nombre: 'Marca Prod', slug: 'marca-prod' })
        .expect(201);
      createdMarcaIds.push(marcaRes.body.id);

      const productoDto = {
        categoria_id: catRes.body.id,
        marca_id: marcaRes.body.id,
        sku: 'SKU-E2E-1',
        nombre: 'Producto E2E',
        unidad_medida: 'UNIDAD',
        precio_base: 100,
        precio_promocional: 150,
      };

      await request(app.getHttpServer())
        .post('/api/productos')
        .set('Authorization', authHeader)
        .send(productoDto)
        .expect(400);
    });
  });

  describe('Variantes', () => {
    it('/api/variantes (POST) - Falla al crear Variante con multiplicador 0', async () => {
       const catRes = await request(app.getHttpServer())
        .post('/api/categorias')
        .set('Authorization', authHeader)
        .send({ nombre: 'Cat Pres', slug: 'cat-pres' })
        .expect(201);
      createdCategoriaIds.push(catRes.body.id);

      const prodRes = await request(app.getHttpServer())
        .post('/api/productos')
        .set('Authorization', authHeader)
        .send({
          categoria_id: catRes.body.id,
          sku: 'SKU-PROD-PRES',
          nombre: 'Producto Pres',
          unidad_medida: 'UNIDAD',
          precio_base: 100,
        })
        .expect(201);
      createdProductoIds.push(prodRes.body.id);

      const varianteDto = {
        producto_id: prodRes.body.id,
        nombre: 'Caja x0',
        sku: 'SKU-CAJA-0',
        multiplicador_unidades: 0,
        precio: 90,
      };

      await request(app.getHttpServer())
        .post('/api/variantes')
        .set('Authorization', authHeader)
        .send(varianteDto)
        .expect(400);
    });
  });

  describe('RBAC granular (crear/editar/eliminar)', () => {
    const signToken = (permisos: string[]) =>
      `Bearer ${app.get(JwtService).sign(
        {
          sub: testUsuarioId.toString(),
          email: `catalogo-e2e-${suffix}@example.test`,
          rolId: testRolId.toString(),
          rolNombre: `Catalogo E2E ${suffix}`,
          permisos,
        },
        { secret: getJwtSecret(), expiresIn: '8h' },
      )}`;

    it('/api/marcas/:id (PATCH) - 403 con solo catalogo:crear (no editar)', async () => {
      const createRes = await request(app.getHttpServer())
        .post('/api/marcas')
        .set('Authorization', authHeader)
        .send({ nombre: 'Marca RBAC', slug: `marca-rbac-${suffix}` })
        .expect(201);
      createdMarcaIds.push(createRes.body.id);

      await request(app.getHttpServer())
        .patch(`/api/marcas/${createRes.body.id}`)
        .set('Authorization', signToken(['catalogo:crear']))
        .send({ nombre: 'Marca RBAC editada' })
        .expect(403);
    });

    it('/api/marcas/:id (PATCH) - 200 con catalogo:editar (sin catalogo:crear)', async () => {
      const createRes = await request(app.getHttpServer())
        .post('/api/marcas')
        .set('Authorization', authHeader)
        .send({ nombre: 'Marca RBAC 2', slug: `marca-rbac-2-${suffix}` })
        .expect(201);
      createdMarcaIds.push(createRes.body.id);

      await request(app.getHttpServer())
        .patch(`/api/marcas/${createRes.body.id}`)
        .set('Authorization', signToken(['catalogo:editar']))
        .send({ nombre: 'Marca RBAC 2 editada' })
        .expect(200);
    });

    it('/api/marcas/:id (DELETE) - 403 con solo catalogo:crear (no eliminar)', async () => {
      const createRes = await request(app.getHttpServer())
        .post('/api/marcas')
        .set('Authorization', authHeader)
        .send({ nombre: 'Marca RBAC 3', slug: `marca-rbac-3-${suffix}` })
        .expect(201);

      await request(app.getHttpServer())
        .delete(`/api/marcas/${createRes.body.id}`)
        .set('Authorization', signToken(['catalogo:crear']))
        .expect(403);

      createdMarcaIds.push(createRes.body.id);
    });

    it('/api/marcas/:id (DELETE) - 200 con catalogo:eliminar (sin catalogo:crear)', async () => {
      const createRes = await request(app.getHttpServer())
        .post('/api/marcas')
        .set('Authorization', authHeader)
        .send({ nombre: `Marca RBAC 4 ${suffix}`, slug: `marca-rbac-4-${suffix}` })
        .expect(201);
      createdMarcaIds.push(createRes.body.id);

      await request(app.getHttpServer())
        .delete(`/api/marcas/${createRes.body.id}`)
        .set('Authorization', signToken(['catalogo:eliminar']))
        .expect(200);
    });

    it('/api/categorias/:id (PATCH) - 403 con solo catalogo:crear, 200 con catalogo:editar', async () => {
      const createRes = await request(app.getHttpServer())
        .post('/api/categorias')
        .set('Authorization', authHeader)
        .send({ nombre: `Cat RBAC ${suffix}`, slug: `cat-rbac-${suffix}` })
        .expect(201);
      createdCategoriaIds.push(createRes.body.id);

      await request(app.getHttpServer())
        .patch(`/api/categorias/${createRes.body.id}`)
        .set('Authorization', signToken(['catalogo:crear']))
        .send({ nombre: 'Cat RBAC bloqueada' })
        .expect(403);

      await request(app.getHttpServer())
        .patch(`/api/categorias/${createRes.body.id}`)
        .set('Authorization', signToken(['catalogo:editar']))
        .send({ nombre: 'Cat RBAC editada' })
        .expect(200);
    });

    it('/api/productos/:id (PATCH/DELETE) - exige catalogo:editar/eliminar, no catalogo:crear', async () => {
      const catRes = await request(app.getHttpServer())
        .post('/api/categorias')
        .set('Authorization', authHeader)
        .send({ nombre: `Cat Prod RBAC ${suffix}`, slug: `cat-prod-rbac-${suffix}` })
        .expect(201);
      createdCategoriaIds.push(catRes.body.id);

      const prodRes = await request(app.getHttpServer())
        .post('/api/productos')
        .set('Authorization', authHeader)
        .send({
          categoria_id: catRes.body.id,
          sku: `SKU-RBAC-${suffix}`,
          nombre: 'Producto RBAC',
          unidad_medida: 'UNIDAD',
          precio_base: 100,
        })
        .expect(201);
      createdProductoIds.push(prodRes.body.id);

      await request(app.getHttpServer())
        .patch(`/api/productos/${prodRes.body.id}`)
        .set('Authorization', signToken(['catalogo:crear']))
        .send({ nombre: 'Producto RBAC bloqueado' })
        .expect(403);

      await request(app.getHttpServer())
        .patch(`/api/productos/${prodRes.body.id}`)
        .set('Authorization', signToken(['catalogo:editar']))
        .send({ nombre: 'Producto RBAC editado' })
        .expect(200);

      await request(app.getHttpServer())
        .delete(`/api/productos/${prodRes.body.id}`)
        .set('Authorization', signToken(['catalogo:crear']))
        .expect(403);

      // catalogo:eliminar debe pasar el guard de permisos; el 409 posterior es
      // una regla de negocio propia de EliminarProductoUseCase, no de RBAC.
      const eliminarRes = await request(app.getHttpServer())
        .delete(`/api/productos/${prodRes.body.id}`)
        .set('Authorization', signToken(['catalogo:eliminar']));
      expect(eliminarRes.status).not.toBe(403);
    });
  });
});
