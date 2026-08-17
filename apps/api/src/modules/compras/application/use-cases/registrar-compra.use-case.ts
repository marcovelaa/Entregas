import type { ICompraRepository } from '../../domain/repositories/compra.repository.interface';
import { COMPRA_REPOSITORY } from '../../domain/repositories/compra.repository.interface';
import { RegistrarCompraDto } from '../dtos/compra.dto';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../../common/prisma/prisma.service';
import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { BitacoraService } from '../../../bitacora/application/services/bitacora.service';
import { TipoActorBitacora, EntidadBitacora } from '../../../bitacora/domain/entities/bitacora-enums';

@Injectable()
export class RegistrarCompraUseCase {
  constructor(
    @Inject(COMPRA_REPOSITORY) private readonly compraRepo: ICompraRepository,
    private readonly prisma: PrismaService,
    private readonly bitacoraService: BitacoraService,
  ) {}

  async execute(dto: RegistrarCompraDto, usuario_id: string) {
    if (!usuario_id) {
      throw new UnauthorizedException('Authenticated user is required');
    }

    let subtotal = 0;
    const detalles = dto.detalles.map((d) => {
      const sub = d.cantidad * d.costo_unitario;
      subtotal += sub;
      return {
        producto_id: BigInt(d.producto_id),
        variante_id: d.variante_id ? BigInt(d.variante_id) : undefined,
        empaque_id: d.empaque_id ? BigInt(d.empaque_id) : undefined,
        cantidad: d.cantidad,
        costo_unitario: d.costo_unitario,
        precio_venta: d.precio_venta,
      };
    });

    const estadoInicial = dto.estado || 'BORRADOR';
    const costoTransporte = dto.costo_transporte || 0;
    const total = subtotal + costoTransporte;

    const result = await this.prisma.$transaction(
      async (tx: Prisma.TransactionClient) => {
        // 1. Crear la compra
        const compra = await this.compraRepo.crear(
          {
            proveedor_id: dto.proveedor_id
              ? BigInt(dto.proveedor_id)
              : undefined,
            usuario_id: BigInt(usuario_id),
            numero_recibo: dto.numero_recibo,
            costo_transporte: costoTransporte,
            subtotal,
            total,
            estado: estadoInicial,
            observaciones: dto.observaciones,
            detalles,
          },
          tx,
        );

        // 2. Si se crea directamente como RECIBIDA o COMPLETADO, procesar ingreso de inventario
        if (estadoInicial === 'RECIBIDA' || estadoInicial === 'COMPLETADO') {
          for (const d of detalles) {
            let inv = await tx.inventario.findFirst({
              where: { producto_id: d.producto_id },
            });

            if (!inv) {
              inv = await tx.inventario.create({
                data: {
                  producto_id: d.producto_id,
                  cantidad_disponible: 0,
                  reservado: 0,
                },
              });
            }

            const stockActual = inv.cantidad_disponible;
            const producto = await tx.producto.findUnique({
              where: { id: d.producto_id },
              select: { costo_promedio: true },
            });
            const costoPromedioActual = Number(producto?.costo_promedio || 0);

            // Prorrateo de flete
            const subtotalItem = d.cantidad * d.costo_unitario;
            const proporcionFlete = subtotal > 0 ? (subtotalItem / subtotal) * costoTransporte : 0;
            const costoEfectivo = d.costo_unitario + (proporcionFlete / d.cantidad);

            const stockNuevo = stockActual + d.cantidad;
            const costoPromedioNuevo =
              stockNuevo > 0
                ? (stockActual * costoPromedioActual + d.cantidad * costoEfectivo) / stockNuevo
                : costoEfectivo;

            await tx.producto.update({
              where: { id: d.producto_id },
              data: { 
                costo_promedio: costoPromedioNuevo,
                ...(d.precio_venta && d.precio_venta > 0 && !d.variante_id ? { precio_base: d.precio_venta } : {})
              },
            });

            if (d.variante_id && d.precio_venta && d.precio_venta > 0) {
              await tx.variante.update({
                where: { id: d.variante_id },
                data: { precio_unitario: d.precio_venta },
              });
            }

            await tx.inventario.update({
              where: { id: inv.id },
              data: { cantidad_disponible: { increment: d.cantidad } },
            });

            await tx.movimientosInventario.create({
              data: {
                producto_id: d.producto_id,
                tipo_movimiento: 'ENTRADA',
                cantidad: d.cantidad,
                motivo: 'Ingreso por Compra',
                usuario_id: BigInt(usuario_id),
                tipo_documento_origen: 'COMPRA',
                documento_origen_id: compra.id,
              },
            });
          }
        }

        return compra;
      },
    );

    await this.bitacoraService.registrar({
      tipo_actor: TipoActorBitacora.USUARIO,
      usuario_id,
      entidad: EntidadBitacora.COMPRA,
      entidad_id: result.id.toString(),
      operacion: 'CREAR_COMPRA',
      datos_nuevos: {
        estado: result.estado,
        total: Number(result.total),
      },
    });

    return { success: true, compraId: result.id.toString(), estado: result.estado };
  }
}
