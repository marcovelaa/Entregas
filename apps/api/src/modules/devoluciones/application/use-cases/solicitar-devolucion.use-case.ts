import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  DEVOLUCION_REPOSITORY,
  type IDevolucionRepository,
  type DevolucionData,
} from '../../domain/repositories/devolucion.repository.interface';
import {
  PEDIDO_REPOSITORY,
  type IPedidoRepository,
} from '../../../pedidos/domain/repositories/pedido.repository.interface';
import { SolicitarDevolucionDto } from '../dtos/solicitar-devolucion.dto';
import { EstadoPedido } from '../../../pedidos/domain/entities/estado-pedido.enum';

@Injectable()
export class SolicitarDevolucionUseCase {
  constructor(
    @Inject(DEVOLUCION_REPOSITORY)
    private readonly devolucionRepo: IDevolucionRepository,
    @Inject(PEDIDO_REPOSITORY)
    private readonly pedidoRepo: IPedidoRepository,
  ) {}

  async execute(
    dto: SolicitarDevolucionDto,
    clienteId: string,
  ): Promise<DevolucionData> {
    const pedido = await this.pedidoRepo.obtenerPorId(dto.pedido_id);
    if (!pedido || pedido.cliente_id !== clienteId) {
      throw new NotFoundException('El pedido no existe o no te pertenece');
    }

    if (pedido.estado !== EstadoPedido.ENTREGADO) {
      throw new BadRequestException(
        'Solo se pueden solicitar devoluciones de pedidos que hayan sido entregados',
      );
    }

    // Validar cantidades de ítems solicitados
    for (const itemDto of dto.detalles) {
      const itemPedido = pedido.detalles.find(
        (d) => d.id === itemDto.pedido_detalle_id,
      );
      if (!itemPedido) {
        throw new BadRequestException(
          `El detalle del pedido ${itemDto.pedido_detalle_id} no pertenece a este pedido`,
        );
      }
      if (itemDto.cantidad > itemPedido.cantidad) {
        throw new BadRequestException(
          `La cantidad a devolver (${itemDto.cantidad}) supera la cantidad comprada (${itemPedido.cantidad}) para el producto ${itemPedido.nombre_producto}`,
        );
      }
    }

    return this.devolucionRepo.crear({
      pedido_id: dto.pedido_id,
      cliente_id: clienteId,
      motivo: dto.motivo,
      detalles: dto.detalles,
    });
  }
}
