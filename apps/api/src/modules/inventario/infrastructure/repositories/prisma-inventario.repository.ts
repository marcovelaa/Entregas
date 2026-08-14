import { ConflictException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../../common/prisma/prisma.service';
import { IInventarioRepository } from '../../domain/repositories/inventario.repository.interface';

@Injectable()
export class PrismaInventarioRepository implements IInventarioRepository {
  constructor(private readonly prisma: PrismaService) {}

  async listarStock(params: { offset: number; limit: number }) {
    const [total, data] = await Promise.all([
      this.prisma.inventario.count(),
      this.prisma.inventario.findMany({
        skip: params.offset,
        take: params.limit,
        include: {
          producto: {
            select: {
              nombre: true,
              sku: true,
              categoria: { select: { nombre: true } },
            },
          },
          variante: {
            select: { nombre: true, sku_base: true },
          },
        },
      }),
    ]);

    const serializedData = data.map(
      (
        item: Prisma.InventarioGetPayload<{
          include: { variante: { select: { nombre: true; sku_base: true } } };
        }>,
      ) => ({
        ...item,
        id: item.id.toString(),
        producto_id: item.producto_id.toString(),
        variante_id: item.variante_id?.toString(),
      }),
    );

    return { total, data: serializedData };
  }

  async listarMovimientos(params: { offset: number; limit: number }) {
    const [total, data] = await Promise.all([
      this.prisma.movimientosInventario.count(),
      this.prisma.movimientosInventario.findMany({
        skip: params.offset,
        take: params.limit,
        orderBy: { creado_en: 'desc' },
        include: {
          producto: { select: { nombre: true, sku: true } },
          variante: { select: { nombre: true, sku_base: true } },
          usuario: { select: { nombres: true, apellidos: true } },
        },
      }),
    ]);

    const serializedData = data.map(
      (
        item: Prisma.MovimientosInventarioGetPayload<{
          include: {
            producto: { select: { nombre: true; sku: true } };
            variante: { select: { nombre: true; sku_base: true } };
            usuario: { select: { nombres: true; apellidos: true } };
          };
        }>,
      ) => ({
        ...item,
        id: item.id.toString(),
        producto_id: item.producto_id.toString(),
        variante_id: item.variante_id?.toString(),
        usuario_id: item.usuario_id?.toString(),
        documento_origen_id: item.documento_origen_id?.toString(),
      }),
    );

    return { total, data: serializedData };
  }

  async registrarMovimiento(
    data: {
      producto_id: bigint;
      variante_id?: bigint;
      empaque_id?: bigint;
      tipo_movimiento: string;
      cantidad: number;
      motivo?: string;
      usuario_id?: bigint;
    },
    tx?: any,
  ) {
    const execute = async (client: any) => {
      let targetVarianteId = data.variante_id;
      if (!targetVarianteId) {
        const defaultVar = await client.variante.findFirst({
          where: { producto_id: data.producto_id, activo: true },
          orderBy: { id: 'asc' },
        });
        if (defaultVar) {
          targetVarianteId = defaultVar.id;
        }
      }

      // 1. Registrar movimiento
      const mov = await client.movimientosInventario.create({
        data: {
          producto_id: data.producto_id,
          variante_id: targetVarianteId,
          tipo_movimiento: data.tipo_movimiento,
          cantidad: data.cantidad,
          motivo: data.motivo,
          usuario_id: data.usuario_id,
        },
      });

      // 2. Actualizar stock
      const stockItem = await client.inventario.findFirst({
        where: {
          producto_id: data.producto_id,
          variante_id: targetVarianteId || null,
        },
      });

      const cantidadDelta = data.tipo_movimiento.includes('INGRESO')
        ? data.cantidad
        : -data.cantidad;

      if (stockItem) {
        if (
          !data.tipo_movimiento.includes('INGRESO') &&
          stockItem.cantidad_disponible + cantidadDelta < 0
        ) {
          throw new ConflictException(
            'Stock insuficiente para realizar este movimiento negativo.',
          );
        }
        await client.inventario.update({
          where: { id: stockItem.id },
          data: { cantidad_disponible: { increment: cantidadDelta } },
        });
      } else {
        if (!data.tipo_movimiento.includes('INGRESO')) {
          throw new ConflictException(
            'Stock insuficiente, no hay registro previo para este producto.',
          );
        }
        await client.inventario.create({
          data: {
            producto_id: data.producto_id,
            variante_id: targetVarianteId,
            cantidad_disponible: cantidadDelta,
            ubicacion: 'PRINCIPAL',
          },
        });
      }

      return mov;
    };

    return tx ? execute(tx) : this.prisma.$transaction(execute);
  }
}
