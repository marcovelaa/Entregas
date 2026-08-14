import { Controller, Get } from '@nestjs/common';
import { GetDashboardMetricsUseCase } from '../../application/use-cases/get-dashboard-metrics.use-case';
import { Public } from '../../../iam/auth/decorators/public.decorator';

@Controller('dashboard')
export class DashboardController {
  constructor(
    private readonly getDashboardMetricsUseCase: GetDashboardMetricsUseCase,
  ) {}

  @Get('metrics')
  @Public()
  async getMetrics() {
    return this.getDashboardMetricsUseCase.execute();
  }
}
