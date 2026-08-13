import { Inject, Injectable } from '@nestjs/common';
import {
  PEDIDO_REPOSITORY,
  type IPedidoRepository,
  type PedidoData,
} from '../../domain/repositories/pedido.repository.interface';
import { EstadoPedido } from '../../domain/entities/estado-pedido.enum';

@Injectable()
export class ListarPedidosErpUseCase {
  constructor(
    @Inject(PEDIDO_REPOSITORY)
    private readonly pedidoRepo: IPedidoRepository,
  ) {}

  async execute(params: {
    offset: number;
    limit: number;
    estado?: EstadoPedido;
    buscar?: string;
  }): Promise<{ total: number; data: PedidoData[] }> {
    return this.pedidoRepo.listarErp(params);
  }
}
