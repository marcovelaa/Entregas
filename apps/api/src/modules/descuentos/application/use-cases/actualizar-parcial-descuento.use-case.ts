import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import type {
  DescuentoActualizarParcialInput,
  IDescuentoRepository,
} from '../../domain/repositories/descuento.repository.interface';
import { DESCUENTO_REPOSITORY } from '../../domain/repositories/descuento.repository.interface';
import { ActualizarParcialDescuentoDto } from '../dtos/descuento.dto';
import { parseDiasSemana, parseHHMM } from '../../domain/scheduling';

@Injectable()
export class ActualizarParcialDescuentoUseCase {
  constructor(
    @Inject(DESCUENTO_REPOSITORY)
    private readonly descuentoRepo: IDescuentoRepository,
  ) {}

  async execute(id: string, dto: ActualizarParcialDescuentoDto) {
    const data: DescuentoActualizarParcialInput = {};
    if (dto.activo !== undefined) data.activo = dto.activo;
    if (dto.nombre !== undefined) data.nombre = dto.nombre;
    if (dto.descripcion !== undefined) data.descripcion = dto.descripcion;
    if (dto.prioridad !== undefined) data.prioridad = dto.prioridad;
    if (dto.valor !== undefined) data.valor = dto.valor;
    if (dto.fechaInicio) data.fecha_inicio = new Date(dto.fechaInicio);
    if (dto.fechaFin) data.fecha_fin = new Date(dto.fechaFin);
    if (dto.diasSemana !== undefined)
      data.dias_semana = parseDiasSemana(dto.diasSemana);
    if (dto.horaInicio !== undefined)
      data.hora_inicio = parseHHMM(dto.horaInicio);
    if (dto.horaFin !== undefined) data.hora_fin = parseHHMM(dto.horaFin);

    const actualizado = await this.descuentoRepo.actualizarParcial(id, data);
    if (!actualizado) {
      throw new NotFoundException('Descuento no encontrado');
    }

    return {
      success: true,
      message: 'Descuento actualizado exitosamente',
      data: { id: actualizado.id, activo: actualizado.activo },
    };
  }
}
