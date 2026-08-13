import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../common/prisma/prisma.service';
import { EstadoPagoQR } from '../../domain/entities/estado-pago-qr.enum';
import {
  IPagoQrRepository,
  PagoQrCreateData,
  PagoQrData,
} from '../../domain/repositories/pago-qr.repository.interface';

@Injectable()
export class PrismaPagoQrRepository implements IPagoQrRepository {
  constructor(private readonly prisma: PrismaService) {}

  async crear(data: PagoQrCreateData): Promise<PagoQrData> {
    const registro = await this.prisma.pagoQR.create({
      data: {
        pedido_id: BigInt(data.pedido_id),
        reserva_id: data.reserva_id ? BigInt(data.reserva_id) : null,
        idempotency_key: data.idempotency_key,
        qr_contenido: data.qr_contenido,
        monto: data.monto,
        moneda: data.moneda || 'BOB',
        estado: EstadoPagoQR.PENDIENTE,
        referencia_bisa: data.referencia_bisa,
        expira_en: data.expira_en,
      },
    });
    return this.serialize(registro);
  }

  async obtenerPorId(id: string): Promise<PagoQrData | null> {
    const registro = await this.prisma.pagoQR.findUnique({
      where: { id: BigInt(id) },
    });
    return registro ? this.serialize(registro) : null;
  }

  async obtenerPorPedidoId(pedidoId: string): Promise<PagoQrData | null> {
    const registro = await this.prisma.pagoQR.findUnique({
      where: { pedido_id: BigInt(pedidoId) },
    });
    return registro ? this.serialize(registro) : null;
  }

  async obtenerPorReferenciaBisa(
    referenciaBisa: string,
  ): Promise<PagoQrData | null> {
    const registro = await this.prisma.pagoQR.findUnique({
      where: { referencia_bisa: referenciaBisa },
    });
    return registro ? this.serialize(registro) : null;
  }

  async obtenerPorIdempotencyKey(
    idempotencyKey: string,
  ): Promise<PagoQrData | null> {
    const registro = await this.prisma.pagoQR.findUnique({
      where: { idempotency_key: idempotencyKey },
    });
    return registro ? this.serialize(registro) : null;
  }

  async marcarConfirmado(id: string, fecha?: Date): Promise<PagoQrData> {
    const registro = await this.prisma.pagoQR.update({
      where: { id: BigInt(id) },
      data: {
        estado: EstadoPagoQR.CONFIRMADO,
        confirmado_en: fecha || new Date(),
      },
    });
    return this.serialize(registro);
  }

  async marcarExpirado(id: string): Promise<PagoQrData> {
    const registro = await this.prisma.pagoQR.update({
      where: { id: BigInt(id) },
      data: {
        estado: EstadoPagoQR.EXPIRADO,
      },
    });
    return this.serialize(registro);
  }

  async registrarWebhookLog(data: {
    eventId?: string | null;
    origen?: string;
    payload: any;
    headers?: any;
    procesado: boolean;
    errorMensaje?: string | null;
  }): Promise<void> {
    await this.prisma.pagoWebhookLog.create({
      data: {
        event_id: data.eventId || null,
        origen: data.origen || 'BANCO_BISA',
        payload: data.payload as any,
        headers: data.headers as any,
        procesado: data.procesado,
        error_mensaje: data.errorMensaje || null,
      },
    });
  }

  private serialize(registro: any): PagoQrData {
    return {
      id: registro.id.toString(),
      public_id: registro.public_id,
      pedido_id: registro.pedido_id.toString(),
      reserva_id: registro.reserva_id ? registro.reserva_id.toString() : null,
      idempotency_key: registro.idempotency_key,
      qr_contenido: registro.qr_contenido,
      monto: Number(registro.monto),
      moneda: registro.moneda,
      estado: registro.estado as EstadoPagoQR,
      referencia_bisa: registro.referencia_bisa,
      expira_en: registro.expira_en,
      confirmado_en: registro.confirmado_en,
      creado_en: registro.creado_en,
      actualizado_en: registro.actualizado_en,
    };
  }
}
