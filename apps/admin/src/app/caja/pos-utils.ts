import type {
  CartItem,
  PosProduct,
  ProductPackage,
  ProductVariant,
} from "./pos-types";

export function getStock(product: PosProduct, variantId?: string): number {
  if (typeof product.stock_vendible === "number") return product.stock_vendible;

  if (product.tipo_producto === "COMBO" && product.componentes_combo?.length) {
    const componentRatios = product.componentes_combo.map((component) => {
      const componentProduct = component.componente_producto;
      if (!componentProduct?.Inventario) return 0;

      const inventory = componentProduct.Inventario.find(
        (item) => item.variante_id === (component.variante_id ?? null),
      );
      const available = inventory
        ? Math.max(
            0,
            Number(inventory.cantidad_disponible) - Number(inventory.reservado),
          )
        : 0;
      const required = Number(component.cantidad) || 1;
      return Math.floor(available / required);
    });

    return componentRatios.length ? Math.min(...componentRatios) : 0;
  }

  const inventory = product.Inventario?.find(
    (item) => item.variante_id === (variantId ?? null),
  );
  return inventory
    ? Number(inventory.cantidad_disponible) - Number(inventory.reservado)
    : 0;
}

export function getCartId(
  product: PosProduct,
  variant?: ProductVariant,
  packageOption?: ProductPackage,
): string {
  if (!variant) return product.id;
  return packageOption
    ? `${product.id}-${variant.id}-${packageOption.id}`
    : `${product.id}-${variant.id}`;
}

export function toCartItem(
  product: PosProduct,
  variant: ProductVariant | undefined,
  packageOption: ProductPackage | undefined,
  stockAvailable: number,
): CartItem {
  const multiplicador = Number(packageOption?.multiplicador_unidades ?? 1);
  const precio = packageOption
    ? Number(packageOption.precio)
    : Number(product.precio_base) + Number(variant?.precio_adicional ?? 0);
  const nombre = [
    product.nombre,
    variant?.nombre ? `(${variant.nombre})` : null,
    packageOption?.nombre ? `[${packageOption.nombre}]` : null,
  ]
    .filter(Boolean)
    .join(" ");

  return {
    cart_id: getCartId(product, variant, packageOption),
    id: product.id,
    variante_id: variant?.id ?? null,
    empaque_id: packageOption?.id ?? null,
    multiplicador,
    nombre,
    sku: packageOption?.sku ?? variant?.sku_base ?? product.sku ?? "N/A",
    precio_catalogo: precio,
    precio,
    cantidad: 1,
    maxStock: Math.floor(stockAvailable / multiplicador),
  };
}

export function cartQuantity(quantity: CartItem["cantidad"]): number {
  return typeof quantity === "number" ? quantity : 0;
}
