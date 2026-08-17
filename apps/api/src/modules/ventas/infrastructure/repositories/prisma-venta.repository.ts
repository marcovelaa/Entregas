import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../../common/prisma/prisma.service';
import { DiscountEngineService } from '../../../descuentos/domain/discount-engine.service';
import {
  IVentaRepository,
  VentaCreateData,
} from '../../domain/repositories/venta.repository.interface';
import { InventoryReservationsService } from '../../application/services/inventory-reservations.service';

const MODOS_VIGENCIA = new Set(['RANGO_FECHAS', 'FECHA_HORA', 'MIXTO']);

@Injectable()
export class PrismaVentaRepository implements IVentaRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly discountEngine: DiscountEngineService,
    private readonly inventoryReservations?: InventoryReservationsService,
  ) {}

  async crear(data: VentaCreateData) {
    // 0. Batch-fetch every producto/empaque/variante referenced by the cart in a
    // handful of queries (instead of one findUnique/findFirst per detalle) so the
    // rest of the method resolves prices, combo rules and inventory targets purely
    // from in-memory maps. Closes 2.2 (N+1 inside the checkout transaction).
    const productoIds = [
      ...new Set(data.detalles.map((d) => BigInt(d.producto_id))),
    ];
    const productos = await this.prisma.producto.findMany({
      where: { id: { in: productoIds } },
      include: {
        componentes_combo: { include: { componente_producto: true } },
      },
    });
    const productoMap = new Map(productos.map((p) => [p.id.toString(), p]));

    const empaqueIds = [
      ...new Set(
        data.detalles
          .filter((d) => d.empaque_id)
          .map((d) => BigInt(d.empaque_id!)),
      ),
    ];
    const empaques = empaqueIds.length
      ? await this.prisma.empaque.findMany({
          where: { id: { in: empaqueIds } },
        })
      : [];
    const empaqueMap = new Map(empaques.map((e) => [e.id.toString(), e]));

    const varianteIdsExplicit = [
      ...new Set(
        data.detalles
          .filter((d) => d.variante_id)
          .map((d) => BigInt(d.variante_id!)),
      ),
    ];
    const variantesExplicitas = varianteIdsExplicit.length
      ? await this.prisma.variante.findMany({
          where: { id: { in: varianteIdsExplicit } },
          include: { producto: true },
        })
      : [];
    const varianteMap = new Map(
      variantesExplicitas.map((v) => [v.id.toString(), v]),
    );

    // Producto ids needing a "default active variant" lookup: a non-combo main detalle
    // (or one whose producto wasn't found) with neither empaque_id nor variante_id,
    // plus every combo component without its own variante_id. A combo's own top-level
    // variant is never resolved — only its components' variants matter for inventory.
    const productoIdsNeedingDefaultVariant = new Set<bigint>();
    for (const d of data.detalles) {
      const producto = productoMap.get(d.producto_id);
      if (
        !d.empaque_id &&
        !d.variante_id &&
        producto?.tipo_producto !== 'COMBO'
      ) {
        productoIdsNeedingDefaultVariant.add(BigInt(d.producto_id));
      }
      if (producto?.tipo_producto === 'COMBO') {
        for (const comp of producto.componentes_combo) {
          if (!comp.variante_id)
            productoIdsNeedingDefaultVariant.add(comp.componente_prod_id);
        }
      }
    }
    const defaultVariantes = productoIdsNeedingDefaultVariant.size
      ? await this.prisma.variante.findMany({
          where: {
            producto_id: { in: [...productoIdsNeedingDefaultVariant] },
            activo: true,
          },
          orderBy: { id: 'asc' },
        })
      : [];
    const defaultVarianteMap = new Map<
      string,
      (typeof defaultVariantes)[number]
    >();
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
          precioCatalogo =
            Number(emp.precio_promocional ?? emp.precio) / multiplicador;
        }
      } else if (d.variante_id) {
        const v = varianteMap.get(d.variante_id);
        if (v) {
          const precioVar = Number(v.precio_promocional ?? v.precio_unitario);
          const precioProd = Number(
            v.producto.precio_promocional ?? v.producto.precio_base,
          );
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
        throw new BadRequestException(
          'Debe indicar qué administrador autorizó la rebaja de precio.',
        );
      }

      const aprobador = await this.prisma.usuario.findUnique({
        where: { id: BigInt(data.aprobador_usuario_id) },
        include: { rol: true },
      });

      if (!aprobador || !aprobador.activo) {
        throw new NotFoundException(
          'El usuario seleccionado como aprobador no existe o está inactivo.',
        );
      }

      const esAdmin =
        aprobador.rol.nombre === 'Super Usuario' ||
        aprobador.rol.nombre === 'Administrador';
      if (!esAdmin) {
        throw new UnauthorizedException(
          'El usuario seleccionado no posee permisos de Administrador para autorizar la rebaja de precio.',
        );
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

    const subtotalReal = detallesEvaluados.reduce(
      (acc, d) => acc + d.cantidad * d.precioAplicado,
      0,
    );
    const total = Math.max(0, subtotalReal - descuentoTotal);
    const vuelto = Math.max(0, data.monto_pagado - total);

    if (data.metodo_pago === 'EFECTIVO' && data.monto_pagado < total) {
      throw new BadRequestException(
        'El monto pagado es menor al total de la venta.',
      );
    }

    // Catalog, approval, pricing and the inventory snapshot are read-only preflight work.
    // The transaction below is reserved for conditional state/stock/cupo writes.
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
        const now = new Date();
        if (
          MODOS_VIGENCIA.has(productoInfo.modo_venta) &&
          ((productoInfo.vigencia_inicio &&
            now < productoInfo.vigencia_inicio) ||
            (productoInfo.vigencia_fin && now > productoInfo.vigencia_fin))
        ) {
          throw new ConflictException(
            `El combo ${productoInfo.nombre} no está en vigencia`,
          );
        }
      }

      if (
        productoInfo?.tipo_producto === 'COMBO' &&
        productoInfo.componentes_combo.length > 0
      ) {
        for (const comp of productoInfo.componentes_combo) {
          const requiredUnits = d.cantidad * comp.cantidad;
          const targetVarId =
            comp.variante_id ??
            defaultVarianteMap.get(comp.componente_prod_id.toString())?.id ??
            null;
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
            if (!targetVarianteId) targetVarianteId = emp.variante_id;
          }
        }
        if (!targetVarianteId)
          targetVarianteId = defaultVarianteMap.get(d.producto_id)?.id ?? null;

        movimientos.push({
          producto_id: prodId,
          variante_id: targetVarianteId,
          cantidad: targetUnits,
          motivo: 'VENTA',
          errorNoInventario: `Inventario no encontrado para el producto ${d.producto_id}`,
          errorStockInsuficiente: () =>
            `Stock insuficiente para el producto ${d.producto_id}`,
          errorConcurrencia: `Conflicto de concurrencia: stock insuficiente para el producto ${d.producto_id}`,
        });
      }
    }

    const inventarioPairKeys = new Set<string>();
    const inventarioPairs: {
      producto_id: bigint;
      variante_id: bigint | null;
    }[] = [];
    for (const movimiento of movimientos) {
      const key = `${movimiento.producto_id}_${movimiento.variante_id ?? 'null'}`;
      if (!inventarioPairKeys.has(key)) {
        inventarioPairKeys.add(key);
        inventarioPairs.push({
          producto_id: movimiento.producto_id,
          variante_id: movimiento.variante_id,
        });
      }
    }
    const inventarios = inventarioPairs.length
      ? await this.prisma.inventario.findMany({
          where: {
            OR: inventarioPairs.map((pair) => ({
              producto_id: pair.producto_id,
              variante_id: pair.variante_id,
            })),
          },
        })
      : [];
    const inventarioMap = new Map(
      inventarios.map((inv) => [
        `${inv.producto_id}_${inv.variante_id ?? 'null'}`,
        inv,
      ]),
    );

    return this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // Expired reservations must be released before any current stock predicate
      // runs. The service is optional only for legacy unit harnesses; production
      // wiring always injects it through VentasModule.
      if (this.inventoryReservations) {
        await this.inventoryReservations.releaseExpiredInTransaction(tx);
      }

      const lastVenta = await tx.venta.findFirst({
        orderBy: { id: 'desc' },
        select: { id: true }
      });
      const nextId = lastVenta ? Number(lastVenta.id) + 1 : 1;
      const numeroTicket = `TK-${String(nextId).padStart(6, '0')}`;

      // 1. Create Venta
      const venta = await tx.venta.create({
        data: {
          numero_ticket: numeroTicket,
          cliente_id: data.cliente_id ? BigInt(data.cliente_id) : null,
          usuario_id: BigInt(data.usuario_id),
          caja_id: data.caja_id ? BigInt(data.caja_id) : null,
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
              motivo_ajuste: d.esRebaja
                ? d.motivo_ajuste || data.motivo_ajuste || 'Rebaja manual POS'
                : null,
              subtotal: d.cantidad * d.precioAplicado,
            })),
          },
        },
        include: {
          cliente: true,
          usuario: { select: { nombres: true, apellidos: true } },
          detalles: {
            include: { producto: true, variante: true, empaque: true },
          },
        },
      });

      // Si se especificó una caja, registramos el movimiento
      if (data.caja_id && data.metodo_pago === 'EFECTIVO') {
        await tx.movimientoCaja.create({
          data: {
            caja_id: BigInt(data.caja_id),
            usuario_id: BigInt(data.usuario_id),
            tipo_movimiento: 'INGRESO',
            concepto: `Venta POS #${numeroTicket}`,
            monto: total, // El monto efectivo que ingresa a la caja (no incluye vuelto)
            metodo_pago: 'EFECTIVO',
            referencia_id: venta.id.toString(),
          }
        });
      }

      // A reservation is consumed only by the exact stock targets it originally
      // locked. Its state transition and the later stock decrement share this
      // transaction, so failed checkout work restores the reservation automatically.
      const reservationTargets = data.reserva_id
        ? movimientos.map((movement) => {
            const inventory = inventarioMap.get(
              `${movement.producto_id}_${movement.variante_id ?? 'null'}`,
            );
            if (!inventory)
              throw new NotFoundException(movement.errorNoInventario);
            return { inventarioId: inventory.id, cantidad: movement.cantidad };
          })
        : null;
      if (data.reserva_id) {
        if (!this.inventoryReservations) {
          throw new ConflictException(
            'Las reservas de inventario no están disponibles en este entorno.',
          );
        }
        await this.inventoryReservations.consumeForSale(
          tx,
          data.reserva_id,
          venta.id,
          data.usuario_id,
          reservationTargets!,
        );
      }

      // 2. Reserve a discount use atomically. The engine's earlier cap check only
      // selects an eligible promotion; it cannot authorize consumption because a
      // concurrent checkout may consume the last use before this transaction.
      if (descuentoIdAplicado) {
        // Prisma's updateMany cannot compare two columns from the same row. Keep
        // the comparison in PostgreSQL so an admin changing limite_usos cannot
        // race a separate findUnique/updateMany pair. NULL remains unlimited.
        const usosReservados = await tx.$executeRaw`
          UPDATE descuentos
          SET usos_actuales = usos_actuales + 1
          WHERE id = ${descuentoIdAplicado}
            AND (limite_usos IS NULL OR usos_actuales < limite_usos)
        `;

        if (usosReservados === 0) {
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

      // 3. Reserve combo cupos with conditional writes. The inventory plan and
      // snapshot above are intentionally read-only preflight work.
      for (const d of data.detalles) {
        const productoInfo = productoMap.get(d.producto_id);
        if (
          productoInfo?.tipo_producto !== 'COMBO' ||
          productoInfo.cupo_maximo == null
        )
          continue;

        const cupoReservado = await tx.producto.updateMany({
          where: {
            id: BigInt(d.producto_id),
            cupo_maximo: { not: null },
            cupo_usado: { lte: productoInfo.cupo_maximo - d.cantidad },
          },
          data: { cupo_usado: { increment: d.cantidad } },
        });
        if (cupoReservado.count === 0) {
          throw new ConflictException(
            `Cupo agotado para el combo ${productoInfo.nombre}`,
          );
        }
      }

      // 3c. Apply the atomic decrements and record each movimiento. Still sequential —
      // each updateMany's conditional WHERE is the real concurrency guard — but now
      // backed by the batched read above instead of one findFirst per movement.
      for (const m of movimientos) {
        const key = `${m.producto_id}_${m.variante_id ?? 'null'}`;
        const inv = inventarioMap.get(key);

        if (!inv) {
          throw new NotFoundException(m.errorNoInventario);
        }

        // Do not reject from the preloaded reserved value: it may have included
        // an expired reservation just released above. The live SQL predicate is
        // the authoritative stock evaluation for ordinary checkouts.

        const updated = data.reserva_id
          ? await tx.inventario.updateMany({
              where: {
                id: inv.id,
                cantidad_disponible: { gte: m.cantidad },
                reservado: { gte: m.cantidad },
              },
              data: {
                cantidad_disponible: { decrement: m.cantidad },
                reservado: { decrement: m.cantidad },
              },
            })
          : await tx.$executeRaw`
              UPDATE inventario
              SET cantidad_disponible = cantidad_disponible - ${m.cantidad}
              WHERE id = ${inv.id}
                AND cantidad_disponible - reservado >= ${m.cantidad}
            `;

        if ((typeof updated === 'number' ? updated : updated.count) === 0) {
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
        nombre_cajero: (venta as any).usuario 
          ? `${(venta as any).usuario.nombres} ${(venta as any).usuario.apellidos || ''}`.trim() 
          : venta.usuario_id.toString(),
        cliente: venta.cliente
          ? {
              ...venta.cliente,
              id: venta.cliente.id.toString(),
            }
          : null,
        detalles: venta.detalles.map(
          (
            det: Prisma.VentaDetalleGetPayload<{
              include: { producto: true; variante: true; empaque: true };
            }>,
          ) => ({
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
          }),
        ),
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
          usuario: { select: { nombres: true, apellidos: true } },
          detalles: {
            include: { producto: true },
          },
        },
      }),
    ]);

    return {
      total,
      data: data.map(
        (
          v: Prisma.VentaGetPayload<{
            include: {
              cliente: true;
              usuario: { select: { nombres: true, apellidos: true } };
              detalles: { include: { producto: true } };
            };
          }>,
        ) => ({
          ...v,
          id: v.id.toString(),
          cliente_id: v.cliente_id?.toString(),
          usuario_id: v.usuario_id.toString(),
          nombre_cajero: v.usuario 
            ? `${v.usuario.nombres} ${v.usuario.apellidos || ''}`.trim() 
            : v.usuario_id.toString(),
          cliente: v.cliente
            ? {
                ...v.cliente,
                id: v.cliente.id.toString(),
              }
            : null,
          detalles: v.detalles.map(
            (
              det: Prisma.VentaDetalleGetPayload<{
                include: { producto: true };
              }>,
            ) => ({
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
            }),
          ),
        }),
      ),
    };
  }

  async anular(
    venta_id: string,
    usuario_id: string,
    motivo: string,
  ): Promise<any> {
    const prepared = await this.preloadReversion(venta_id);
    if (prepared.venta.estado === 'ANULADA')
      throw new ConflictException('La venta ya se encuentra anulada');

    return this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // The state transition is conditional so a concurrent cancellation cannot return stock twice.
      const transition = await tx.venta.updateMany({
        where: { id: prepared.id, estado: 'COMPLETADA' },
        data: { estado: 'ANULADA', motivo_anulacion: motivo },
      });
      if (transition.count === 0)
        throw new ConflictException('La venta ya se encuentra anulada');

      for (const d of prepared.venta.detalles) {
        const productoInfo = prepared.productos.get(d.producto_id.toString());
        const prodId = d.producto_id;

        if (productoInfo?.tipo_producto === 'COMBO') {
          const cupoLiberado = await tx.producto.updateMany({
            where: {
              id: prodId,
              cupo_maximo: { not: null },
              cupo_usado: { gte: d.cantidad },
            },
            data: { cupo_usado: { decrement: d.cantidad } },
          });
          if (cupoLiberado.count === 0) {
            await tx.producto.updateMany({
              where: {
                id: prodId,
                cupo_maximo: { not: null },
                cupo_usado: { gt: 0 },
              },
              data: { cupo_usado: 0 },
            });
          }
        }

        const targets = this.stockTargets(
          d,
          productoInfo,
          prepared.defaultVariantes,
        );
        for (const target of targets) {
          const inv = this.findInventario(
            prepared.inventarios,
            target.productoId,
            target.varianteId,
          );
          if (!inv) throw new NotFoundException(target.errorNoInventarioAnular);

          await tx.inventario.update({
            where: { id: inv.id },
            data: { cantidad_disponible: { increment: target.cantidad } },
          });
          await tx.movimientosInventario.create({
            data: {
              producto_id: target.productoId,
              variante_id: target.varianteId || inv.variante_id,
              tipo_movimiento: 'ENTRADA',
              cantidad: target.cantidad,
              motivo: target.esCombo
                ? motivo || `DEVOLUCION_VENTA_COMBO (${productoInfo?.nombre})`
                : motivo || 'DEVOLUCION_VENTA',
              tipo_documento_origen: 'VENTA_ANULADA',
              documento_origen_id: prepared.venta.id,
              usuario_id: BigInt(usuario_id),
            },
          });
        }
      }

      if (prepared.venta.caja_id && prepared.venta.metodo_pago === 'EFECTIVO') {
        await tx.movimientoCaja.create({
          data: {
            caja_id: prepared.venta.caja_id,
            usuario_id: BigInt(usuario_id),
            tipo_movimiento: 'EGRESO',
            concepto: `Anulación de Venta #${prepared.venta.numero_ticket}`,
            monto: prepared.venta.total,
            metodo_pago: 'EFECTIVO',
            referencia_id: prepared.venta.id.toString(),
          }
        });
      }

      return {
        success: true,
        message: 'Venta anulada y stock retornado correctamente',
      };
    });
  }

  async revertirAnulacion(venta_id: string, usuario_id: string): Promise<any> {
    const prepared = await this.preloadReversion(venta_id);
    if (prepared.venta.estado !== 'ANULADA')
      throw new ConflictException('La venta no está anulada');

    return this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      if (this.inventoryReservations) {
        await this.inventoryReservations.releaseExpiredInTransaction(tx);
      }

      // Keep this conditional state guard inside the transaction; all preloaded data is read-only.
      const transition = await tx.venta.updateMany({
        where: { id: prepared.id, estado: 'ANULADA' },
        data: { estado: 'COMPLETADA', motivo_anulacion: null },
      });
      if (transition.count === 0)
        throw new ConflictException('La venta no está anulada');

      for (const d of prepared.venta.detalles) {
        const productoInfo = prepared.productos.get(d.producto_id.toString());
        const prodId = d.producto_id;

        if (productoInfo?.tipo_producto === 'COMBO') {
          // No cap validation: the cap may have changed after the original sale.
          await tx.producto.updateMany({
            where: { id: prodId, cupo_maximo: { not: null } },
            data: { cupo_usado: { increment: d.cantidad } },
          });
        }

        for (const target of this.stockTargets(
          d,
          productoInfo,
          prepared.defaultVariantes,
        )) {
          const inv = this.findInventario(
            prepared.inventarios,
            target.productoId,
            target.varianteId,
          );
          if (!inv)
            throw new NotFoundException(target.errorNoInventarioRevertir);

          // As in checkout, the SQL predicate below evaluates live reserved
          // stock after expired reservations have been released.

          const updated = await tx.$executeRaw`
            UPDATE inventario
            SET cantidad_disponible = cantidad_disponible - ${target.cantidad}
            WHERE id = ${inv.id}
              AND cantidad_disponible - reservado >= ${target.cantidad}
          `;
          if (updated === 0)
            throw new ConflictException(target.errorConcurrenciaRevertir);

          // Preserve the original sequential semantics for two details targeting one row.
          inv.cantidad_disponible -= target.cantidad;
          await tx.movimientosInventario.create({
            data: {
              producto_id: target.productoId,
              variante_id: target.varianteId || inv.variante_id,
              tipo_movimiento: 'SALIDA',
              cantidad: target.cantidad,
              motivo: target.esCombo
                ? `REVERSION_ANULACION_COMBO (${productoInfo?.nombre})`
                : 'REVERSION_ANULACION',
              tipo_documento_origen: 'VENTA',
              documento_origen_id: prepared.venta.id,
              usuario_id: BigInt(usuario_id),
            },
          });
        }
      }

      if (prepared.venta.caja_id && prepared.venta.metodo_pago === 'EFECTIVO') {
        await tx.movimientoCaja.create({
          data: {
            caja_id: prepared.venta.caja_id,
            usuario_id: BigInt(usuario_id),
            tipo_movimiento: 'INGRESO',
            concepto: `Reversión Anulación #${prepared.venta.numero_ticket}`,
            monto: prepared.venta.total,
            metodo_pago: 'EFECTIVO',
            referencia_id: prepared.venta.id.toString(),
          }
        });
      }

      return {
        success: true,
        message: 'Anulación revertida y stock descontado correctamente',
      };
    });
  }

  private async preloadReversion(ventaId: string) {
    const id = BigInt(ventaId);
    const venta = await this.prisma.venta.findUnique({
      where: { id },
      include: { detalles: true },
    });
    if (!venta) throw new NotFoundException('Venta no encontrada');

    const productoIds = [...new Set(venta.detalles.map((d) => d.producto_id))];
    const productosList = await this.prisma.producto.findMany({
      where: { id: { in: productoIds } },
      include: { componentes_combo: true },
    });
    const productos = new Map(productosList.map((p) => [p.id.toString(), p]));

    const defaultVariantProductoIds = new Set<bigint>();
    for (const d of venta.detalles) {
      const producto = productos.get(d.producto_id.toString());
      if (producto?.tipo_producto === 'COMBO') {
        for (const componente of producto.componentes_combo) {
          if (!componente.variante_id)
            defaultVariantProductoIds.add(componente.componente_prod_id);
        }
      } else if (!d.variante_id) {
        defaultVariantProductoIds.add(d.producto_id);
      }
    }
    const variants = defaultVariantProductoIds.size
      ? await this.prisma.variante.findMany({
          where: {
            producto_id: { in: [...defaultVariantProductoIds] },
            activo: true,
          },
          orderBy: { id: 'asc' },
        })
      : [];
    const defaultVariantes = new Map<string, (typeof variants)[number]>();
    for (const variant of variants) {
      const key = variant.producto_id.toString();
      if (!defaultVariantes.has(key)) defaultVariantes.set(key, variant);
    }

    const inventarioProductoIds = new Set<bigint>();
    for (const d of venta.detalles) {
      const producto = productos.get(d.producto_id.toString());
      if (
        producto?.tipo_producto === 'COMBO' &&
        producto.componentes_combo.length > 0
      ) {
        for (const componente of producto.componentes_combo)
          inventarioProductoIds.add(componente.componente_prod_id);
      } else {
        inventarioProductoIds.add(d.producto_id);
      }
    }
    const inventarios = inventarioProductoIds.size
      ? await this.prisma.inventario.findMany({
          where: { producto_id: { in: [...inventarioProductoIds] } },
        })
      : [];

    return { id, venta, productos, defaultVariantes, inventarios };
  }

  private stockTargets(
    detalle: {
      producto_id: bigint;
      variante_id: bigint | null;
      cantidad: number;
    },
    producto:
      | {
          tipo_producto: string;
          nombre: string;
          componentes_combo: {
            componente_prod_id: bigint;
            variante_id: bigint | null;
            cantidad: number;
          }[];
        }
      | undefined,
    defaultVariantes: Map<string, { id: bigint }>,
  ) {
    if (
      producto?.tipo_producto === 'COMBO' &&
      producto.componentes_combo.length > 0
    ) {
      return producto.componentes_combo.map((componente) => ({
        productoId: componente.componente_prod_id,
        varianteId:
          componente.variante_id ??
          defaultVariantes.get(componente.componente_prod_id.toString())?.id ??
          null,
        cantidad: detalle.cantidad * componente.cantidad,
        esCombo: true,
        errorNoInventarioAnular:
          'Inventario no encontrado para devolver stock en componente del combo',
        errorNoInventarioRevertir:
          'Inventario no encontrado para revertir anulación en componente del combo',
        errorStockInsuficienteRevertir:
          'Stock insuficiente para revertir anulación en componente del combo',
        errorConcurrenciaRevertir:
          'Conflicto de concurrencia al revertir anulación del componente del combo',
      }));
    }

    const productoId = detalle.producto_id;
    return [
      {
        productoId,
        varianteId:
          detalle.variante_id ??
          defaultVariantes.get(productoId.toString())?.id ??
          null,
        cantidad: detalle.cantidad,
        esCombo: false,
        errorNoInventarioAnular: `Inventario no encontrado para retornar stock del producto ${productoId}`,
        errorNoInventarioRevertir: `Inventario no encontrado para revertir la anulación del producto ${productoId}`,
        errorStockInsuficienteRevertir: `Stock insuficiente para revertir la anulación del producto ${productoId}`,
        errorConcurrenciaRevertir: `Conflicto de concurrencia al revertir anulación del producto ${productoId}`,
      },
    ];
  }

  private findInventario<
    T extends { producto_id: bigint; variante_id: bigint | null },
  >(inventarios: T[], productoId: bigint, varianteId: bigint | null) {
    return inventarios.find(
      (inventario) =>
        inventario.producto_id === productoId &&
        (varianteId ? inventario.variante_id === varianteId : true),
    );
  }
}
