import { IVentaRepository } from '../../domain/repositories/venta.repository.interface';
import { RegistrarVentaDto } from '../dtos/venta.dto';

export class RegistrarVentaUseCase {
  constructor(private readonly ventaRepo: IVentaRepository) {}

  async execute(dto: RegistrarVentaDto, usuario_id: string) {
    const subtotalBruto = dto.detalles.reduce((acc, item) => acc + item.cantidad * item.precio_unitario, 0);
    const descuentoTotal = dto.descuento_total || 0;
    const totalNeto = Math.max(0, subtotalBruto - descuentoTotal);
    const vuelto = Math.max(0, dto.monto_pagado - totalNeto);

    if (dto.metodo_pago === 'EFECTIVO' && dto.monto_pagado < totalNeto) {
      throw new Error('El monto pagado es menor al total de la venta.');
    }

    const data = {
      cliente_id: dto.cliente_id,
      usuario_id,
      metodo_pago: dto.metodo_pago,
      monto_pagado: dto.monto_pagado,
      descuento_id: dto.descuento_id,
      descuento_total: descuentoTotal,
      codigo_cupon: dto.codigo_cupon,
      aprobador_usuario_id: dto.aprobador_usuario_id,
      motivo_ajuste: dto.motivo_ajuste,
      detalles: dto.detalles,
    };

    return { data: await this.ventaRepo.crear(data, totalNeto, vuelto) };
  }
}
