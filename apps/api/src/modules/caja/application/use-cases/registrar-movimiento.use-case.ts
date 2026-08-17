import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import { type ICajaRepository, CAJA_REPOSITORY } from '../../domain/repositories/caja.repository.interface';
import { RegistrarMovimientoDto } from '../dtos/caja.dto';

@Injectable()
export class RegistrarMovimientoUseCase {
  constructor(
    @Inject(CAJA_REPOSITORY)
    private readonly cajaRepo: ICajaRepository,
  ) {}

  async execute(usuario_id: string, dto: RegistrarMovimientoDto) {
    const cajaActiva = await this.cajaRepo.obtenerCajaActiva();
    if (!cajaActiva) {
      throw new BadRequestException('No hay una caja abierta para registrar movimientos.');
    }

    return this.cajaRepo.registrarMovimiento({
      caja_id: cajaActiva.id,
      usuario_id,
      tipo_movimiento: dto.tipo_movimiento,
      concepto: dto.concepto,
      monto: dto.monto,
      metodo_pago: dto.metodo_pago || 'EFECTIVO'
    });
  }
}
