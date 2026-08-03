import { Module } from '@nestjs/common';
import { DashboardController } from './infrastructure/controllers/dashboard.controller';
import { GetDashboardMetricsUseCase } from './application/use-cases/get-dashboard-metrics.use-case';
import { PrismaService } from '../../common/prisma/prisma.service';

@Module({
  controllers: [DashboardController],
  providers: [GetDashboardMetricsUseCase, PrismaService],
})
export class DashboardModule {}
