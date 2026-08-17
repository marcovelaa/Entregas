import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import { type IGastosRepository, GASTOS_REPOSITORY } from '../../domain/repositories/gastos.repository.interface';
import { CrearGastoDto } from '../dtos/crear-gasto.dto';

@Injectable()
export class CrearGastoUseCase {
  constructor(
    @Inject(GASTOS_REPOSITORY)
    private readonly repo: IGastosRepository,
  ) {}

  async execute(usuarioId: string, dto: CrearGastoDto) {
    if (!usuarioId) {
      throw new BadRequestException('Se requiere usuarioId para registrar un gasto');
    }
    
    return this.repo.crear({
      usuario_id: usuarioId,
      categoria: dto.categoria,
      descripcion: dto.descripcion,
      monto: dto.monto,
      fecha_gasto: dto.fecha_gasto ? new Date(dto.fecha_gasto) : undefined,
    });
  }
}
