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
        permisos: ['catalogo:gestionar'],
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
});
