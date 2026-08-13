import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import {
  PEDIDO_REPOSITORY,
  type IPedidoRepository,
  type PedidoData,
} from '../../domain/repositories/pedido.repository.interface';
import { CrearPedidoDto } from '../dtos/crear-pedido.dto';

@Injectable()
export class CrearPedidoUseCase {
  constructor(
    @Inject(PEDIDO_REPOSITORY)
    private readonly pedidoRepo: IPedidoRepository,
  ) {}

  async execute(
    dto: CrearPedidoDto,
    clienteId?: string | null,
  ): Promise<PedidoData> {
    if (!dto.detalles || dto.detalles.length === 0) {
      throw new BadRequestException('El pedido debe tener al menos un ítem');
    }

    let subtotal = 0;
    const detallesData = dto.detalles.map((item) => {
      const itemSubtotal = item.precio_unitario * item.cantidad;
      subtotal += itemSubtotal;
      return {
        producto_id: item.producto_id,
        variante_id: item.variante_id || null,
        empaque_id: item.empaque_id || null,
        nombre_producto: item.nombre_producto,
        sku: item.sku || null,
        precio_unitario: item.precio_unitario,
        cantidad: item.cantidad,
        subtotal: itemSubtotal,
        imagen_url: item.imagen_url || null,
      };
    });

    const costoEnvio = dto.costo_envio || 0;
    const total = subtotal + costoEnvio;

    return this.pedidoRepo.crear({
      cliente_id: clienteId || null,
      reserva_id: dto.reserva_id || null,
      direccion_envio_snapshot: {
        destinatario_nombre: dto.direccion_envio.destinatario_nombre,
        destinatario_apellidos: dto.direccion_envio.destinatario_apellidos,
        direccion_completa: dto.direccion_envio.direccion_completa,
        ciudad: dto.direccion_envio.ciudad,
        telefono: dto.direccion_envio.telefono,
        referencia: dto.direccion_envio.referencia || null,
      },
      costo_envio: costoEnvio,
      subtotal,
      descuento_total: 0,
      total,
      metodo_pago: dto.metodo_pago || 'QR',
      notas: dto.notas || null,
      detalles: detallesData,
    });
  }
}
