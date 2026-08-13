import { Module } from '@nestjs/common';
import { PrismaModule } from '../../common/prisma/prisma.module';
import { PedidosModule } from '../pedidos/pedidos.module';
import { DEVOLUCION_REPOSITORY } from './domain/repositories/devolucion.repository.interface';
import { PrismaDevolucionRepository } from './infrastructure/repositories/prisma-devolucion.repository';
import { SolicitarDevolucionUseCase } from './application/use-cases/solicitar-devolucion.use-case';
import { EvaluarDevolucionUseCase } from './application/use-cases/evaluar-devolucion.use-case';
import { ListarDevolucionesClienteUseCase } from './application/use-cases/listar-devoluciones-cliente.use-case';
import { ListarDevolucionesErpUseCase } from './application/use-cases/listar-devoluciones-erp.use-case';
import { ClienteDevolucionesController } from './infrastructure/controllers/cliente-devoluciones.controller';
import { DevolucionesErpController } from './infrastructure/controllers/devoluciones-erp.controller';

@Module({
  imports: [PrismaModule, PedidosModule],
  controllers: [ClienteDevolucionesController, DevolucionesErpController],
  providers: [
    {
      provide: DEVOLUCION_REPOSITORY,
      useClass: PrismaDevolucionRepository,
    },
    SolicitarDevolucionUseCase,
    EvaluarDevolucionUseCase,
    ListarDevolucionesClienteUseCase,
    ListarDevolucionesErpUseCase,
  ],
  exports: [
    DEVOLUCION_REPOSITORY,
    SolicitarDevolucionUseCase,
    EvaluarDevolucionUseCase,
    ListarDevolucionesClienteUseCase,
    ListarDevolucionesErpUseCase,
  ],
})
export class DevolucionesModule {}
