import { Inject, Injectable } from '@nestjs/common';
import { REPORTES_REPOSITORY } from '../../domain/repositories/reportes.repository.interface';
import type { IReportesRepository } from '../../domain/repositories/reportes.repository.interface';
import { GetReporteVentasDto } from '../../infrastructure/dto/get-reporte-ventas.dto';

@Injectable()
export class GetReporteVentasUseCase {
  constructor(
    @Inject(REPORTES_REPOSITORY)
    private readonly reportesRepository: IReportesRepository
  ) {}

  async execute(filtros: GetReporteVentasDto) {
    const result = await this.reportesRepository.obtenerReporteVentas(filtros);
    return {
      success: true,
      ...result
    };
  }
}
