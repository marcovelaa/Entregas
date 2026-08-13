import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  PEDIDO_REPOSITORY,
  type IPedidoRepository,
  type PedidoData,
} from '../../domain/repositories/pedido.repository.interface';
import {
  EstadoPedido,
  esTransicionValida,
} from '../../domain/entities/estado-pedido.enum';

@Injectable()
export class CambiarEstadoPedidoUseCase {
  constructor(
    @Inject(PEDIDO_REPOSITORY)
    private readonly pedidoRepo: IPedidoRepository,
  ) {}

  async execute(params: {
    pedidoId: string;
    nuevoEstado: EstadoPedido;
    motivo?: string | null;
    usuarioId?: string | null;
    clienteId?: string | null;
  }): Promise<PedidoData> {
    const pedido = await this.pedidoRepo.obtenerPorId(params.pedidoId);
    if (!pedido) {
      throw new NotFoundException('El pedido no existe');
    }

    const estadoActual = pedido.estado;
    const esValida = esTransicionValida(estadoActual, params.nuevoEstado);

    if (!esValida) {
      throw new BadRequestException(
        `Transición de estado no permitida desde ${estadoActual} hacia ${params.nuevoEstado}`,
      );
    }

    if (estadoActual === params.nuevoEstado) {
      return pedido;
    }

    return this.pedidoRepo.actualizarEstado(params.pedidoId, params.nuevoEstado, {
      estadoAnterior: estadoActual,
      cambiadoPorUsuarioId: params.usuarioId || null,
      cambiadoPorClienteId: params.clienteId || null,
      motivo: params.motivo || null,
    });
  }
}
