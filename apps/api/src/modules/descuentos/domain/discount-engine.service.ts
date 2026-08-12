import { Inject, Injectable } from '@nestjs/common';
import { DESCUENTO_REPOSITORY } from './repositories/descuento.repository.interface';
import type {
  IDescuentoRepository,
  ReglaDescuentoVigente,
} from './repositories/descuento.repository.interface';

export interface CartItemInput {
  productoId: string;
  varianteId?: string;
  empaqueId?: string;
  categoriaId?: string;
  cantidad: number;
  precioUnitario: number;
}

export interface EvaluateDiscountInput {
  cupon?: string;
  canal?: 'POS' | 'ECOMMERCE';
  clienteId?: string;
  items: CartItemInput[];
}

export interface DiscountEvaluationResult {
  id: string;
  nombre: string;
  codigo?: string | null;
  tipo: string;
  alcance: string;
  canal: string;
  montoDescontado: number;
  totalOriginal: number;
  totalFinal: number;
  itemsElegiblesCount: number;
}

export type DiscountRejectionReason =
  | 'SIN_PROMOCIONES_ACTIVAS'
  | 'CUPON_NO_ENCONTRADO'
  | 'CUPON_INACTIVO'
  | 'CUPON_FUERA_DE_VIGENCIA'
  | 'CUPON_DIA_NO_HABILITADO'
  | 'FUERA_DE_HORARIO'
  | 'CANAL_NO_VALIDO'
  | 'CUPO_GLOBAL_AGOTADO'
  | 'LIMITE_POR_CLIENTE_ALCANZADO'
  | 'SIN_ITEMS_ELEGIBLES'
  | 'MONTO_MINIMO_NO_ALCANZADO'
  | 'SIN_AHORRO_CALCULADO';

const REJECTION_MESSAGES: Record<DiscountRejectionReason, string> = {
  SIN_PROMOCIONES_ACTIVAS:
    'No hay promociones ni cupones activos en este momento.',
  CUPON_NO_ENCONTRADO: 'El código de cupón no existe.',
  CUPON_INACTIVO: 'El cupón existe pero está desactivado.',
  CUPON_FUERA_DE_VIGENCIA: 'El cupón no está vigente en este momento.',
  CUPON_DIA_NO_HABILITADO: 'El cupón no está habilitado para el día de hoy.',
  FUERA_DE_HORARIO: 'La promoción no está disponible en este horario.',
  CANAL_NO_VALIDO: 'La promoción no aplica para este canal de venta.',
  CUPO_GLOBAL_AGOTADO: 'La promoción alcanzó su límite de usos.',
  LIMITE_POR_CLIENTE_ALCANZADO:
    'Ya alcanzaste el límite de usos de esta promoción.',
  SIN_ITEMS_ELEGIBLES:
    'Ninguno de los productos del carrito califica para una promoción activa.',
  MONTO_MINIMO_NO_ALCANZADO:
    'El carrito no alcanza el monto mínimo de compra requerido.',
  SIN_AHORRO_CALCULADO:
    'Las condiciones de la promoción aún no se cumplen con las cantidades actuales.',
};

export interface DiscountEvaluationResponse {
  discount: DiscountEvaluationResult | null;
  rejectionReason?: DiscountRejectionReason;
  rejectionMessage?: string;
}

type Rejection = { reason: DiscountRejectionReason; scopeMatched: boolean };

@Injectable()
export class DiscountEngineService {
  constructor(
    @Inject(DESCUENTO_REPOSITORY)
    private readonly descuentoRepo: IDescuentoRepository,
  ) {}

  async evaluate(
    input: EvaluateDiscountInput,
  ): Promise<DiscountEvaluationResult | null> {
    const { best } = await this.run(input);
    return best;
  }

  /** Same evaluation as `evaluate`, plus why nothing applied when it did not. */
  async evaluateWithReason(
    input: EvaluateDiscountInput,
  ): Promise<DiscountEvaluationResponse> {
    const { best, rejections, activeCount } = await this.run(input);
    if (best) return { discount: best };

    if (activeCount === 0 && input.cupon) {
      const couponReason = await this.explainMissingCoupon(input.cupon);
      if (couponReason) {
        return {
          discount: null,
          rejectionReason: couponReason,
          rejectionMessage: REJECTION_MESSAGES[couponReason],
        };
      }
    }

    const chosen: Rejection = rejections.find((r) => r.scopeMatched) ??
      rejections[0] ?? {
        reason: 'SIN_PROMOCIONES_ACTIVAS',
        scopeMatched: false,
      };
    return {
      discount: null,
      rejectionReason: chosen.reason,
      rejectionMessage: REJECTION_MESSAGES[chosen.reason],
    };
  }

  private async run(input: EvaluateDiscountInput): Promise<{
    best: DiscountEvaluationResult | null;
    rejections: Rejection[];
    activeCount: number;
  }> {
    const { cupon, canal = 'TODOS', clienteId, items } = input;
    const rejections: Rejection[] = [];
    if (!items || items.length === 0)
      return { best: null, rejections, activeCount: 0 };

    const now = new Date();
    const totalCartOriginal = items.reduce(
      (sum, item) => sum + item.cantidad * item.precioUnitario,
      0,
    );

    const activeDiscounts = await this.descuentoRepo.buscarReglasVigentes({
      now,
      codigoCupon: cupon,
    });
    if (activeDiscounts.length === 0)
      return { best: null, rejections, activeCount: 0 };

    let bestResult: DiscountEvaluationResult | null = null;
    let maxSavings = -1;

    for (const d of activeDiscounts) {
      // 0. Day-of-Week / Time-of-Day Gate (before channel filter)
      if (!this.isDayTimeEligible(d, now)) {
        rejections.push({ reason: 'FUERA_DE_HORARIO', scopeMatched: false });
        continue;
      }

      // 1. Channel Filter
      if (d.canal !== 'TODOS' && canal !== 'TODOS' && d.canal !== canal) {
        rejections.push({ reason: 'CANAL_NO_VALIDO', scopeMatched: false });
        continue;
      }

      // 2. Global Usage Limit Check
      if (d.limite_usos && d.usos_actuales >= d.limite_usos) {
        rejections.push({ reason: 'CUPO_GLOBAL_AGOTADO', scopeMatched: false });
        continue;
      }

      // 3. Customer Per-User Usage Limit Check
      if (clienteId && d.limite_usos_por_cliente) {
        const clienteUsosCount = await this.descuentoRepo.contarUsosPorCliente(
          d.id,
          clienteId,
        );
        if (clienteUsosCount >= d.limite_usos_por_cliente) {
          rejections.push({
            reason: 'LIMITE_POR_CLIENTE_ALCANZADO',
            scopeMatched: false,
          });
          continue;
        }
      }

      // 4. Match Target Items
      const targetProductIds = new Set(d.productos.map((p) => p.producto_id));
      const targetVariantIds = new Set(d.variantes.map((v) => v.variante_id));
      const targetEmpaqueIds = new Set(d.empaques.map((e) => e.empaque_id));
      const targetCategoryIds = new Set(
        d.categorias.map((c) => c.categoria_id),
      );

      const matchingItems = items.filter((item) => {
        if (d.alcance === 'GLOBAL') return true;
        if (d.alcance === 'PRODUCTO')
          return targetProductIds.has(item.productoId);
        if (d.alcance === 'VARIANTE')
          return item.varianteId && targetVariantIds.has(item.varianteId);
        if (d.alcance === 'EMPAQUE')
          return item.empaqueId && targetEmpaqueIds.has(item.empaqueId);
        if (d.alcance === 'CATEGORIA')
          return item.categoriaId && targetCategoryIds.has(item.categoriaId);
        return false;
      });

      if (matchingItems.length === 0) {
        rejections.push({ reason: 'SIN_ITEMS_ELEGIBLES', scopeMatched: false });
        continue;
      }

      const matchingSubtotal = matchingItems.reduce(
        (sum, item) => sum + item.cantidad * item.precioUnitario,
        0,
      );

      // 5. Minimum Purchase Spend Check
      if (d.monto_minimo_compra && matchingSubtotal < d.monto_minimo_compra) {
        rejections.push({
          reason: 'MONTO_MINIMO_NO_ALCANZADO',
          scopeMatched: true,
        });
        continue;
      }

      // 6. Calculate Savings Strategy
      let savings = 0;

      if (d.tipo === 'PORCENTAJE') {
        savings = (matchingSubtotal * d.valor) / 100;
        if (d.max_monto_descuento) {
          savings = Math.min(savings, d.max_monto_descuento);
        }
      } else if (d.tipo === 'MONTO_FIJO_POR_UNIDAD') {
        const unitDiscount = d.valor;
        let rawSavings = 0;
        for (const item of matchingItems) {
          const effectiveDiscountPerUnit = Math.min(
            item.precioUnitario,
            unitDiscount,
          );
          rawSavings += effectiveDiscountPerUnit * item.cantidad;
        }
        if (d.max_monto_descuento) {
          savings = Math.min(rawSavings, d.max_monto_descuento);
        } else {
          savings = rawSavings;
        }
      } else if (d.tipo === 'MONTO_FIJO') {
        savings = Math.min(matchingSubtotal, d.valor);
      } else if (d.tipo === 'LLEVA_X_PAGA_Y') {
        const req = d.cantidad_requerida || 2;
        const paga = d.cantidad_paga || 1;

        if (req > paga && req > 0) {
          // Group matching items by product/variant/empaque identity to evaluate volume per distinct product
          const groups = new Map<
            string,
            { cantidad: number; precioUnitario: number }
          >();
          for (const item of matchingItems) {
            const key = `${item.productoId}_${item.varianteId || 'base'}_${item.empaqueId || 'unit'}`;
            const existing = groups.get(key) || {
              cantidad: 0,
              precioUnitario: item.precioUnitario,
            };
            existing.cantidad += item.cantidad;
            groups.set(key, existing);
          }

          for (const group of groups.values()) {
            if (group.cantidad >= req) {
              const sets = Math.floor(group.cantidad / req);
              const freeUnits = sets * (req - paga);
              savings += freeUnits * group.precioUnitario;
            }
          }
        }
      } else if (d.tipo === 'COMBO') {
        // Combo bundling: requires target products to all be present in the cart
        const requiredProductIds = d.productos.map((p) => p.producto_id);
        if (requiredProductIds.length > 0) {
          // Check available quantities for each required product in the combo
          const quantitiesByProd = new Map<string, number>();
          for (const item of matchingItems) {
            const current = quantitiesByProd.get(item.productoId) || 0;
            quantitiesByProd.set(item.productoId, current + item.cantidad);
          }

          const hasAllComponents = requiredProductIds.every(
            (pId) => (quantitiesByProd.get(pId) || 0) >= 1,
          );

          if (hasAllComponents) {
            const completedSets = Math.min(
              ...requiredProductIds.map(
                (pId) => quantitiesByProd.get(pId) || 0,
              ),
            );
            const comboDiscountValue = d.valor || 0;
            if (comboDiscountValue > 0) {
              savings = completedSets * comboDiscountValue;
            } else {
              // Default fallback: 10% bundle savings if no fixed discount specified
              const comboItemsSubtotal = matchingItems.reduce(
                (s, it) => s + it.cantidad * it.precioUnitario,
                0,
              );
              savings = (comboItemsSubtotal * 10) / 100;
            }
          }
        } else {
          // Global combo fallback with minimum items count
          const req = d.cantidad_requerida || 2;
          const totalUnits = matchingItems.reduce(
            (sum, it) => sum + it.cantidad,
            0,
          );
          if (totalUnits >= req) {
            const sets = Math.floor(totalUnits / req);
            savings = sets * (d.valor || 0);
          }
        }
      }

      if (savings > maxSavings && savings > 0) {
        maxSavings = savings;
        bestResult = {
          id: d.id,
          nombre: d.nombre,
          codigo: d.codigo_cupon,
          tipo: d.tipo,
          alcance: d.alcance,
          canal: d.canal,
          montoDescontado: Number(savings.toFixed(2)),
          totalOriginal: Number(totalCartOriginal.toFixed(2)),
          totalFinal: Number(
            Math.max(0, totalCartOriginal - savings).toFixed(2),
          ),
          itemsElegiblesCount: matchingItems.reduce(
            (acc, it) => acc + it.cantidad,
            0,
          ),
        };
      } else if (savings <= 0) {
        rejections.push({ reason: 'SIN_AHORRO_CALCULADO', scopeMatched: true });
      }
    }

    return {
      best: bestResult,
      rejections,
      activeCount: activeDiscounts.length,
    };
  }

  /**
   * `buscarReglasVigentes` already filters by activo/fecha/día at the DB level, so an
   * empty result for a coupon lookup collapses every possible reason into "not found".
   * This ignores those filters to tell the customer specifically what is wrong.
   */
  private async explainMissingCoupon(
    codigoCupon: string,
  ): Promise<DiscountRejectionReason | null> {
    const descuento =
      await this.descuentoRepo.buscarDescuentoPorCupon(codigoCupon);
    if (!descuento) return 'CUPON_NO_ENCONTRADO';
    if (!descuento.activo) return 'CUPON_INACTIVO';

    const now = new Date();
    if (now < descuento.fecha_inicio || now > descuento.fecha_fin) {
      return 'CUPON_FUERA_DE_VIGENCIA';
    }
    if (
      descuento.dias_semana.length > 0 &&
      !descuento.dias_semana.includes(now.getDay())
    ) {
      return 'CUPON_DIA_NO_HABILITADO';
    }
    return null;
  }

  private isDayTimeEligible(d: ReglaDescuentoVigente, now: Date): boolean {
    const dias = d.dias_semana ?? [];
    if (dias.length > 0 && !dias.includes(now.getDay())) return false;
    if (!d.hora_inicio || !d.hora_fin) return true;
    const nowHHMM = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    return nowHHMM >= d.hora_inicio && nowHHMM <= d.hora_fin;
  }
}
