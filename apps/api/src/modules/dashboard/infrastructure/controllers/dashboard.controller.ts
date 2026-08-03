import { Controller, Get } from '@nestjs/common';
import { GetDashboardMetricsUseCase } from '../../application/use-cases/get-dashboard-metrics.use-case';

@Controller('dashboard')
export class DashboardController {
  constructor(private readonly getDashboardMetricsUseCase: GetDashboardMetricsUseCase) {}

  @Get('metrics')
  async getMetrics() {
    return this.getDashboardMetricsUseCase.execute();
  }
}
