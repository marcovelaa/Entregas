import { EstadoPagoQR } from '../entities/estado-pago-qr.enum';

export interface PagoQrCreateData {
  pedido_id: string;
  reserva_id?: string | null;
  idempotency_key: string;
  qr_contenido: string;
  monto: number;
  moneda?: string;
  referencia_bisa: string;
  expira_en: Date;
}

export interface PagoQrData {
  id: string;
  public_id: string;
  pedido_id: string;
  reserva_id?: string | null;
  idempotency_key: string;
  qr_contenido: string;
  monto: number;
  moneda: string;
  estado: EstadoPagoQR;
  referencia_bisa?: string | null;
  expira_en: Date;
  confirmado_en?: Date | null;
  creado_en: Date;
  actualizado_en: Date;
}

export const PAGO_QR_REPOSITORY = 'PAGO_QR_REPOSITORY';

export interface IPagoQrRepository {
  crear(data: PagoQrCreateData): Promise<PagoQrData>;
  obtenerPorId(id: string): Promise<PagoQrData | null>;
  obtenerPorPedidoId(pedidoId: string): Promise<PagoQrData | null>;
  obtenerPorReferenciaBisa(referenciaBisa: string): Promise<PagoQrData | null>;
  obtenerPorIdempotencyKey(idempotencyKey: string): Promise<PagoQrData | null>;
  marcarConfirmado(id: string, fecha?: Date): Promise<PagoQrData>;
  marcarExpirado(id: string): Promise<PagoQrData>;
  registrarWebhookLog(data: {
    eventId?: string | null;
    origen?: string;
    payload: any;
    headers?: any;
    procesado: boolean;
    errorMensaje?: string | null;
  }): Promise<void>;
}
