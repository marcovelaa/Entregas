import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import { type ICajaRepository, CAJA_REPOSITORY } from '../../domain/repositories/caja.repository.interface';
import { AbrirCajaDto } from '../dtos/caja.dto';

@Injectable()
export class AbrirCajaUseCase {
  constructor(
    @Inject(CAJA_REPOSITORY)
    private readonly cajaRepo: ICajaRepository,
  ) {}

  async execute(usuario_id: string, dto: AbrirCajaDto) {
    const cajaActiva = await this.cajaRepo.obtenerCajaActiva();
    if (cajaActiva) {
      throw new BadRequestException('Ya existe una caja abierta en el sistema. Debe cerrarla antes de abrir otra.');
    }
    
    return this.cajaRepo.abrirCaja(usuario_id, dto.monto_apertura);
  }
}
