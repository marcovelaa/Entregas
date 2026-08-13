import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import {
  PEDIDO_REPOSITORY,
  type IPedidoRepository,
  type PedidoData,
} from '../../domain/repositories/pedido.repository.interface';

@Injectable()
export class ObtenerPedidoClienteUseCase {
  constructor(
    @Inject(PEDIDO_REPOSITORY)
    private readonly pedidoRepo: IPedidoRepository,
  ) {}

  async execute(clienteId: string, pedidoId: string): Promise<PedidoData> {
    const pedido = await this.pedidoRepo.obtenerPorId(pedidoId);
    if (!pedido || pedido.cliente_id !== clienteId) {
      throw new NotFoundException('El pedido no existe');
    }
    return pedido;
  }
}
