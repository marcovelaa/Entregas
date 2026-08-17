import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../common/prisma/prisma.service';

@Injectable()
export class GetDetalleTicketUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(numeroTicket: string) {
    const venta = await this.prisma.venta.findUnique({
      where: { numero_ticket: numeroTicket },
      include: {
        cliente: { select: { nombre: true, documento_id: true, email: true, telefono: true, direccion: true } },
        usuario: { select: { nombres: true, apellidos: true } },
        detalles: {
          include: {
            producto: { select: { nombre: true, sku: true } },
            variante: { select: { nombre: true, sku_base: true } },
            aprobado_por_usuario: { select: { nombres: true, apellidos: true } }
          }
        }
      }
    });

    if (!venta) {
      return { success: false, message: 'Ticket no encontrado' };
    }

    return {
      success: true,
      data: {
        id: venta.id.toString(),
        numeroTicket: venta.numero_ticket,
        fecha: venta.creado_en,
        metodoPago: venta.metodo_pago,
        total: Number(venta.total),
        montoPagado: Number(venta.monto_pagado),
        descuentoTotal: Number(venta.descuento_total),
        vuelto: Number(venta.vuelto),
        estado: venta.estado,
        canalVenta: venta.canal_venta,
        motivoAnulacion: venta.motivo_anulacion,
        cliente: venta.cliente,
        vendedor: `${venta.usuario.nombres} ${venta.usuario.apellidos}`.trim(),
        detalles: venta.detalles.map(d => ({
          id: d.id.toString(),
          producto: d.producto.nombre,
          variante: d.variante?.nombre || null,
          sku: d.variante?.sku_base || d.producto.sku,
          cantidad: d.cantidad,
          precioUnitario: Number(d.precio_unitario),
          subtotal: Number(d.subtotal),
          motivoAjuste: d.motivo_ajuste,
          aprobador: d.aprobado_por_usuario ? `${d.aprobado_por_usuario.nombres} ${d.aprobado_por_usuario.apellidos}`.trim() : null
        }))
      }
    };
  }
}
