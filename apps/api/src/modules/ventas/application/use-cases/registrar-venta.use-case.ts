import { IVentaRepository } from '../../domain/repositories/venta.repository.interface';
import { RegistrarVentaDto } from '../dtos/venta.dto';

export class RegistrarVentaUseCase {
  constructor(private readonly ventaRepo: IVentaRepository) {}

  async execute(dto: RegistrarVentaDto, usuario_id: string) {
    const data = {
      cliente_id: dto.cliente_id,
      usuario_id,
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
