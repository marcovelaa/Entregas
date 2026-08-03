import { Module } from '@nestjs/common';
import { PrismaModule } from '../../common/prisma/prisma.module';
import { DescuentosController } from './infrastructure/controllers/descuentos.controller';
import { DiscountEngineService } from './domain/discount-engine.service';

@Module({
  imports: [PrismaModule],
  controllers: [DescuentosController],
  providers: [DiscountEngineService],
  exports: [DiscountEngineService],
})
export class DescuentosModule {}
