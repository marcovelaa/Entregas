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
    <div ref={containerRef} style={{ position: 'relative', width: '100%' }}>
      {/* Search Bar + Explore Button Combo Container */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          backgroundColor: '#f8fafc',
          padding: '0.75rem',
          borderRadius: '10px',
          border: '1px solid #e2e8f0',
        }}
      >
        {/* Omnibox Input Field */}
        <div
          style={{
            position: 'relative',
            flex: 1,
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <div
            style={{
              position: 'absolute',
              left: '0.75rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              color: '#64748b',
              pointerEvents: 'none',
            }}
          >
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
            style={{
              width: '100%',
              padding: '0.7rem 2.2rem 0.7rem 2.5rem',
              borderRadius: '8px',
              border: '1px solid #cbd5e1',
              fontSize: '0.9rem',
              backgroundColor: '#ffffff',
              outline: 'none',
              transition: 'border-color 0.2s, box-shadow 0.2s',
            }}
          />

          <div
            style={{
              position: 'absolute',
              right: '0.75rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
            }}
          >
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
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#94a3b8',
                  cursor: 'pointer',
                  padding: 0,
                  display: 'flex',
                }}
              >
                <X size={16} />
              </button>
            ) : null}
          </div>
        </div>

        {/* Modal Opener Button: Explorar Catálogo */}
        <button
          type="button"
          onClick={onOpenBrowseModal}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.45rem',
            padding: '0.7rem 1.15rem',
            borderRadius: '8px',
            border: '1px solid #0f172a',
            backgroundColor: '#ffffff',
            color: '#0f172a',
            fontSize: '0.875rem',
            fontWeight: 600,
            cursor: 'pointer',
            whiteSpace: 'nowrap',
            transition: 'all 0.15s ease',
            boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#0f172a';
            e.currentTarget.style.color = '#ffffff';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#ffffff';
            e.currentTarget.style.color = '#0f172a';
          }}
        >
          <Package size={17} /> Explorar Catálogo (Lote)
        </button>
      </div>

      {/* Barcode / Quick scan success toast notification */}
      {lastScannedName && (
        <div
          style={{
            position: 'absolute',
            top: '-2.5rem',
            left: 0,
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            padding: '0.35rem 0.75rem',
            backgroundColor: '#ecfdf5',
            color: '#065f46',
            borderRadius: '6px',
            border: '1px solid #a7f3d0',
            fontSize: '0.8rem',
            fontWeight: 600,
            animation: 'fadeIn 0.2s ease',
            zIndex: 30,
          }}
        >
          <Check size={14} color="#059669" />
          <span>¡Agregado!: {lastScannedName}</span>
        </div>
      )}

      {/* Floating Results Popover Dropdown */}
      {isOpen && query.trim() && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 4px)',
            left: 0,
            right: 0,
            backgroundColor: '#ffffff',
            borderRadius: '10px',
            boxShadow: '0 12px 28px -4px rgba(15, 23, 42, 0.2), 0 4px 10px -2px rgba(15, 23, 42, 0.08)',
            border: '1px solid #e2e8f0',
            zIndex: 1000,
            maxHeight: '360px',
            overflowY: 'auto',
          }}
        >
          {loading && results.length === 0 ? (
            <div style={{ padding: '1.5rem', textAlign: 'center', color: '#64748b', fontSize: '0.85rem' }}>
              <Loader2 size={20} className="spin" style={{ margin: '0 auto 0.5rem', color: '#0f172a' }} />
              Buscando productos...
            </div>
          ) : results.length === 0 ? (
            <div style={{ padding: '1.5rem', textAlign: 'center', color: '#64748b' }}>
              <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.875rem', fontWeight: 600, color: '#334155' }}>
                No se encontraron productos para "{query}"
              </p>
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  onOpenBrowseModal();
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#2563eb',
                  fontSize: '0.825rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.3rem',
                }}
              >
                Abrir catálogo completo con filtros avanzados <ArrowRight size={14} />
              </button>
            </div>
          ) : (
            <div>
              <div
                style={{
                  padding: '0.5rem 0.85rem',
                  backgroundColor: '#f8fafc',
                  borderBottom: '1px solid #e2e8f0',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  color: '#64748b',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <span>RESULTADOS ({results.length}) — Presiona Enter o clic para agregar</span>
                <span style={{ fontSize: '0.7rem' }}>↑↓ Navegar | ESC Cerrar</span>
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
                    style={{
                      padding: '0.65rem 0.85rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      borderBottom: '1px solid #f1f5f9',
                      backgroundColor: isHighlighted ? '#f1f5f9' : '#ffffff',
                      cursor: 'pointer',
                      transition: 'background-color 0.1s ease',
                    }}
                  >
                    {/* Left: Thumbnail & Names */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          width: '36px',
                          height: '36px',
                          borderRadius: '6px',
                          backgroundColor: '#f8fafc',
                          border: '1px solid #e2e8f0',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          overflow: 'hidden',
                          flexShrink: 0,
                        }}
                      >
                        {fullImg ? (
                          <img
                            src={fullImg}
                            alt={p.nombre}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                        ) : (
                          <BookOpen size={16} color="#94a3b8" />
                        )}
                      </div>

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                          <span
                            style={{
                              fontSize: '0.85rem',
                              fontWeight: 600,
                              color: '#0f172a',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {p.nombre}
                          </span>
                          {isAlreadyIn && (
                            <span
                              style={{
                                fontSize: '0.65rem',
                                padding: '0.1rem 0.35rem',
                                borderRadius: '3px',
                                backgroundColor: '#eff6ff',
                                color: '#1e40af',
                                fontWeight: 600,
                              }}
                            >
                              En receta
                            </span>
                          )}
                        </div>

                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            fontSize: '0.725rem',
                            color: '#64748b',
                            marginTop: '0.1rem',
                          }}
                        >
                          <span style={{ fontFamily: 'monospace' }}>SKU: {p.sku || 'N/A'}</span>
                          {p.categoria?.nombre && <span>• {p.categoria.nombre}</span>}
                          {p.marca?.nombre && <span>• {p.marca.nombre}</span>}
                        </div>
                      </div>
                    </div>

                    {/* Right: Stock, Price and Add Button */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexShrink: 0 }}>
                      <span
                        style={{
                          fontSize: '0.725rem',
                          fontWeight: 600,
                          padding: '0.15rem 0.45rem',
                          borderRadius: '4px',
                          backgroundColor: stock > 0 ? '#ecfdf5' : '#fef2f2',
                          color: stock > 0 ? '#065f46' : '#991b1b',
                          border: `1px solid ${stock > 0 ? '#a7f3d0' : '#fecaca'}`,
                        }}
                      >
                        {stock > 0 ? `${stock} disp.` : 'Agotado'}
                      </span>

                      <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0f172a', minWidth: '70px', textAlign: 'right' }}>
                        Bs. {Number(p.precio_base || 0).toFixed(2)}
                      </span>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelectProduct(p, 1);
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.2rem',
                          padding: '0.35rem 0.65rem',
                          borderRadius: '6px',
                          border: 'none',
                          backgroundColor: '#0f172a',
                          color: '#ffffff',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                        }}
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
                style={{
                  padding: '0.65rem 0.85rem',
                  backgroundColor: '#f8fafc',
                  textAlign: 'center',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  color: '#2563eb',
                  cursor: 'pointer',
                  borderTop: '1px solid #e2e8f0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.3rem',
                }}
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
