import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  PAGO_QR_REPOSITORY,
  type IPagoQrRepository,
  type PagoQrData,
} from '../../domain/repositories/pago-qr.repository.interface';
import {
  BISA_QR_PROVIDER,
  type IBisaQrProvider,
} from '../../domain/ports/bisa-qr-provider.interface';
import {
  PEDIDO_REPOSITORY,
  type IPedidoRepository,
} from '../../../pedidos/domain/repositories/pedido.repository.interface';
import { GenerarPagoQrDto } from '../dtos/generar-pago-qr.dto';
import { EstadoPagoQR } from '../../domain/entities/estado-pago-qr.enum';

const QR_EXPIRATION_MS = 15 * 60 * 1000;

@Injectable()
export class GenerarPagoQrUseCase {
  constructor(
    @Inject(PAGO_QR_REPOSITORY)
    private readonly pagoRepo: IPagoQrRepository,
    @Inject(PEDIDO_REPOSITORY)
    private readonly pedidoRepo: IPedidoRepository,
    @Inject(BISA_QR_PROVIDER)
    private readonly bisaProvider: IBisaQrProvider,
  ) {}

  async execute(
    dto: GenerarPagoQrDto,
    clienteId?: string | null,
  ): Promise<PagoQrData> {
    const pedido = await this.pedidoRepo.obtenerPorId(dto.pedido_id);
    if (!pedido) {
      throw new NotFoundException('El pedido no existe');
    }

    if (clienteId && pedido.cliente_id && pedido.cliente_id !== clienteId) {
      throw new NotFoundException('El pedido no existe');
    }

    const idempotencyKey =
      dto.idempotency_key ||
      `QR-${pedido.id}-${new Date(pedido.actualizado_en).getTime()}`;

    const existente = await this.pagoRepo.obtenerPorIdempotencyKey(
      idempotencyKey,
    );
    if (existente && existente.estado === EstadoPagoQR.PENDIENTE) {
      return existente;
    }

    const pagoPorPedido = await this.pagoRepo.obtenerPorPedidoId(pedido.id);
    if (pagoPorPedido && pagoPorPedido.estado === EstadoPagoQR.CONFIRMADO) {
      throw new BadRequestException('El pedido ya ha sido pagado');
    }

    const expiraEn = new Date(Date.now() + QR_EXPIRATION_MS);
    const resultadoBisa = await this.bisaProvider.generarQR({
      pedidoId: pedido.id,
      idempotencyKey,
      monto: pedido.total,
      moneda: 'BOB',
      expiraEn,
      descripcion: `Pago Pedido ${pedido.numero_pedido}`,
    });

    return this.pagoRepo.crear({
      pedido_id: pedido.id,
      reserva_id: pedido.reserva_id,
      idempotency_key: idempotencyKey,
      qr_contenido: resultadoBisa.qrContenido,
      monto: pedido.total,
      moneda: 'BOB',
      referencia_bisa: resultadoBisa.referenciaBisa,
      expira_en: resultadoBisa.expiraEn,
    });
  }
}
