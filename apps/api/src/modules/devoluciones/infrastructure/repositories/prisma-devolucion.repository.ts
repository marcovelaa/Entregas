import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../common/prisma/prisma.service';
import {
  EstadoDevolucion,
  ResolucionDevolucion,
  DestinoFisicoItem,
} from '../../domain/entities/devolucion-enums';
import {
  IDevolucionRepository,
  DevolucionCreateData,
  DevolucionData,
} from '../../domain/repositories/devolucion.repository.interface';

@Injectable()
export class PrismaDevolucionRepository implements IDevolucionRepository {
  constructor(private readonly prisma: PrismaService) {}

  async crear(data: DevolucionCreateData): Promise<DevolucionData> {
    const registro = await this.prisma.devolucion.create({
      data: {
        pedido_id: BigInt(data.pedido_id),
        cliente_id: BigInt(data.cliente_id),
        motivo: data.motivo,
        estado: EstadoDevolucion.SOLICITADA,
        detalles: {
          create: data.detalles.map((d) => ({
            pedido_detalle_id: BigInt(d.pedido_detalle_id),
            producto_id: BigInt(d.producto_id),
            cantidad: d.cantidad,
            motivo_item: d.motivo_item || null,
          })),
        },
      },
      include: {
        detalles: true,
      },
    });
    return this.serialize(registro);
  }

  async obtenerPorId(id: string): Promise<DevolucionData | null> {
    const registro = await this.prisma.devolucion.findUnique({
      where: { id: BigInt(id) },
      include: { detalles: true },
    });
    return registro ? this.serialize(registro) : null;
  }

  async listarPorCliente(clienteId: string): Promise<DevolucionData[]> {
    const registros = await this.prisma.devolucion.findMany({
      where: { cliente_id: BigInt(clienteId) },
      orderBy: { creado_en: 'desc' },
      include: { detalles: true },
    });
    return registros.map((r) => this.serialize(r));
  }

  async listarErp(params: {
    offset: number;
    limit: number;
    estado?: EstadoDevolucion;
  }): Promise<{ total: number; data: DevolucionData[] }> {
    const where: any = {};
    if (params.estado) {
      where.estado = params.estado;
    }

    const [total, data] = await Promise.all([
      this.prisma.devolucion.count({ where }),
      this.prisma.devolucion.findMany({
        where,
        skip: params.offset,
        take: params.limit,
        orderBy: { creado_en: 'desc' },
        include: { detalles: true },
      }),
    ]);

    return {
      total,
      data: data.map((r) => this.serialize(r)),
    };
  }

  async evaluarYRestock(
    id: string,
    evaluacion: {
      estado: EstadoDevolucion;
      resolucion: ResolucionDevolucion;
      destinoFisico: DestinoFisicoItem;
      montoReembolso?: number | null;
      notasEvaluacion?: string | null;
      evaluadoPorUsuarioId: string;
    },
  ): Promise<DevolucionData> {
    return this.prisma.$transaction(async (tx) => {
      const devolucionActualizada = await tx.devolucion.update({
        where: { id: BigInt(id) },
        data: {
          estado: evaluacion.estado,
          resolucion: evaluacion.resolucion,
          destino_fisico: evaluacion.destinoFisico,
          monto_reembolso: evaluacion.montoReembolso ?? null,
          notas_evaluacion: evaluacion.notasEvaluacion ?? null,
          evaluado_por_usuario_id: BigInt(evaluacion.evaluadoPorUsuarioId),
          evaluado_en: new Date(),
        },
        include: {
          detalles: {
            include: {
              pedido_detalle: {
                select: {
                  variante_id: true,
                  empaque: { select: { variante_id: true } },
                },
              },
            },
          },
        },
      });

      // Si fue aprobada o completada con destino RESTOCK en inventario
      if (
        (evaluacion.estado === EstadoDevolucion.APROBADA ||
          evaluacion.estado === EstadoDevolucion.COMPLETADA) &&
        evaluacion.destinoFisico === DestinoFisicoItem.INVENTARIO_RESTOCK
      ) {
        for (const d of devolucionActualizada.detalles) {
          const varianteId =
            d.pedido_detalle.variante_id ??
            d.pedido_detalle.empaque?.variante_id ??
            null;
          const inv = await tx.inventario.findFirst({
            where: {
              producto_id: d.producto_id,
              variante_id: varianteId,
            },
          });

          if (inv) {
            await tx.inventario.update({
              where: { id: inv.id },
              data: {
                cantidad_disponible: { increment: d.cantidad },
              },
            });

            await tx.movimientosInventario.create({
              data: {
                producto_id: d.producto_id,
                variante_id: varianteId ?? undefined,
                tipo_movimiento: 'ENTRADA',
                cantidad: d.cantidad,
                motivo: `Devolución Aprobada #${devolucionActualizada.public_id}`,
                usuario_id: BigInt(evaluacion.evaluadoPorUsuarioId),
                tipo_documento_origen: 'DEVOLUCION',
                documento_origen_id: devolucionActualizada.id,
              },
            });
          }
        }
      }

      return this.serialize(devolucionActualizada);
    });
  }

  private serialize(registro: any): DevolucionData {
    return {
      id: registro.id.toString(),
      public_id: registro.public_id,
      pedido_id: registro.pedido_id.toString(),
      cliente_id: registro.cliente_id.toString(),
      estado: registro.estado as EstadoDevolucion,
      motivo: registro.motivo,
      resolucion: registro.resolucion as ResolucionDevolucion,
      destino_fisico: registro.destino_fisico as DestinoFisicoItem,
      monto_reembolso: registro.monto_reembolso
        ? Number(registro.monto_reembolso)
        : null,
      notas_evaluacion: registro.notas_evaluacion,
      evaluado_por_usuario_id: registro.evaluado_por_usuario_id
        ? registro.evaluado_por_usuario_id.toString()
        : null,
      evaluado_en: registro.evaluado_en,
      creado_en: registro.creado_en,
      actualizado_en: registro.actualizado_en,
      detalles: (registro.detalles || []).map((d: any) => ({
        id: d.id.toString(),
        pedido_detalle_id: d.pedido_detalle_id.toString(),
        producto_id: d.producto_id.toString(),
        cantidad: d.cantidad,
        motivo_item: d.motivo_item,
      })),
    };
  }
}
