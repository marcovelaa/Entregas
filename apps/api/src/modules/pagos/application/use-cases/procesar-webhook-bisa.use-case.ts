import {
  Inject,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import {
  PAGO_QR_REPOSITORY,
  type IPagoQrRepository,
} from '../../domain/repositories/pago-qr.repository.interface';
import {
  BISA_QR_PROVIDER,
  type IBisaQrProvider,
} from '../../domain/ports/bisa-qr-provider.interface';
import {
  PEDIDO_REPOSITORY,
  type IPedidoRepository,
} from '../../../pedidos/domain/repositories/pedido.repository.interface';
import { CambiarEstadoPedidoUseCase } from '../../../pedidos/application/use-cases/cambiar-estado-pedido.use-case';
import { WebhookBisaPayloadDto } from '../dtos/webhook-bisa-payload.dto';
import { EstadoPagoQR } from '../../domain/entities/estado-pago-qr.enum';
import { EstadoPedido } from '../../../pedidos/domain/entities/estado-pedido.enum';

@Injectable()
export class ProcesarWebhookBisaUseCase {
  constructor(
    @Inject(PAGO_QR_REPOSITORY)
    private readonly pagoRepo: IPagoQrRepository,
    @Inject(PEDIDO_REPOSITORY)
    private readonly pedidoRepo: IPedidoRepository,
    @Inject(BISA_QR_PROVIDER)
    private readonly bisaProvider: IBisaQrProvider,
    private readonly cambiarEstadoPedidoUseCase: CambiarEstadoPedidoUseCase,
  ) {}

  async execute(
    dto: WebhookBisaPayloadDto,
    headers?: any,
  ): Promise<{ ok: boolean; procesado: boolean }> {
    const firmaValida = this.bisaProvider.validarFirmaWebhook(dto, headers);
    if (!firmaValida) {
      await this.pagoRepo.registrarWebhookLog({
        eventId: dto.event_id,
        payload: dto,
        headers,
        procesado: false,
        errorMensaje: 'Firma inválida',
      });
      throw new UnauthorizedException('Firma de webhook BISA inválida');
    }

    const pago = await this.pagoRepo.obtenerPorReferenciaBisa(
      dto.referencia_bisa,
    );
    if (!pago) {
      await this.pagoRepo.registrarWebhookLog({
        eventId: dto.event_id,
        payload: dto,
        headers,
        procesado: false,
        errorMensaje: 'Referencia BISA no encontrada',
      });
      throw new NotFoundException(
        'Pago QR no encontrado para la referencia provista',
      );
    }

    if (pago.estado === EstadoPagoQR.CONFIRMADO) {
      await this.pagoRepo.registrarWebhookLog({
        eventId: dto.event_id,
        payload: dto,
        headers,
        procesado: true,
        errorMensaje: 'Webhook duplicado omitido por idempotencia',
      });
      return { ok: true, procesado: false };
    }

    if (dto.estado === 'CONFIRMADO') {
      await this.pagoRepo.marcarConfirmado(pago.id);

      await this.cambiarEstadoPedidoUseCase.execute({
        pedidoId: pago.pedido_id,
        nuevoEstado: EstadoPedido.PAGADO,
        motivo: `Pago QR confirmado por pasarela BISA (${dto.referencia_bisa})`,
      });

      await this.pagoRepo.registrarWebhookLog({
        eventId: dto.event_id,
        payload: dto,
        headers,
        procesado: true,
      });

      return { ok: true, procesado: true };
    } else if (dto.estado === 'RECHAZADO' || dto.estado === 'CANCELADO') {
      await this.pagoRepo.marcarExpirado(pago.id);
      await this.cambiarEstadoPedidoUseCase.execute({
        pedidoId: pago.pedido_id,
        nuevoEstado: EstadoPedido.CANCELADO,
        motivo: `Pago QR rechazado o cancelado por pasarela BISA`,
      });

      await this.pagoRepo.registrarWebhookLog({
        eventId: dto.event_id,
        payload: dto,
        headers,
        procesado: true,
      });

      return { ok: true, procesado: true };
    }

    return { ok: true, procesado: false };
  }
}
