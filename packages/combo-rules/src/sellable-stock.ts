export type ModoVenta = 'PERMANENTE' | 'RANGO_FECHAS' | 'FECHA_HORA' | 'CUPO_FIJO' | 'MIXTO';

export type EstadoVenta = 'ACTIVO' | 'VENCIDO' | 'AGOTADO' | 'INACTIVO';

export interface ComputeSellableInput {
  tipoProducto: string;
  stockBom: number;
  activo: boolean;
  modoVenta: ModoVenta;
  vigenciaInicio?: Date | null;
  vigenciaFin?: Date | null;
  cupoMaximo?: number | null;
  cupoUsado: number;
  now?: Date;
}

export interface SellableResult {
  sellable: number;
  estado: EstadoVenta;
}

const VIGENCIA_MODES: ReadonlySet<ModoVenta> = new Set(['RANGO_FECHAS', 'FECHA_HORA', 'MIXTO']);

export function computeSellable(input: ComputeSellableInput): SellableResult {
  const { stockBom, activo, modoVenta, vigenciaInicio, vigenciaFin, cupoMaximo, cupoUsado, now } = input;

  if (!activo) {
    return { sellable: 0, estado: 'INACTIVO' };
  }

  if (VIGENCIA_MODES.has(modoVenta)) {
    const current = now ?? new Date();
    if (vigenciaInicio && current < vigenciaInicio) {
      return { sellable: 0, estado: 'VENCIDO' };
    }
    if (vigenciaFin && current > vigenciaFin) {
      return { sellable: 0, estado: 'VENCIDO' };
    }
  }

  const cupoRestante = cupoMaximo != null ? Math.max(0, cupoMaximo - cupoUsado) : Infinity;
  const sellable = Math.min(stockBom, cupoRestante);

  if (sellable <= 0) {
    return { sellable: 0, estado: 'AGOTADO' };
  }

  return { sellable, estado: 'ACTIVO' };
}
