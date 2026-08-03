import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
const request = require('supertest');
import { AppModule } from './../src/app.module';
import { PrismaService } from './../src/common/prisma/prisma.service';


(BigInt.prototype as any).toJSON = function () {
  return Number(this);
};

describe('Catalogo (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

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
  });

  afterAll(async () => {
    await prisma.variante.deleteMany();
    await prisma.productoImagen.deleteMany();
    await prisma.producto.deleteMany();
    await prisma.categoria.deleteMany();
    await prisma.marca.deleteMany();
    await prisma.$disconnect();
    await app.close();
  });

  describe('Marcas', () => {
    it('/api/marcas (POST) - Falla al crear Marca con slug duplicado', async () => {
      const marcaDto = {
        nombre: 'Marca E2E',
        slug: 'marca-e2e',
      };
      await request(app.getHttpServer())
        .post('/api/marcas')
        .send(marcaDto)
        .expect(201);
      
      await request(app.getHttpServer())
        .post('/api/marcas')
        .send(marcaDto)
        .expect(400); 
    });
  });

  describe('Categorias', () => {
    it('/api/categorias (POST) - Falla al asignar categoria_padre_id circular a Categoria', async () => {
      const rootRes = await request(app.getHttpServer())
        .post('/api/categorias')
        .send({ nombre: 'Root Cat', slug: 'root-cat' })
        .expect(201);

      const rootId = rootRes.body.id;

      await request(app.getHttpServer())
        .post('/api/categorias')
        .send({ nombre: 'Child Cat', slug: 'child-cat', categoria_padre_id: rootId })
        .expect(201);

      await request(app.getHttpServer())
        .patch(`/api/categorias/${rootId}`)
        .send({ categoria_padre_id: rootId })
        .expect(400);
    });
  });

  describe('Productos', () => {
    it('/api/productos (POST) - Falla al crear Producto si precio_promocional >= precio_base', async () => {
      const catRes = await request(app.getHttpServer())
        .post('/api/categorias')
        .send({ nombre: 'Cat Prod', slug: 'cat-prod' })
        .expect(201);

      const marcaRes = await request(app.getHttpServer())
        .post('/api/marcas')
        .send({ nombre: 'Marca Prod', slug: 'marca-prod' })
        .expect(201);

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
        .send(productoDto)
        .expect(400);
    });
  });

  describe('Variantes', () => {
    it('/api/variantes (POST) - Falla al crear Variante con multiplicador 0', async () => {
       const catRes = await request(app.getHttpServer())
        .post('/api/categorias')
        .send({ nombre: 'Cat Pres', slug: 'cat-pres' })
        .expect(201);

      const prodRes = await request(app.getHttpServer())
        .post('/api/productos')
        .send({
          categoria_id: catRes.body.id,
          sku: 'SKU-PROD-PRES',
          nombre: 'Producto Pres',
          unidad_medida: 'UNIDAD',
          precio_base: 100,
        })
        .expect(201);

      const varianteDto = {
        producto_id: prodRes.body.id,
        nombre: 'Caja x0',
        sku: 'SKU-CAJA-0',
        multiplicador_unidades: 0,
        precio: 90,
      };

      await request(app.getHttpServer())
        .post('/api/variantes')
        .send(varianteDto)
        .expect(400);
    });
  });

});
