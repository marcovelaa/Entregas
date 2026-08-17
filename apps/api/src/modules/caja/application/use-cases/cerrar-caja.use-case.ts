import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import { type ICajaRepository, CAJA_REPOSITORY } from '../../domain/repositories/caja.repository.interface';
import { CerrarCajaDto } from '../dtos/caja.dto';

@Injectable()
export class CerrarCajaUseCase {
  constructor(
    @Inject(CAJA_REPOSITORY)
    private readonly cajaRepo: ICajaRepository,
  ) {}

  async execute(caja_id: string, dto: CerrarCajaDto) {
    const cajaActiva = await this.cajaRepo.obtenerCajaActiva();
    if (!cajaActiva || cajaActiva.id !== caja_id) {
      throw new BadRequestException('La caja especificada no está abierta.');
    }

    const montoEsperado = await this.cajaRepo.calcularEfectivoEsperado(caja_id);
    const diferencia = dto.monto_cierre_real - montoEsperado;

    return this.cajaRepo.cerrarCaja(caja_id, montoEsperado, dto.monto_cierre_real, diferencia, dto.observaciones);
  }
}
