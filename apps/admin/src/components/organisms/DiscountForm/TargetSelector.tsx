'use client';

import React, { useState, useMemo } from 'react';
import styles from './TargetSelector.module.css';
import { Search, X, Layers, Package, Tag, Boxes } from 'lucide-react';

export interface TargetItem {
  id: string;
  nombre: string;
  code?: string;
  subtitle?: string;
}

export type TargetTab = 'categorias' | 'productos' | 'variantes' | 'empaques';

export interface TargetSelectorProps {
  alcance?: string;
  categories?: TargetItem[];
  products?: TargetItem[];
  variants?: TargetItem[];
  empaques?: TargetItem[];

  selectedCategoryIds?: string[];
  selectedProductIds?: string[];
  selectedVariantIds?: string[];
  selectedEmpaqueIds?: string[];

  onSelectCategory?: (ids: string[]) => void;
  onSelectProduct?: (ids: string[]) => void;
  onSelectVariant?: (ids: string[]) => void;
  onSelectEmpaque?: (ids: string[]) => void;

  disabled?: boolean;
}

export function TargetSelector({
  alcance,
  categories = [],
  products = [],
  variants = [],
  empaques = [],
  selectedCategoryIds = [],
  selectedProductIds = [],
  selectedVariantIds = [],
  selectedEmpaqueIds = [],
  onSelectCategory,
  onSelectProduct,
  onSelectVariant,
  onSelectEmpaque,
  disabled = false,
}: TargetSelectorProps) {
  const [activeTab, setActiveTab] = useState<TargetTab>('categorias');
  const [searchQuery, setSearchQuery] = useState('');

  React.useEffect(() => {
    if (alcance === 'CATEGORIA') setActiveTab('categorias');
    else if (alcance === 'PRODUCTO') setActiveTab('productos');
    else if (alcance === 'VARIANTE') setActiveTab('variantes');
    else if (alcance === 'EMPAQUE') setActiveTab('empaques');
  }, [alcance]);

  const currentList = useMemo(() => {
    switch (activeTab) {
      case 'categorias':
        return categories;
      case 'productos':
        return products;
      case 'variantes':
        return variants;
      case 'empaques':
        return empaques;
      default:
        return [];
    }
  }, [activeTab, categories, products, variants, empaques]);

  const currentSelectedIds = useMemo(() => {
    switch (activeTab) {
      case 'categorias':
        return selectedCategoryIds;
      case 'productos':
        return selectedProductIds;
      case 'variantes':
        return selectedVariantIds;
      case 'empaques':
        return selectedEmpaqueIds;
      default:
        return [];
    }
  }, [activeTab, selectedCategoryIds, selectedProductIds, selectedVariantIds, selectedEmpaqueIds]);

  const handleToggleItem = (id: string | number) => {
    if (disabled) return;
    const strId = String(id);
    const isSelected = currentSelectedIds.some((item) => String(item) === strId);
    const updated = isSelected
      ? currentSelectedIds.filter((item) => String(item) !== strId)
      : [...currentSelectedIds.map(String), strId];

    switch (activeTab) {
      case 'categorias':
        onSelectCategory?.(updated);
        break;
      case 'productos':
        onSelectProduct?.(updated);
        break;
      case 'variantes':
        onSelectVariant?.(updated);
        break;
      case 'empaques':
        onSelectEmpaque?.(updated);
        break;
    }
  };

  const filteredList = useMemo(() => {
    if (!searchQuery.trim()) return currentList;
    const q = searchQuery.toLowerCase().trim();
    return currentList.filter(
      (item) =>
        item.nombre.toLowerCase().includes(q) ||
        (item.code && item.code.toLowerCase().includes(q)) ||
        (item.subtitle && item.subtitle.toLowerCase().includes(q))
    );
  }, [currentList, searchQuery]);

  const allSelectedPills = useMemo(() => {
    const pills: { id: string; nombre: string; type: TargetTab; label: string }[] = [];

    (selectedCategoryIds || []).forEach((rawId) => {
      const idStr = String(rawId);
      const item = categories.find((c) => String(c.id) === idStr);
      pills.push({ id: idStr, nombre: item ? item.nombre : `Categoría #${idStr}`, type: 'categorias', label: 'Categoría' });
    });

    (selectedProductIds || []).forEach((rawId) => {
      const idStr = String(rawId);
      const item = products.find((p) => String(p.id) === idStr);
      pills.push({ id: idStr, nombre: item ? item.nombre : `Producto #${idStr}`, type: 'productos', label: 'Producto' });
    });

    (selectedVariantIds || []).forEach((rawId) => {
      const idStr = String(rawId);
      const item = variants.find((v) => String(v.id) === idStr);
      pills.push({ id: idStr, nombre: item ? item.nombre : `Variante #${idStr}`, type: 'variantes', label: 'Variante' });
    });

    (selectedEmpaqueIds || []).forEach((rawId) => {
      const idStr = String(rawId);
      const item = empaques.find((e) => String(e.id) === idStr);
      pills.push({ id: idStr, nombre: item ? item.nombre : `Empaque #${idStr}`, type: 'empaques', label: 'Empaque' });
    });

    return pills;
  }, [
    categories,
    products,
    variants,
    empaques,
    selectedCategoryIds,
    selectedProductIds,
    selectedVariantIds,
    selectedEmpaqueIds,
  ]);

  const handleDismissPill = (id: string, type: TargetTab) => {
    if (disabled) return;
    const strId = String(id);
    switch (type) {
      case 'categorias':
        onSelectCategory?.((selectedCategoryIds || []).filter((item) => String(item) !== strId));
        break;
      case 'productos':
        onSelectProduct?.((selectedProductIds || []).filter((item) => String(item) !== strId));
        break;
      case 'variantes':
        onSelectVariant?.((selectedVariantIds || []).filter((item) => String(item) !== strId));
        break;
      case 'empaques':
        onSelectEmpaque?.((selectedEmpaqueIds || []).filter((item) => String(item) !== strId));
        break;
    }
  };

  const handleClearAll = () => {
    if (disabled) return;
    onSelectCategory?.([]);
    onSelectProduct?.([]);
    onSelectVariant?.([]);
    onSelectEmpaque?.([]);
  };

  const totalSelectedCount = allSelectedPills.length;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.titleGroup}>
          <h4 className={styles.title}>Selección de Objetivos del Descuento</h4>
          {totalSelectedCount > 0 && (
            <span className={styles.counterBadge}>{totalSelectedCount} seleccionados</span>
          )}
        </div>
        {totalSelectedCount > 0 && (
          <button type="button" onClick={handleClearAll} className={styles.clearBtn} disabled={disabled}>
            Limpiar selección
          </button>
        )}
      </div>

      <div className={styles.tabsList}>
        {(!alcance || alcance === 'CATEGORIA') && (
          <button
            type="button"
            className={`${styles.tabBtn} ${activeTab === 'categorias' ? styles.activeTab : ''}`}
            onClick={() => {
              setActiveTab('categorias');
              setSearchQuery('');
            }}
          >
            <Layers size={15} />
            <span>Categorías</span>
            <span className={styles.tabBadge}>{selectedCategoryIds.length}</span>
          </button>
        )}

        {(!alcance || alcance === 'PRODUCTO') && (
          <button
            type="button"
            className={`${styles.tabBtn} ${activeTab === 'productos' ? styles.activeTab : ''}`}
            onClick={() => {
              setActiveTab('productos');
              setSearchQuery('');
            }}
          >
            <Package size={15} />
            <span>Productos</span>
            <span className={styles.tabBadge}>{selectedProductIds.length}</span>
          </button>
        )}

        {(!alcance || alcance === 'VARIANTE') && (
          <button
            type="button"
            className={`${styles.tabBtn} ${activeTab === 'variantes' ? styles.activeTab : ''}`}
            onClick={() => {
              setActiveTab('variantes');
              setSearchQuery('');
            }}
          >
            <Tag size={15} />
            <span>Variantes</span>
            <span className={styles.tabBadge}>{selectedVariantIds.length}</span>
          </button>
        )}

        {(!alcance || alcance === 'EMPAQUE') && (
          <button
            type="button"
            className={`${styles.tabBtn} ${activeTab === 'empaques' ? styles.activeTab : ''}`}
            onClick={() => {
              setActiveTab('empaques');
              setSearchQuery('');
            }}
          >
            <Boxes size={15} />
            <span>Empaques</span>
            <span className={styles.tabBadge}>{selectedEmpaqueIds.length}</span>
          </button>
        )}
      </div>

      <div className={styles.searchWrapper}>
        <Search size={16} className={styles.searchIcon} />
        <input
          type="text"
          className={styles.searchInput}
          placeholder={`Buscar en ${
            activeTab === 'categorias'
              ? 'categorías'
              : activeTab === 'productos'
              ? 'productos'
              : activeTab === 'variantes'
              ? 'variantes'
              : 'empaques'
          }...`}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          disabled={disabled}
        />
        {searchQuery && (
          <button type="button" className={styles.clearSearchBtn} onClick={() => setSearchQuery('')}>
            <X size={14} />
          </button>
        )}
      </div>

      <div className={styles.listContainer}>
        {filteredList.length === 0 ? (
          <div className={styles.emptyState}>
            {searchQuery
              ? `No se encontraron resultados para "${searchQuery}"`
              : `No hay ${activeTab} disponibles para seleccionar`}
          </div>
        ) : (
          filteredList.map((item) => {
            const isSelected = currentSelectedIds.includes(item.id);
            return (
              <div
                key={item.id}
                className={`${styles.itemRow} ${isSelected ? styles.itemSelected : ''}`}
                onClick={() => handleToggleItem(item.id)}
              >
                <input
                  type="checkbox"
                  className={styles.checkbox}
                  checked={isSelected}
                  onChange={() => {}}
                  disabled={disabled}
                />
                <div className={styles.itemInfo}>
                  <span className={styles.itemName}>{item.nombre}</span>
                  {item.subtitle && <span className={styles.itemDetail}>{item.subtitle}</span>}
                </div>
                {item.code && <span className={styles.itemCodeTag}>{item.code}</span>}
              </div>
            );
          })
        )}
      </div>

      {totalSelectedCount > 0 && (
        <div className={styles.selectedSection}>
          <div className={styles.selectedHeader}>
            <span>Objetivos Seleccionados</span>
            <span>{totalSelectedCount} ítem{totalSelectedCount !== 1 ? 's' : ''}</span>
          </div>

          <div className={styles.badgesWrapper}>
            {allSelectedPills.map((pill) => (
              <span key={`${pill.type}-${pill.id}`} className={styles.pillBadge}>
                <span className={styles.badgeTypeTag}>{pill.label}</span>
                <span>{pill.nombre}</span>
                <button
                  type="button"
                  className={styles.dismissBtn}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDismissPill(pill.id, pill.type);
                  }}
                  title="Eliminar de la selección"
                  disabled={disabled}
                >
                  <X size={12} />
                </button>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default TargetSelector;
