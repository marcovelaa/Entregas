describe('Composite Products (Combos con Receta) - Logic & Stock Calculation', () => {
  it('calculates dynamic virtual stock for a combo based on minimum available component ratio', () => {
    // Combo "Kit Escolar": requires 1 Backpack + 2 Notebooks + 3 Pens
    const comboRecipe = [
      {
        componenteId: '1',
        nombre: 'Mochila',
        cantidadRequerida: 1,
        stockFisico: 10,
      },
      {
        componenteId: '2',
        nombre: 'Cuaderno',
        cantidadRequerida: 2,
        stockFisico: 30,
      }, // 30 / 2 = 15 kits
      {
        componenteId: '3',
        nombre: 'Bolígrafo',
        cantidadRequerida: 3,
        stockFisico: 18,
      }, // 18 / 3 = 6 kits (bottleneck)
    ];

    const calculateVirtualComboStock = (components: typeof comboRecipe) => {
      if (!components || components.length === 0) return 0;
      return Math.min(
        ...components.map((c) =>
          Math.floor(c.stockFisico / c.cantidadRequerida),
        ),
      );
    };

    const availableKits = calculateVirtualComboStock(comboRecipe);
    expect(availableKits).toBe(6);
  });

  it('returns 0 available kits if any required component is completely out of stock', () => {
    const comboRecipe = [
      {
        componenteId: '1',
        nombre: 'Mochila',
        cantidadRequerida: 1,
        stockFisico: 10,
      },
      {
        componenteId: '2',
        nombre: 'Cuaderno',
        cantidadRequerida: 2,
        stockFisico: 0,
      }, // 0 stock
    ];

    const calculateVirtualComboStock = (components: typeof comboRecipe) => {
      if (!components || components.length === 0) return 0;
      return Math.min(
        ...components.map((c) =>
          Math.floor(c.stockFisico / c.cantidadRequerida),
        ),
      );
    };

    const availableKits = calculateVirtualComboStock(comboRecipe);
    expect(availableKits).toBe(0);
  });

  it('calculates the package savings accurately comparing sum of components vs fixed bundle price', () => {
    const components = [
      { nombre: 'Mochila Pro', precioUnitario: 120, cantidad: 1 },
      { nombre: 'Cuaderno Universitario', precioUnitario: 25, cantidad: 2 },
    ];
    const precioComboFijo = 130;

    const regularTotal = components.reduce(
      (sum, c) => sum + c.precioUnitario * c.cantidad,
      0,
    ); // 120 + 50 = 170
    const savings = Math.max(0, regularTotal - precioComboFijo); // 170 - 130 = 40
    const percentSavings = ((savings / regularTotal) * 100).toFixed(0);

    expect(regularTotal).toBe(170);
    expect(savings).toBe(40);
    expect(percentSavings).toBe('24');
  });
});
