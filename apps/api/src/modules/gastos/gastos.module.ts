import { Module } from '@nestjs/common';
import { PrismaModule } from '../../common/prisma/prisma.module';
import { GastosController } from './gastos.controller';
import { GASTOS_REPOSITORY } from './domain/repositories/gastos.repository.interface';
import { PrismaGastosRepository } from './infrastructure/repositories/prisma-gastos.repository';
import { ListarGastosUseCase } from './application/use-cases/listar-gastos.use-case';
import { CrearGastoUseCase } from './application/use-cases/crear-gasto.use-case';
import { EliminarGastoUseCase } from './application/use-cases/eliminar-gasto.use-case';

@Module({
  imports: [PrismaModule],
  controllers: [GastosController],
  providers: [
    {
      provide: GASTOS_REPOSITORY,
      useClass: PrismaGastosRepository,
    },
    ListarGastosUseCase,
    CrearGastoUseCase,
    EliminarGastoUseCase,
  ],
})
export class GastosModule {}
