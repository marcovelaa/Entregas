import { Inject, Injectable } from '@nestjs/common';
import { REPORTES_REPOSITORY } from '../../domain/repositories/reportes.repository.interface';
import type { IReportesRepository } from '../../domain/repositories/reportes.repository.interface';

@Injectable()
export class GetInventarioCriticoUseCase {
  constructor(
    @Inject(REPORTES_REPOSITORY)
    private readonly reportesRepository: IReportesRepository
  ) {}

  async execute() {
    const data = await this.reportesRepository.obtenerInventarioCritico();
    return {
      success: true,
      data
    };
  }
}
