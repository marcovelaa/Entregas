"use client";

import { useEffect, useState } from "react";
import {
  evaluateDiscount,
  getRequestErrorMessage,
  isRequestCancelled,
} from "../pos-api";
import type { CartItem, DiscountInfo, DiscountPreview } from "../pos-types";
import { cartQuantity } from "../pos-utils";

interface UseDiscountPreviewParams {
  cart: CartItem[];
  couponCode: string;
  customerId: string;
}

export function useDiscountPreview({
  cart,
  couponCode,
  customerId,
}: UseDiscountPreviewParams) {
  const [discount, setDiscount] = useState<DiscountPreview | null>(null);
  const [info, setInfo] = useState<DiscountInfo | null>(null);
  const [isChecking, setIsChecking] = useState(false);

  useEffect(() => {
    if (!cart.length) {
      const resetTimer = window.setTimeout(() => {
        setDiscount(null);
        setInfo(null);
        setIsChecking(false);
      }, 0);
      return () => window.clearTimeout(resetTimer);
    }

    const controller = new AbortController();
    const checkingTimer = window.setTimeout(() => {
      if (!controller.signal.aborted) setIsChecking(true);
    }, 0);

    void evaluateDiscount(
      {
        cupon: couponCode.trim() || undefined,
        canal: "POS",
        clienteId: customerId || undefined,
        items: cart.map((item) => ({
          productoId: item.id,
          varianteId: item.variante_id ?? undefined,
          empaqueId: item.empaque_id ?? undefined,
          cantidad: cartQuantity(item.cantidad) * item.multiplicador,
          precioUnitario: item.precio / item.multiplicador,
        })),
      },
      controller.signal,
    )
      .then((response) => {
        if (controller.signal.aborted) return;

        if (response.success && response.data) {
          setDiscount(response.data);
          setInfo(null);
          return;
        }

        setDiscount(null);
        if (!response.success && response.error) {
          setInfo({ message: response.error, isCouponError: true });
        } else if (response.message) {
          setInfo({ message: response.message, isCouponError: false });
        } else {
          setInfo(null);
        }
      })
      .catch((requestError) => {
        if (!controller.signal.aborted && !isRequestCancelled(requestError)) {
          setDiscount(null);
          setInfo({
            message: getRequestErrorMessage(
              requestError,
              "No se pudo validar el descuento. Intentá nuevamente.",
            ),
            isCouponError: true,
          });
        }
      })
      .finally(() => {
        window.clearTimeout(checkingTimer);
        if (!controller.signal.aborted) setIsChecking(false);
      });

    return () => {
      window.clearTimeout(checkingTimer);
      controller.abort();
    };
  }, [cart, couponCode, customerId]);

  return { discount, info, isChecking };
}
