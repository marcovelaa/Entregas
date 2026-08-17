import { Inject, Injectable } from '@nestjs/common';
import { REPORTES_REPOSITORY } from '../../domain/repositories/reportes.repository.interface';
import type { IReportesRepository } from '../../domain/repositories/reportes.repository.interface';

@Injectable()
export class GetRendimientoVendedoresUseCase {
  constructor(
    @Inject(REPORTES_REPOSITORY)
    private readonly reportesRepository: IReportesRepository
  ) {}

  async execute(startDate?: string, endDate?: string) {
    const start = startDate ? new Date(startDate) : new Date(new Date().setDate(new Date().getDate() - 30));
    const end = endDate ? new Date(endDate) : new Date();

    const data = await this.reportesRepository.obtenerRendimientoVendedores(start, end);
    return {
      success: true,
      data,
      meta: {
        startDate: start.toISOString(),
        endDate: end.toISOString()
      }
    };
  }
}
