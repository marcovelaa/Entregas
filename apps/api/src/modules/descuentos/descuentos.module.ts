import { Module } from '@nestjs/common';
import { PrismaModule } from '../../common/prisma/prisma.module';
import { DescuentosController } from './infrastructure/controllers/descuentos.controller';
import { DiscountEngineService } from './domain/discount-engine.service';
import { DESCUENTO_REPOSITORY } from './domain/repositories/descuento.repository.interface';
import { PrismaDescuentoRepository } from './infrastructure/repositories/prisma-descuento.repository';
import { ListarDescuentosUseCase } from './application/use-cases/listar-descuentos.use-case';
import { ObtenerDescuentoUseCase } from './application/use-cases/obtener-descuento.use-case';
import { ObtenerAnaliticaDescuentoUseCase } from './application/use-cases/obtener-analitica-descuento.use-case';
import { CrearDescuentoUseCase } from './application/use-cases/crear-descuento.use-case';
import { ActualizarParcialDescuentoUseCase } from './application/use-cases/actualizar-parcial-descuento.use-case';
import { ActualizarDescuentoUseCase } from './application/use-cases/actualizar-descuento.use-case';
import { EliminarDescuentoUseCase } from './application/use-cases/eliminar-descuento.use-case';

@Module({
  imports: [PrismaModule],
  controllers: [DescuentosController],
  providers: [
    DiscountEngineService,
    {
      provide: DESCUENTO_REPOSITORY,
      useClass: PrismaDescuentoRepository,
    },
    ListarDescuentosUseCase,
    ObtenerDescuentoUseCase,
    ObtenerAnaliticaDescuentoUseCase,
    CrearDescuentoUseCase,
    ActualizarParcialDescuentoUseCase,
    ActualizarDescuentoUseCase,
    EliminarDescuentoUseCase,
  ],
  exports: [DiscountEngineService],
})
export class DescuentosModule {}
