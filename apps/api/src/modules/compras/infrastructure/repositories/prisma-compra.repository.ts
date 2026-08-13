import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../../common/prisma/prisma.service';
import {
  ICompraRepository,
  CompraCreateData,
} from '../../domain/repositories/compra.repository.interface';

@Injectable()
export class PrismaCompraRepository implements ICompraRepository {
  constructor(private readonly prisma: PrismaService) {}

  async crear(
    data: CompraCreateData,
    tx?: any,
  ): Promise<Prisma.CompraGetPayload<Record<string, never>>> {
    const execute = async (client: any) => {
      const costoTransporte = data.costo_transporte || 0;
      const subtotal = data.subtotal || data.total;
      const total = subtotal + costoTransporte;

      const compra = await client.compra.create({
        data: {
          proveedor_id: data.proveedor_id,
          usuario_id: data.usuario_id,
          numero_nota: data.numero_recibo || 'S/N',
          costo_transporte: costoTransporte,
          subtotal,
          total,
          notas: data.observaciones,
          estado: data.estado || 'BORRADOR',
          detalles: {
            create: data.detalles.map((d) => ({
              producto_id: d.producto_id,
              variante_id: d.variante_id,
              empaque_id: d.empaque_id,
              cantidad_solicitada: d.cantidad,
              cantidad_recibida: data.estado === 'RECIBIDA' || data.estado === 'COMPLETADO' ? d.cantidad : 0,
              precio_costo: d.costo_unitario,
              subtotal: d.cantidad * d.costo_unitario,
            })),
          },
        },
        include: {
          detalles: true,
        },
      });

      return compra;
    };

    return tx ? execute(tx) : this.prisma.$transaction(execute);
  }

  async listar(params: {
    offset: number;
    limit: number;
  }): Promise<{ total: number; data: any[] }> {
    const [total, data] = await Promise.all([
      this.prisma.compra.count(),
      this.prisma.compra.findMany({
        skip: params.offset,
        take: params.limit,
        orderBy: { creado_en: 'desc' },
        include: {
          proveedor: { select: { nombre: true } },
          usuario: { select: { nombres: true, apellidos: true } },
        },
      }),
    ]);

    const serializedData = data.map((c) => ({
      ...c,
      id: c.id.toString(),
      proveedor_id: c.proveedor_id?.toString(),
      usuario_id: c.usuario_id?.toString() || null,
      costo_transporte: Number(c.costo_transporte),
      subtotal: Number(c.subtotal),
      total: Number(c.total),
    }));

    return { total, data: serializedData };
  }

  async obtenerPorId(id: string): Promise<any> {
    const compra = await this.prisma.compra.findUnique({
      where: { id: BigInt(id) },
      include: {
        proveedor: { select: { nombre: true } },
        usuario: { select: { nombres: true, apellidos: true } },
        detalles: {
          include: {
            producto: { select: { nombre: true, sku: true, costo_promedio: true } },
            variante: { select: { nombre: true, sku_base: true } },
            empaque: { select: { nombre: true, multiplicador_unidades: true } },
          },
        },
      },
    });

    if (!compra) return null;

    return {
      ...compra,
      id: compra.id.toString(),
      proveedor_id: compra.proveedor_id?.toString(),
      usuario_id: compra.usuario_id?.toString() || null,
      costo_transporte: Number(compra.costo_transporte),
      subtotal: Number(compra.subtotal),
      total: Number(compra.total),
      detalles: compra.detalles.map((d: any) => ({
        ...d,
        id: d.id.toString(),
        compra_id: d.compra_id.toString(),
        producto_id: d.producto_id.toString(),
        variante_id: d.variante_id?.toString(),
        cantidad: d.cantidad_solicitada,
        cantidad_solicitada: d.cantidad_solicitada,
        cantidad_recibida: d.cantidad_recibida,
        precio_costo: Number(d.precio_costo),
        costo_unitario: Number(d.precio_costo),
        subtotal: Number(d.subtotal),
        producto: d.producto ? {
          ...d.producto,
          costo_promedio: Number(d.producto.costo_promedio || 0),
        } : null,
      })),
    };
  }
}
