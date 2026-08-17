import {
  Injectable,
  NotFoundException,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../../../../common/prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { BitacoraService } from '../../../bitacora/application/services/bitacora.service';
import {
  TipoActorBitacora,
  EntidadBitacora,
} from '../../../bitacora/domain/entities/bitacora-enums';

@Injectable()
export class AnularCompraUseCase {
  constructor(
    private readonly prisma: PrismaService,
    private readonly bitacoraService: BitacoraService,
  ) {}

  async execute(compraId: string, motivo: string, usuario_id: string) {
    if (!usuario_id) {
      throw new UnauthorizedException('Usuario no autenticado');
    }

    if (!motivo || motivo.trim() === '') {
      throw new BadRequestException(
        'Debe proporcionar un motivo para la anulación',
      );
    }

    const compraOriginal = await this.prisma.compra.findUnique({
      where: { id: BigInt(compraId) },
      include: { detalles: true },
    });

    if (!compraOriginal) {
      throw new NotFoundException('Compra no encontrada');
    }

    if (
      compraOriginal.estado === 'ANULADO' ||
      compraOriginal.estado === 'ANULADA'
    ) {
      throw new BadRequestException('La compra ya se encuentra anulada');
    }

    const usuario = await this.prisma.usuario.findUnique({
      where: { id: BigInt(usuario_id) },
      select: { nombres: true, apellidos: true },
    });
    const nombreAnulador = usuario
      ? `${usuario.nombres} ${usuario.apellidos || ''}`.trim()
      : 'Sistema';

    const result = await this.prisma.$transaction(
      async (tx: Prisma.TransactionClient) => {
        // 1. Actualizar el estado de la compra a ANULADO y agregar la nota
        const notasPrevias = compraOriginal.notas
          ? compraOriginal.notas + '\n'
          : '';
        const compraActualizada = await tx.compra.update({
          where: { id: BigInt(compraId) },
          data: {
            estado: 'ANULADO',
            notas:
              notasPrevias +
              `[ANULADA por ${nombreAnulador}] Motivo: ${motivo}`,
          },
        });

        // 2. Si estaba COMPLETADO o RECIBIDA, revertir el inventario
        if (
          compraOriginal.estado === 'COMPLETADO' ||
          compraOriginal.estado === 'RECIBIDA'
        ) {
          for (const detalle of compraOriginal.detalles) {
            const varianteId = await this.resolverVarianteInventario(
              tx,
              detalle.producto_id,
              detalle.variante_id,
              detalle.empaque_id,
            );
            const inv = await tx.inventario.findFirst({
              where: {
                producto_id: detalle.producto_id,
                variante_id: varianteId,
              },
            });

            if (inv) {
              // Verificar si hay stock suficiente para revertir (para evitar negativos, o podríamos permitir negativos en este ERP)
              const nuevaCantidad =
                inv.cantidad_disponible - detalle.cantidad_recibida;
              if (nuevaCantidad < 0) {
                throw new BadRequestException(
                  `No hay suficiente stock del producto ID ${detalle.producto_id} para revertir esta compra. Generaría un stock negativo.`,
                );
              }

              await tx.inventario.update({
                where: { id: inv.id },
                data: {
                  cantidad_disponible: { decrement: detalle.cantidad_recibida },
                },
              });

              // Registrar el movimiento inverso (SALIDA por Anulación)
              await tx.movimientosInventario.create({
                data: {
                  producto_id: detalle.producto_id,
                  variante_id: varianteId ?? undefined,
                  tipo_movimiento: 'SALIDA',
                  cantidad: detalle.cantidad_recibida,
                  motivo: `Reversión por Anulación: ${motivo}`,
                  usuario_id: BigInt(usuario_id),
                  tipo_documento_origen: 'COMPRA',
                  documento_origen_id: compraOriginal.id,
                },
              });
            }
          }
        }

        return compraActualizada;
      },
    );

    await this.bitacoraService.registrar({
      tipo_actor: TipoActorBitacora.USUARIO,
      usuario_id,
      entidad: EntidadBitacora.COMPRA,
      entidad_id: compraId,
      operacion: 'ANULAR_COMPRA',
      datos_anteriores: { estado: compraOriginal.estado },
      datos_nuevos: { estado: 'ANULADO', motivo },
    });

    return { success: true, compraId, estado: 'ANULADO' };
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
