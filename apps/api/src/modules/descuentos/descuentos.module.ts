import { Module } from '@nestjs/common';
import { PrismaModule } from '../../common/prisma/prisma.module';
import { DescuentosController } from './infrastructure/controllers/descuentos.controller';
import { DiscountEngineService } from './domain/discount-engine.service';
import { DESCUENTO_REPOSITORY } from './domain/repositories/descuento.repository.interface';
import { PrismaDescuentoRepository } from './infrastructure/repositories/prisma-descuento.repository';

@Module({
  imports: [PrismaModule],
  controllers: [DescuentosController],
  providers: [
    DiscountEngineService,
    {
      provide: DESCUENTO_REPOSITORY,
      useClass: PrismaDescuentoRepository,
    },
  ],
  exports: [DiscountEngineService],
})
export class DescuentosModule {}
