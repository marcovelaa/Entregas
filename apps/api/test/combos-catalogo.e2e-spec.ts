import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
const request = require('supertest');
const cookieParser = require('cookie-parser');
import { AppModule } from './../src/app.module';
import { PrismaService } from './../src/common/prisma/prisma.service';
import { computeStockBom } from './../src/modules/catalogo/domain/combo-stock';

(BigInt.prototype as any).toJSON = function () {
  return Number(this);
};

describe('Combos y Catálogo Pendientes (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  const suffix = `${Date.now()}-${process.pid}`;
  let categoriaId: bigint;
  let prodAId: bigint;
  let prodBId: bigint;
  let comboId: bigint;

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

    // 1. Create Category
    const cat = await prisma.categoria.create({
      data: {
        nombre: `Cat Combo ${suffix}`,
        slug: `cat-combo-${suffix}`,
      },
    });
    categoriaId = cat.id;

    // 2. Create Component Products & Inventory
    const prodA = await prisma.producto.create({
      data: {
        categoria_id: categoriaId,
        nombre: `Componente A ${suffix}`,
        sku: `SKU-A-${suffix}`,
        precio_base: 20.0,
        activo: true,
      },
    });
    prodAId = prodA.id;

    await prisma.inventario.create({
      data: {
        producto_id: prodAId,
        cantidad_disponible: 10,
        reservado: 0,
      },
    });

    const prodB = await prisma.producto.create({
      data: {
        categoria_id: categoriaId,
        nombre: `Componente B ${suffix}`,
        sku: `SKU-B-${suffix}`,
        precio_base: 30.0,
        activo: true,
      },
    });
    prodBId = prodB.id;

    await prisma.inventario.create({
      data: {
        producto_id: prodBId,
        cantidad_disponible: 3,
        reservado: 0,
      },
    });

    // 3. Create COMBO Product (requires 2 units of A and 1 unit of B)
    const combo = await prisma.producto.create({
      data: {
        categoria_id: categoriaId,
        nombre: `Super Combo Pack ${suffix}`,
        sku: `SKU-COMBO-${suffix}`,
        precio_base: 60.0,
        tipo_producto: 'COMBO',
        activo: true,
        componentes_combo: {
          create: [
            {
              componente_prod_id: prodAId,
              cantidad: 2,
            },
            {
              componente_prod_id: prodBId,
              cantidad: 1,
            },
          ],
        },
      },
    });
    comboId = combo.id;
  });

  afterAll(async () => {
    if (comboId) {
      await prisma.productoComponente.deleteMany({
        where: { combo_producto_id: comboId },
      });
      await prisma.producto.delete({ where: { id: comboId } });
    }
    if (prodAId) {
      await prisma.inventario.deleteMany({ where: { producto_id: prodAId } });
      await prisma.producto.delete({ where: { id: prodAId } });
    }
    if (prodBId) {
      await prisma.inventario.deleteMany({ where: { producto_id: prodBId } });
      await prisma.producto.delete({ where: { id: prodBId } });
    }
    if (categoriaId) {
      await prisma.categoria.delete({ where: { id: categoriaId } });
    }

    await prisma.$disconnect();
    await app.close();
  });

  it('1. Calcula el stock virtual del combo basado en BOM (10/2 y 3/1 -> 3 combos vendibles)', () => {
    const stockBom = computeStockBom([
      { cantidad: 2, stockDisponible: 10 },
      { cantidad: 1, stockDisponible: 3 },
    ]);
    expect(stockBom).toBe(3);
  });

  it('2. Retorna el producto combo con stock_vendible calculado dinámicamente vía API', async () => {
    const res = await request(app.getHttpServer())
      .get(`/api/productos/${comboId}`)
      .expect(200);

    expect(res.body.id.toString()).toBe(comboId.toString());
    expect(res.body.tipo_producto).toBe('COMBO');
    expect(res.body.stock_vendible).toBe(3);
    expect(res.body.estado_venta).toBe('ACTIVO');
  });

  it('3. Lista productos de la tienda pública calculando stock virtual de combos', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/productos?visibilidad=publica&limit=100')
      .expect(200);

    const comboEncontrado = res.body.data.find(
      (p: any) => p.id.toString() === comboId.toString(),
    );
    expect(comboEncontrado).toBeDefined();
    expect(comboEncontrado.stock_vendible).toBe(3);
  });
});
