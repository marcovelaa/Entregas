import { Inject, Injectable } from '@nestjs/common';
import { REPORTES_REPOSITORY } from '../../domain/repositories/reportes.repository.interface';
import type { IReportesRepository } from '../../domain/repositories/reportes.repository.interface';

@Injectable()
export class GetResumenEjecutivoUseCase {
  constructor(
    @Inject(REPORTES_REPOSITORY)
    private readonly reportesRepository: IReportesRepository
  ) {}

  async execute() {
    // Calculamos el rango de fechas (últimos 30 días)
    const hoy = new Date();
    const hace30Dias = new Date();
    hace30Dias.setDate(hoy.getDate() - 30);
    hace30Dias.setHours(0, 0, 0, 0);

    const result = await this.reportesRepository.obtenerResumenEjecutivo(hace30Dias, hoy);
    return {
      success: true,
      data: result
    };
  }
}
