export interface BomComponenteInput {
  cantidad?: number | null;
  stockDisponible?: number;
}

export interface InventarioFilaInput {
  producto_id: bigint;
  variante_id: bigint | null;
  cantidad_disponible: number;
  reservado: number;
}

export interface BomComponenteNuevo {
  componente_prod_id: string | number | bigint;
  variante_id?: string | number | bigint | null;
  cantidad?: number | null;
}

export function stockDisponibleDeComponente(componente: any): number {
  if (!componente) return 0;
  const inventario = componente.variante_id != null ? componente.variante?.Inventario : componente.componente_producto?.Inventario;
  if (Array.isArray(inventario) && inventario.length > 0) {
    return inventario.reduce((acc: number, f: any) => acc + Math.max(0, (f.cantidad_disponible ?? 0) - (f.reservado ?? 0)), 0);
  }
  return typeof componente.stock_disponible === 'number' ? Math.max(0, componente.stock_disponible) : 0;
}

export function computeStockBom(componentes: Array<BomComponenteInput | null | undefined>): number {
  if (!Array.isArray(componentes) || componentes.length === 0) return 0;
  let minKits = Infinity;
  for (const c of componentes) {
    const kits = Math.floor((c?.stockDisponible ?? 0) / (c?.cantidad || 1));
    if (kits < minKits) minKits = kits;
  }
  return minKits === Infinity ? 0 : Math.max(0, minKits);
}

export function computeStockBomDesdeInventario(
  componentes: BomComponenteNuevo[],
  filas: InventarioFilaInput[],
): number {
  return computeStockBom(
    componentes.map((c) => {
      const id = BigInt(c.componente_prod_id);
      const varianteId = c.variante_id != null ? BigInt(c.variante_id) : null;
      const matching = filas.filter(
        (f) => f.producto_id === id && (varianteId !== null ? (f.variante_id ?? null) === varianteId : true),
      );
      const stockDisponible = matching.reduce(
        (acc, f) => acc + Math.max(0, (f.cantidad_disponible ?? 0) - (f.reservado ?? 0)),
        0,
      );
      return {
        cantidad: c.cantidad,
        stockDisponible,
      };
    }),
  );
}
