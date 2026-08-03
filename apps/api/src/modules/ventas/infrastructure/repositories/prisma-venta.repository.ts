import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../common/prisma/prisma.service';
import { IVentaRepository, VentaCreateData } from '../../domain/repositories/venta.repository.interface';

@Injectable()
export class PrismaVentaRepository implements IVentaRepository {
  constructor(private readonly prisma: PrismaService) {}

  async crear(data: VentaCreateData, total: number, vuelto: number) {
    return this.prisma.$transaction(async (tx) => {
      // 1. Create Venta
      const venta = await tx.venta.create({
        data: {
          cliente_id: data.cliente_id ? BigInt(data.cliente_id) : null,
          usuario_id: BigInt(data.usuario_id),
          metodo_pago: data.metodo_pago,
          monto_pagado: data.monto_pagado,
          total,
          descuento_total: data.descuento_total || 0,
          codigo_cupon: data.codigo_cupon || null,
          vuelto,
          estado: 'COMPLETADA',
          detalles: {
            create: data.detalles.map((d) => ({
              producto_id: BigInt(d.producto_id),
              variante_id: d.variante_id ? BigInt(d.variante_id) : null,
              empaque_id: d.empaque_id ? BigInt(d.empaque_id) : null,
              cantidad: d.cantidad,
              precio_unitario: d.precio_unitario,
              subtotal: d.cantidad * d.precio_unitario,
            })),
          },
        },
        include: {
          cliente: true,
          detalles: {
            include: { producto: true, variante: true, empaque: true },
          },
        },
      });

      // 2. Audit Discount Usage if discount applied
      if (data.descuento_id) {
        const descId = BigInt(data.descuento_id);
        await tx.descuento.update({
          where: { id: descId },
          data: { usos_actuales: { increment: 1 } },
        });

        await tx.descuentoUso.create({
          data: {
            descuento_id: descId,
            venta_id: venta.id,
            cliente_id: data.cliente_id ? BigInt(data.cliente_id) : null,
            monto_descontado: data.descuento_total || 0,
          },
        });
      }

      // 3. Decrease Inventory and add Movimientos (handling both Simple and Combo products)
      for (const d of data.detalles) {
        const prodId = BigInt(d.producto_id);
        const productoInfo = await tx.producto.findUnique({
          where: { id: prodId },
          include: {
            componentes_combo: {
              include: { componente_producto: true },
            },
          },
        });

        if (productoInfo?.tipo_producto === 'COMBO' && productoInfo.componentes_combo.length > 0) {
          // Atomic deduction for each component in the combo recipe
          for (const comp of productoInfo.componentes_combo) {
            const requiredUnits = d.cantidad * comp.cantidad;
            const compInv = await tx.inventario.findFirst({
              where: {
                producto_id: comp.componente_prod_id,
                variante_id: comp.variante_id,
              },
            });

            if (!compInv) {
              throw new Error(`Inventario no encontrado para el componente "${comp.componente_producto.nombre}" del combo "${productoInfo.nombre}"`);
            }

            if (compInv.cantidad_disponible - compInv.reservado < requiredUnits) {
              throw new Error(`Stock insuficiente para el componente "${comp.componente_producto.nombre}" del combo "${productoInfo.nombre}" (disponible: ${compInv.cantidad_disponible}, requerido: ${requiredUnits})`);
            }

            await tx.inventario.updateMany({
              where: { id: compInv.id },
              data: {
                cantidad_disponible: { decrement: requiredUnits },
              },
            });

            await tx.movimientosInventario.create({
              data: {
                producto_id: comp.componente_prod_id,
                variante_id: comp.variante_id,
                tipo_movimiento: 'SALIDA',
                cantidad: requiredUnits,
                motivo: `VENTA_COMBO (${productoInfo.nombre})`,
                tipo_documento_origen: 'VENTA',
                documento_origen_id: venta.id,
                usuario_id: BigInt(data.usuario_id),
              },
            });
          }
        } else {
          // Standard single product deduction
          const inv = await tx.inventario.findFirst({
            where: {
              producto_id: prodId,
              variante_id: d.variante_id ? BigInt(d.variante_id) : null,
            },
          });

          if (!inv) {
            throw new Error(`Inventario no encontrado para el producto ${d.producto_id}`);
          }

          if (inv.cantidad_disponible - inv.reservado < d.cantidad) {
            throw new Error(`Stock insuficiente para el producto ${d.producto_id}`);
          }

          await tx.inventario.updateMany({
            where: { id: inv.id },
            data: {
              cantidad_disponible: { decrement: d.cantidad },
            },
          });

          await tx.movimientosInventario.create({
            data: {
              producto_id: prodId,
              variante_id: d.variante_id ? BigInt(d.variante_id) : null,
              tipo_movimiento: 'SALIDA',
              cantidad: d.cantidad,
              motivo: 'VENTA',
              tipo_documento_origen: 'VENTA',
              documento_origen_id: venta.id,
              usuario_id: BigInt(data.usuario_id),
            },
          });
        }
      }

      return {
        ...venta,
        id: venta.id.toString(),
        cliente_id: venta.cliente_id?.toString(),
        usuario_id: venta.usuario_id.toString(),
        cliente: venta.cliente
          ? {
              ...venta.cliente,
              id: venta.cliente.id.toString(),
            }
          : null,
        detalles: venta.detalles.map((det) => ({
          ...det,
          id: det.id.toString(),
          venta_id: det.venta_id.toString(),
          producto_id: det.producto_id.toString(),
          variante_id: det.variante_id?.toString(),
          empaque_id: det.empaque_id?.toString(),
          producto: det.producto
            ? {
                ...det.producto,
                id: det.producto.id.toString(),
                categoria_id: det.producto.categoria_id.toString(),
                marca_id: det.producto.marca_id?.toString(),
              }
            : undefined,
          variante: det.variante
            ? {
                ...det.variante,
                id: det.variante.id.toString(),
                producto_id: det.variante.producto_id.toString(),
              }
            : undefined,
        })),
      };
    });
  }

  async listar(params: { offset: number; limit: number }) {
    const [total, data] = await Promise.all([
      this.prisma.venta.count(),
      this.prisma.venta.findMany({
        skip: params.offset,
        take: params.limit,
        orderBy: { creado_en: 'desc' },
        include: {
          cliente: true,
          detalles: {
            include: { producto: true },
          },
        },
      }),
    ]);

    return {
      total,
      data: data.map((v) => ({
        ...v,
        id: v.id.toString(),
        cliente_id: v.cliente_id?.toString(),
        usuario_id: v.usuario_id.toString(),
        cliente: v.cliente
          ? {
              ...v.cliente,
              id: v.cliente.id.toString(),
            }
          : null,
        detalles: v.detalles.map((det) => ({
          ...det,
          id: det.id.toString(),
          venta_id: det.venta_id.toString(),
          producto_id: det.producto_id.toString(),
          producto: {
            ...det.producto,
            id: det.producto.id.toString(),
            categoria_id: det.producto.categoria_id.toString(),
            marca_id: det.producto.marca_id?.toString(),
          },
        })),
      })),
    };
  }

  async anular(venta_id: string, usuario_id: string, motivo: string): Promise<any> {
    return await this.prisma.$transaction(async (tx) => {
      const id = BigInt(venta_id);

      const venta = await tx.venta.findUnique({
        where: { id },
        include: { detalles: true },
      });

      if (!venta) throw new Error('Venta no encontrada');
      if (venta.estado === 'ANULADA') throw new Error('La venta ya se encuentra anulada');

      await tx.venta.update({
        where: { id },
        data: { estado: 'ANULADA', motivo_anulacion: motivo },
      });

      for (const d of venta.detalles) {
        const prodId = BigInt(d.producto_id);
        const productoInfo = await tx.producto.findUnique({
          where: { id: prodId },
          include: {
            componentes_combo: true,
          },
        });

        if (productoInfo?.tipo_producto === 'COMBO' && productoInfo.componentes_combo.length > 0) {
          for (const comp of productoInfo.componentes_combo) {
            const unitsToReturn = d.cantidad * comp.cantidad;
            const compInv = await tx.inventario.findFirst({
              where: {
                producto_id: comp.componente_prod_id,
                variante_id: comp.variante_id,
              },
            });

            if (compInv) {
              await tx.inventario.update({
                where: { id: compInv.id },
                data: { cantidad_disponible: compInv.cantidad_disponible + unitsToReturn },
              });
            }

            await tx.movimientosInventario.create({
              data: {
                producto_id: comp.componente_prod_id,
                variante_id: comp.variante_id,
                tipo_movimiento: 'ENTRADA',
                cantidad: unitsToReturn,
                motivo: motivo || `DEVOLUCION_VENTA_COMBO (${productoInfo.nombre})`,
                tipo_documento_origen: 'VENTA_ANULADA',
                documento_origen_id: venta.id,
                usuario_id: BigInt(usuario_id),
              },
            });
          }
        } else {
          const inv = await tx.inventario.findFirst({
            where: {
              producto_id: prodId,
              variante_id: d.variante_id,
            },
          });

          if (inv) {
            await tx.inventario.update({
              where: { id: inv.id },
              data: { cantidad_disponible: inv.cantidad_disponible + d.cantidad },
            });
          }

          await tx.movimientosInventario.create({
            data: {
              producto_id: prodId,
              variante_id: d.variante_id,
              tipo_movimiento: 'ENTRADA',
              cantidad: d.cantidad,
              motivo: motivo || 'DEVOLUCION_VENTA',
              tipo_documento_origen: 'VENTA_ANULADA',
              documento_origen_id: venta.id,
              usuario_id: BigInt(usuario_id),
            },
          });
        }
      }

      return { success: true, message: 'Venta anulada y stock retornado correctamente' };
    });
  }

  async revertirAnulacion(venta_id: string, usuario_id: string): Promise<any> {
    return await this.prisma.$transaction(async (tx) => {
      const id = BigInt(venta_id);

      const venta = await tx.venta.findUnique({
        where: { id },
        include: { detalles: true },
      });

      if (!venta) throw new Error('Venta no encontrada');
      if (venta.estado !== 'ANULADA') throw new Error('La venta no está anulada');

      await tx.venta.update({
        where: { id },
        data: { estado: 'COMPLETADA', motivo_anulacion: null },
      });

      for (const d of venta.detalles) {
        const prodId = BigInt(d.producto_id);
        const productoInfo = await tx.producto.findUnique({
          where: { id: prodId },
          include: {
            componentes_combo: true,
          },
        });

        if (productoInfo?.tipo_producto === 'COMBO' && productoInfo.componentes_combo.length > 0) {
          for (const comp of productoInfo.componentes_combo) {
            const unitsToDeduct = d.cantidad * comp.cantidad;
            const compInv = await tx.inventario.findFirst({
              where: {
                producto_id: comp.componente_prod_id,
                variante_id: comp.variante_id,
              },
            });

            if (compInv) {
              if (compInv.cantidad_disponible - compInv.reservado < unitsToDeduct) {
                throw new Error(`Stock insuficiente para revertir anulación en componente del combo`);
              }
              await tx.inventario.update({
                where: { id: compInv.id },
                data: { cantidad_disponible: compInv.cantidad_disponible - unitsToDeduct },
              });
            }

            await tx.movimientosInventario.create({
              data: {
                producto_id: comp.componente_prod_id,
                variante_id: comp.variante_id,
                tipo_movimiento: 'SALIDA',
                cantidad: unitsToDeduct,
                motivo: `REVERSION_ANULACION_COMBO (${productoInfo.nombre})`,
                tipo_documento_origen: 'VENTA',
                documento_origen_id: venta.id,
                usuario_id: BigInt(usuario_id),
              },
            });
          }
        } else {
          const inv = await tx.inventario.findFirst({
            where: {
              producto_id: prodId,
              variante_id: d.variante_id,
            },
          });

          if (inv) {
            if (inv.cantidad_disponible - inv.reservado < d.cantidad) {
              throw new Error(`Stock insuficiente para revertir la anulación del producto ${d.producto_id}`);
            }
            await tx.inventario.update({
              where: { id: inv.id },
              data: { cantidad_disponible: inv.cantidad_disponible - d.cantidad },
            });
          }

          await tx.movimientosInventario.create({
            data: {
              producto_id: prodId,
              variante_id: d.variante_id,
              tipo_movimiento: 'SALIDA',
              cantidad: d.cantidad,
              motivo: 'REVERSION_ANULACION',
              tipo_documento_origen: 'VENTA',
              documento_origen_id: venta.id,
              usuario_id: BigInt(usuario_id),
            },
          });
        }
      }

      return { success: true, message: 'Anulación revertida y stock descontado correctamente' };
    });
  }
}
