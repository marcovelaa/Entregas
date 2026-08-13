import {
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  DEVOLUCION_REPOSITORY,
  type IDevolucionRepository,
  type DevolucionData,
} from '../../domain/repositories/devolucion.repository.interface';
import { EvaluarDevolucionDto } from '../dtos/evaluar-devolucion.dto';

@Injectable()
export class EvaluarDevolucionUseCase {
  constructor(
    @Inject(DEVOLUCION_REPOSITORY)
    private readonly devolucionRepo: IDevolucionRepository,
  ) {}

  async execute(
    devolucionId: string,
    dto: EvaluarDevolucionDto,
    usuarioId: string,
  ): Promise<DevolucionData> {
    const devolucion = await this.devolucionRepo.obtenerPorId(devolucionId);
    if (!devolucion) {
      throw new NotFoundException('La solicitud de devolución no existe');
    }

    return this.devolucionRepo.evaluarYRestock(devolucionId, {
      estado: dto.estado,
      resolucion: dto.resolucion,
      destinoFisico: dto.destino_fisico,
      montoReembolso: dto.monto_reembolso,
      notasEvaluacion: dto.notas_evaluacion,
      evaluadoPorUsuarioId: usuarioId,
    });
  }
}
