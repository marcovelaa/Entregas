import { Module } from '@nestjs/common';
import { PrismaModule } from '../../common/prisma/prisma.module';
import { InventarioController } from './infrastructure/controllers/inventario.controller';
import { INVENTARIO_REPOSITORY } from './domain/repositories/inventario.repository.interface';
import { PrismaInventarioRepository } from './infrastructure/repositories/prisma-inventario.repository';
import { ListarStockUseCase } from './application/use-cases/listar-stock.use-case';
import { ListarMovimientosUseCase } from './application/use-cases/listar-movimientos.use-case';

import { RegistrarMovimientoUseCase } from './application/use-cases/registrar-movimiento.use-case';
import { ListarAlertasUseCase } from './application/use-cases/listar-alertas.use-case';

@Module({
  imports: [PrismaModule],
  controllers: [InventarioController],
  providers: [
    {
      provide: INVENTARIO_REPOSITORY,
      useClass: PrismaInventarioRepository
    },
    {
      provide: ListarStockUseCase,
      useFactory: (repo) => new ListarStockUseCase(repo),
      inject: [INVENTARIO_REPOSITORY]
    },
    {
      provide: ListarMovimientosUseCase,
      useFactory: (repo) => new ListarMovimientosUseCase(repo),
      inject: [INVENTARIO_REPOSITORY]
    },
    {
      provide: RegistrarMovimientoUseCase,
      useFactory: (repo) => new RegistrarMovimientoUseCase(repo),
      inject: [INVENTARIO_REPOSITORY]
    },
    ListarAlertasUseCase
  ],
  exports: [INVENTARIO_REPOSITORY]
})
export class InventarioModule {}
