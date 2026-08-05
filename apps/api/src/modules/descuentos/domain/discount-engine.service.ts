import { Inject, Injectable } from '@nestjs/common';
import { DESCUENTO_REPOSITORY } from './repositories/descuento.repository.interface';
import type { IDescuentoRepository, ReglaDescuentoVigente } from './repositories/descuento.repository.interface';

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

@Injectable()
export class DiscountEngineService {
  constructor(@Inject(DESCUENTO_REPOSITORY) private readonly descuentoRepo: IDescuentoRepository) {}

  async evaluate(input: EvaluateDiscountInput): Promise<DiscountEvaluationResult | null> {
    const { cupon, canal = 'TODOS', clienteId, items } = input;
    if (!items || items.length === 0) return null;

    const now = new Date();
    const totalCartOriginal = items.reduce((sum, item) => sum + item.cantidad * item.precioUnitario, 0);

    const activeDiscounts = await this.descuentoRepo.buscarReglasVigentes({ now, codigoCupon: cupon });
    if (activeDiscounts.length === 0) return null;

    let bestResult: DiscountEvaluationResult | null = null;
    let maxSavings = -1;

    for (const d of activeDiscounts) {
      // 0. Day-of-Week / Time-of-Day Gate (before channel filter)
      if (!this.isDayTimeEligible(d, now)) {
        continue;
      }

      // 1. Channel Filter
      if (d.canal !== 'TODOS' && canal !== 'TODOS' && d.canal !== canal) {
        continue;
      }

      // 2. Global Usage Limit Check
      if (d.limite_usos && d.usos_actuales >= d.limite_usos) {
        continue;
      }

      // 3. Customer Per-User Usage Limit Check
      if (clienteId && d.limite_usos_por_cliente) {
        const clienteUsosCount = await this.descuentoRepo.contarUsosPorCliente(d.id, clienteId);
        if (clienteUsosCount >= d.limite_usos_por_cliente) {
          continue;
        }
      }

      // 4. Match Target Items
      const targetProductIds = new Set(d.productos.map((p) => p.producto_id));
      const targetVariantIds = new Set(d.variantes.map((v) => v.variante_id));
      const targetEmpaqueIds = new Set(d.empaques.map((e) => e.empaque_id));
      const targetCategoryIds = new Set(d.categorias.map((c) => c.categoria_id));

      const matchingItems = items.filter((item) => {
        if (d.alcance === 'GLOBAL') return true;
        if (d.alcance === 'PRODUCTO') return targetProductIds.has(item.productoId);
        if (d.alcance === 'VARIANTE') return item.varianteId && targetVariantIds.has(item.varianteId);
        if (d.alcance === 'EMPAQUE') return item.empaqueId && targetEmpaqueIds.has(item.empaqueId);
        if (d.alcance === 'CATEGORIA') return item.categoriaId && targetCategoryIds.has(item.categoriaId);
        return false;
      });

      if (matchingItems.length === 0) continue;

      const matchingSubtotal = matchingItems.reduce(
        (sum, item) => sum + item.cantidad * item.precioUnitario,
        0,
      );

      // 5. Minimum Purchase Spend Check
      if (d.monto_minimo_compra && matchingSubtotal < d.monto_minimo_compra) {
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
          const effectiveDiscountPerUnit = Math.min(item.precioUnitario, unitDiscount);
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
          const groups = new Map<string, { cantidad: number; precioUnitario: number }>();
          for (const item of matchingItems) {
            const key = `${item.productoId}_${item.varianteId || 'base'}_${item.empaqueId || 'unit'}`;
            const existing = groups.get(key) || { cantidad: 0, precioUnitario: item.precioUnitario };
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

          const hasAllComponents = requiredProductIds.every((pId) => (quantitiesByProd.get(pId) || 0) >= 1);

          if (hasAllComponents) {
            const completedSets = Math.min(...requiredProductIds.map((pId) => quantitiesByProd.get(pId) || 0));
            const comboDiscountValue = d.valor || 0;
            if (comboDiscountValue > 0) {
              savings = completedSets * comboDiscountValue;
            } else {
              // Default fallback: 10% bundle savings if no fixed discount specified
              const comboItemsSubtotal = matchingItems.reduce((s, it) => s + it.cantidad * it.precioUnitario, 0);
              savings = (comboItemsSubtotal * 10) / 100;
            }
          }
        } else {
          // Global combo fallback with minimum items count
          const req = d.cantidad_requerida || 2;
          const totalUnits = matchingItems.reduce((sum, it) => sum + it.cantidad, 0);
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
          totalFinal: Number(Math.max(0, totalCartOriginal - savings).toFixed(2)),
          itemsElegiblesCount: matchingItems.reduce((acc, it) => acc + it.cantidad, 0),
        };
      }
    }

    return bestResult;
  }

  private isDayTimeEligible(d: ReglaDescuentoVigente, now: Date): boolean {
    const dias = d.dias_semana ?? [];
    if (dias.length > 0 && !dias.includes(now.getDay())) return false;
    if (!d.hora_inicio || !d.hora_fin) return true;
    const nowHHMM = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    return nowHHMM >= d.hora_inicio && nowHHMM <= d.hora_fin;
  }
}
