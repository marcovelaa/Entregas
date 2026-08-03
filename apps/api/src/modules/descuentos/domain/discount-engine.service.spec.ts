import { DiscountEngineService } from './discount-engine.service';
import { PrismaService } from '../../../common/prisma/prisma.service';

describe('DiscountEngineService - Item-Level & Strategy Verification', () => {
  let service: DiscountEngineService;
  let mockPrisma: any;

  beforeEach(() => {
    mockPrisma = {
      descuento: {
        findMany: jest.fn(),
      },
      descuentoUso: {
        count: jest.fn().mockResolvedValue(0),
      },
    };
    service = new DiscountEngineService(mockPrisma as PrismaService);
  });

  it('calculates MONTO_FIJO_POR_UNIDAD correctly (2 books of 100 with 10 discount -> 180 total)', async () => {
    mockPrisma.descuento.findMany.mockResolvedValue([
      {
        id: BigInt(1),
        nombre: '10 Bs OFF por Libro',
        codigo_cupon: null,
        tipo: 'MONTO_FIJO_POR_UNIDAD',
        valor: 10,
        max_monto_descuento: null,
        alcance: 'PRODUCTO',
        canal: 'TODOS',
        limite_usos: null,
        limite_usos_por_cliente: null,
        monto_minimo_compra: null,
        productos: [{ producto_id: BigInt(101) }],
        variantes: [],
        empaques: [],
        categorias: [],
      },
    ]);

    const result = await service.evaluate({
      items: [
        {
          productoId: '101',
          cantidad: 2,
          precioUnitario: 100,
        },
      ],
    });

    expect(result).not.toBeNull();
    expect(result?.montoDescontado).toBe(20);
    expect(result?.totalOriginal).toBe(200);
    expect(result?.totalFinal).toBe(180);
    expect(result?.itemsElegiblesCount).toBe(2);
  });

  it('bounds unit discount so it does not exceed unit price', async () => {
    mockPrisma.descuento.findMany.mockResolvedValue([
      {
        id: BigInt(2),
        nombre: '10 Bs OFF por Unidad',
        codigo_cupon: null,
        tipo: 'MONTO_FIJO_POR_UNIDAD',
        valor: 10,
        max_monto_descuento: null,
        alcance: 'GLOBAL',
        canal: 'TODOS',
        limite_usos: null,
        limite_usos_por_cliente: null,
        monto_minimo_compra: null,
        productos: [],
        variantes: [],
        empaques: [],
        categorias: [],
      },
    ]);

    const result = await service.evaluate({
      items: [
        {
          productoId: '102',
          cantidad: 1,
          precioUnitario: 8,
        },
      ],
    });

    expect(result).not.toBeNull();
    expect(result?.montoDescontado).toBe(8);
    expect(result?.totalFinal).toBe(0);
  });

  it('respects max_monto_descuento cap on per-unit discounts', async () => {
    mockPrisma.descuento.findMany.mockResolvedValue([
      {
        id: BigInt(3),
        nombre: '10 Bs OFF por Libro con Tope 50 Bs',
        codigo_cupon: null,
        tipo: 'MONTO_FIJO_POR_UNIDAD',
        valor: 10,
        max_monto_descuento: 50,
        alcance: 'GLOBAL',
        canal: 'TODOS',
        limite_usos: null,
        limite_usos_por_cliente: null,
        monto_minimo_compra: null,
        productos: [],
        variantes: [],
        empaques: [],
        categorias: [],
      },
    ]);

    const result = await service.evaluate({
      items: [
        {
          productoId: '101',
          cantidad: 10,
          precioUnitario: 100,
        },
      ],
    });

    expect(result).not.toBeNull();
    expect(result?.montoDescontado).toBe(50);
    expect(result?.totalOriginal).toBe(1000);
    expect(result?.totalFinal).toBe(950);
  });

  it('calculates 2x1 (LLEVA_X_PAGA_Y) independently per product: 2 notebooks (25 ea) + 2 pens (18 ea) = 43 Bs savings', async () => {
    mockPrisma.descuento.findMany.mockResolvedValue([
      {
        id: BigInt(4),
        nombre: '2x1 en Librería',
        codigo_cupon: null,
        tipo: 'LLEVA_X_PAGA_Y',
        cantidad_requerida: 2,
        cantidad_paga: 1,
        valor: 0,
        max_monto_descuento: null,
        alcance: 'GLOBAL',
        canal: 'TODOS',
        limite_usos: null,
        limite_usos_por_cliente: null,
        monto_minimo_compra: null,
        productos: [],
        variantes: [],
        empaques: [],
        categorias: [],
      },
    ]);

    const result = await service.evaluate({
      items: [
        {
          productoId: '10', // Cuaderno
          cantidad: 2,
          precioUnitario: 25,
        },
        {
          productoId: '20', // Bolígrafo
          cantidad: 2,
          precioUnitario: 18,
        },
      ],
    });

    expect(result).not.toBeNull();
    // 1 notebook free (25) + 1 pen free (18) = 43 Bs
    expect(result?.montoDescontado).toBe(43);
    expect(result?.totalOriginal).toBe(86);
    expect(result?.totalFinal).toBe(43);
  });

  it('does NOT apply 2x1 (LLEVA_X_PAGA_Y) when buying 1 notebook and 1 pen (each below required 2 units)', async () => {
    mockPrisma.descuento.findMany.mockResolvedValue([
      {
        id: BigInt(5),
        nombre: '2x1 en Librería',
        codigo_cupon: null,
        tipo: 'LLEVA_X_PAGA_Y',
        cantidad_requerida: 2,
        cantidad_paga: 1,
        valor: 0,
        max_monto_descuento: null,
        alcance: 'GLOBAL',
        canal: 'TODOS',
        limite_usos: null,
        limite_usos_por_cliente: null,
        monto_minimo_compra: null,
        productos: [],
        variantes: [],
        empaques: [],
        categorias: [],
      },
    ]);

    const result = await service.evaluate({
      items: [
        {
          productoId: '10',
          cantidad: 1,
          precioUnitario: 25,
        },
        {
          productoId: '20',
          cantidad: 1,
          precioUnitario: 18,
        },
      ],
    });

    // Should not apply discount because neither reached 2 units
    expect(result).toBeNull();
  });

  it('evaluates COMBO bundle requiring all target products to be present in cart', async () => {
    mockPrisma.descuento.findMany.mockResolvedValue([
      {
        id: BigInt(6),
        nombre: 'Combo Escolar Mochila + Cuaderno (30 Bs OFF)',
        codigo_cupon: null,
        tipo: 'COMBO',
        valor: 30,
        max_monto_descuento: null,
        alcance: 'PRODUCTO',
        canal: 'TODOS',
        limite_usos: null,
        limite_usos_por_cliente: null,
        monto_minimo_compra: null,
        productos: [{ producto_id: BigInt(100) }, { producto_id: BigInt(200) }],
        variantes: [],
        empaques: [],
        categorias: [],
      },
    ]);

    // Scenario A: Cart has both items
    const resultComplete = await service.evaluate({
      items: [
        { productoId: '100', cantidad: 1, precioUnitario: 120 },
        { productoId: '200', cantidad: 1, precioUnitario: 25 },
      ],
    });

    expect(resultComplete).not.toBeNull();
    expect(resultComplete?.montoDescontado).toBe(30);
    expect(resultComplete?.totalOriginal).toBe(145);
    expect(resultComplete?.totalFinal).toBe(115);

    // Scenario B: Cart has only 1 of the 2 required items
    const resultIncomplete = await service.evaluate({
      items: [{ productoId: '100', cantidad: 1, precioUnitario: 120 }],
    });

    expect(resultIncomplete).toBeNull();
  });
});
