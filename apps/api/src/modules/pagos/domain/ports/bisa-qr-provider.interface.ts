export interface GenerarQrInput {
  pedidoId: string;
  idempotencyKey: string;
  monto: number;
  moneda: string;
  expiraEn: Date;
  descripcion?: string;
}

export interface GenerarQrOutput {
  qrContenido: string;
  referenciaBisa: string;
  expiraEn: Date;
}

export const BISA_QR_PROVIDER = 'BISA_QR_PROVIDER';

export interface IBisaQrProvider {
  generarQR(input: GenerarQrInput): Promise<GenerarQrOutput>;
  validarFirmaWebhook(payload: any, headers: any): boolean;
}
