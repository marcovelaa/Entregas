import { BadRequestException, ConflictException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../../common/prisma/prisma.service';
import { DiscountEngineService } from '../../../descuentos/domain/discount-engine.service';
import { IVentaRepository, VentaCreateData } from '../../domain/repositories/venta.repository.interface';

const MODOS_VIGENCIA = new Set(['RANGO_FECHAS', 'FECHA_HORA', 'MIXTO']);

@Injectable()
export class PrismaVentaRepository implements IVentaRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly discountEngine: DiscountEngineService,
  ) {}

  async crear(data: VentaCreateData) {
    return this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // 0. Batch-fetch every producto/empaque/variante referenced by the cart in a
      // handful of queries (instead of one findUnique/findFirst per detalle) so the
      // rest of the method resolves prices, combo rules and inventory targets purely
      // from in-memory maps. Closes 2.2 (N+1 inside the checkout transaction).
      const productoIds = [...new Set(data.detalles.map((d) => BigInt(d.producto_id)))];
      const productos = await tx.producto.findMany({
        where: { id: { in: productoIds } },
        include: { componentes_combo: { include: { componente_producto: true } } },
      });
      const productoMap = new Map(productos.map((p) => [p.id.toString(), p]));

      const empaqueIds = [...new Set(data.detalles.filter((d) => d.empaque_id).map((d) => BigInt(d.empaque_id!)))];
      const empaques = empaqueIds.length ? await tx.empaque.findMany({ where: { id: { in: empaqueIds } } }) : [];
      const empaqueMap = new Map(empaques.map((e) => [e.id.toString(), e]));

      const varianteIdsExplicit = [
        ...new Set(data.detalles.filter((d) => d.variante_id).map((d) => BigInt(d.variante_id!))),
      ];
      const variantesExplicitas = varianteIdsExplicit.length
        ? await tx.variante.findMany({ where: { id: { in: varianteIdsExplicit } }, include: { producto: true } })
        : [];
      const varianteMap = new Map(variantesExplicitas.map((v) => [v.id.toString(), v]));

      // Producto ids needing a "default active variant" lookup: a non-combo main detalle
      // (or one whose producto wasn't found) with neither empaque_id nor variante_id,
      // plus every combo component without its own variante_id. A combo's own top-level
      // variant is never resolved — only its components' variants matter for inventory.
      const productoIdsNeedingDefaultVariant = new Set<bigint>();
      for (const d of data.detalles) {
        const producto = productoMap.get(d.producto_id);
        if (!d.empaque_id && !d.variante_id && producto?.tipo_producto !== 'COMBO') {
          productoIdsNeedingDefaultVariant.add(BigInt(d.producto_id));
        }
        if (producto?.tipo_producto === 'COMBO') {
          for (const comp of producto.componentes_combo) {
            if (!comp.variante_id) productoIdsNeedingDefaultVariant.add(comp.componente_prod_id);
          }
        }
      }
      const defaultVariantes = productoIdsNeedingDefaultVariant.size
        ? await tx.variante.findMany({
            where: { producto_id: { in: [...productoIdsNeedingDefaultVariant] }, activo: true },
            orderBy: { id: 'asc' },
          })
        : [];
      const defaultVarianteMap = new Map<string, (typeof defaultVariantes)[number]>();
      for (const v of defaultVariantes) {
        const key = v.producto_id.toString();
        if (!defaultVarianteMap.has(key)) defaultVarianteMap.set(key, v);
      }

      // 0.1 Resolve catalog prices and verify manual price overrides (from the maps above)
      const detallesEvaluados = data.detalles.map((d) => {
        let precioCatalogo = 0;

        if (d.empaque_id) {
          const emp = empaqueMap.get(d.empaque_id);
          if (emp) {
            const multiplicador = emp.multiplicador_unidades || 1;
            precioCatalogo = Number(emp.precio_promocional ?? emp.precio) / multiplicador;
          }
        } else if (d.variante_id) {
          const v = varianteMap.get(d.variante_id);
          if (v) {
            const precioVar = Number(v.precio_promocional ?? v.precio_unitario);
            const precioProd = Number(v.producto.precio_promocional ?? v.producto.precio_base);
            precioCatalogo = precioVar > 0 ? precioVar : precioProd;
          }
        } else {
          const p = productoMap.get(d.producto_id);
          if (p) {
            precioCatalogo = Number(p.precio_promocional ?? p.precio_base);
          }
        }

        const precioAplicado = d.precio_unitario;
        const esRebaja = precioAplicado < precioCatalogo - 0.0001;

        return {
          ...d,
          precioCatalogo,
          precioAplicado,
          esRebaja,
        };
      });

      const requiereAprobacion = detallesEvaluados.some((d) => d.esRebaja);
      let aprobadorId: bigint | null = null;

      if (requiereAprobacion) {
        if (!data.aprobador_usuario_id) {
          throw new BadRequestException('Debe indicar qué administrador autorizó la rebaja de precio.');
        }

        const aprobador = await tx.usuario.findUnique({
          where: { id: BigInt(data.aprobador_usuario_id) },
          include: { rol: true },
        });

        if (!aprobador || !aprobador.activo) {
          throw new NotFoundException('El usuario seleccionado como aprobador no existe o está inactivo.');
        }

        const esAdmin = aprobador.rol.nombre === 'Super Usuario' || aprobador.rol.nombre === 'Administrador';
        if (!esAdmin) {
          throw new UnauthorizedException('El usuario seleccionado no posee permisos de Administrador para autorizar la rebaja de precio.');
        }

        aprobadorId = aprobador.id;
      }

      // 0.5. Resolve the real discount server-side (never trust dto.descuento_total)
      let descuentoTotal = 0;
      let descuentoIdAplicado: bigint | null = null;
      let codigoCuponAplicado: string | null = null;

      if (data.descuento_id || data.codigo_cupon) {
        const evaluacion = await this.discountEngine.evaluate({
          cupon: data.codigo_cupon,
          canal: 'POS',
          clienteId: data.cliente_id,
          items: detallesEvaluados.map((d) => ({
            productoId: d.producto_id,
            varianteId: d.variante_id,
            empaqueId: d.empaque_id,
            cantidad: d.cantidad,
            precioUnitario: d.precioAplicado,
          })),
        });

        if (evaluacion) {
          descuentoTotal = evaluacion.montoDescontado;
          descuentoIdAplicado = BigInt(evaluacion.id);
          codigoCuponAplicado = evaluacion.codigo ?? null;
        }
      }

      const subtotalReal = detallesEvaluados.reduce((acc, d) => acc + d.cantidad * d.precioAplicado, 0);
      const total = Math.max(0, subtotalReal - descuentoTotal);
      const vuelto = Math.max(0, data.monto_pagado - total);

      if (data.metodo_pago === 'EFECTIVO' && data.monto_pagado < total) {
        throw new BadRequestException('El monto pagado es menor al total de la venta.');
      }

      // 1. Create Venta
      const venta = await tx.venta.create({
        data: {
          cliente_id: data.cliente_id ? BigInt(data.cliente_id) : null,
          usuario_id: BigInt(data.usuario_id),
          metodo_pago: data.metodo_pago,
          monto_pagado: data.monto_pagado,
          total,
          descuento_total: descuentoTotal,
          codigo_cupon: codigoCuponAplicado,
          vuelto,
          estado: 'COMPLETADA',
          detalles: {
            create: detallesEvaluados.map((d) => ({
              producto_id: BigInt(d.producto_id),
              variante_id: d.variante_id ? BigInt(d.variante_id) : null,
              empaque_id: d.empaque_id ? BigInt(d.empaque_id) : null,
              cantidad: d.cantidad,
              precio_unitario: d.precioAplicado,
              precio_unitario_catalogo: d.precioCatalogo,
              aprobado_por_usuario_id: d.esRebaja ? aprobadorId : null,
              motivo_ajuste: d.esRebaja ? (d.motivo_ajuste || data.motivo_ajuste || 'Rebaja manual POS') : null,
              subtotal: d.cantidad * d.precioAplicado,
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

      // 2. Audit Discount Usage if discount applied (atomic cupo guard, closes 5.2)
      if (descuentoIdAplicado) {
        const descuento = await tx.descuento.findUnique({ where: { id: descuentoIdAplicado } });

        const cupoResult = await tx.descuento.updateMany({
          where: {
            id: descuentoIdAplicado,
            ...(descuento?.limite_usos != null ? { usos_actuales: { lt: descuento.limite_usos } } : {}),
          },
          data: { usos_actuales: { increment: 1 } },
        });

        if (cupoResult.count === 0) {
          throw new ConflictException('Cupo de descuento agotado.');
        }

        await tx.descuentoUso.create({
          data: {
            descuento_id: descuentoIdAplicado,
            venta_id: venta.id,
            cliente_id: data.cliente_id ? BigInt(data.cliente_id) : null,
            monto_descontado: descuentoTotal,
          },
        });
      }

      // 3a. Enforce vigencia/cupo per combo detalle (unavoidably sequential atomic writes)
      // and build the flat list of inventory movements to apply, purely from the maps
      // fetched in step 0 — no DB reads happen in this pass.
      type MovimientoPlan = {
        producto_id: bigint;
        variante_id: bigint | null;
        cantidad: number;
        motivo: string;
        errorNoInventario: string;
        errorStockInsuficiente: (disponible: number) => string;
        errorConcurrencia: string;
      };
      const movimientos: MovimientoPlan[] = [];

      for (const d of data.detalles) {
        const prodId = BigInt(d.producto_id);
        const productoInfo = productoMap.get(d.producto_id);

        if (productoInfo?.tipo_producto === 'COMBO') {
          // Vigencia enforcement (2.7): combo must be inside its active window
          const now = new Date();
          if (
            MODOS_VIGENCIA.has(productoInfo.modo_venta) &&
            ((productoInfo.vigencia_inicio && now < productoInfo.vigencia_inicio) ||
              (productoInfo.vigencia_fin && now > productoInfo.vigencia_fin))
          ) {
            throw new ConflictException(`El combo ${productoInfo.nombre} no está en vigencia`);
          }

          // Cupo enforcement (2.7/D5): conditional atomic update kills the POS race.
          // If cupo_usado + cantidad would exceed cupo_maximo, the row does not match
          // and count is 0 -> 409. The increment is the reservation and rolls back
          // with this transaction if the venta creation fails later.
          if (productoInfo.cupo_maximo != null) {
            const cupoReservado = await tx.producto.updateMany({
              where: {
                id: prodId,
                cupo_maximo: { not: null },
                cupo_usado: { lte: productoInfo.cupo_maximo - d.cantidad },
              },
              data: { cupo_usado: { increment: d.cantidad } },
            });
            if (cupoReservado.count === 0) {
              throw new ConflictException(`Cupo agotado para el combo ${productoInfo.nombre}`);
            }
          }
        }

        if (productoInfo?.tipo_producto === 'COMBO' && productoInfo.componentes_combo.length > 0) {
          for (const comp of productoInfo.componentes_combo) {
            const requiredUnits = d.cantidad * comp.cantidad;
            const targetVarId = comp.variante_id ?? defaultVarianteMap.get(comp.componente_prod_id.toString())?.id ?? null;

            movimientos.push({
              producto_id: comp.componente_prod_id,
              variante_id: targetVarId,
              cantidad: requiredUnits,
              motivo: `VENTA_COMBO (${productoInfo.nombre})`,
              errorNoInventario: `Inventario no encontrado para el componente "${comp.componente_producto.nombre}" del combo "${productoInfo.nombre}"`,
              errorStockInsuficiente: (disponible) =>
                `Stock insuficiente para el componente "${comp.componente_producto.nombre}" del combo "${productoInfo.nombre}" (disponible: ${disponible}, requerido: ${requiredUnits})`,
              errorConcurrencia: `Conflicto de concurrencia: stock insuficiente para el componente "${comp.componente_producto.nombre}" del combo "${productoInfo.nombre}"`,
            });
          }
        } else {
          let targetUnits = d.cantidad;
          let targetVarianteId = d.variante_id ? BigInt(d.variante_id) : null;

          if (d.empaque_id) {
            const emp = empaqueMap.get(d.empaque_id);
            if (emp) {
              targetUnits = d.cantidad * (emp.multiplicador_unidades || 1);
              if (!targetVarianteId) {
                targetVarianteId = emp.variante_id;
              }
            }
          }

          if (!targetVarianteId) {
            targetVarianteId = defaultVarianteMap.get(d.producto_id)?.id ?? null;
          }

          movimientos.push({
            producto_id: prodId,
            variante_id: targetVarianteId,
            cantidad: targetUnits,
            motivo: 'VENTA',
            errorNoInventario: `Inventario no encontrado para el producto ${d.producto_id}`,
            errorStockInsuficiente: () => `Stock insuficiente para el producto ${d.producto_id}`,
            errorConcurrencia: `Conflicto de concurrencia: stock insuficiente para el producto ${d.producto_id}`,
          });
        }
      }

      // 3b. Batch-fetch current inventory state for every distinct (producto_id, variante_id)
      // pair the movements above target, in a single round trip.
      const inventarioPairKeys = new Set<string>();
      const inventarioPairs: { producto_id: bigint; variante_id: bigint | null }[] = [];
      for (const m of movimientos) {
        const key = `${m.producto_id}_${m.variante_id ?? 'null'}`;
        if (!inventarioPairKeys.has(key)) {
          inventarioPairKeys.add(key);
          inventarioPairs.push({ producto_id: m.producto_id, variante_id: m.variante_id });
        }
      }
      const inventarios = inventarioPairs.length
        ? await tx.inventario.findMany({
            where: { OR: inventarioPairs.map((p) => ({ producto_id: p.producto_id, variante_id: p.variante_id })) },
          })
        : [];
      const inventarioMap = new Map(inventarios.map((inv) => [`${inv.producto_id}_${inv.variante_id ?? 'null'}`, inv]));

      // 3c. Apply the atomic decrements and record each movimiento. Still sequential —
      // each updateMany's conditional WHERE is the real concurrency guard — but now
      // backed by the batched read above instead of one findFirst per movement.
      for (const m of movimientos) {
        const key = `${m.producto_id}_${m.variante_id ?? 'null'}`;
        const inv = inventarioMap.get(key);

        if (!inv) {
          throw new NotFoundException(m.errorNoInventario);
        }

        if (inv.cantidad_disponible - inv.reservado < m.cantidad) {
          throw new ConflictException(m.errorStockInsuficiente(inv.cantidad_disponible));
        }

        const updated = await tx.inventario.updateMany({
          where: {
            id: inv.id,
            cantidad_disponible: { gte: m.cantidad + (inv.reservado || 0) },
          },
          data: {
            cantidad_disponible: { decrement: m.cantidad },
          },
        });

        if (updated.count === 0) {
          throw new ConflictException(m.errorConcurrencia);
        }

        // Reflect the decrement in the shared in-memory snapshot so a later movement
        // targeting the SAME inventario row (e.g. the same producto/variante appearing
        // twice in the cart) validates against the just-applied value.
        inv.cantidad_disponible -= m.cantidad;

        await tx.movimientosInventario.create({
          data: {
            producto_id: m.producto_id,
            variante_id: m.variante_id || inv.variante_id,
            tipo_movimiento: 'SALIDA',
            cantidad: m.cantidad,
            motivo: m.motivo,
            tipo_documento_origen: 'VENTA',
            documento_origen_id: venta.id,
            usuario_id: BigInt(data.usuario_id),
          },
        });
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
        detalles: venta.detalles.map((det: Prisma.VentaDetalleGetPayload<{ include: { producto: true; variante: true; empaque: true } }>) => ({
          ...det,
          id: det.id.toString(),
          venta_id: det.venta_id.toString(),
          producto_id: det.producto_id.toString(),
          variante_id: det.variante_id?.toString(),
          empaque_id: det.empaque_id?.toString(),
          aprobado_por_usuario_id: det.aprobado_por_usuario_id?.toString(),
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
      data: data.map((v: Prisma.VentaGetPayload<{ include: { cliente: true; detalles: { include: { producto: true } } } }>) => ({
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
        detalles: v.detalles.map((det: Prisma.VentaDetalleGetPayload<{ include: { producto: true } }>) => ({
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
    return await this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const id = BigInt(venta_id);

      const venta = await tx.venta.findUnique({
        where: { id },
        include: { detalles: true },
      });

      if (!venta) throw new NotFoundException('Venta no encontrada');
      if (venta.estado === 'ANULADA') throw new ConflictException('La venta ya se encuentra anulada');

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

        if (productoInfo?.tipo_producto === 'COMBO') {
          // Cupo release (2.8): free the reserved cupo, clamped at 0 so it never goes negative.
          // First try a plain decrement; if there is not enough usage, clamp to 0.
          const cupoLiberado = await tx.producto.updateMany({
            where: { id: prodId, cupo_maximo: { not: null }, cupo_usado: { gte: d.cantidad } },
            data: { cupo_usado: { decrement: d.cantidad } },
          });
          if (cupoLiberado.count === 0) {
            await tx.producto.updateMany({
              where: { id: prodId, cupo_maximo: { not: null }, cupo_usado: { gt: 0 } },
              data: { cupo_usado: 0 },
            });
          }
        }

        if (productoInfo?.tipo_producto === 'COMBO' && productoInfo.componentes_combo.length > 0) {
          for (const comp of productoInfo.componentes_combo) {
            const unitsToReturn = d.cantidad * comp.cantidad;
            let targetVarId = comp.variante_id;

            if (!targetVarId) {
              const defaultVar = await tx.variante.findFirst({
                where: { producto_id: comp.componente_prod_id, activo: true },
                orderBy: { id: 'asc' },
              });
              if (defaultVar) {
                targetVarId = defaultVar.id;
              }
            }

            const compInv = await tx.inventario.findFirst({
              where: {
                producto_id: comp.componente_prod_id,
                ...(targetVarId ? { variante_id: targetVarId } : {}),
              },
            });

            if (!compInv) {
              throw new NotFoundException(`Inventario no encontrado para devolver stock en componente del combo`);
            }

            await tx.inventario.update({
              where: { id: compInv.id },
              data: { cantidad_disponible: { increment: unitsToReturn } },
            });

            await tx.movimientosInventario.create({
              data: {
                producto_id: comp.componente_prod_id,
                variante_id: targetVarId || compInv.variante_id,
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
          let targetVarianteId = d.variante_id ? BigInt(d.variante_id) : null;
          if (!targetVarianteId) {
            const defaultVar = await tx.variante.findFirst({
              where: { producto_id: prodId, activo: true },
              orderBy: { id: 'asc' },
            });
            if (defaultVar) {
              targetVarianteId = defaultVar.id;
            }
          }

          const inv = await tx.inventario.findFirst({
            where: {
              producto_id: prodId,
              ...(targetVarianteId ? { variante_id: targetVarianteId } : {}),
            },
          });

          if (!inv) {
            throw new NotFoundException(`Inventario no encontrado para retornar stock del producto ${prodId}`);
          }

          await tx.inventario.update({
            where: { id: inv.id },
            data: { cantidad_disponible: { increment: d.cantidad } },
          });

          await tx.movimientosInventario.create({
            data: {
              producto_id: prodId,
              variante_id: targetVarianteId || inv.variante_id,
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
    return await this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const id = BigInt(venta_id);

      const venta = await tx.venta.findUnique({
        where: { id },
        include: { detalles: true },
      });

      if (!venta) throw new NotFoundException('Venta no encontrada');
      if (venta.estado !== 'ANULADA') throw new ConflictException('La venta no está anulada');

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

        if (productoInfo?.tipo_producto === 'COMBO') {
          // Cupo restore (2.8, Open Q1): a reverted sale restores its cupo WITHOUT
          // cap validation — the cap may have been lowered after the sale.
          await tx.producto.updateMany({
            where: { id: prodId, cupo_maximo: { not: null } },
            data: { cupo_usado: { increment: d.cantidad } },
          });
        }

        if (productoInfo?.tipo_producto === 'COMBO' && productoInfo.componentes_combo.length > 0) {
          for (const comp of productoInfo.componentes_combo) {
            const unitsToDeduct = d.cantidad * comp.cantidad;
            let targetVarId = comp.variante_id;

            if (!targetVarId) {
              const defaultVar = await tx.variante.findFirst({
                where: { producto_id: comp.componente_prod_id, activo: true },
                orderBy: { id: 'asc' },
              });
              if (defaultVar) {
                targetVarId = defaultVar.id;
              }
            }

            const compInv = await tx.inventario.findFirst({
              where: {
                producto_id: comp.componente_prod_id,
                ...(targetVarId ? { variante_id: targetVarId } : {}),
              },
            });

            if (!compInv) {
              throw new NotFoundException(`Inventario no encontrado para revertir anulación en componente del combo`);
            }

            if (compInv.cantidad_disponible - compInv.reservado < unitsToDeduct) {
              throw new ConflictException(`Stock insuficiente para revertir anulación en componente del combo`);
            }

            const updated = await tx.inventario.updateMany({
              where: {
                id: compInv.id,
                cantidad_disponible: { gte: unitsToDeduct + (compInv.reservado || 0) },
              },
              data: {
                cantidad_disponible: { decrement: unitsToDeduct },
              },
            });

            if (updated.count === 0) {
              throw new ConflictException(`Conflicto de concurrencia al revertir anulación del componente del combo`);
            }

            await tx.movimientosInventario.create({
              data: {
                producto_id: comp.componente_prod_id,
                variante_id: targetVarId || compInv.variante_id,
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
          let targetVarianteId = d.variante_id ? BigInt(d.variante_id) : null;
          if (!targetVarianteId) {
            const defaultVar = await tx.variante.findFirst({
              where: { producto_id: prodId, activo: true },
              orderBy: { id: 'asc' },
            });
            if (defaultVar) {
              targetVarianteId = defaultVar.id;
            }
          }

          const inv = await tx.inventario.findFirst({
            where: {
              producto_id: prodId,
              ...(targetVarianteId ? { variante_id: targetVarianteId } : {}),
            },
          });

          if (!inv) {
            throw new NotFoundException(`Inventario no encontrado para revertir la anulación del producto ${d.producto_id}`);
          }

          if (inv.cantidad_disponible - inv.reservado < d.cantidad) {
            throw new ConflictException(`Stock insuficiente para revertir la anulación del producto ${d.producto_id}`);
          }

          const updated = await tx.inventario.updateMany({
            where: {
              id: inv.id,
              cantidad_disponible: { gte: d.cantidad + (inv.reservado || 0) },
            },
            data: {
              cantidad_disponible: { decrement: d.cantidad },
            },
          });

          if (updated.count === 0) {
            throw new ConflictException(`Conflicto de concurrencia al revertir anulación del producto ${d.producto_id}`);
          }

          await tx.movimientosInventario.create({
            data: {
              producto_id: prodId,
              variante_id: targetVarianteId || inv.variante_id,
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
