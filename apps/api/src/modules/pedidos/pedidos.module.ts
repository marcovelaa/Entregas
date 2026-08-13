import { Module } from '@nestjs/common';
import { PrismaModule } from '../../common/prisma/prisma.module';
import { PEDIDO_REPOSITORY } from './domain/repositories/pedido.repository.interface';
import { PrismaPedidoRepository } from './infrastructure/repositories/prisma-pedido.repository';
import { CrearPedidoUseCase } from './application/use-cases/crear-pedido.use-case';
import { CambiarEstadoPedidoUseCase } from './application/use-cases/cambiar-estado-pedido.use-case';
import { ListarPedidosClienteUseCase } from './application/use-cases/listar-pedidos-cliente.use-case';
import { ObtenerPedidoClienteUseCase } from './application/use-cases/obtener-pedido-cliente.use-case';
import { ListarPedidosErpUseCase } from './application/use-cases/listar-pedidos-erp.use-case';
import { ClientePedidosController } from './infrastructure/controllers/cliente-pedidos.controller';
import { PedidosErpController } from './infrastructure/controllers/pedidos-erp.controller';

@Module({
  imports: [PrismaModule],
  controllers: [ClientePedidosController, PedidosErpController],
  providers: [
    {
      provide: PEDIDO_REPOSITORY,
      useClass: PrismaPedidoRepository,
    },
    CrearPedidoUseCase,
    CambiarEstadoPedidoUseCase,
    ListarPedidosClienteUseCase,
    ObtenerPedidoClienteUseCase,
    ListarPedidosErpUseCase,
  ],
  exports: [
    PEDIDO_REPOSITORY,
    CrearPedidoUseCase,
    CambiarEstadoPedidoUseCase,
    ListarPedidosClienteUseCase,
    ObtenerPedidoClienteUseCase,
    ListarPedidosErpUseCase,
  ],
})
export class PedidosModule {}
