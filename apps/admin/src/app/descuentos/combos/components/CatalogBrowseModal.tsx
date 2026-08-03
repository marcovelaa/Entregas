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
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(4px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.5rem',
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          width: '100%',
          maxWidth: '960px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          border: '1px solid #e2e8f0',
          overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '1.25rem 1.5rem',
            borderBottom: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: '#ffffff',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                backgroundColor: '#f1f5f9',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#0f172a',
              }}
            >
              <Package size={22} />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700, color: '#0f172a' }}>
                Explorar y Agregar Productos al Combo
              </h2>
              <p style={{ margin: '0.15rem 0 0 0', fontSize: '0.825rem', color: '#64748b' }}>
                Busca, filtra y selecciona múltiples componentes en lote para armar la receta BOM.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              borderRadius: '8px',
              padding: '0.5rem',
              cursor: 'pointer',
              color: '#64748b',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Filter Controls Bar */}
        <div
          style={{
            padding: '1rem 1.5rem',
            backgroundColor: '#f8fafc',
            borderBottom: '1px solid #e2e8f0',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem',
          }}
        >
          {/* Search Row */}
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <div
              style={{
                position: 'relative',
                flex: 1,
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <Search
                size={18}
                color="#94a3b8"
                style={{ position: 'absolute', left: '0.75rem', pointerEvents: 'none' }}
              />
              <input
                type="text"
                placeholder="Buscar por título, SKU, código de barras o autor..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                autoFocus
                style={{
                  width: '100%',
                  padding: '0.65rem 0.75rem 0.65rem 2.4rem',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  fontSize: '0.9rem',
                  backgroundColor: '#ffffff',
                  outline: 'none',
                }}
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  style={{
                    position: 'absolute',
                    right: '0.75rem',
                    background: 'none',
                    border: 'none',
                    color: '#94a3b8',
                    cursor: 'pointer',
                    padding: 0,
                  }}
                >
                  <X size={16} />
                </button>
              )}
            </div>

            {/* In-stock pill toggle */}
            <button
              type="button"
              onClick={() => setOnlyInStock(!onlyInStock)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.65rem 1rem',
                borderRadius: '8px',
                border: `1px solid ${onlyInStock ? '#0f172a' : '#cbd5e1'}`,
                backgroundColor: onlyInStock ? '#0f172a' : '#ffffff',
                color: onlyInStock ? '#ffffff' : '#475569',
                fontSize: '0.85rem',
                fontWeight: 600,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s ease',
              }}
            >
              <CheckCircle2 size={16} color={onlyInStock ? '#ffffff' : '#94a3b8'} />
              Solo con Stock
            </button>
          </div>

          {/* Secondary Filters: Categoría & Marca */}
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <select
              value={selectedCategoria}
              onChange={(e) => setSelectedCategoria(e.target.value)}
              style={{
                flex: 1,
                minWidth: '180px',
                padding: '0.55rem 0.75rem',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                fontSize: '0.85rem',
                backgroundColor: '#ffffff',
                color: '#334155',
              }}
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
              style={{
                flex: 1,
                minWidth: '180px',
                padding: '0.55rem 0.75rem',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                fontSize: '0.85rem',
                backgroundColor: '#ffffff',
                color: '#334155',
              }}
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
                style={{
                  background: 'none',
                  border: '1px dashed #cbd5e1',
                  borderRadius: '8px',
                  padding: '0.55rem 0.85rem',
                  fontSize: '0.825rem',
                  color: '#64748b',
                  cursor: 'pointer',
                  fontWeight: 500,
                }}
              >
                Limpiar Filtros
              </button>
            )}
          </div>
        </div>

        {/* Product List Table / Grid */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '0',
            backgroundColor: '#ffffff',
            position: 'relative',
          }}
        >
          {loading ? (
            <div style={{ padding: '4rem 2rem', textAlign: 'center', color: '#64748b' }}>
              <Loader2 size={32} className="spin" style={{ margin: '0 auto 0.75rem', color: '#0f172a' }} />
              <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: 600 }}>Buscando productos en catálogo...</p>
            </div>
          ) : displayedProducts.length === 0 ? (
            <div style={{ padding: '4rem 2rem', textAlign: 'center', color: '#64748b' }}>
              <Package size={40} style={{ margin: '0 auto 0.75rem', color: '#cbd5e1' }} />
              <p style={{ margin: '0 0 0.25rem 0', fontSize: '0.95rem', fontWeight: 600, color: '#334155' }}>
                No se encontraron productos coincidentes
              </p>
              <p style={{ margin: 0, fontSize: '0.825rem', color: '#94a3b8' }}>
                Intenta con otro término de búsqueda o ajustando los filtros de categoría.
              </p>
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
              <thead>
                <tr
                  style={{
                    backgroundColor: '#f8fafc',
                    borderBottom: '1px solid #e2e8f0',
                    color: '#475569',
                    textAlign: 'left',
                    position: 'sticky',
                    top: 0,
                    zIndex: 10,
                  }}
                >
                  <th style={{ padding: '0.65rem 1rem', width: '40px' }}>
                    <input
                      type="checkbox"
                      checked={
                        displayedProducts.length > 0 &&
                        displayedProducts.every((p) => selectedMap[p.id.toString()] !== undefined)
                      }
                      onChange={handleSelectAllOnPage}
                      style={{ cursor: 'pointer', width: '16px', height: '16px', accentColor: '#0f172a' }}
                    />
                  </th>
                  <th style={{ padding: '0.65rem 0.5rem', width: '56px' }}>Img</th>
                  <th style={{ padding: '0.65rem 1rem' }}>Producto / SKU</th>
                  <th style={{ padding: '0.65rem 1rem' }}>Categoría / Marca</th>
                  <th style={{ padding: '0.65rem 1rem', textAlign: 'center', width: '110px' }}>Stock</th>
                  <th style={{ padding: '0.65rem 1rem', textAlign: 'right', width: '110px' }}>Precio Base</th>
                  <th style={{ padding: '0.65rem 1rem', textAlign: 'center', width: '140px' }}>
                    Cantidad a Incluir
                  </th>
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
                      style={{
                        borderBottom: '1px solid #f1f5f9',
                        backgroundColor: isSelected ? '#f8fafc' : '#ffffff',
                        cursor: 'pointer',
                        transition: 'background-color 0.15s ease',
                      }}
                    >
                      <td style={{ padding: '0.75rem 1rem' }} onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelectProduct(p)}
                          style={{ cursor: 'pointer', width: '16px', height: '16px', accentColor: '#0f172a' }}
                        />
                      </td>
                      <td style={{ padding: '0.75rem 0.5rem' }}>
                        <div
                          style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '6px',
                            backgroundColor: '#f1f5f9',
                            border: '1px solid #e2e8f0',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            overflow: 'hidden',
                          }}
                        >
                          {fullImg ? (
                            <img
                              src={fullImg}
                              alt={p.nombre}
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                          ) : (
                            <BookOpen size={18} color="#94a3b8" />
                          )}
                        </div>
                      </td>
                      <td style={{ padding: '0.75rem 1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                          <span style={{ fontWeight: 600, color: '#0f172a' }}>{p.nombre}</span>
                          {isAlreadyInCombo && (
                            <span
                              style={{
                                fontSize: '0.7rem',
                                padding: '0.15rem 0.4rem',
                                borderRadius: '4px',
                                backgroundColor: '#eff6ff',
                                color: '#1e40af',
                                fontWeight: 600,
                                border: '1px solid #bfdbfe',
                              }}
                            >
                              Ya en combo
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.15rem' }}>
                          SKU: <span style={{ fontFamily: 'monospace' }}>{p.sku || 'Sin SKU'}</span>
                        </div>
                      </td>
                      <td style={{ padding: '0.75rem 1rem', color: '#475569', fontSize: '0.8rem' }}>
                        <div>{p.categoria?.nombre || 'General'}</div>
                        {p.marca?.nombre && (
                          <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{p.marca.nombre}</div>
                        )}
                      </td>
                      <td style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>
                        <span
                          style={{
                            display: 'inline-block',
                            padding: '0.2rem 0.55rem',
                            borderRadius: '999px',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            backgroundColor: stock > 0 ? '#ecfdf5' : '#fef2f2',
                            color: stock > 0 ? '#065f46' : '#991b1b',
                            border: `1px solid ${stock > 0 ? '#a7f3d0' : '#fecaca'}`,
                          }}
                        >
                          {stock > 0 ? `${stock} u.` : 'Sin Stock'}
                        </span>
                      </td>
                      <td style={{ padding: '0.75rem 1rem', textAlign: 'right', fontWeight: 600, color: '#0f172a' }}>
                        Bs. {Number(p.precio_base || 0).toFixed(2)}
                      </td>
                      <td style={{ padding: '0.75rem 1rem', textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
                        {isSelected ? (
                          <div
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              border: '1px solid #cbd5e1',
                              borderRadius: '6px',
                              overflow: 'hidden',
                              backgroundColor: '#ffffff',
                            }}
                          >
                            <button
                              type="button"
                              onClick={(e) => updateQuantity(idStr, qty - 1, e)}
                              style={{
                                border: 'none',
                                background: '#f8fafc',
                                padding: '0.3rem 0.45rem',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                color: '#475569',
                              }}
                            >
                              <Minus size={14} />
                            </button>
                            <input
                              type="number"
                              min="1"
                              value={qty}
                              onChange={(e) => updateQuantity(idStr, parseInt(e.target.value) || 1, e as any)}
                              style={{
                                width: '42px',
                                border: 'none',
                                textAlign: 'center',
                                fontSize: '0.85rem',
                                fontWeight: 600,
                                padding: '0.2rem 0',
                                outline: 'none',
                              }}
                            />
                            <button
                              type="button"
                              onClick={(e) => updateQuantity(idStr, qty + 1, e)}
                              style={{
                                border: 'none',
                                background: '#f8fafc',
                                padding: '0.3rem 0.45rem',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                color: '#475569',
                              }}
                            >
                              <Plus size={14} />
                            </button>
                          </div>
                        ) : (
                          <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Sticky Footer Action Bar */}
        <div
          style={{
            padding: '1rem 1.5rem',
            borderTop: '1px solid #e2e8f0',
            backgroundColor: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ fontSize: '0.85rem', color: '#475569' }}>
            {totalSelectedItems > 0 ? (
              <span style={{ fontWeight: 600, color: '#0f172a' }}>
                {totalSelectedItems} producto{totalSelectedItems > 1 ? 's' : ''} seleccionado{totalSelectedItems > 1 ? 's' : ''} ({totalUnits} unidades en total)
              </span>
            ) : (
              <span>Selecciona uno o varios productos de la lista para agregarlos.</span>
            )}
          </div>

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '0.6rem 1.2rem',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                backgroundColor: '#ffffff',
                color: '#475569',
                fontSize: '0.875rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Cancelar
            </button>

            <button
              type="button"
              onClick={handleConfirmAdd}
              disabled={totalSelectedItems === 0}
              style={{
                padding: '0.6rem 1.25rem',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: totalSelectedItems > 0 ? '#0f172a' : '#94a3b8',
                color: '#ffffff',
                fontSize: '0.875rem',
                fontWeight: 600,
                cursor: totalSelectedItems > 0 ? 'pointer' : 'not-allowed',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                boxShadow: totalSelectedItems > 0 ? '0 4px 6px -1px rgba(15, 23, 42, 0.2)' : 'none',
              }}
            >
              <Check size={16} /> Agregar al Combo ({totalSelectedItems})
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
