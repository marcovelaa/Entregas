'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Search,
  Package,
  Plus,
  Minus,
  Check,
  X,
  Layers,
  Loader2,
  BookOpen,
  ArrowRight,
} from 'lucide-react';
import { api } from '@/lib/axios';
import { CatalogProduct } from './CatalogBrowseModal';
import styles from './ComboProductOmnibox.module.css';

interface ComboProductOmniboxProps {
  onAddProduct: (product: CatalogProduct, cantidad: number) => void;
  onOpenBrowseModal: () => void;
  existingComponentIds: string[];
  excludeProductId?: string;
}

export function ComboProductOmnibox({
  onAddProduct,
  onOpenBrowseModal,
  existingComponentIds,
  excludeProductId,
}: ComboProductOmniboxProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<CatalogProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState<number>(-1);
  const [lastScannedName, setLastScannedName] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced search query
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const timeout = setTimeout(async () => {
      try {
        const res = await api.get('/productos', {
          params: {
            search: query.trim(),
            limit: 20,
            activo: true,
          },
        });
        const prods = (res.data?.data || res.data || []).filter(
          (p: CatalogProduct) =>
            p.tipo_producto !== 'COMBO' &&
            (!excludeProductId || p.id.toString() !== excludeProductId.toString())
        );
        setResults(prods);
        setIsOpen(true);
        setHighlightedIndex(prods.length > 0 ? 0 : -1);
      } catch (err) {
        console.error('Error buscando productos en omnibox:', err);
      } finally {
        setLoading(false);
      }
    }, 200);

    return () => clearTimeout(timeout);
  }, [query, excludeProductId]);

  const handleSelectProduct = (product: CatalogProduct, qty: number = 1) => {
    onAddProduct(product, qty);
    setQuery('');
    setResults([]);
    setIsOpen(false);
    setLastScannedName(product.nombre);
    setTimeout(() => setLastScannedName(null), 3000);
    inputRef.current?.focus();
  };

  // Keyboard navigation & Barcode scanner detection (Enter key)
  const handleKeyDown = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (results.length > 0) {
        setIsOpen(true);
        setHighlightedIndex((prev) => (prev < results.length - 1 ? prev + 1 : 0));
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (results.length > 0) {
        setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : results.length - 1));
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    } else if (e.key === 'Enter') {
      e.preventDefault();

      // If user navigated with arrows to a specific product
      if (highlightedIndex >= 0 && results[highlightedIndex]) {
        handleSelectProduct(results[highlightedIndex], 1);
        return;
      }

      // Barcode Scanner detection: exact SKU or single match on Enter
      const trimmed = query.trim();
      if (!trimmed) return;

      // Check if we have exact match in current results or perform exact lookup
      const exactMatch = results.find(
        (p) => p.sku?.toLowerCase() === trimmed.toLowerCase() || p.nombre.toLowerCase() === trimmed.toLowerCase()
      );

      if (exactMatch) {
        handleSelectProduct(exactMatch, 1);
        return;
      }

      if (results.length === 1) {
        handleSelectProduct(results[0], 1);
        return;
      }

      // Fallback: direct server query for exact SKU
      try {
        setLoading(true);
        const res = await api.get('/productos', { params: { search: trimmed, limit: 5 } });
        const list = (res.data?.data || res.data || []).filter((p: any) => p.tipo_producto !== 'COMBO');
        if (list.length > 0) {
          handleSelectProduct(list[0], 1);
        }
      } catch (err) {
        console.error('Error buscando SKU escaneado:', err);
      } finally {
        setLoading(false);
      }
    }
  };

  const getStock = (p: CatalogProduct): number => {
    if (!p.Inventario || p.Inventario.length === 0) return 0;
    const inv = p.Inventario[0];
    return Math.max(0, (inv.cantidad_disponible || 0) - (inv.reservado || 0));
  };

  return (
    <div ref={containerRef} className={styles.container}>
      {/* Search Bar + Explore Button Combo Container */}
      <div className={styles.searchBar}>
        {/* Omnibox Input Field */}
        <div className={styles.inputWrap}>
          <div className={styles.inputIcon}>
            <Search size={18} />
          </div>

          <input
            ref={inputRef}
            type="text"
            placeholder="Buscar producto por nombre o SKU..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              if (!isOpen && e.target.value.trim()) setIsOpen(true);
            }}
            onFocus={() => {
              if (results.length > 0) setIsOpen(true);
            }}
            onKeyDown={handleKeyDown}
            className={styles.input}
          />

          <div className={styles.inputTrailing}>
            {loading ? (
              <Loader2 size={16} className="spin" color="#0f172a" />
            ) : query ? (
              <button
                type="button"
                onClick={() => {
                  setQuery('');
                  setResults([]);
                  setIsOpen(false);
                  inputRef.current?.focus();
                }}
                className={styles.clearBtn}
              >
                <X size={16} />
              </button>
            ) : null}
          </div>
        </div>

        {/* Modal Opener Button: Explorar Catálogo */}
        <button type="button" onClick={onOpenBrowseModal} className={styles.browseBtn}>
          <Package size={17} /> Explorar Catálogo (Lote)
        </button>
      </div>

      {/* Barcode / Quick scan success toast notification */}
      {lastScannedName && (
        <div className={styles.scanToast}>
          <Check size={14} color="#059669" />
          <span>¡Agregado!: {lastScannedName}</span>
        </div>
      )}

      {/* Floating Results Popover Dropdown */}
      {isOpen && query.trim() && (
        <div className={styles.popover}>
          {loading && results.length === 0 ? (
            <div className={styles.popoverState}>
              <Loader2 size={20} className={`spin ${styles.popoverStateSpin}`} />
              Buscando productos...
            </div>
          ) : results.length === 0 ? (
            <div className={styles.popoverState}>
              <p className={styles.popoverStateTitle}>No se encontraron productos para "{query}"</p>
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  onOpenBrowseModal();
                }}
                className={styles.popoverLinkBtn}
              >
                Abrir catálogo completo con filtros avanzados <ArrowRight size={14} />
              </button>
            </div>
          ) : (
            <div>
              <div className={styles.resultsHeader}>
                <span>RESULTADOS ({results.length}) — Presiona Enter o clic para agregar</span>
                <span className={styles.resultsHeaderHint}>↑↓ Navegar | ESC Cerrar</span>
              </div>

              {results.map((p, idx) => {
                const idStr = p.id.toString();
                const stock = getStock(p);
                const isAlreadyIn = existingComponentIds.includes(idStr);
                const isHighlighted = idx === highlightedIndex;
                const imgUrl = p.imagenes?.[0]?.url;
                const fullImg = imgUrl
                  ? imgUrl.startsWith('http')
                    ? imgUrl
                    : `http://localhost:3001${imgUrl}`
                  : null;

                return (
                  <div
                    key={p.id}
                    onMouseEnter={() => setHighlightedIndex(idx)}
                    onClick={() => handleSelectProduct(p, 1)}
                    className={isHighlighted ? styles.resultRowHighlighted : styles.resultRow}
                  >
                    {/* Left: Thumbnail & Names */}
                    <div className={styles.resultLeft}>
                      <div className={styles.resultThumb}>
                        {fullImg ? (
                          <img src={fullImg} alt={p.nombre} className={styles.resultThumbImg} />
                        ) : (
                          <BookOpen size={16} color="#94a3b8" />
                        )}
                      </div>

                      <div className={styles.resultInfo}>
                        <div className={styles.resultNameRow}>
                          <span className={styles.resultName}>{p.nombre}</span>
                          {isAlreadyIn && <span className={styles.resultInComboBadge}>En receta</span>}
                        </div>

                        <div className={styles.resultMeta}>
                          <span className={styles.mono}>SKU: {p.sku || 'N/A'}</span>
                          {p.categoria?.nombre && <span>• {p.categoria.nombre}</span>}
                          {p.marca?.nombre && <span>• {p.marca.nombre}</span>}
                        </div>
                      </div>
                    </div>

                    {/* Right: Stock, Price and Add Button */}
                    <div className={styles.resultRight}>
                      <span className={stock > 0 ? styles.resultStockPositive : styles.resultStockNegative}>
                        {stock > 0 ? `${stock} disp.` : 'Agotado'}
                      </span>

                      <span className={styles.resultPrice}>
                        Bs. {Number(p.precio_base || 0).toFixed(2)}
                      </span>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelectProduct(p, 1);
                        }}
                        className={styles.resultAddBtn}
                      >
                        <Plus size={14} /> Sumar
                      </button>
                    </div>
                  </div>
                );
              })}

              <div
                onClick={() => {
                  setIsOpen(false);
                  onOpenBrowseModal();
                }}
                className={styles.footerLink}
              >
                <Layers size={14} /> Ver más resultados en el Explorador de Catálogo
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
