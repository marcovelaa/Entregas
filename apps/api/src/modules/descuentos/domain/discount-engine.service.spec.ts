import { DiscountEngineService } from './discount-engine.service';
import type {
  IDescuentoRepository,
  ReglaDescuentoVigente,
} from './repositories/descuento.repository.interface';

function createMockRepo(): jest.Mocked<IDescuentoRepository> {
  return {
    buscarReglasVigentes: jest.fn(),
    contarUsosPorCliente: jest.fn().mockResolvedValue(0),
    buscarDescuentoPorCupon: jest.fn().mockResolvedValue(null),
  };
}

function reglaBase(
  overrides: Partial<ReglaDescuentoVigente> = {},
): ReglaDescuentoVigente {
  return {
    id: '0',
    nombre: 'Descuento de prueba',
    codigo_cupon: null,
    tipo: 'MONTO_FIJO',
    alcance: 'GLOBAL',
    canal: 'TODOS',
    valor: 10,
    max_monto_descuento: null,
    cantidad_requerida: 1,
    cantidad_paga: 1,
    monto_minimo_compra: null,
    limite_usos: null,
    limite_usos_por_cliente: null,
    usos_actuales: 0,
    prioridad: 0,
    dias_semana: [],
    hora_inicio: null,
    hora_fin: null,
    productos: [],
    variantes: [],
    empaques: [],
    categorias: [],
    ...overrides,
  };
}

describe('DiscountEngineService - Item-Level & Strategy Verification', () => {
  let service: DiscountEngineService;
  let repo: jest.Mocked<IDescuentoRepository>;

  beforeEach(() => {
    repo = createMockRepo();
    service = new DiscountEngineService(repo);
  });

  it('calculates MONTO_FIJO_POR_UNIDAD correctly (2 books of 100 with 10 discount -> 180 total)', async () => {
    repo.buscarReglasVigentes.mockResolvedValue([
      reglaBase({
        id: '1',
        nombre: '10 Bs OFF por Libro',
        tipo: 'MONTO_FIJO_POR_UNIDAD',
        valor: 10,
        alcance: 'PRODUCTO',
        productos: [{ producto_id: '101' }],
      }),
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
    repo.buscarReglasVigentes.mockResolvedValue([
      reglaBase({
        id: '2',
        nombre: '10 Bs OFF por Unidad',
        tipo: 'MONTO_FIJO_POR_UNIDAD',
        valor: 10,
      }),
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
    repo.buscarReglasVigentes.mockResolvedValue([
      reglaBase({
        id: '3',
        nombre: '10 Bs OFF por Libro con Tope 50 Bs',
        tipo: 'MONTO_FIJO_POR_UNIDAD',
        valor: 10,
        max_monto_descuento: 50,
      }),
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
    repo.buscarReglasVigentes.mockResolvedValue([
      reglaBase({
        id: '4',
        nombre: '2x1 en Librería',
        tipo: 'LLEVA_X_PAGA_Y',
        cantidad_requerida: 2,
        cantidad_paga: 1,
        valor: 0,
      }),
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
    repo.buscarReglasVigentes.mockResolvedValue([
      reglaBase({
        id: '5',
        nombre: '2x1 en Librería',
        tipo: 'LLEVA_X_PAGA_Y',
        cantidad_requerida: 2,
        cantidad_paga: 1,
        valor: 0,
      }),
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
    repo.buscarReglasVigentes.mockResolvedValue([
      reglaBase({
        id: '6',
        nombre: 'Combo Escolar Mochila + Cuaderno (30 Bs OFF)',
        tipo: 'COMBO',
        valor: 30,
        alcance: 'PRODUCTO',
        productos: [{ producto_id: '100' }, { producto_id: '200' }],
      }),
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

describe('DiscountEngineService - evaluateWithReason', () => {
  let service: DiscountEngineService;
  let repo: jest.Mocked<IDescuentoRepository>;

  beforeEach(() => {
    repo = createMockRepo();
    service = new DiscountEngineService(repo);
  });

  it('returns the discount with no rejection when one applies', async () => {
    repo.buscarReglasVigentes.mockResolvedValue([
      reglaBase({ id: '1', valor: 10 }),
    ]);

    const evaluacion = await service.evaluateWithReason({
      items: [{ productoId: '100', cantidad: 1, precioUnitario: 100 }],
    });

    expect(evaluacion.discount).not.toBeNull();
    expect(evaluacion.rejectionReason).toBeUndefined();
  });

  it('reports SIN_ITEMS_ELEGIBLES when no active rule targets the cart contents', async () => {
    repo.buscarReglasVigentes.mockResolvedValue([
      reglaBase({
        id: '1',
        alcance: 'PRODUCTO',
        productos: [{ producto_id: '999' }],
      }),
    ]);

    const evaluacion = await service.evaluateWithReason({
      items: [{ productoId: '100', cantidad: 1, precioUnitario: 100 }],
    });

    expect(evaluacion.discount).toBeNull();
    expect(evaluacion.rejectionReason).toBe('SIN_ITEMS_ELEGIBLES');
  });

  it('reports MONTO_MINIMO_NO_ALCANZADO over a scope mismatch from another rule', async () => {
    repo.buscarReglasVigentes.mockResolvedValue([
      reglaBase({ id: '1', monto_minimo_compra: 500 }),
      reglaBase({
        id: '2',
        alcance: 'PRODUCTO',
        productos: [{ producto_id: '999' }],
      }),
    ]);

    const evaluacion = await service.evaluateWithReason({
      items: [{ productoId: '100', cantidad: 1, precioUnitario: 100 }],
    });

    expect(evaluacion.discount).toBeNull();
    expect(evaluacion.rejectionReason).toBe('MONTO_MINIMO_NO_ALCANZADO');
  });

  it('reports CANAL_NO_VALIDO when the only rule targets a different channel', async () => {
    repo.buscarReglasVigentes.mockResolvedValue([
      reglaBase({ id: '1', canal: 'ECOMMERCE' }),
    ]);

    const evaluacion = await service.evaluateWithReason({
      canal: 'POS',
      items: [{ productoId: '100', cantidad: 1, precioUnitario: 100 }],
    });

    expect(evaluacion.discount).toBeNull();
    expect(evaluacion.rejectionReason).toBe('CANAL_NO_VALIDO');
  });

  it('reports SIN_PROMOCIONES_ACTIVAS when nothing is configured and no coupon was given', async () => {
    repo.buscarReglasVigentes.mockResolvedValue([]);

    const evaluacion = await service.evaluateWithReason({
      items: [{ productoId: '100', cantidad: 1, precioUnitario: 100 }],
    });

    expect(evaluacion.discount).toBeNull();
    expect(evaluacion.rejectionReason).toBe('SIN_PROMOCIONES_ACTIVAS');
  });

  it('reports CUPON_NO_ENCONTRADO when the code does not exist at all', async () => {
    repo.buscarReglasVigentes.mockResolvedValue([]);
    repo.buscarDescuentoPorCupon.mockResolvedValue(null);

    const evaluacion = await service.evaluateWithReason({
      cupon: 'NOPE',
      items: [{ productoId: '100', cantidad: 1, precioUnitario: 100 }],
    });

    expect(evaluacion.discount).toBeNull();
    expect(evaluacion.rejectionReason).toBe('CUPON_NO_ENCONTRADO');
  });

  it('reports CUPON_INACTIVO when the coupon exists but is disabled', async () => {
    repo.buscarReglasVigentes.mockResolvedValue([]);
    repo.buscarDescuentoPorCupon.mockResolvedValue({
      activo: false,
      fecha_inicio: new Date(2000, 0, 1),
      fecha_fin: new Date(2999, 0, 1),
      dias_semana: [],
    });

    const evaluacion = await service.evaluateWithReason({
      cupon: 'OFF10',
      items: [{ productoId: '100', cantidad: 1, precioUnitario: 100 }],
    });

    expect(evaluacion.discount).toBeNull();
    expect(evaluacion.rejectionReason).toBe('CUPON_INACTIVO');
  });

  it('reports CUPON_FUERA_DE_VIGENCIA when the coupon dates do not cover today', async () => {
    repo.buscarReglasVigentes.mockResolvedValue([]);
    repo.buscarDescuentoPorCupon.mockResolvedValue({
      activo: true,
      fecha_inicio: new Date(2000, 0, 1),
      fecha_fin: new Date(2000, 0, 31),
      dias_semana: [],
    });

    const evaluacion = await service.evaluateWithReason({
      cupon: 'OLD10',
      items: [{ productoId: '100', cantidad: 1, precioUnitario: 100 }],
    });

    expect(evaluacion.discount).toBeNull();
    expect(evaluacion.rejectionReason).toBe('CUPON_FUERA_DE_VIGENCIA');
  });

  it('reports CUPON_DIA_NO_HABILITADO when the coupon excludes the current weekday', async () => {
    repo.buscarReglasVigentes.mockResolvedValue([]);
    const notToday = (new Date().getDay() + 1) % 7;
    repo.buscarDescuentoPorCupon.mockResolvedValue({
      activo: true,
      fecha_inicio: new Date(2000, 0, 1),
      fecha_fin: new Date(2999, 0, 1),
      dias_semana: [notToday],
    });

    const evaluacion = await service.evaluateWithReason({
      cupon: 'WEEKEND',
      items: [{ productoId: '100', cantidad: 1, precioUnitario: 100 }],
    });

    expect(evaluacion.discount).toBeNull();
    expect(evaluacion.rejectionReason).toBe('CUPON_DIA_NO_HABILITADO');
  });
});

describe('DiscountEngineService - Day-of-Week Gate', () => {
  let service: DiscountEngineService;
  let repo: jest.Mocked<IDescuentoRepository>;
  const MONDAY = new Date(2026, 7, 3, 15, 0, 0);

  const dayRow = (overrides: Partial<ReglaDescuentoVigente> = {}) =>
    reglaBase({
      id: '10',
      nombre: 'Descuento con restricción semanal',
      tipo: 'MONTO_FIJO',
      valor: 10,
      limite_usos_por_cliente: 5,
      ...overrides,
    });

  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(MONDAY);
    repo = createMockRepo();
    service = new DiscountEngineService(repo);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('applies on any day when dias_semana is [] (REQ-DIA-01 S1.1)', async () => {
    repo.buscarReglasVigentes.mockResolvedValue([dayRow({ dias_semana: [] })]);

    const result = await service.evaluate({
      clienteId: '1',
      items: [{ productoId: '100', cantidad: 1, precioUnitario: 100 }],
    });

    expect(result).not.toBeNull();
    expect(result?.montoDescontado).toBe(10);
  });

  it('applies when dias_semana is absent on legacy rows without crashing (REQ-DIA-01 S1.2)', async () => {
    repo.buscarReglasVigentes.mockResolvedValue([dayRow()]);

    const result = await service.evaluate({
      clienteId: '1',
      items: [{ productoId: '100', cantidad: 1, precioUnitario: 100 }],
    });

    expect(result).not.toBeNull();
    expect(result?.montoDescontado).toBe(10);
  });

  it('passes now + codigoCupon to the repository so day/date filtering happens at the data layer (REQ-DIA-03)', async () => {
    repo.buscarReglasVigentes.mockResolvedValue([dayRow({ dias_semana: [1] })]);

    await service.evaluate({
      cupon: 'promo10',
      clienteId: '1',
      items: [{ productoId: '100', cantidad: 1, precioUnitario: 100 }],
    });

    expect(repo.buscarReglasVigentes).toHaveBeenCalledWith({
      now: MONDAY,
      codigoCupon: 'promo10',
    });
  });

  it('does NOT issue a usage-count query when the day filter yields no candidates (REQ-DIA-03)', async () => {
    repo.buscarReglasVigentes.mockResolvedValue([]);

    const result = await service.evaluate({
      clienteId: '1',
      items: [{ productoId: '100', cantidad: 1, precioUnitario: 100 }],
    });

    expect(result).toBeNull();
    expect(repo.contarUsosPorCliente).not.toHaveBeenCalled();
  });

  it('applies a Monday-only discount on Monday (REQ-DIA-02 S2.1)', async () => {
    repo.buscarReglasVigentes.mockResolvedValue([
      dayRow({ dias_semana: [MONDAY.getDay()] }),
    ]);

    const result = await service.evaluate({
      clienteId: '1',
      items: [{ productoId: '100', cantidad: 1, precioUnitario: 100 }],
    });

    expect(result).not.toBeNull();
    expect(result?.montoDescontado).toBe(10);
  });

  it('rejects a discount for another weekday before any usage query (REQ-DIA-02 S2.2)', async () => {
    repo.buscarReglasVigentes.mockResolvedValue([dayRow({ dias_semana: [2] })]);

    const result = await service.evaluate({
      clienteId: '1',
      items: [{ productoId: '100', cantidad: 1, precioUnitario: 100 }],
    });

    expect(result).toBeNull();
    expect(repo.contarUsosPorCliente).not.toHaveBeenCalled();
  });
});

describe('DiscountEngineService - Time-of-Day Gate', () => {
  let service: DiscountEngineService;
  let repo: jest.Mocked<IDescuentoRepository>;
  const MONDAY = new Date(2026, 7, 3, 15, 0, 0);
  const WEDNESDAY = new Date(2026, 7, 5, 15, 0, 0);
  const TUESDAY = new Date(2026, 7, 4, 15, 0, 0);

  const timeRow = (overrides: Partial<ReglaDescuentoVigente> = {}) =>
    reglaBase({
      id: '20',
      nombre: 'Descuento con ventana horaria',
      tipo: 'MONTO_FIJO',
      valor: 10,
      limite_usos_por_cliente: 5,
      ...overrides,
    });

  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(MONDAY);
    repo = createMockRepo();
    service = new DiscountEngineService(repo);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('applies within the inclusive [14:00, 18:00] window (REQ-DIA-04)', async () => {
    repo.buscarReglasVigentes.mockResolvedValue([
      timeRow({ hora_inicio: '14:00', hora_fin: '18:00' }),
    ]);

    jest.setSystemTime(new Date(2026, 7, 3, 14, 0, 0));
    expect(
      (
        await service.evaluate({
          items: [{ productoId: '100', cantidad: 1, precioUnitario: 100 }],
        })
      )?.montoDescontado,
    ).toBe(10);

    jest.setSystemTime(new Date(2026, 7, 3, 18, 0, 0));
    expect(
      (
        await service.evaluate({
          items: [{ productoId: '100', cantidad: 1, precioUnitario: 100 }],
        })
      )?.montoDescontado,
    ).toBe(10);

    jest.setSystemTime(new Date(2026, 7, 3, 13, 59, 0));
    expect(
      await service.evaluate({
        items: [{ productoId: '100', cantidad: 1, precioUnitario: 100 }],
      }),
    ).toBeNull();

    jest.setSystemTime(new Date(2026, 7, 3, 18, 1, 0));
    expect(
      await service.evaluate({
        items: [{ productoId: '100', cantidad: 1, precioUnitario: 100 }],
      }),
    ).toBeNull();
  });

  it('applies a time-only window on any weekday (REQ-DIA-05)', async () => {
    repo.buscarReglasVigentes.mockResolvedValue([
      timeRow({ dias_semana: [], hora_inicio: '14:00', hora_fin: '18:00' }),
    ]);

    jest.setSystemTime(WEDNESDAY);
    const result = await service.evaluate({
      items: [{ productoId: '100', cantidad: 1, precioUnitario: 100 }],
    });

    expect(result).not.toBeNull();
    expect(result?.montoDescontado).toBe(10);
  });

  it('applies only when day AND time window both match (REQ-DIA-06)', async () => {
    repo.buscarReglasVigentes.mockResolvedValue([
      timeRow({ dias_semana: [1], hora_inicio: '14:00', hora_fin: '18:00' }),
    ]);

    jest.setSystemTime(MONDAY);
    expect(
      (
        await service.evaluate({
          items: [{ productoId: '100', cantidad: 1, precioUnitario: 100 }],
        })
      )?.montoDescontado,
    ).toBe(10);

    jest.setSystemTime(TUESDAY);
    expect(
      await service.evaluate({
        items: [{ productoId: '100', cantidad: 1, precioUnitario: 100 }],
      }),
    ).toBeNull();

    jest.setSystemTime(new Date(2026, 7, 3, 19, 0, 0));
    expect(
      await service.evaluate({
        items: [{ productoId: '100', cantidad: 1, precioUnitario: 100 }],
      }),
    ).toBeNull();
  });

  it('treats a lone hora_inicio bound as no time restriction (both-bounds rule)', async () => {
    repo.buscarReglasVigentes.mockResolvedValue([
      timeRow({ hora_inicio: '09:00' }),
    ]);

    jest.setSystemTime(new Date(2026, 7, 3, 9, 0, 0));
    const result = await service.evaluate({
      items: [{ productoId: '100', cantidad: 1, precioUnitario: 100 }],
    });

    expect(result).not.toBeNull();
    expect(result?.montoDescontado).toBe(10);
  });

  it('gates COMBO-typed discounts in the same loop (REQ-DIA-09)', async () => {
    repo.buscarReglasVigentes.mockResolvedValue([
      timeRow({
        id: '21',
        nombre: 'Combo con restricción semanal',
        tipo: 'COMBO',
        valor: 30,
        cantidad_requerida: 2,
        dias_semana: [1],
      }),
    ]);

    jest.setSystemTime(MONDAY);
    const resultMonday = await service.evaluate({
      items: [{ productoId: '100', cantidad: 2, precioUnitario: 100 }],
    });
    expect(resultMonday).not.toBeNull();
    expect(resultMonday?.montoDescontado).toBe(30);

    jest.setSystemTime(TUESDAY);
    expect(
      await service.evaluate({
        items: [{ productoId: '100', cantidad: 2, precioUnitario: 100 }],
      }),
    ).toBeNull();
  });
});
