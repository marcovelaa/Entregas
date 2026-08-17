/* eslint-disable @next/next/no-img-element -- Product assets are served by the configured API origin. */
"use client";

import { Plus, ShoppingCart } from "lucide-react";
import { getApiAssetUrl } from "@/lib/axios";
import { Modal } from "@/components/molecules/Modal/Modal";
import type { PosProduct, ProductPackage, ProductVariant } from "../pos-types";
import { getStock } from "../pos-utils";
import styles from "../page.module.css";

interface VariantSelectionModalProps {
  product: PosProduct | null;
  onClose: () => void;
  onAdd: (
    product: PosProduct,
    variant: ProductVariant,
    packageOption?: ProductPackage,
  ) => void;
}

export function VariantSelectionModal({
  product,
  onClose,
  onAdd,
}: VariantSelectionModalProps) {
  return (
    <Modal
      isOpen={Boolean(product)}
      onClose={onClose}
      title="Seleccionar Variante"
      maxWidth="600px"
    >
      {product && (
        <div className={styles.variantModalContent}>
          <div className={styles.variantModalHeader}>
            {product.imagenes?.[0]?.url ? (
              <img
                src={getApiAssetUrl(product.imagenes[0].url)}
                alt=""
                className={styles.variantProductImage}
              />
            ) : (
              <div className={styles.variantImagePlaceholder}>
                <ShoppingCart size={24} aria-hidden="true" />
              </div>
            )}
            <div>
              <h3 className={styles.variantProductTitle}>{product.nombre}</h3>
              <p className={styles.variantProductSubtitle}>
                Selecciona la variante deseada
              </p>
            </div>
          </div>
          <div className={styles.variantList}>
            {product.variantes?.map((variant) => (
              <VariantRow
                key={variant.id}
                product={product}
                variant={variant}
                onAdd={onAdd}
                onClose={onClose}
              />
            ))}
          </div>
        </div>
      )}
    </Modal>
  );
}

function VariantRow({
  product,
  variant,
  onAdd,
  onClose,
}: {
  product: PosProduct;
  variant: ProductVariant;
  onAdd: (
    product: PosProduct,
    variant: ProductVariant,
    packageOption?: ProductPackage,
  ) => void;
  onClose: () => void;
}) {
  const stock = getStock(product, variant.id);
  const price =
    Number(product.precio_base) + Number(variant.precio_adicional ?? 0);
  const addVariant = () => {
    onAdd(product, variant);
    onClose();
  };

  return (
    <article className={styles.variantRow}>
      <div className={styles.variantInfo}>
        {variant.imagen_url && (
          <img
            src={getApiAssetUrl(variant.imagen_url)}
            alt=""
            className={styles.variantImage}
          />
        )}
        <div>
          <p className={styles.variantName}>{variant.nombre ?? "Variante"}</p>
          <p className={styles.variantSku}>SKU: {variant.sku_base ?? "N/A"}</p>
          {variant.empaques?.length ? (
            <div className={styles.packageOptions}>
              {variant.empaques.map((packageOption) => (
                <button
                  key={packageOption.id}
                  type="button"
                  className={styles.packageButton}
                  disabled={
                    stock < Number(packageOption.multiplicador_unidades ?? 1)
                  }
                  onClick={() => {
                    onAdd(product, variant, packageOption);
                    onClose();
                  }}
                >
                  {packageOption.nombre} (Bs.{" "}
                  {Number(packageOption.precio).toFixed(2)})
                </button>
              ))}
            </div>
          ) : null}
        </div>
      </div>
      <div className={styles.variantActions}>
        <div>
          <p className={styles.variantPrice}>Bs. {price.toFixed(2)}</p>
          <p
            className={
              stock > 0
                ? styles.variantStockAvailable
                : styles.variantStockUnavailable
            }
          >
            {stock > 0 ? `Stock: ${stock}` : "Agotado"}
          </p>
        </div>
        <button
          type="button"
          className={styles.addVariantButton}
          disabled={stock <= 0}
          onClick={addVariant}
          aria-label={`Agregar ${variant.nombre ?? "variante"} al carrito`}
        >
          <Plus size={20} aria-hidden="true" />
        </button>
      </div>
    </article>
  );
}
