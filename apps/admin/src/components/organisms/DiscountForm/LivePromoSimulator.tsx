'use client';

import React, { useState, useMemo } from 'react';
import styles from './LivePromoSimulator.module.css';
import { RefreshCw, Zap, Store, Monitor, Tag, AlertTriangle, Ticket, Check, X, Info } from 'lucide-react';

export interface PromoFormState {
  nombre?: string;
  tipo?: 'PORCENTAJE' | 'MONTO_FIJO' | 'COMBO' | 'LLEVA_X_PAGA_Y' | string;
  valor?: number | string;
  maxMontoDescuento?: number | string;
  cantidadRequerida?: number | string;
  cantidadPaga?: number | string;
  montoMinimoCompra?: number | string;
  codigoCupon?: string;
  canal?: 'POS' | 'ECOMMERCE' | 'TODOS' | string;
  alcance?: 'GLOBAL' | 'CATEGORIA' | 'PRODUCTO' | 'VARIANTE' | 'EMPAQUE' | string;
  categoriaIds?: string[];
  productoIds?: string[];
  varianteIds?: string[];
  empaqueIds?: string[];
}

export interface LivePromoSimulatorProps {
  formState: PromoFormState;
}

interface TestCartItem {
  id: string;
  nombre: string;
  precio: number;
  cantidad: number;
  elegible: boolean;
}

const INITIAL_CART: TestCartItem[] = [
  { id: '1', nombre: 'Cuaderno Espiral 100H', precio: 25.0, cantidad: 2, elegible: true },
  { id: '2', nombre: 'Bolígrafo Azul Pack x10', precio: 18.0, cantidad: 1, elegible: true },
  { id: '3', nombre: 'Mochila Ergonómica', precio: 120.0, cantidad: 1, elegible: false },
];

export function LivePromoSimulator({ formState }: LivePromoSimulatorProps) {
  const [cartItems, setCartItems] = useState<TestCartItem[]>(INITIAL_CART);

  // Update item quantity
  const handleUpdateQty = (id: string, delta: number) => {
    setCartItems((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const newQty = Math.max(0, item.cantidad + delta);
          return { ...item, cantidad: newQty };
        }
        return item;
      })
    );
  };

  // Toggle item eligibility in test cart
  const handleToggleEligibility = (id: string) => {
    setCartItems((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          return { ...item, elegible: !item.elegible };
        }
        return item;
      })
    );
  };

  const handleResetCart = () => {
    setCartItems(INITIAL_CART);
  };

  // Form values sanitized
  const alcance = formState.alcance || 'GLOBAL';
  const tipo = formState.tipo || 'PORCENTAJE';
  const valor = Number(formState.valor) || 0;
  const maxMontoDescuento = Number(formState.maxMontoDescuento) || 0;
  const cantidadRequerida = Number(formState.cantidadRequerida) || 2;
  const cantidadPaga = Number(formState.cantidadPaga) || 1;
  const montoMinimoCompra = Number(formState.montoMinimoCompra) || 0;
  const codigoCupon = formState.codigoCupon?.trim().toUpperCase() || '';
  const canal = formState.canal || 'TODOS';
  const promoNombre = formState.nombre?.trim() || 'Promoción en Vivo';
  const selectedProductIds = formState.productoIds || [];

  // Subtotal calculations (Global vs Eligible items)
  const subtotalTotal = useMemo(() => {
    return cartItems.reduce((acc, item) => acc + item.precio * item.cantidad, 0);
  }, [cartItems]);

  const totalQuantity = useMemo(() => {
    return cartItems.reduce((acc, item) => acc + item.cantidad, 0);
  }, [cartItems]);

  const eligibleItems = useMemo(() => {
    if (alcance === 'GLOBAL') return cartItems;
    return cartItems.filter((item) => item.elegible);
  }, [cartItems, alcance]);

  const subtotalElegible = useMemo(() => {
    return eligibleItems.reduce((acc, item) => acc + item.precio * item.cantidad, 0);
  }, [eligibleItems]);

  const eligibleQuantity = useMemo(() => {
    return eligibleItems.reduce((acc, item) => acc + item.cantidad, 0);
  }, [eligibleItems]);

  // Min Spend Validation (evaluated against eligible subtotal or total subtotal)
  const meetsMinSpend = montoMinimoCompra <= 0 || subtotalTotal >= montoMinimoCompra;

  // Calculated Discount & Formula Explanation
  const { discount, badgeText, formulaText, isCapped } = useMemo(() => {
    if (!meetsMinSpend || subtotalTotal <= 0) {
      return {
        discount: 0,
        badgeText: 'Monto Mín. no alcanzado',
        formulaText: `Se requiere una compra mínima de Bs. ${montoMinimoCompra.toFixed(2)}`,
        isCapped: false,
      };
    }

    if (subtotalElegible <= 0) {
      return {
        discount: 0,
        badgeText: 'Sin ítems elegibles',
        formulaText: 'Ningún ítem del carrito coincide con el alcance configurado.',
        isCapped: false,
      };
    }

    let calculated = 0;
    let label = '';
    let formula = '';
    let capped = false;

    if (tipo === 'PORCENTAJE') {
      const rawDiscount = (subtotalElegible * valor) / 100;
      calculated = rawDiscount;

      if (maxMontoDescuento > 0 && rawDiscount > maxMontoDescuento) {
        calculated = maxMontoDescuento;
        capped = true;
        formula = `Cálculo: (Bs. ${subtotalElegible.toFixed(2)} × ${valor}%) = Bs. ${rawDiscount.toFixed(2)} → Límite de tope aplicado: Bs. ${maxMontoDescuento.toFixed(2)}`;
      } else {
        formula = `Cálculo: Bs. ${subtotalElegible.toFixed(2)} elegible × ${valor}% = Bs. ${rawDiscount.toFixed(2)}`;
      }
      label = `${valor}% OFF`;
    } else if (tipo === 'MONTO_FIJO_POR_UNIDAD') {
      let rawSavings = 0;
      eligibleItems.forEach((item) => {
        const perUnit = Math.min(item.precio, valor);
        rawSavings += perUnit * item.cantidad;
      });

      if (maxMontoDescuento > 0 && rawSavings > maxMontoDescuento) {
        calculated = maxMontoDescuento;
        capped = true;
        formula = `Cálculo: ${eligibleQuantity} unidad(es) × Bs. ${valor.toFixed(2)} = Bs. ${rawSavings.toFixed(2)} → Tope aplicado: Bs. ${maxMontoDescuento.toFixed(2)}`;
      } else {
        calculated = rawSavings;
        formula = `Cálculo: ${eligibleQuantity} unidad(es) elegible(s) × Bs. ${valor.toFixed(2)}/u = Bs. ${rawSavings.toFixed(2)} de ahorro total.`;
      }
      label = `Bs. ${valor.toFixed(2)} OFF / ítem`;
    } else if (tipo === 'MONTO_FIJO') {
      calculated = Math.min(valor, subtotalElegible);
      label = `Bs. ${valor.toFixed(2)} OFF Global`;
      formula = `Descuento fijo de Bs. ${valor.toFixed(2)} aplicado al subtotal elegible.`;
    } else if (tipo === 'LLEVA_X_PAGA_Y') {
      if (cantidadRequerida > cantidadPaga && cantidadPaga > 0) {
        let totalFreeUnits = 0;
        let totalSavings = 0;
        const details: string[] = [];

        eligibleItems.forEach((item) => {
          if (item.cantidad >= cantidadRequerida) {
            const sets = Math.floor(item.cantidad / cantidadRequerida);
            const freeUnits = sets * (cantidadRequerida - cantidadPaga);
            const itemSaving = freeUnits * item.precio;
            totalFreeUnits += freeUnits;
            totalSavings += itemSaving;
            details.push(`${item.nombre}: ${sets} set(s) → ${freeUnits} gratis (Bs. ${itemSaving.toFixed(2)})`);
          }
        });

        calculated = totalSavings;
        label = `Lleva ${cantidadRequerida} Paga ${cantidadPaga}`;
        if (totalFreeUnits > 0) {
          formula = `${details.join(' | ')} (Ahorro total: Bs. ${totalSavings.toFixed(2)})`;
        } else {
          formula = `Requiere al menos ${cantidadRequerida} unidades del mismo producto (ningún ítem alcanza el mínimo).`;
        }
      } else {
        calculated = 0;
        label = `Configuración incompleta`;
        formula = `Configura cantidad requerida > cantidad pagada.`;
      }
    } else if (tipo === 'COMBO') {
      const requiredItemsCount = Math.max(1, selectedProductIds.length || 2);
      const matchingCount = eligibleItems.filter((i) => i.cantidad > 0).length;

      if (matchingCount >= requiredItemsCount) {
        const completedSets = Math.min(...eligibleItems.map((i) => i.cantidad));
        const comboSaving = valor > 0 ? completedSets * valor : completedSets * (subtotalElegible * 0.15);
        calculated = comboSaving;
        label = `Combo Pack (${completedSets} set)`;
        formula = `Combo completado con ${matchingCount} productos requeridos. Descuento aplicado: Bs. ${comboSaving.toFixed(2)}`;
      } else {
        calculated = 0;
        label = `Combo incompleto (${matchingCount}/${requiredItemsCount})`;
        formula = `Debes incluir los ${requiredItemsCount} productos requeridos en el carrito para activar la bonificación del Combo.`;
      }
    }

    return {
      discount: Math.max(0, calculated),
      badgeText: label,
      formulaText: formula,
      isCapped: capped,
    };
  }, [
    tipo,
    valor,
    maxMontoDescuento,
    cantidadRequerida,
    cantidadPaga,
    subtotalTotal,
    subtotalElegible,
    eligibleQuantity,
    eligibleItems,
    meetsMinSpend,
    montoMinimoCompra,
    selectedProductIds,
  ]);

  const totalNeto = Math.max(0, subtotalTotal - discount);
  const percentSavings = subtotalTotal > 0 ? ((discount / subtotalTotal) * 100).toFixed(0) : '0';

  return (
    <aside className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.titleGroup}>
          <div className={styles.iconWrapper}>
            <Zap size={16} />
          </div>
          <h3 className={styles.title}>Simulador de Promoción</h3>
        </div>
        <span className={styles.channelBadge}>
          {canal === 'POS' ? 'Solo POS' : canal === 'ECOMMERCE' ? 'Solo E-Commerce' : 'POS + Web'}
        </span>
      </div>

      {/* Interactive Cart Card */}
      <div className={styles.cartCard}>
        <div className={styles.cartHeader}>
          <span>Carrito de Prueba ({totalQuantity} ítems)</span>
          <button type="button" onClick={handleResetCart} className={styles.resetCartBtn} title="Restablecer carrito">
            <RefreshCw size={12} /> Restablecer
          </button>
        </div>

        <div className={styles.cartItemsList}>
          {cartItems.map((item) => {
            const isItemEligible = alcance === 'GLOBAL' || item.elegible;

            return (
              <div
                key={item.id}
                className={`${styles.cartItemRow} ${!isItemEligible ? styles.cartItemIneligible : ''}`}
              >
                <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0 }}>
                  <span className={styles.itemTitle}>{item.nombre}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: '0.15rem' }}>
                    {alcance !== 'GLOBAL' && (
                      <button
                        type="button"
                        onClick={() => handleToggleEligibility(item.id)}
                        className={isItemEligible ? styles.tagEligible : styles.tagIneligible}
                        title="Haz clic para conmutar si este producto entra en el alcance de la regla"
                      >
                        {isItemEligible ? <Check size={10} /> : <X size={10} />}
                        <span>{isItemEligible ? 'Elegible' : 'Excluido'}</span>
                      </button>
                    )}
                  </div>
                </div>

                <div className={styles.qtyControls}>
                  <button
                    type="button"
                    className={styles.qtyBtn}
                    onClick={() => handleUpdateQty(item.id, -1)}
                  >
                    -
                  </button>
                  <span className={styles.qtyValue}>{item.cantidad}</span>
                  <button
                    type="button"
                    className={styles.qtyBtn}
                    onClick={() => handleUpdateQty(item.id, 1)}
                  >
                    +
                  </button>
                </div>

                <span className={styles.itemPrice}>
                  Bs. {(item.precio * item.cantidad).toFixed(2)}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Breakdown & Calculations Card */}
      <div className={styles.breakdownCard}>
        <div className={styles.breakdownRow}>
          <span>Subtotal Carrito:</span>
          <span>Bs. {subtotalTotal.toFixed(2)}</span>
        </div>

        {alcance !== 'GLOBAL' && (
          <div className={styles.breakdownRow} style={{ fontSize: '0.78rem', color: '#64748b' }}>
            <span>Subtotal Elegible ({eligibleItems.length} ítems):</span>
            <span>Bs. {subtotalElegible.toFixed(2)}</span>
          </div>
        )}

        <div className={`${styles.breakdownRow} ${styles.discountRow}`}>
          <span>Descuento Calculado ({badgeText}):</span>
          <span>-Bs. {discount.toFixed(2)}</span>
        </div>

        {isCapped && (
          <div className={styles.cappedAlert}>
            <AlertTriangle size={12} style={{ display: 'inline', marginRight: '4px' }} />
            Tope máximo aplicado (Máx Bs. {maxMontoDescuento.toFixed(2)})
          </div>
        )}

        {!meetsMinSpend && (
          <div className={styles.minSpendAlert}>
            <AlertTriangle size={12} style={{ display: 'inline', marginRight: '4px' }} />
            Monto mínimo requerido: Bs. {montoMinimoCompra.toFixed(2)}
          </div>
        )}

        <div className={`${styles.breakdownRow} ${styles.totalRow}`}>
          <span>Total Neto a Cobrar:</span>
          <span>Bs. {totalNeto.toFixed(2)}</span>
        </div>

        {discount > 0 && (
          <span style={{ fontSize: '0.78rem', color: '#16a34a', fontWeight: 650, textAlign: 'right' }}>
            ¡Ahorro total del {percentSavings}%!
          </span>
        )}
      </div>

      {/* Formula Explanation Box */}
      {formulaText && (
        <div className={styles.formulaBox}>
          <Info size={14} className={styles.formulaIcon} />
          <span>{formulaText}</span>
        </div>
      )}

      {/* Live Badge Previews Section */}
      <div className={styles.previewsContainer}>
        <span className={styles.previewSectionTitle}>Vista Previa de Badges en Tiempo Real</span>

        <div className={styles.previewGrid}>
          {/* POS Terminal Badge Preview */}
          {(canal === 'POS' || canal === 'TODOS') && (
            <div className={styles.posCard}>
              <div className={styles.posHeader}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Monitor size={13} /> Terminal POS (Caja ERP)
                </span>
                <span>TICKET ID #9421</span>
              </div>

              <div className={styles.posTicket}>
                <div className={styles.posItemRow}>
                  <span style={{ fontWeight: 600 }}>{promoNombre}</span>
                  <span className={styles.posBadge}>{badgeText}</span>
                </div>
                <div className={styles.posItemRow}>
                  <span style={{ color: '#94a3b8', fontSize: '0.75rem' }}>Total Ticket</span>
                  <div>
                    {discount > 0 && <span className={styles.posPriceOld}>Bs. {subtotalTotal.toFixed(2)}</span>}
                    <span className={styles.posPriceNew}>Bs. {totalNeto.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* E-Commerce Storefront Preview */}
          {(canal === 'ECOMMERCE' || canal === 'TODOS') && (
            <div className={styles.ecomCard}>
              <div className={styles.ecomHeader}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Store size={13} /> Tienda E-Commerce
                </span>
                <span>VISTA PREVIA DE PRODUCTO</span>
              </div>

              <div className={styles.ecomBanner}>
                <span className={styles.ecomTagBadge}>
                  <Tag size={11} /> {badgeText}
                </span>
                <div className={styles.ecomInfo}>
                  <span className={styles.ecomTitle}>{promoNombre}</span>
                  <div className={styles.ecomPrices}>
                    {discount > 0 && <span className={styles.ecomOld}>Bs. {subtotalTotal.toFixed(2)}</span>}
                    <span className={styles.ecomNew}>Bs. {totalNeto.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {codigoCupon && (
                <div className={styles.couponChip}>
                  <Ticket size={11} /> Cupón Activo: <strong>{codigoCupon}</strong>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}

export default LivePromoSimulator;
