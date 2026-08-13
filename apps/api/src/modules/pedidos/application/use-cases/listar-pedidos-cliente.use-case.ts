import { Inject, Injectable } from '@nestjs/common';
import {
  PEDIDO_REPOSITORY,
  type IPedidoRepository,
  type PedidoData,
} from '../../domain/repositories/pedido.repository.interface';

@Injectable()
export class ListarPedidosClienteUseCase {
  constructor(
    @Inject(PEDIDO_REPOSITORY)
    private readonly pedidoRepo: IPedidoRepository,
  ) {}

  async execute(clienteId: string): Promise<PedidoData[]> {
    return this.pedidoRepo.listarPorCliente(clienteId);
  }
}
