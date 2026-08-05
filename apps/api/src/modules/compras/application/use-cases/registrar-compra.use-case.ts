import type { ICompraRepository } from '../../domain/repositories/compra.repository.interface';
import { COMPRA_REPOSITORY } from '../../domain/repositories/compra.repository.interface';
import { RegistrarCompraDto } from '../dtos/compra.dto';

import type { IInventarioRepository } from '../../../inventario/domain/repositories/inventario.repository.interface';
import { INVENTARIO_REPOSITORY } from '../../../inventario/domain/repositories/inventario.repository.interface';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../../common/prisma/prisma.service';
import { Inject, Injectable } from '@nestjs/common';

@Injectable()
export class RegistrarCompraUseCase {
  constructor(
    @Inject(COMPRA_REPOSITORY) private readonly compraRepo: ICompraRepository,
    @Inject(INVENTARIO_REPOSITORY) private readonly inventarioRepo: IInventarioRepository,
    private readonly prisma: PrismaService // Used only for transaction boundary
  ) {}

  async execute(dto: RegistrarCompraDto, usuario_id: string = '1') {
    let total = 0;
    const detalles = dto.detalles.map(d => {
      total += d.cantidad * d.costo_unitario;
      return {
        producto_id: BigInt(d.producto_id),
        variante_id: d.variante_id ? BigInt(d.variante_id) : undefined,
        empaque_id: d.empaque_id ? BigInt(d.empaque_id) : undefined,
        cantidad: d.cantidad,
        costo_unitario: d.costo_unitario,
        precio_venta: d.precio_venta,
      };
    });

    const result = await this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // 1. Crear compra (ahora sin inventario interno)
      const compra = await this.compraRepo.crear({
        proveedor_id: dto.proveedor_id ? BigInt(dto.proveedor_id) : undefined,
        usuario_id: BigInt(usuario_id),
        numero_recibo: dto.numero_recibo,
        observaciones: dto.observaciones,
        total,
        detalles,
      }, tx);

      // 2. Registrar Movimientos de Inventario y Actualizar Precios
      for (const d of detalles) {
        await this.inventarioRepo.registrarMovimiento({
          producto_id: d.producto_id,
          variante_id: d.variante_id,
          empaque_id: d.empaque_id,
          tipo_movimiento: 'INGRESO_COMPRA',
          cantidad: d.cantidad,
          motivo: 'Ingreso por Compra',
          usuario_id: BigInt(usuario_id)
        }, tx);

        if (d.precio_venta !== undefined && d.precio_venta !== null) {
          if (d.variante_id) {
            // No VarianteRepository en compras, usamos Prisma aquí temporalmente dentro de tx
            // o idealmente Inyectar IVarianteRepository
            await tx.variante.update({
              where: { id: d.variante_id },
              data: { /* El precio de venta puede ir a nivel empque/variante, por defecto null en prisma pero si hubiera: */ }
            });
          } else {
            await tx.producto.update({
              where: { id: d.producto_id },
              data: { precio_base: d.precio_venta }
            });
          }
        }
      }

      return compra;
    });

    return { success: true, compraId: result.id.toString() };
  }
}
