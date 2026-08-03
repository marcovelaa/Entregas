import { computeSellable } from './sellable-stock';

const base = {
  tipoProducto: 'COMBO',
  stockBom: 20,
  activo: true,
  modoVenta: 'PERMANENTE',
  cupoUsado: 0,
} as const;

describe('computeSellable', () => {
  it('caps sellable by remaining cupo (STOCK-1: 20/5/1 -> 4)', () => {
    expect(computeSellable({ ...base, cupoMaximo: 5, cupoUsado: 1 })).toEqual({ sellable: 4, estado: 'ACTIVO' });
  });

  it('caps sellable by BOM stock (STOCK-1: 3/50/0 -> 3)', () => {
    expect(computeSellable({ ...base, stockBom: 3, cupoMaximo: 50 })).toEqual({ sellable: 3, estado: 'ACTIVO' });
  });

  it('MIXTO with exhausted cupo and valid vigencia yields 0 AGOTADO (RULES-1)', () => {
    const now = new Date('2026-08-10T12:00:00.000Z');
    expect(
      computeSellable({
        ...base,
        modoVenta: 'MIXTO',
        vigenciaInicio: new Date('2026-08-01T04:00:00.000Z'),
        vigenciaFin: new Date('2026-08-20T04:00:00.000Z'),
        cupoMaximo: 10,
        cupoUsado: 10,
        now,
      }),
    ).toEqual({ sellable: 0, estado: 'AGOTADO' });
  });

  it('returns 0 INACTIVO for inactive combos', () => {
    expect(computeSellable({ ...base, activo: false, cupoMaximo: 5 })).toEqual({ sellable: 0, estado: 'INACTIVO' });
  });

  it('legacy combos without cupo sell at full BOM stock', () => {
    expect(computeSellable({ ...base, cupoMaximo: null })).toEqual({ sellable: 20, estado: 'ACTIVO' });
  });

  it('yields VENCIDO when now is outside the vigencia range (RULES-2)', () => {
    const now = new Date('2026-08-25T12:00:00.000Z');
    expect(
      computeSellable({
        ...base,
        modoVenta: 'RANGO_FECHAS',
        vigenciaInicio: new Date('2026-08-01T04:00:00.000Z'),
        vigenciaFin: new Date('2026-08-20T04:00:00.000Z'),
        now,
      }),
    ).toEqual({ sellable: 0, estado: 'VENCIDO' });
  });

  it('yields VENCIDO before vigencia starts', () => {
    const now = new Date('2026-07-30T12:00:00.000Z');
    expect(
      computeSellable({
        ...base,
        modoVenta: 'FECHA_HORA',
        vigenciaInicio: new Date('2026-08-01T04:00:00.000Z'),
        vigenciaFin: new Date('2026-08-20T04:00:00.000Z'),
        now,
      }),
    ).toEqual({ sellable: 0, estado: 'VENCIDO' });
  });

  it('stays ACTIVO at exact vigencia boundaries', () => {
    const now = new Date('2026-08-20T04:00:00.000Z');
    expect(
      computeSellable({
        ...base,
        modoVenta: 'RANGO_FECHAS',
        vigenciaInicio: new Date('2026-08-01T04:00:00.000Z'),
        vigenciaFin: new Date('2026-08-20T04:00:00.000Z'),
        now,
      }),
    ).toEqual({ sellable: 20, estado: 'ACTIVO' });
  });

  it('never returns negative sellable when cupoUsado exceeds cupoMaximo', () => {
    expect(computeSellable({ ...base, cupoMaximo: 5, cupoUsado: 7 })).toEqual({ sellable: 0, estado: 'AGOTADO' });
  });

  it('ignores vigencia dates for PERMANENTE mode (D9)', () => {
    const now = new Date('2026-08-25T12:00:00.000Z');
    expect(
      computeSellable({
        ...base,
        vigenciaInicio: new Date('2026-08-01T04:00:00.000Z'),
        vigenciaFin: new Date('2026-08-20T04:00:00.000Z'),
        now,
      }),
    ).toEqual({ sellable: 20, estado: 'ACTIVO' });
  });

  it('defaults now to the current instant when omitted', () => {
    const result = computeSellable({
      ...base,
      modoVenta: 'CUPO_FIJO',
      vigenciaInicio: new Date('2000-01-01T04:00:00.000Z'),
      vigenciaFin: new Date('2001-01-01T04:00:00.000Z'),
      cupoMaximo: 5,
    });
    expect(result.sellable).toBe(5);
    expect(result.estado).toBe('ACTIVO');
  });
});
