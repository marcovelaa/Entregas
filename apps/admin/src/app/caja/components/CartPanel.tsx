"use client";

import { Edit2, Minus, Plus, ShoppingCart, Tag, Trash2 } from "lucide-react";
import type { CartItem, DiscountInfo, DiscountPreview } from "../pos-types";
import { cartQuantity } from "../pos-utils";
import styles from "../page.module.css";

interface CartPanelProps {
  cart: CartItem[];
  couponCode: string;
  discount: DiscountPreview | null;
  discountInfo: DiscountInfo | null;
  isCheckingDiscount: boolean;
  subtotal: number;
  manualDiscount: number;
  discountAmount: number;
  total: number;
  isSubmitting: boolean;
  onCouponChange: (coupon: string) => void;
  onQuantityChange: (cartId: string, value: string) => void;
  onQuantityAdjust: (cartId: string, delta: number) => void;
  onRemove: (cartId: string) => void;
  onAdjustPrice: (item: CartItem) => void;
  onCheckout: () => void;
}

export function CartPanel({
  cart,
  couponCode,
  discount,
  discountInfo,
  isCheckingDiscount,
  subtotal,
  manualDiscount,
  discountAmount,
  total,
  isSubmitting,
  onCouponChange,
  onQuantityChange,
  onQuantityAdjust,
  onRemove,
  onAdjustPrice,
  onCheckout,
}: CartPanelProps) {
  return (
    <aside className={styles.rightPanel} aria-labelledby="pos-cart-title">
      <div className={styles.cartContainer}>
        <h2 id="pos-cart-title" className={styles.visuallyHidden}>
          Carrito de venta
        </h2>
        {!cart.length ? (
          <div className={styles.emptyCart}>
            <ShoppingCart size={48} aria-hidden="true" />
            <p>El carrito está vacío</p>
          </div>
        ) : (
          <table className={styles.cartTable}>
            <caption className={styles.visuallyHidden}>
              Productos agregados al carrito
            </caption>
            <thead>
              <tr>
                <th scope="col">Producto</th>
                <th scope="col" className={styles.cellCenter}>
                  Cant.
                </th>
                <th scope="col" className={styles.cellRight}>
                  P. Unit (Bs.)
                </th>
                <th scope="col" className={styles.cellRight}>
                  SubT
                </th>
                <th scope="col">
                  <span className={styles.visuallyHidden}>Acciones</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {cart.map((item) => (
                <CartRow
                  key={item.cart_id}
                  item={item}
                  onQuantityChange={onQuantityChange}
                  onQuantityAdjust={onQuantityAdjust}
                  onRemove={onRemove}
                  onAdjustPrice={onAdjustPrice}
                />
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className={styles.totalsSection}>
        <label className={styles.visuallyHidden} htmlFor="pos-coupon">
          Código de cupón
        </label>
        <div className={styles.couponInputWrap}>
          <Tag size={16} className={styles.couponIcon} aria-hidden="true" />
          <input
            id="pos-coupon"
            type="text"
            placeholder="Código de cupón..."
            value={couponCode}
            onChange={(event) =>
              onCouponChange(event.target.value.toUpperCase())
            }
            className={styles.couponInput}
          />
        </div>

        {isCheckingDiscount && (
          <p className={styles.discountStatus} aria-live="polite">
            Validando descuento…
          </p>
        )}
        {discount && (
          <div className={styles.discountApplied} aria-live="polite">
            <span>🏷️ {discount.nombre}</span>
            <span>- Bs. {discount.montoDescontado.toFixed(2)}</span>
          </div>
        )}
        {!discount && discountInfo && (
          <p
            className={
              discountInfo.isCouponError
                ? styles.discountError
                : styles.discountHint
            }
            role={discountInfo.isCouponError ? "alert" : "status"}
          >
            {discountInfo.message}
          </p>
        )}

        <div className={styles.totalRow}>
          <span>Subtotal</span>
          <span>Bs. {subtotal.toFixed(2)}</span>
        </div>
        {manualDiscount > 0 && (
          <div className={`${styles.totalRow} ${styles.manualDiscountRow}`}>
            <span>Rebaja Manual Aprobada</span>
            <span>- Bs. {manualDiscount.toFixed(2)}</span>
          </div>
        )}
        {discountAmount > 0 && (
          <div className={`${styles.totalRow} ${styles.discountTotalRow}`}>
            <span>Descuento Aplicado</span>
            <span>- Bs. {discountAmount.toFixed(2)}</span>
          </div>
        )}
        <div className={styles.totalRowLarge}>
          <span>TOTAL</span>
          <span>Bs. {total.toFixed(2)}</span>
        </div>
        <button
          type="button"
          className={styles.checkoutBtn}
          disabled={!cart.length || isSubmitting}
          onClick={onCheckout}
        >
          COBRAR Bs. {total.toFixed(2)}
        </button>
      </div>
    </aside>
  );
}

function CartRow({
  item,
  onQuantityChange,
  onQuantityAdjust,
  onRemove,
  onAdjustPrice,
}: {
  item: CartItem;
  onQuantityChange: (cartId: string, value: string) => void;
  onQuantityAdjust: (cartId: string, delta: number) => void;
  onRemove: (cartId: string) => void;
  onAdjustPrice: (item: CartItem) => void;
}) {
  const hasManualDiscount = item.precio < item.precio_catalogo - 0.0001;
  const quantity = cartQuantity(item.cantidad);

  return (
    <tr>
      <td>
        <span className={styles.cartItemName}>{item.nombre}</span>
        <span className={styles.cartItemSku}>{item.sku}</span>
      </td>
      <td className={styles.cartQuantityCell}>
        <span className={styles.mobileCartLabel}>Cantidad</span>
        <div className={styles.quantityControl}>
          <button
            type="button"
            onClick={() => onQuantityAdjust(item.cart_id, -1)}
            aria-label={`Reducir cantidad de ${item.nombre}`}
          >
            <Minus size={14} aria-hidden="true" />
          </button>
          <label
            className={styles.visuallyHidden}
            htmlFor={`quantity-${item.cart_id}`}
          >
            Cantidad de {item.nombre}
          </label>
          <input
            id={`quantity-${item.cart_id}`}
            type="number"
            min="1"
            step="1"
            inputMode="numeric"
            value={item.cantidad}
            onChange={(event) =>
              onQuantityChange(item.cart_id, event.target.value)
            }
            onBlur={(event) => {
              if (!event.target.value || event.target.value === "0")
                onQuantityChange(item.cart_id, "1");
            }}
            className={styles.quantityInput}
          />
          <button
            type="button"
            onClick={() => onQuantityAdjust(item.cart_id, 1)}
            aria-label={`Aumentar cantidad de ${item.nombre}`}
          >
            <Plus size={14} aria-hidden="true" />
          </button>
        </div>
      </td>
      <td className={`${styles.cellRight} ${styles.cartUnitPriceCell}`}>
        <span className={styles.mobileCartLabel}>P. Unit.</span>
        <div className={styles.priceCell}>
          {hasManualDiscount && (
            <span className={styles.catalogPrice}>
              Bs. {item.precio_catalogo.toFixed(2)}
            </span>
          )}
          <button
            type="button"
            className={`${styles.priceAdjustmentButton} ${hasManualDiscount ? styles.priceAdjustmentButtonDiscounted : ""}`}
            onClick={() => onAdjustPrice(item)}
            aria-label={`Ajustar precio de ${item.nombre}`}
          >
            <span>Bs. {item.precio.toFixed(2)}</span>
            <Edit2 size={12} aria-hidden="true" />
          </button>
        </div>
      </td>
      <td
        className={`${styles.cellRight} ${styles.cartSubtotalCell} ${hasManualDiscount ? styles.discountedSubtotal : ""}`}
      >
        <span className={styles.mobileCartLabel}>SubT</span>
        Bs. {(item.precio * quantity).toFixed(2)}
      </td>
      <td className={`${styles.cellRight} ${styles.cartRemoveCell}`}>
        <button
          type="button"
          className={styles.deleteBtn}
          onClick={() => onRemove(item.cart_id)}
          aria-label={`Eliminar ${item.nombre} del carrito`}
        >
          <Trash2 size={16} aria-hidden="true" />
        </button>
      </td>
    </tr>
  );
}
