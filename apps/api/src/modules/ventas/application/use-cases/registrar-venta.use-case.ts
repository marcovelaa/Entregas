import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import {
  type IVentaRepository,
  VENTA_REPOSITORY,
} from '../../domain/repositories/venta.repository.interface';
import {
  type ICajaRepository,
  CAJA_REPOSITORY,
} from '../../../caja/domain/repositories/caja.repository.interface';
import { RegistrarVentaDto } from '../dtos/venta.dto';

@Injectable()
export class RegistrarVentaUseCase {
  constructor(
    @Inject(VENTA_REPOSITORY)
    private readonly ventaRepo: IVentaRepository,
    @Inject(CAJA_REPOSITORY)
    private readonly cajaRepo: ICajaRepository,
  ) {}

  async execute(dto: RegistrarVentaDto, usuario_id: string) {
    const cajaActiva = await this.cajaRepo.obtenerCajaActiva();
    if (!cajaActiva) {
      throw new BadRequestException(
        'No hay una caja abierta para registrar ventas POS.',
      );
    }

    const data = {
      cliente_id: dto.cliente_id,
      usuario_id,
      caja_id: cajaActiva.id,
      idempotency_key: dto.idempotency_key,
      metodo_pago: dto.metodo_pago,
      monto_pagado: dto.monto_pagado,
      descuento_id: dto.descuento_id,
      codigo_cupon: dto.codigo_cupon,
      aprobador_usuario_id: dto.aprobador_usuario_id,
      motivo_ajuste: dto.motivo_ajuste,
      reserva_id: dto.reserva_id,
      detalles: dto.detalles,
    };

    return { data: await this.ventaRepo.crear(data) };
  }
}
