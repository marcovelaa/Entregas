export const VENTA_REPOSITORY = 'VENTA_REPOSITORY';

export type VentaDetalleData = {
  producto_id: string;
  variante_id?: string;
  empaque_id?: string;
  cantidad: number;
  precio_unitario: number;
  motivo_ajuste?: string;
};

export type VentaCreateData = {
  cliente_id?: string;
  usuario_id: string;
  metodo_pago: string;
  monto_pagado: number;
  descuento_id?: string;
  codigo_cupon?: string;
  aprobador_usuario_id?: string;
  motivo_ajuste?: string;
  reserva_id?: string;
  detalles: VentaDetalleData[];
};

export interface IVentaRepository {
  crear(data: VentaCreateData): Promise<any>;
  listar(params: {
    offset: number;
    limit: number;
  }): Promise<{ total: number; data: any[] }>;
  anular(venta_id: string, usuario_id: string, motivo: string): Promise<any>;
  revertirAnulacion(venta_id: string, usuario_id: string): Promise<any>;
}
