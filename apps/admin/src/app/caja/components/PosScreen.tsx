"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { Modal } from "@/components/molecules/Modal/Modal";
import { TicketImpresion } from "@/components/molecules/TicketImpresion/TicketImpresion";
import { registerSale, getRequestErrorMessage } from "../pos-api";
import type {
  CartItem,
  CheckoutSale,
  PaymentMethod,
  PosApprover,
  PosProduct,
  ProductPackage,
  ProductVariant,
  SaleRequest,
} from "../pos-types";
import { cartQuantity, getCartId, getStock, toCartItem } from "../pos-utils";
import { useDiscountPreview } from "../hooks/use-discount-preview";
import { usePosData } from "../hooks/use-pos-data";
import { CatalogPanel } from "./CatalogPanel";
import { CartPanel } from "./CartPanel";
import { CheckoutModal } from "./CheckoutModal";
import { PriceAdjustmentModal } from "./PriceAdjustmentModal";
import { VariantSelectionModal } from "./VariantSelectionModal";
import styles from "../page.module.css";

type Toast = { message: string; type: "error" | "success" };

export function PosScreen() {
  const {
    productos,
    clientes,
    categorias,
    aprobadores,
    status,
    error,
    retry,
    refreshProducts,
  } = usePosData();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [productWithVariants, setProductWithVariants] =
    useState<PosProduct | null>(null);
  const [couponCode, setCouponCode] = useState("");
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [isEditingCustomer, setIsEditingCustomer] = useState(false);
  const [customerQuery, setCustomerQuery] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("EFECTIVO");
  const [paidAmount, setPaidAmount] = useState("");
  const [itemToAdjust, setItemToAdjust] = useState<CartItem | null>(null);
  const [selectedApprover, setSelectedApprover] = useState<PosApprover | null>(
    null,
  );
  const [approverQuery, setApproverQuery] = useState("");
  const [newPrice, setNewPrice] = useState("");
  const [adjustmentReason, setAdjustmentReason] = useState("");
  const [ticketData, setTicketData] = useState<CheckoutSale | null>(null);
  const [toast, setToast] = useState<Toast | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const checkoutAttemptRef = useRef<{
    fingerprint: string;
    idempotencyKey: string;
  } | null>(null);
  const {
    discount,
    info: discountInfo,
    isChecking: isCheckingDiscount,
  } = useDiscountPreview({
    cart,
    couponCode,
    customerId: selectedCustomerId,
  });

  const showToast = useCallback(
    (message: string, type: Toast["type"] = "error") => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
      setToast({ message, type });
      toastTimerRef.current = setTimeout(() => setToast(null), 3500);
    },
    [],
  );

  useEffect(() => {
    searchInputRef.current?.focus();
    return () => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    };
  }, []);

  const addToCart = useCallback(
    (
      product: PosProduct,
      variant?: ProductVariant,
      packageOption?: ProductPackage,
    ) => {
      const stockAvailable = getStock(product, variant?.id);
      const multiplicador = Number(packageOption?.multiplicador_unidades ?? 1);
      if (stockAvailable < multiplicador) {
        showToast("No hay stock disponible para este empaque");
        return;
      }

      const cartId = getCartId(product, variant, packageOption);
      const existing = cart.find((item) => item.cart_id === cartId);
      if (existing) {
        const nextQuantity = cartQuantity(existing.cantidad) + 1;
        if (nextQuantity * multiplicador > stockAvailable) {
          showToast("No puedes exceder el stock disponible");
          return;
        }
        setCart((current) =>
          current.map((item) =>
            item.cart_id === cartId
              ? { ...item, cantidad: nextQuantity }
              : item,
          ),
        );
      } else {
        setCart((current) => [
          ...current,
          toCartItem(product, variant, packageOption, stockAvailable),
        ]);
      }

      setSearchQuery("");
      searchInputRef.current?.focus();
    },
    [cart, showToast],
  );

  const selectProduct = (product: PosProduct) => {
    if (product.variantes?.length) {
      setProductWithVariants(product);
      return;
    }
    addToCart(product);
  };

  const setQuantity = (cartId: string, value: string) => {
    if (value === "") {
      setCart((current) =>
        current.map((item) =>
          item.cart_id === cartId ? { ...item, cantidad: "" } : item,
        ),
      );
      return;
    }

    const quantity = Number.parseInt(value, 10);
    if (Number.isNaN(quantity)) return;

    setCart((current) =>
      current.map((item) => {
        if (item.cart_id !== cartId) return item;
        if (quantity < 1) return { ...item, cantidad: 1 };
        if (quantity > item.maxStock) {
          showToast("No puedes exceder el stock disponible");
          return { ...item, cantidad: item.maxStock };
        }
        return { ...item, cantidad: quantity };
      }),
    );
  };

  const adjustQuantity = (cartId: string, delta: number) => {
    setCart((current) =>
      current.map((item) => {
        if (item.cart_id !== cartId) return item;
        const nextQuantity = Math.max(1, cartQuantity(item.cantidad) + delta);
        if (nextQuantity > item.maxStock) {
          showToast("No puedes exceder el stock disponible");
          return item;
        }
        return { ...item, cantidad: nextQuantity };
      }),
    );
  };

  const openPriceAdjustment = (item: CartItem) => {
    setItemToAdjust(item);
    setNewPrice(String(item.precio));
    setSelectedApprover(
      item.aprobador_id
        ? (aprobadores.find((approver) => approver.id === item.aprobador_id) ??
            null)
        : null,
    );
    setAdjustmentReason(item.motivo_ajuste ?? "");
    setApproverQuery("");
  };

  const closePriceAdjustment = () => {
    setItemToAdjust(null);
    setSelectedApprover(null);
    setApproverQuery("");
    setAdjustmentReason("");
  };

  const applyPriceAdjustment = () => {
    if (!itemToAdjust) return;
    const parsedPrice = Number(newPrice);
    if (!Number.isFinite(parsedPrice) || parsedPrice < 0) {
      showToast("Ingrese un precio válido");
      return;
    }

    const requiresApproval =
      parsedPrice < itemToAdjust.precio_catalogo - 0.0001;
    if (requiresApproval && (!selectedApprover || !adjustmentReason.trim())) {
      showToast(
        "Seleccione un aprobador y brinde un motivo para rebajar el precio.",
      );
      return;
    }

    setCart((current) =>
      current.map((item) =>
        item.cart_id === itemToAdjust.cart_id
          ? {
              ...item,
              precio: parsedPrice,
              aprobador_id: requiresApproval ? selectedApprover?.id : undefined,
              motivo_ajuste: requiresApproval
                ? adjustmentReason.trim()
                : undefined,
            }
          : item,
      ),
    );
    closePriceAdjustment();
  };

  const { subtotal, manualDiscount, discountAmount, total, paid, change } =
    useMemo(() => {
      const currentSubtotal = cart.reduce(
        (sum, item) => sum + item.precio * cartQuantity(item.cantidad),
        0,
      );
      const currentManualDiscount = cart.reduce(
        (sum, item) =>
          sum +
          Math.max(0, item.precio_catalogo - item.precio) *
            cartQuantity(item.cantidad),
        0,
      );
      const currentDiscountAmount = discount?.montoDescontado ?? 0;
      const currentTotal = Math.max(0, currentSubtotal - currentDiscountAmount);
      const currentPaid = Number.parseFloat(paidAmount) || 0;
      return {
        subtotal: currentSubtotal,
        manualDiscount: currentManualDiscount,
        discountAmount: currentDiscountAmount,
        total: currentTotal,
        paid: currentPaid,
        change: currentPaid >= currentTotal ? currentPaid - currentTotal : 0,
      };
    }, [cart, discount, paidAmount]);

  const closeCheckout = () => {
    if (!isSubmitting) setIsCheckoutOpen(false);
  };

  const openCheckout = () => {
    setIsEditingCustomer(false);
    setCustomerQuery("");
    setIsCheckoutOpen(true);
  };

  const handleCheckout = async () => {
    if (isSubmitting) return;
    if (!cart.length) {
      showToast("El carrito está vacío");
      return;
    }
    if (paymentMethod === "EFECTIVO" && paid < total) {
      showToast("El monto pagado es insuficiente");
      return;
    }

    const itemWithManualDiscount = cart.find((item) => item.aprobador_id);
    const checkoutPayload = {
      cliente_id: selectedCustomerId || undefined,
      metodo_pago: paymentMethod,
      monto_pagado: paymentMethod === "EFECTIVO" ? paid : total,
      descuento_id: discount?.id,
      descuento_total: discountAmount,
      codigo_cupon: couponCode.trim().toUpperCase() || undefined,
      aprobador_usuario_id: itemWithManualDiscount?.aprobador_id,
      motivo_ajuste: itemWithManualDiscount?.motivo_ajuste,
      detalles: cart.map((item) => ({
        producto_id: item.id,
        variante_id: item.variante_id ?? undefined,
        empaque_id: item.empaque_id ?? undefined,
        cantidad: cartQuantity(item.cantidad) * item.multiplicador,
        precio_unitario: item.precio / item.multiplicador,
        motivo_ajuste: item.motivo_ajuste || undefined,
      })),
    } satisfies Omit<SaleRequest, "idempotency_key">;

    const checkoutFingerprint = JSON.stringify(checkoutPayload);
    if (checkoutAttemptRef.current?.fingerprint !== checkoutFingerprint) {
      checkoutAttemptRef.current = {
        fingerprint: checkoutFingerprint,
        idempotencyKey: crypto.randomUUID(),
      };
    }

    setIsSubmitting(true);
    try {
      const sale = await registerSale({
        ...checkoutPayload,
        idempotency_key: checkoutAttemptRef.current.idempotencyKey,
      });
      setTicketData(sale);
      checkoutAttemptRef.current = null;
      setCart([]);
      setCouponCode("");
      setIsCheckoutOpen(false);
      setSelectedCustomerId("");
      setPaymentMethod("EFECTIVO");
      setPaidAmount("");
      closePriceAdjustment();
      void refreshProducts();
    } catch (requestError) {
      showToast(
        `Error: ${getRequestErrorMessage(requestError, "No se pudo registrar la venta.")}`,
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className={styles.posContainer}>
      {toast && (
        <div
          className={`${styles.toast} ${toast.type === "error" ? styles.toastError : styles.toastSuccess}`}
          role={toast.type === "error" ? "alert" : "status"}
          aria-live="assertive"
        >
          {toast.type === "error" ? (
            <AlertTriangle size={18} aria-hidden="true" />
          ) : (
            <CheckCircle2 size={18} aria-hidden="true" />
          )}
          <span>{toast.message}</span>
        </div>
      )}

      <CatalogPanel
        categories={categorias}
        products={productos}
        selectedCategory={selectedCategory}
        searchQuery={searchQuery}
        searchInputRef={searchInputRef}
        isLoading={status === "loading"}
        error={error}
        onCategoryChange={setSelectedCategory}
        onSearchChange={setSearchQuery}
        onRetry={() => {
          void retry();
        }}
        onProductSelect={selectProduct}
      />
      <CartPanel
        cart={cart}
        couponCode={couponCode}
        discount={discount}
        discountInfo={discountInfo}
        isCheckingDiscount={isCheckingDiscount}
        subtotal={subtotal}
        manualDiscount={manualDiscount}
        discountAmount={discountAmount}
        total={total}
        isSubmitting={isSubmitting}
        onCouponChange={setCouponCode}
        onQuantityChange={setQuantity}
        onQuantityAdjust={adjustQuantity}
        onRemove={(cartId) =>
          setCart((current) =>
            current.filter((item) => item.cart_id !== cartId),
          )
        }
        onAdjustPrice={openPriceAdjustment}
        onCheckout={openCheckout}
      />

      <PriceAdjustmentModal
        item={itemToAdjust}
        approvers={aprobadores}
        selectedApprover={selectedApprover}
        approverQuery={approverQuery}
        newPrice={newPrice}
        reason={adjustmentReason}
        onClose={closePriceAdjustment}
        onApproverChange={setSelectedApprover}
        onApproverQueryChange={setApproverQuery}
        onNewPriceChange={setNewPrice}
        onReasonChange={setAdjustmentReason}
        onApply={applyPriceAdjustment}
      />
      <CheckoutModal
        isOpen={isCheckoutOpen}
        customers={clientes}
        cart={cart}
        selectedCustomerId={selectedCustomerId}
        isEditingCustomer={isEditingCustomer}
        customerQuery={customerQuery}
        paymentMethod={paymentMethod}
        paidAmount={paidAmount}
        total={total}
        change={change}
        isSubmitting={isSubmitting}
        onClose={closeCheckout}
        onCustomerChange={setSelectedCustomerId}
        onCustomerEditingChange={setIsEditingCustomer}
        onCustomerQueryChange={setCustomerQuery}
        onPaymentMethodChange={setPaymentMethod}
        onPaidAmountChange={setPaidAmount}
        onSubmit={() => {
          void handleCheckout();
        }}
      />
      <VariantSelectionModal
        product={productWithVariants}
        onClose={() => setProductWithVariants(null)}
        onAdd={addToCart}
      />
      <Modal
        isOpen={Boolean(ticketData)}
        onClose={() => setTicketData(null)}
        title="Comprobante de Venta"
        maxWidth="400px"
      >
        {ticketData && (
          <TicketImpresion
            ticketData={ticketData}
            configNegocio={{
              nombre: "ENTREGAS.com.bo",
              direccion: "Santa Cruz, Bolivia",
              telefono: "+591 70000000",
              nit: "1029384029",
            }}
            onClose={() => setTicketData(null)}
          />
        )}
      </Modal>
    </main>
  );
}
