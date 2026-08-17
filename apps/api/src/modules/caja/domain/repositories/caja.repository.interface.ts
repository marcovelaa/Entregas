export const CAJA_REPOSITORY = 'CAJA_REPOSITORY';

export interface CajaData {
  id: string;
  usuario_id: string;
  fecha_apertura: Date;
  fecha_cierre?: Date | null;
  monto_apertura: number;
  monto_cierre_esp?: number | null;
  monto_cierre_real?: number | null;
  diferencia?: number | null;
  estado: string;
  observaciones?: string | null;
}

export interface MovimientoCajaData {
  id: string;
  caja_id: string;
  usuario_id: string;
  tipo_movimiento: string;
  concepto: string;
  monto: number;
  metodo_pago: string;
  creado_en: Date;
}

export interface ICajaRepository {
  obtenerCajaActiva(): Promise<CajaData | null>;
  abrirCaja(usuario_id: string, monto_apertura: number): Promise<CajaData>;
  cerrarCaja(caja_id: string, monto_cierre_esp: number, monto_cierre_real: number, diferencia: number, observaciones?: string): Promise<CajaData>;
  registrarMovimiento(params: {
    caja_id: string;
    usuario_id: string;
    tipo_movimiento: 'INGRESO' | 'EGRESO';
    concepto: string;
    monto: number;
    metodo_pago: string;
    referencia_id?: string;
  }): Promise<MovimientoCajaData>;
  calcularEfectivoEsperado(caja_id: string): Promise<number>;
  obtenerMovimientos(caja_id: string): Promise<MovimientoCajaData[]>;
}
