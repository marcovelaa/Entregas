import { computeStockBom, stockDisponibleDeComponente } from './combo-stock';

describe('combo-stock - stockBOM a partir del BOM (D4)', () => {
  it('computes min floor ratio across components (10/1, 30/2, 18/3 -> 6 kits)', () => {
    const componentes = [
      { cantidad: 1, stockDisponible: 10 },
      { cantidad: 2, stockDisponible: 30 },
      { cantidad: 3, stockDisponible: 18 },
    ];
    expect(computeStockBom(componentes)).toBe(6);
  });

  it('returns 0 when any component has no stock', () => {
    expect(
      computeStockBom([
        { cantidad: 1, stockDisponible: 10 },
        { cantidad: 1, stockDisponible: 0 },
      ]),
    ).toBe(0);
  });

  it('returns 0 for an empty or undefined BOM', () => {
    expect(computeStockBom([])).toBe(0);
    expect(computeStockBom(undefined as any)).toBe(0);
  });

  it('never returns negative stock', () => {
    expect(computeStockBom([{ cantidad: 1, stockDisponible: -5 }])).toBe(0);
  });

  it('reads stock from componente_producto Inventario when no variante is set', () => {
    const comp = {
      cantidad: 2,
      componente_producto: { Inventario: [{ cantidad_disponible: 10, reservado: 2 }] },
    };
    expect(stockDisponibleDeComponente(comp)).toBe(8);
  });

  it('reads stock from the variante Inventario when variante_id is set', () => {
    const comp = {
      variante_id: 7,
      variante: { Inventario: [{ cantidad_disponible: 5, reservado: 1 }] },
    };
    expect(stockDisponibleDeComponente(comp)).toBe(4);
  });

  it('falls back to stock_disponible when no Inventario rows exist, else 0', () => {
    expect(stockDisponibleDeComponente({ stock_disponible: 3 })).toBe(3);
    expect(stockDisponibleDeComponente({})).toBe(0);
    expect(stockDisponibleDeComponente(null)).toBe(0);
  });
});
