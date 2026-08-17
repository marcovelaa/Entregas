import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../common/prisma/prisma.service';
import { EstadoPedido } from '../../domain/entities/estado-pedido.enum';
import {
  IPedidoRepository,
  PedidoCreateData,
  PedidoData,
} from '../../domain/repositories/pedido.repository.interface';

@Injectable()
export class PrismaPedidoRepository implements IPedidoRepository {
  constructor(private readonly prisma: PrismaService) {}

  async crear(data: PedidoCreateData): Promise<PedidoData> {
    const pedido = await this.prisma.pedido.create({
      data: {
        cliente_id: data.cliente_id ? BigInt(data.cliente_id) : null,
        reserva_id: data.reserva_id ? BigInt(data.reserva_id) : null,
        estado: EstadoPedido.PENDIENTE_PAGO,
        direccion_envio_snapshot: data.direccion_envio_snapshot as any,
        costo_envio: data.costo_envio,
        subtotal: data.subtotal,
        descuento_total: data.descuento_total,
        total: data.total,
        metodo_pago: data.metodo_pago || 'QR',
        notas: data.notas || null,
        detalles: {
          create: data.detalles.map((d) => ({
            producto_id: BigInt(d.producto_id),
            variante_id: d.variante_id ? BigInt(d.variante_id) : null,
            empaque_id: d.empaque_id ? BigInt(d.empaque_id) : null,
            nombre_producto: d.nombre_producto,
            sku: d.sku || null,
            precio_unitario: d.precio_unitario,
            cantidad: d.cantidad,
            subtotal: d.subtotal,
            imagen_url: d.imagen_url || null,
          })),
        },
        historialEstado: {
          create: {
            estado_anterior: null,
            estado_nuevo: EstadoPedido.PENDIENTE_PAGO,
            cambiado_por_cliente_id: data.cliente_id
              ? BigInt(data.cliente_id)
              : null,
            motivo: 'Creación de pedido',
          },
        },
      },
      include: {
        detalles: true,
        historialEstado: {
          orderBy: { creado_en: 'asc' },
        },
      },
    });

    return this.serialize(pedido);
  }

  async obtenerPorId(id: string): Promise<PedidoData | null> {
    const pedido = await this.prisma.pedido.findUnique({
      where: { id: BigInt(id) },
      include: {
        detalles: true,
        historialEstado: {
          orderBy: { creado_en: 'asc' },
        },
      },
    });
    return pedido ? this.serialize(pedido) : null;
  }

  async obtenerPorNumeroPedido(numeroPedido: string): Promise<PedidoData | null> {
    const pedido = await this.prisma.pedido.findUnique({
      where: { numero_pedido: numeroPedido },
      include: {
        detalles: true,
        historialEstado: {
          orderBy: { creado_en: 'asc' },
        },
      },
    });
    return pedido ? this.serialize(pedido) : null;
  }

  async listarPorCliente(clienteId: string): Promise<PedidoData[]> {
    const pedidos = await this.prisma.pedido.findMany({
      where: { cliente_id: BigInt(clienteId) },
      orderBy: { creado_en: 'desc' },
      include: {
        detalles: true,
        historialEstado: {
          orderBy: { creado_en: 'asc' },
        },
      },
    });
    return pedidos.map((p) => this.serialize(p));
  }

  async listarErp(params: {
    offset: number;
    limit: number;
    estado?: EstadoPedido;
    buscar?: string;
  }): Promise<{ total: number; data: PedidoData[] }> {
    const where: any = {};
    if (params.estado) {
      where.estado = params.estado;
    }
    if (params.buscar) {
      where.OR = [
        { numero_pedido: { contains: params.buscar, mode: 'insensitive' } },
        { notas: { contains: params.buscar, mode: 'insensitive' } },
      ];
    }

    const [total, data] = await Promise.all([
      this.prisma.pedido.count({ where }),
      this.prisma.pedido.findMany({
        where,
        skip: params.offset,
        take: params.limit,
        orderBy: { creado_en: 'desc' },
        include: {
          cliente: true,
          preparador: { select: { nombres: true, apellidos: true } },
          repartidor: { select: { nombres: true, apellidos: true } },
          detalles: true,
          historialEstado: {
            orderBy: { creado_en: 'asc' },
          },
        },
      }),
    ]);

    return {
      total,
      data: data.map((p) => this.serialize(p)),
    };
  }

  async actualizarEstado(
    pedidoId: string,
    nuevoEstado: EstadoPedido,
    historial: {
      estadoAnterior: EstadoPedido;
      cambiadoPorUsuarioId?: string | null;
      cambiadoPorClienteId?: string | null;
      motivo?: string | null;
      costoEnvio?: number;
    },
  ): Promise<PedidoData> {
    const pedido = await this.prisma.$transaction(async (tx) => {
      const p = await tx.pedido.update({
        where: { id: BigInt(pedidoId) },
        data: {
          estado: nuevoEstado,
          costo_envio: historial.costoEnvio !== undefined ? historial.costoEnvio : undefined,
          preparador_id:
            nuevoEstado === EstadoPedido.EN_PREPARACION && historial.cambiadoPorUsuarioId
              ? BigInt(historial.cambiadoPorUsuarioId)
              : undefined,
          repartidor_id:
            nuevoEstado === EstadoPedido.ENVIADO && historial.cambiadoPorUsuarioId
              ? BigInt(historial.cambiadoPorUsuarioId)
              : undefined,
          historialEstado: {
            create: {
              estado_anterior: historial.estadoAnterior,
              estado_nuevo: nuevoEstado,
              cambiado_por_usuario_id: historial.cambiadoPorUsuarioId
                ? BigInt(historial.cambiadoPorUsuarioId)
                : null,
              cambiado_por_cliente_id: historial.cambiadoPorClienteId
                ? BigInt(historial.cambiadoPorClienteId)
                : null,
              motivo: historial.motivo || null,
            },
          },
        },
        include: {
          cliente: true,
          preparador: { select: { nombres: true, apellidos: true } },
          repartidor: { select: { nombres: true, apellidos: true } },
          detalles: true,
          historialEstado: {
            orderBy: { creado_en: 'asc' },
          },
        },
      });

      if (historial.costoEnvio !== undefined && historial.costoEnvio > 0 && historial.cambiadoPorUsuarioId) {
        await tx.gastoOperativo.create({
          data: {
            usuario_id: BigInt(historial.cambiadoPorUsuarioId),
            categoria: 'LOGISTICA',
            descripcion: `Delivery subsidiado (Pedido #${p.numero_pedido})`,
            monto: historial.costoEnvio,
          },
        });
      }

      return p;
    });

    return this.serialize(pedido);
  }

  private serialize(pedido: any): PedidoData {
    return {
      id: pedido.id.toString(),
      numero_pedido: pedido.numero_pedido,
      cliente_id: pedido.cliente_id ? pedido.cliente_id.toString() : null,
      reserva_id: pedido.reserva_id ? pedido.reserva_id.toString() : null,
      preparador_id: pedido.preparador_id ? pedido.preparador_id.toString() : null,
      repartidor_id: pedido.repartidor_id ? pedido.repartidor_id.toString() : null,
      nombre_preparador: pedido.preparador ? `${pedido.preparador.nombres} ${pedido.preparador.apellidos || ''}`.trim() : null,
      nombre_repartidor: pedido.repartidor ? `${pedido.repartidor.nombres} ${pedido.repartidor.apellidos || ''}`.trim() : null,
      estado: pedido.estado as EstadoPedido,
      direccion_envio_snapshot: pedido.direccion_envio_snapshot as any,
      costo_envio: Number(pedido.costo_envio),
      subtotal: Number(pedido.subtotal),
      descuento_total: Number(pedido.descuento_total),
      total: Number(pedido.total),
      metodo_pago: pedido.metodo_pago,
      notas: pedido.notas,
      creado_en: pedido.creado_en,
      actualizado_en: pedido.actualizado_en,
      detalles: (pedido.detalles || []).map((d: any) => ({
        id: d.id.toString(),
        producto_id: d.producto_id.toString(),
        variante_id: d.variante_id ? d.variante_id.toString() : null,
        empaque_id: d.empaque_id ? d.empaque_id.toString() : null,
        nombre_producto: d.nombre_producto,
        sku: d.sku,
        precio_unitario: Number(d.precio_unitario),
        cantidad: d.cantidad,
        subtotal: Number(d.subtotal),
        imagen_url: d.imagen_url,
      })),
      historialEstado: (pedido.historialEstado || []).map((h: any) => ({
        id: h.id.toString(),
        estado_anterior: h.estado_anterior,
        estado_nuevo: h.estado_nuevo,
        cambiado_por_usuario_id: h.cambiado_por_usuario_id
          ? h.cambiado_por_usuario_id.toString()
          : null,
        cambiado_por_cliente_id: h.cambiado_por_cliente_id
          ? h.cambiado_por_cliente_id.toString()
          : null,
        motivo: h.motivo,
        creado_en: h.creado_en,
      })),
    };
  }
}
