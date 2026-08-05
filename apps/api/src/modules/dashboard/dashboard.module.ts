import { Module } from '@nestjs/common';
import { DashboardController } from './infrastructure/controllers/dashboard.controller';
import { GetDashboardMetricsUseCase } from './application/use-cases/get-dashboard-metrics.use-case';
import { DASHBOARD_REPOSITORY } from './domain/repositories/dashboard.repository.interface';
import { PrismaDashboardRepository } from './infrastructure/repositories/prisma-dashboard.repository';
import { PrismaModule } from '../../common/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [DashboardController],
  providers: [
    GetDashboardMetricsUseCase,
    {
      provide: DASHBOARD_REPOSITORY,
      useClass: PrismaDashboardRepository,
    },
  ],
})
export class DashboardModule {}
