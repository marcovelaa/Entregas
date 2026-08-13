import { Inject, Injectable } from '@nestjs/common';
import {
  DEVOLUCION_REPOSITORY,
  type IDevolucionRepository,
  type DevolucionData,
} from '../../domain/repositories/devolucion.repository.interface';
import { EstadoDevolucion } from '../../domain/entities/devolucion-enums';

@Injectable()
export class ListarDevolucionesErpUseCase {
  constructor(
    @Inject(DEVOLUCION_REPOSITORY)
    private readonly devolucionRepo: IDevolucionRepository,
  ) {}

  async execute(params: {
    offset?: number;
    limit?: number;
    estado?: EstadoDevolucion;
  }): Promise<{ total: number; data: DevolucionData[] }> {
    return this.devolucionRepo.listarErp({
      offset: params.offset || 0,
      limit: params.limit || 50,
      estado: params.estado,
    });
  }
}
