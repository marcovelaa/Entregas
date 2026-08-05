import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service';

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
  constructor(private readonly prisma: PrismaService) {}

  async evaluate(input: EvaluateDiscountInput): Promise<DiscountEvaluationResult | null> {
    const { cupon, canal = 'TODOS', clienteId, items } = input;
    if (!items || items.length === 0) return null;

    const now = new Date();
    const totalCartOriginal = items.reduce((sum, item) => sum + item.cantidad * item.precioUnitario, 0);

    // Fetch candidate discounts
    const activeDiscounts = await this.prisma.descuento.findMany({
      where: {
        activo: true,
        fecha_inicio: { lte: now },
        fecha_fin: { gte: now },
        codigo_cupon: cupon ? cupon.toUpperCase() : null,
        OR: [{ dias_semana: { isEmpty: true } }, { dias_semana: { has: now.getDay() } }],
      },
      include: {
        productos: true,
        variantes: true,
        empaques: true,
        categorias: true,
      },
      orderBy: [{ prioridad: 'desc' }, { creado_en: 'desc' }],
    });

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
        const clienteUsosCount = await this.prisma.descuentoUso.count({
          where: {
            descuento_id: d.id,
            cliente_id: BigInt(clienteId),
          },
        });
        if (clienteUsosCount >= d.limite_usos_por_cliente) {
          continue;
        }
      }

      // 4. Match Target Items
      const targetProductIds = new Set(d.productos.map((p: { producto_id: bigint }) => p.producto_id.toString()));
      const targetVariantIds = new Set(d.variantes.map((v: { variante_id: bigint }) => v.variante_id.toString()));
      const targetEmpaqueIds = new Set(d.empaques.map((e: { empaque_id: bigint }) => e.empaque_id.toString()));
      const targetCategoryIds = new Set(d.categorias.map((c: { categoria_id: bigint }) => c.categoria_id.toString()));

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
      if (d.monto_minimo_compra && matchingSubtotal < Number(d.monto_minimo_compra)) {
        continue;
      }

      // 6. Calculate Savings Strategy
      let savings = 0;

      if (d.tipo === 'PORCENTAJE') {
        savings = (matchingSubtotal * Number(d.valor)) / 100;
        if (d.max_monto_descuento) {
          savings = Math.min(savings, Number(d.max_monto_descuento));
        }
      } else if (d.tipo === 'MONTO_FIJO_POR_UNIDAD') {
        const unitDiscount = Number(d.valor);
        let rawSavings = 0;
        for (const item of matchingItems) {
          const effectiveDiscountPerUnit = Math.min(item.precioUnitario, unitDiscount);
          rawSavings += effectiveDiscountPerUnit * item.cantidad;
        }
        if (d.max_monto_descuento) {
          savings = Math.min(rawSavings, Number(d.max_monto_descuento));
        } else {
          savings = rawSavings;
        }
      } else if (d.tipo === 'MONTO_FIJO') {
        savings = Math.min(matchingSubtotal, Number(d.valor));
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
        const requiredProductIds = d.productos.map((p: { producto_id: bigint }) => p.producto_id.toString());
        if (requiredProductIds.length > 0) {
          // Check available quantities for each required product in the combo
          const quantitiesByProd = new Map<string, number>();
          for (const item of matchingItems) {
            const current = quantitiesByProd.get(item.productoId) || 0;
            quantitiesByProd.set(item.productoId, current + item.cantidad);
          }

          const hasAllComponents = requiredProductIds.every((pId: string) => (quantitiesByProd.get(pId) || 0) >= 1);

          if (hasAllComponents) {
            const completedSets = Math.min(...requiredProductIds.map((pId: string) => quantitiesByProd.get(pId) || 0));
            const comboDiscountValue = Number(d.valor) || 0;
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
            savings = sets * (Number(d.valor) || 0);
          }
        }
      }

      if (savings > maxSavings && savings > 0) {
        maxSavings = savings;
        bestResult = {
          id: d.id.toString(),
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

  private isDayTimeEligible(
    d: { dias_semana?: number[]; hora_inicio?: string | null; hora_fin?: string | null },
    now: Date,
  ): boolean {
    const dias = d.dias_semana ?? [];
    if (dias.length > 0 && !dias.includes(now.getDay())) return false;
    if (!d.hora_inicio || !d.hora_fin) return true;
    const nowHHMM = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    return nowHHMM >= d.hora_inicio && nowHHMM <= d.hora_fin;
  }
}
