'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  X,
  Search,
  Filter,
  Check,
  Plus,
  Minus,
  Package,
  Layers,
  AlertCircle,
  CheckCircle2,
  Loader2,
  BookOpen,
} from 'lucide-react';
import { api } from '@/lib/axios';
import styles from './CatalogBrowseModal.module.css';

export interface CatalogProduct {
  id: string | number;
  nombre: string;
  sku?: string;
  precio_base: number | string;
  categoria_id?: string | number;
  marca_id?: string | number;
  categoria?: { id: string | number; nombre: string };
  marca?: { id: string | number; nombre: string };
  imagenes?: Array<{ url: string }>;
  Inventario?: Array<{
    cantidad_disponible: number;
    reservado: number;
  }>;
  tipo_producto?: string;
}

interface CatalogBrowseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddSelected: (
    items: Array<{
      producto: CatalogProduct;
      cantidad: number;
    }>
  ) => void;
  existingComponentIds: string[];
  excludeProductId?: string;
}

export function CatalogBrowseModal({
  isOpen,
  onClose,
  onAddSelected,
  existingComponentIds,
  excludeProductId,
}: CatalogBrowseModalProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategoria, setSelectedCategoria] = useState<string>('');
  const [selectedMarca, setSelectedMarca] = useState<string>('');
  const [onlyInStock, setOnlyInStock] = useState(false);

  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<CatalogProduct[]>([]);
  const [categorias, setCategorias] = useState<any[]>([]);
  const [marcas, setMarcas] = useState<any[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const limit = 25;

  // Selected state: map of productId -> quantity to add
  const [selectedMap, setSelectedMap] = useState<Record<string, number>>({});

  // Load categories and brands on mount
  useEffect(() => {
    if (!isOpen) return;

    async function loadFilters() {
      try {
        const [resCat, resMar] = await Promise.all([
          api.get('/categorias').catch(() => ({ data: [] })),
          api.get('/marcas').catch(() => ({ data: [] })),
        ]);
        setCategorias(Array.isArray(resCat.data) ? resCat.data : resCat.data.data || []);
        setMarcas(Array.isArray(resMar.data) ? resMar.data : resMar.data.data || []);
      } catch (err) {
        console.error('Error cargando filtros del catálogo:', err);
      }
    }
    loadFilters();
  }, [isOpen]);

  // Fetch products with debounce on search and filter change
  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, any> = {
        page,
        limit,
        activo: true,
      };

      if (searchTerm.trim()) params.search = searchTerm.trim();
      if (selectedCategoria) params.categoria_id = Number(selectedCategoria);
      if (selectedMarca) params.marca_id = Number(selectedMarca);

      const res = await api.get('/productos', { params });
      const rawData = res.data?.data || res.data || [];
      const total = res.data?.meta?.total || rawData.length;

      // Filter out COMBO types and the current combo product itself
      const valid = rawData.filter(
        (p: CatalogProduct) =>
          p.tipo_producto !== 'COMBO' &&
          (!excludeProductId || p.id.toString() !== excludeProductId.toString())
      );

      setProducts(valid);
      setTotalCount(total);
    } catch (err) {
      console.error('Error buscando productos:', err);
    } finally {
      setLoading(false);
    }
  }, [searchTerm, selectedCategoria, selectedMarca, page, excludeProductId]);

  useEffect(() => {
    if (!isOpen) return;
    const timeout = setTimeout(() => {
      fetchProducts();
    }, 250);
    return () => clearTimeout(timeout);
  }, [isOpen, fetchProducts]);

  // Reset page to 1 when filters change
  useEffect(() => {
    setPage(1);
  }, [searchTerm, selectedCategoria, selectedMarca]);

  // Reset selected state when modal opens
  useEffect(() => {
    if (isOpen) {
      setSelectedMap({});
    }
  }, [isOpen]);

  // Helper to calculate available stock
  const getStock = (p: CatalogProduct): number => {
    if (!p.Inventario || p.Inventario.length === 0) return 0;
    const inv = p.Inventario[0];
    return Math.max(0, (inv.cantidad_disponible || 0) - (inv.reservado || 0));
  };

  // Filtered by in-stock if toggle active
  const displayedProducts = useMemo(() => {
    if (!onlyInStock) return products;
    return products.filter((p) => getStock(p) > 0);
  }, [products, onlyInStock]);

  const toggleSelectProduct = (p: CatalogProduct) => {
    const id = p.id.toString();
    setSelectedMap((prev) => {
      const next = { ...prev };
      if (next[id] !== undefined) {
        delete next[id];
      } else {
        next[id] = 1;
      }
      return next;
    });
  };

  const updateQuantity = (id: string, qty: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedMap((prev) => ({
      ...prev,
      [id]: Math.max(1, qty),
    }));
  };

  const handleSelectAllOnPage = () => {
    const allSelected = displayedProducts.every((p) => selectedMap[p.id.toString()] !== undefined);
    setSelectedMap((prev) => {
      const next = { ...prev };
      if (allSelected) {
        displayedProducts.forEach((p) => {
          delete next[p.id.toString()];
        });
      } else {
        displayedProducts.forEach((p) => {
          if (next[p.id.toString()] === undefined) {
            next[p.id.toString()] = 1;
          }
        });
      }
      return next;
    });
  };

  const totalSelectedItems = Object.keys(selectedMap).length;
  const totalUnits = Object.values(selectedMap).reduce((acc, q) => acc + q, 0);

  const handleConfirmAdd = () => {
    const itemsToAdd: Array<{ producto: CatalogProduct; cantidad: number }> = [];

    // Find full product details from all available sources
    Object.entries(selectedMap).forEach(([id, qty]) => {
      const prod = products.find((p) => p.id.toString() === id);
      if (prod) {
        itemsToAdd.push({ producto: prod, cantidad: qty });
      }
    });

    if (itemsToAdd.length > 0) {
      onAddSelected(itemsToAdd);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <div className={styles.headerIcon}>
              <Package size={22} />
            </div>
            <div>
              <h2 className={styles.headerTitle}>Explorar y Agregar Productos al Combo</h2>
              <p className={styles.headerSubtitle}>
                Busca, filtra y selecciona múltiples componentes en lote para armar la receta BOM.
              </p>
            </div>
          </div>
          <button onClick={onClose} className={styles.closeBtn}>
            <X size={20} />
          </button>
        </div>

        {/* Filter Controls Bar */}
        <div className={styles.filterBar}>
          {/* Search Row */}
          <div className={styles.searchRow}>
            <div className={styles.searchInputWrap}>
              <Search size={18} color="#94a3b8" className={styles.searchIcon} />
              <input
                type="text"
                placeholder="Buscar por título, SKU, código de barras o autor..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                autoFocus
                className={styles.searchInput}
              />
              {searchTerm && (
                <button type="button" onClick={() => setSearchTerm('')} className={styles.clearSearchBtn}>
                  <X size={16} />
                </button>
              )}
            </div>

            {/* In-stock pill toggle */}
            <button
              type="button"
              onClick={() => setOnlyInStock(!onlyInStock)}
              className={onlyInStock ? styles.stockToggleActive : styles.stockToggle}
            >
              <CheckCircle2 size={16} color={onlyInStock ? '#ffffff' : '#94a3b8'} />
              Solo con Stock
            </button>
          </div>

          {/* Secondary Filters: Categoría & Marca */}
          <div className={styles.secondaryFilters}>
            <select
              value={selectedCategoria}
              onChange={(e) => setSelectedCategoria(e.target.value)}
              className={styles.filterSelect}
            >
              <option value="">Todas las Categorías</option>
              {categorias.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre}
                </option>
              ))}
            </select>

            <select
              value={selectedMarca}
              onChange={(e) => setSelectedMarca(e.target.value)}
              className={styles.filterSelect}
            >
              <option value="">Todas las Marcas / Editoriales</option>
              {marcas.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.nombre}
                </option>
              ))}
            </select>

            {(selectedCategoria || selectedMarca || searchTerm || onlyInStock) && (
              <button
                type="button"
                onClick={() => {
                  setSelectedCategoria('');
                  setSelectedMarca('');
                  setSearchTerm('');
                  setOnlyInStock(false);
                }}
                className={styles.clearFiltersBtn}
              >
                Limpiar Filtros
              </button>
            )}
          </div>
        </div>

        {/* Product List Table / Grid */}
        <div className={styles.listArea}>
          {loading ? (
            <div className={styles.listState}>
              <Loader2 size={32} className={`spin ${styles.listStateSpin}`} />
              <p className={styles.listStateTitle}>Buscando productos en catálogo...</p>
            </div>
          ) : displayedProducts.length === 0 ? (
            <div className={styles.listState}>
              <Package size={40} className={styles.listStateSpin} />
              <p className={styles.listStateTitle}>No se encontraron productos coincidentes</p>
              <p className={styles.listStateText}>
                Intenta con otro término de búsqueda o ajustando los filtros de categoría.
              </p>
            </div>
          ) : (
            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr className={styles.theadRow}>
                    <th className={styles.thCheck}>
                      <input
                        type="checkbox"
                        checked={
                          displayedProducts.length > 0 &&
                          displayedProducts.every((p) => selectedMap[p.id.toString()] !== undefined)
                        }
                        onChange={handleSelectAllOnPage}
                        className={styles.checkbox}
                      />
                    </th>
                    <th className={styles.thImg}>Img</th>
                    <th className={styles.th}>Producto / SKU</th>
                    <th className={styles.th}>Categoría / Marca</th>
                    <th className={styles.thStock}>Stock</th>
                    <th className={styles.thPrice}>Precio Base</th>
                    <th className={styles.thQty}>Cantidad a Incluir</th>
                  </tr>
                </thead>
                <tbody>
                  {displayedProducts.map((p) => {
                    const idStr = p.id.toString();
                    const isSelected = selectedMap[idStr] !== undefined;
                    const qty = selectedMap[idStr] || 1;
                    const stock = getStock(p);
                    const isAlreadyInCombo = existingComponentIds.includes(idStr);
                    const imgUrl = p.imagenes?.[0]?.url;
                    const fullImg = imgUrl
                      ? imgUrl.startsWith('http')
                        ? imgUrl
                        : `http://localhost:3001${imgUrl}`
                      : null;

                    return (
                      <tr
                        key={p.id}
                        onClick={() => toggleSelectProduct(p)}
                        className={isSelected ? styles.rowSelected : styles.row}
                      >
                        <td className={styles.tdCheck} onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelectProduct(p)}
                            className={styles.checkbox}
                          />
                        </td>
                        <td className={styles.tdImg}>
                          <div className={styles.thumb}>
                            {fullImg ? (
                              <img src={fullImg} alt={p.nombre} className={styles.thumbImg} />
                            ) : (
                              <BookOpen size={18} color="#94a3b8" />
                            )}
                          </div>
                        </td>
                        <td className={styles.td}>
                          <div className={styles.nameRow}>
                            <span className={styles.name}>{p.nombre}</span>
                            {isAlreadyInCombo && <span className={styles.inComboBadge}>Ya en combo</span>}
                          </div>
                          <div className={styles.skuText}>
                            SKU: <span className={styles.mono}>{p.sku || 'Sin SKU'}</span>
                          </div>
                        </td>
                        <td className={styles.tdMeta}>
                          <div>{p.categoria?.nombre || 'General'}</div>
                          {p.marca?.nombre && <div className={styles.metaSub}>{p.marca.nombre}</div>}
                        </td>
                        <td className={styles.tdStock}>
                          <span className={stock > 0 ? styles.stockPositive : styles.stockNegative}>
                            {stock > 0 ? `${stock} u.` : 'Sin Stock'}
                          </span>
                        </td>
                        <td className={styles.tdPrice}>
                          Bs. {Number(p.precio_base || 0).toFixed(2)}
                        </td>
                        <td className={styles.tdQty} onClick={(e) => e.stopPropagation()}>
                          {isSelected ? (
                            <div className={styles.qtyControl}>
                              <button
                                type="button"
                                onClick={(e) => updateQuantity(idStr, qty - 1, e)}
                                className={styles.qtyBtn}
                              >
                                <Minus size={14} />
                              </button>
                              <input
                                type="number"
                                min="1"
                                value={qty}
                                onChange={(e) => updateQuantity(idStr, parseInt(e.target.value) || 1, e as any)}
                                className={styles.qtyInput}
                              />
                              <button
                                type="button"
                                onClick={(e) => updateQuantity(idStr, qty + 1, e)}
                                className={styles.qtyBtn}
                              >
                                <Plus size={14} />
                              </button>
                            </div>
                          ) : (
                            <span className={styles.qtyDash}>—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Sticky Footer Action Bar */}
        <div className={styles.footer}>
          <div className={styles.footerSummary}>
            {totalSelectedItems > 0 ? (
              <span className={styles.footerSummaryStrong}>
                {totalSelectedItems} producto{totalSelectedItems > 1 ? 's' : ''} seleccionado{totalSelectedItems > 1 ? 's' : ''} ({totalUnits} unidades en total)
              </span>
            ) : (
              <span>Selecciona uno o varios productos de la lista para agregarlos.</span>
            )}
          </div>

          <div className={styles.footerActions}>
            <button type="button" onClick={onClose} className={styles.cancelBtn}>
              Cancelar
            </button>

            <button
              type="button"
              onClick={handleConfirmAdd}
              disabled={totalSelectedItems === 0}
              className={totalSelectedItems > 0 ? styles.confirmBtn : styles.confirmBtnDisabled}
            >
              <Check size={16} /> Agregar al Combo ({totalSelectedItems})
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
