import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../../common/prisma/prisma.service';
import { ensureInventoryStockTarget } from '../../../../common/prisma/inventory-stock-target';
import { RecibirCompraDto } from '../dtos/compra.dto';
import { BitacoraService } from '../../../bitacora/application/services/bitacora.service';
import {
  TipoActorBitacora,
  EntidadBitacora,
} from '../../../bitacora/domain/entities/bitacora-enums';

@Injectable()
export class RecibirCompraUseCase {
  constructor(
    private readonly prisma: PrismaService,
    private readonly bitacoraService: BitacoraService,
  ) {}

  async execute(compraId: string, dto: RecibirCompraDto, usuarioId: string) {
    const compra = await this.prisma.compra.findUnique({
      where: { id: BigInt(compraId) },
      include: { detalles: true },
    });

    if (!compra) {
      throw new NotFoundException('La orden de compra no existe');
    }

    if (compra.estado === 'RECIBIDA' || compra.estado === 'CANCELADA') {
      throw new BadRequestException(
        `No se pueden recibir ítems de una compra en estado ${compra.estado}`,
      );
    }

    const result = await this.prisma.$transaction(async (tx) => {
      let fleteTotal = Number(compra.costo_transporte || 0);
      if (dto.costo_transporte_adicional) {
        fleteTotal += dto.costo_transporte_adicional;
        await tx.compra.update({
          where: { id: compra.id },
          data: {
            costo_transporte: fleteTotal,
            total: Number(compra.subtotal) + fleteTotal,
          },
        });
      }

      const subtotalCompra = Number(compra.subtotal) || 1;

      for (const itemRecibido of dto.detalles_recibidos) {
        const detalle = compra.detalles.find(
          (d) => d.id.toString() === itemRecibido.detalle_id,
        );

        if (!detalle) {
          throw new BadRequestException(
            `El detalle de compra ${itemRecibido.detalle_id} no pertenece a esta orden`,
          );
        }

        const pendiente =
          detalle.cantidad_solicitada - detalle.cantidad_recibida;
        if (itemRecibido.cantidad_recibida > pendiente) {
          throw new BadRequestException(
            `La cantidad a recibir (${itemRecibido.cantidad_recibida}) supera la pendiente (${pendiente}) para este ítem`,
          );
        }

        // 1. Actualizar cantidad recibida en el detalle
        const nuevaCantidadRecibida =
          detalle.cantidad_recibida + itemRecibido.cantidad_recibida;
        await tx.compraDetalle.update({
          where: { id: detalle.id },
          data: { cantidad_recibida: nuevaCantidadRecibida },
        });

        // 2. Calcular prorrateo de flete por unidad
        const subtotalItem =
          Number(detalle.precio_costo) * itemRecibido.cantidad_recibida;
        const proporcionFlete = (subtotalItem / subtotalCompra) * fleteTotal;
        const fletePorUnidad = proporcionFlete / itemRecibido.cantidad_recibida;
        const costoUnitarioEfectivo =
          Number(detalle.precio_costo) + fletePorUnidad;

        // 3. Obtener stock e inventario actual
        const varianteId = await this.resolverVarianteInventario(
          tx,
          detalle.producto_id,
          detalle.variante_id,
          detalle.empaque_id,
        );
        const inv = await ensureInventoryStockTarget(
          tx,
          detalle.producto_id,
          varianteId,
        );

        const stockActual = inv.cantidad_disponible;

        // 4. Obtener costo promedio actual del producto
        const producto = await tx.producto.findUnique({
          where: { id: detalle.producto_id },
          select: { costo_promedio: true },
        });

        const costoPromedioActual = Number(producto?.costo_promedio || 0);

        // 5. Calcular nuevo Costo Promedio Ponderado
        const stockNuevo = stockActual + itemRecibido.cantidad_recibida;
        const costoPromedioNuevo =
          stockNuevo > 0
            ? (stockActual * costoPromedioActual +
                itemRecibido.cantidad_recibida * costoUnitarioEfectivo) /
              stockNuevo
            : costoUnitarioEfectivo;

        // Actualizar costo_promedio en producto
        await tx.producto.update({
          where: { id: detalle.producto_id },
          data: { costo_promedio: costoPromedioNuevo },
        });

        // 6. Incrementar stock disponible en inventario
        await tx.inventario.update({
          where: { id: inv.id },
          data: {
            cantidad_disponible: { increment: itemRecibido.cantidad_recibida },
          },
        });

        // 7. Registrar entrada en MovimientosInventario (Kardex)
        await tx.movimientosInventario.create({
          data: {
            producto_id: detalle.producto_id,
            variante_id: varianteId,
            tipo_movimiento: 'ENTRADA',
            cantidad: itemRecibido.cantidad_recibida,
            motivo: `Ingreso por Recepción de Compra #${compra.numero_nota}`,
            usuario_id: BigInt(usuarioId),
            tipo_documento_origen: 'COMPRA',
            documento_origen_id: compra.id,
          },
        });
      }

      // 8. Determinar nuevo estado de la orden
      const detallesActualizados = await tx.compraDetalle.findMany({
        where: { compra_id: compra.id },
      });

      const todosCompletos = detallesActualizados.every(
        (d) => d.cantidad_recibida >= d.cantidad_solicitada,
      );

      const nuevoEstado = todosCompletos ? 'RECIBIDA' : 'RECEPCION_PARCIAL';

      const compraFinal = await tx.compra.update({
        where: { id: compra.id },
        data: { estado: nuevoEstado },
        include: { detalles: true },
      });

      return compraFinal;
    });

    // Registrar bitácora de negocio
    await this.bitacoraService.registrar({
      tipo_actor: TipoActorBitacora.USUARIO,
      usuario_id: usuarioId,
      entidad: EntidadBitacora.COMPRA,
      entidad_id: compraId,
      operacion: 'RECEPCION_COMPRA',
      datos_nuevos: {
        estado: result.estado,
        detalles_recibidos: dto.detalles_recibidos,
      },
    });

    return {
      success: true,
      compraId: result.id.toString(),
      estado: result.estado,
    };
  }

  private async resolverVarianteInventario(
    tx: Prisma.TransactionClient,
    productoId: bigint,
    varianteId: bigint | null,
    empaqueId: bigint | null,
  ): Promise<bigint | null> {
    if (varianteId) return varianteId;

    if (empaqueId) {
      const empaque = await tx.empaque.findUnique({
        where: { id: empaqueId },
        select: { variante_id: true },
      });
      if (empaque) return empaque.variante_id;
    }

    const variantePorDefecto = await tx.variante.findFirst({
      where: { producto_id: productoId, activo: true },
      orderBy: { id: 'asc' },
      select: { id: true },
    });
    return variantePorDefecto?.id ?? null;
  }
}
