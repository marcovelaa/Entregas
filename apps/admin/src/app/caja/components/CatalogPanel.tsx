/* eslint-disable @next/next/no-img-element -- Product assets are served by the configured API origin. */
"use client";

import { Search, ShoppingCart } from "lucide-react";
import { getApiAssetUrl } from "@/lib/axios";
import type { PosCategory, PosProduct } from "../pos-types";
import { getStock } from "../pos-utils";
import styles from "../page.module.css";

const badgeClassByStyle = {
  red: styles.badgeRed,
  emerald: styles.badgeEmerald,
  blue: styles.badgeBlue,
  amber: styles.badgeAmber,
  slate: styles.badgeSlate,
  indigo: styles.badgeIndigo,
} as const;

interface CatalogPanelProps {
  categories: PosCategory[];
  products: PosProduct[];
  selectedCategory: string;
  searchQuery: string;
  searchInputRef: React.RefObject<HTMLInputElement | null>;
  isLoading: boolean;
  error: string | null;
  onCategoryChange: (categoryId: string) => void;
  onSearchChange: (query: string) => void;
  onRetry: () => void;
  onProductSelect: (product: PosProduct) => void;
}

export function CatalogPanel({
  categories,
  products,
  selectedCategory,
  searchQuery,
  searchInputRef,
  isLoading,
  error,
  onCategoryChange,
  onSearchChange,
  onRetry,
  onProductSelect,
}: CatalogPanelProps) {
  const normalizedSearch = searchQuery.toLowerCase();
  const filteredProducts = products.filter((product) => {
    if (
      product.estado_venta === "VENCIDO" ||
      product.estado_venta === "AGOTADO"
    )
      return false;
    const matchesCategory = selectedCategory
      ? product.categoria_id === selectedCategory
      : true;
    const matchesSearch =
      product.nombre.toLowerCase().includes(normalizedSearch) ||
      (product.sku ?? "").toLowerCase().includes(normalizedSearch) ||
      product.variantes?.some((variant) =>
        (variant.sku_base ?? "").toLowerCase().includes(normalizedSearch),
      );
    return matchesCategory && Boolean(matchesSearch);
  });

  return (
    <section className={styles.leftPanel} aria-labelledby="pos-catalog-title">
      <div className={styles.searchHeader}>
        <h1 id="pos-catalog-title" className={styles.visuallyHidden}>
          Catálogo de caja
        </h1>
        <label className={styles.visuallyHidden} htmlFor="pos-product-search">
          Buscar producto
        </label>
        <div className={styles.searchBox}>
          <Search size={20} className={styles.searchIcon} aria-hidden="true" />
          <input
            ref={searchInputRef}
            id="pos-product-search"
            type="search"
            placeholder="Buscar producto por nombre o SKU..."
            value={searchQuery}
            onChange={(event) => onSearchChange(event.target.value)}
            className={styles.searchInput}
          />
        </div>

        <div
          className={styles.categoriesWrapper}
          aria-label="Filtrar por categoría"
        >
          <button
            type="button"
            className={`${styles.categoryBtn} ${selectedCategory === "" ? styles.categoryBtnActive : ""}`}
            aria-pressed={selectedCategory === ""}
            onClick={() => onCategoryChange("")}
          >
            Todas
          </button>
          {categories.map((category) => (
            <button
              key={category.id}
              type="button"
              className={`${styles.categoryBtn} ${selectedCategory === category.id ? styles.categoryBtnActive : ""}`}
              aria-pressed={selectedCategory === category.id}
              onClick={() => onCategoryChange(category.id)}
            >
              {category.nombre}
            </button>
          ))}
        </div>
      </div>

      <div
        className={styles.productsGrid}
        aria-live="polite"
        aria-busy={isLoading}
      >
        {isLoading && (
          <p className={styles.catalogState}>Cargando catálogo de caja…</p>
        )}
        {!isLoading && error && (
          <div className={styles.catalogState} role="alert">
            <p>{error}</p>
            <button
              type="button"
              className={styles.btnSecondary}
              onClick={onRetry}
            >
              Reintentar
            </button>
          </div>
        )}
        {!isLoading && !error && filteredProducts.length === 0 && (
          <p className={styles.catalogState}>
            No hay productos disponibles con este filtro.
          </p>
        )}
        {!isLoading &&
          !error &&
          filteredProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onSelect={onProductSelect}
            />
          ))}
      </div>
    </section>
  );
}

function ProductCard({
  product,
  onSelect,
}: {
  product: PosProduct;
  onSelect: (product: PosProduct) => void;
}) {
  const hasVariants = Boolean(product.variantes?.length);
  const mainStock = getStock(product);
  const variantStock =
    product.variantes?.reduce(
      (total, variant) => total + getStock(product, variant.id),
      0,
    ) ?? 0;
  const stockToShow = hasVariants ? variantStock : mainStock;
  const isCombo = product.tipo_producto === "COMBO";
  const presentation = product.atributos?.presentacion_visual;
  const badgeStyle = presentation?.badge_estilo ?? "indigo";
  const showBadge =
    badgeStyle !== "none" && presentation?.mostrar_badge !== false;
  const componentImages: string[] = [];
  let componentSubtotal = 0;

  if (isCombo && product.componentes_combo?.length) {
    product.componentes_combo.forEach((component) => {
      const componentProduct = component.componente_producto;
      if (!componentProduct) return;
      componentSubtotal +=
        Number(componentProduct.precio_base) *
        (Number(component.cantidad) || 1);
      const image = componentProduct.imagenes?.[0]?.url;
      if (image) componentImages.push(getApiAssetUrl(image));
    });
  }

  const comboPrice = Number(product.precio_base) || 0;
  const hasSavings = isCombo && componentSubtotal > comboPrice;
  const savingsPercentage = hasSavings
    ? Math.round(((componentSubtotal - comboPrice) / componentSubtotal) * 100)
    : 0;
  const badgeLabel = showBadge
    ? presentation?.badge_texto ||
      (isCombo
        ? hasSavings
          ? `Ahorrá ${savingsPercentage}%`
          : "KIT / COMBO"
        : null)
    : null;
  const hasCustomImage = Boolean(
    product.imagenes?.length && presentation?.modo_imagen === "PROPIA",
  );
  const useComponentImages =
    isCombo && !hasCustomImage && componentImages.length > 0;
  const componentNames = product.componentes_combo
    ?.map(
      (component) =>
        `${Number(component.cantidad) > 1 ? `${component.cantidad}x ` : ""}${component.componente_producto?.nombre ?? "Item"}`,
    )
    .join(", ");
  const badgeClass =
    badgeStyle === "none" ? styles.badgeIndigo : badgeClassByStyle[badgeStyle];

  return (
    <button
      type="button"
      className={`${styles.productCard} ${stockToShow <= 0 ? styles.productCardUnavailable : ""}`}
      disabled={stockToShow <= 0}
      onClick={() => onSelect(product)}
      aria-label={`${hasVariants ? "Seleccionar variante de" : "Agregar"} ${product.nombre}${stockToShow <= 0 ? ", agotado" : ""}`}
    >
      {badgeLabel && (
        <span className={`${styles.productBadge} ${badgeClass}`}>
          {badgeLabel}
        </span>
      )}
      <div className={styles.productImageFrame}>
        {useComponentImages ? (
          <div
            className={`${styles.componentImageGrid} ${componentImages.length === 1 ? styles.componentImageGridSingle : ""} ${componentImages.length === 3 ? styles.componentImageGridThree : ""}`}
          >
            {componentImages.slice(0, 4).map((image, index) => (
              <span
                key={image}
                className={`${styles.componentImageCell} ${componentImages.length === 3 && index === 0 ? styles.componentImageCellFeature : ""}`}
              >
                <img src={image} alt="" className={styles.productImage} />
              </span>
            ))}
          </div>
        ) : product.imagenes?.[0]?.url ? (
          <img
            src={getApiAssetUrl(product.imagenes[0].url)}
            alt=""
            className={styles.productImage}
          />
        ) : (
          <ShoppingCart
            size={32}
            className={styles.productPlaceholderIcon}
            aria-hidden="true"
          />
        )}
      </div>

      <span className={styles.productCardName} title={product.nombre}>
        {product.nombre}
      </span>
      <span className={styles.productCardSku}>{product.sku ?? "N/A"}</span>
      {isCombo &&
        presentation?.mostrar_desglose_pos !== false &&
        componentNames && (
          <span className={styles.comboBreakdown} title={componentNames}>
            Incluye: {componentNames}
          </span>
        )}
      <span className={styles.productCardFooter}>
        <span>
          {hasSavings && (
            <span className={styles.previousPrice}>
              Bs. {componentSubtotal.toFixed(2)}
            </span>
          )}
          <span className={styles.productCardPrice}>
            Bs. {comboPrice.toFixed(2)}
          </span>
        </span>
        <span
          className={
            stockToShow > 0 ? styles.stockAvailable : styles.stockUnavailable
          }
        >
          {stockToShow > 0 ? `Stock: ${stockToShow}` : "Agotado"}
        </span>
      </span>
    </button>
  );
}
