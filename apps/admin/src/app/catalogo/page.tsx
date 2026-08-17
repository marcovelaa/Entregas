'use client';

import React, { useState, useEffect, useCallback, useRef, Suspense } from 'react';
import axios from 'axios';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { Loader2, Package, Tag, Search, Plus, Pencil, ToggleLeft, ToggleRight, ChevronLeft, ChevronRight } from 'lucide-react';
import styles from './page.module.css';
import { api, getApiAssetUrl } from '../../lib/axios';
import { Producto, Categoria, ActiveTab } from './types';
import MarcasPanel from './components/MarcasPanel';

function CatalogoContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [tab, setTab] = useState<ActiveTab>('productos');

  // Data states
  const [productos, setProductos] = useState<Producto[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [marcas, setMarcas] = useState<any[]>([]);

  // UI states
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Pagination & Search states (seeded from the URL so links are shareable)
  const [search, setSearch] = useState(() => searchParams.get('q') || '');
  const [debouncedSearch, setDebouncedSearch] = useState(() => searchParams.get('q') || '');
  const [page, setPage] = useState(() => Number(searchParams.get('page')) || 1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  function updateUrl(next: { q?: string; page?: number }) {
    const params = new URLSearchParams(searchParams.toString());
    if (next.q !== undefined) {
      if (next.q) params.set('q', next.q); else params.delete('q');
    }
    if (next.page !== undefined) {
      if (next.page > 1) params.set('page', String(next.page)); else params.delete('page');
    }
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }

  function goToPage(next: number) {
    setPage(next);
    updateUrl({ page: next });
  }

  // 1. Debounce search input (waits 500ms after user stops typing), then sync to the URL
  const isFirstRun = useRef(true);
  useEffect(() => {
    if (isFirstRun.current) {
      isFirstRun.current = false;
      return;
    }
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1); // Reset to page 1 on new search
      updateUrl({ q: search, page: 1 });
    }, 500);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  // 2. Fetch static metadata (categories and brands) once
  const fetchMetadata = useCallback(async (signal?: AbortSignal) => {
    try {
      const [cRes, mRes] = await Promise.all([
        api.get('/categorias', { signal }),
        api.get('/marcas', { signal }),
      ]);
      setCategorias(Array.isArray(cRes.data) ? cRes.data : cRes.data.data || []);
      setMarcas(Array.isArray(mRes.data) ? mRes.data : mRes.data.data || []);
    } catch (err: any) {
      if (axios.isCancel(err) || err?.name === 'CanceledError' || err?.name === 'AbortError') return;
      console.error('Error fetching metadata');
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    fetchMetadata(controller.signal);
    return () => controller.abort();
  }, [fetchMetadata]);

  // 3. Fetch paginated products (depends on page and search)
  const fetchProductos = useCallback(async (signal?: AbortSignal) => {
    setLoading(true); setError(null);
    try {
      const pRes = await api.get('/productos', {
        params: { page, limit: 20, search: debouncedSearch },
        signal,
      });

      if (pRes.data.meta) {
        setProductos(pRes.data.data);
        setTotalPages(pRes.data.meta.totalPages);
        setTotalCount(pRes.data.meta.total);
      } else {
        const arr = Array.isArray(pRes.data) ? pRes.data : pRes.data.data || [];
        setProductos(arr);
        setTotalPages(1);
        setTotalCount(arr.length);
      }
    } catch (err: any) {
      if (axios.isCancel(err) || err?.name === 'CanceledError' || err?.name === 'AbortError') return;
      setError(err?.response?.data?.message || 'Error al conectar con la API.');
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch]);

  useEffect(() => {
    const controller = new AbortController();
    fetchProductos(controller.signal);
    return () => controller.abort();
  }, [fetchProductos]);

  function openCrearProducto() {
    router.push('/catalogo/productos/nuevo');
  }

  function openEditarProducto(producto: Producto) {
    if (producto.tipo_producto === 'COMBO') {
      router.push(`/descuentos/combos/${producto.id}`);
    } else {
      router.push(`/catalogo/productos/${producto.id}`);
    }
  }

  async function handleToggleActivo(id: string, activo: boolean) {
    try {
      await api.patch(`/productos/${id}`, { activo: !activo });
      fetchProductos();
    } catch (err: any) { alert('Error al actualizar estado'); }
  }

  const tabLabels = [
    { key: 'productos' as ActiveTab, label: 'Productos', icon: <Package size={16} /> },
    { key: 'marcas' as ActiveTab, label: 'Marcas', icon: <Tag size={16} /> },
  ];

  return (
    <div className={styles.container}>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Catálogo Dinámico</h1>
          <p className={styles.pageSubtitle}>Estructura orientada a dominio (PIM)</p>
        </div>
      </div>

      {error && <div className={styles.errorBanner}><span>⚠️ {error}</span><button onClick={() => setError(null)} className={styles.errorClose}>✕</button></div>}

      <div className={styles.toolbarRow}>
        <div className={styles.tabs}>
          {tabLabels.map(t => (
            <button key={t.key} className={`${styles.tab} ${tab === t.key ? styles.tabActive : ''}`} onClick={() => { setTab(t.key); setSearch(''); }}>
              {t.icon} {t.label}
            </button>
          ))}
        </div>
      </div>

      {tab === 'productos' ? (
        <section className={styles.card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.5rem', borderBottom: '1px solid var(--border-color, #e2e8f0)' }}>
            <div className={styles.searchWrapper} style={{ width: '100%', maxWidth: '350px' }}>
              <Search size={16} className={styles.searchIcon} />
              <input type="text" className={styles.searchInput} placeholder="Buscar productos..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <button className={styles.btnPrimary} onClick={openCrearProducto}>
              <Plus size={16} strokeWidth={1.5} /> Nuevo Producto
            </button>
          </div>
          <div className={styles.tableWrapper}>
            {loading ? (
              <table className={styles.table}>
                <thead>
                  <tr><th>Producto</th><th>Marca</th><th>Naturaleza</th><th>Categoría</th><th>Precio</th><th>Atributos Específicos</th><th>Estado</th><th style={{ textAlign: 'right' }}>Acciones</th></tr>
                </thead>
                <tbody>
                  {[...Array(5)].map((_, i) => (
                    <tr key={i}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                          <div className={`${styles.skeleton} ${styles.skeletonImg}`}></div>
                          <div>
                            <div className={`${styles.skeleton} ${styles.skeletonText}`} style={{ width: '120px', marginBottom: '6px' }}></div>
                            <div className={`${styles.skeleton} ${styles.skeletonText}`} style={{ width: '80px' }}></div>
                          </div>
                        </div>
                      </td>
                      <td><div className={`${styles.skeleton} ${styles.skeletonText}`} style={{ width: '90px' }}></div></td>
                      <td><div className={`${styles.skeleton} ${styles.skeletonBadge}`}></div></td>
                      <td><div className={`${styles.skeleton} ${styles.skeletonText}`} style={{ width: '100px' }}></div></td>
                      <td><div className={`${styles.skeleton} ${styles.skeletonText}`} style={{ width: '60px' }}></div></td>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <div className={`${styles.skeleton} ${styles.skeletonText}`} style={{ width: '110px' }}></div>
                          <div className={`${styles.skeleton} ${styles.skeletonText}`} style={{ width: '90px' }}></div>
                        </div>
                      </td>
                      <td><div className={`${styles.skeleton} ${styles.skeletonBadge}`} style={{ width: '50px' }}></div></td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                          <div className={`${styles.skeleton} ${styles.skeletonBtn}`}></div>
                          <div className={`${styles.skeleton} ${styles.skeletonBtn}`} style={{ width: '32px' }}></div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <>
                <table className={styles.table}>
                  <thead>
                    <tr><th>Producto</th><th>Marca</th><th>Naturaleza</th><th>Categoría</th><th>Precio</th><th>Atributos Específicos</th><th>Estado</th><th style={{ textAlign: 'right' }}>Acciones</th></tr>
                  </thead>
                  <tbody>
                    {productos.length === 0 ? (
                      <tr><td colSpan={8} className={styles.emptyCell}>No se encontraron productos.</td></tr>
                    ) : productos.map(p => (
                      <tr key={p.id}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                            {p.imagenes && p.imagenes.length > 0 ? (
                              <img src={getApiAssetUrl(p.imagenes[0].url)} alt={p.nombre} style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '8px', flexShrink: 0 }} />
                            ) : (
                              <div style={{ width: '40px', height: '40px', background: '#f1f5f9', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', flexShrink: 0 }}>
                                <Package size={20} />
                              </div>
                            )}
                            <div>
                              <div className={styles.productName}>{p.nombre}</div>
                              <code className={styles.sku}>{p.sku}</code>
                            </div>
                          </div>
                        </td>
                        <td>{p.marca?.nombre || <span className={styles.textMuted}>-</span>}</td>
                        <td>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <span className={styles.naturalezaBadge}>{p.naturaleza || 'Genérico'}</span>
                            {p.tipo_producto === 'COMBO' && (
                              <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#334155', backgroundColor: '#f1f5f9', padding: '0.15rem 0.45rem', borderRadius: '4px', border: '1px solid #e2e8f0', width: 'fit-content' }}>
                                KIT / COMBO ({p.componentes_combo?.length || 0} ítems)
                              </span>
                            )}
                          </div>
                        </td>
                        <td>{p.categoria?.nombre}</td>
                        <td className={styles.precio}>Bs. {Number(p.precio_base).toFixed(2)}</td>
                        <td>
                          {p.atributos && Object.keys(p.atributos).length > 0 ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', fontSize: '0.75rem', color: '#64748b' }}>
                              {Object.entries(p.atributos).map(([k, v]) => <span key={k}><strong>{k}:</strong> {String(v)}</span>)}
                            </div>
                          ) : '-'}
                        </td>
                        <td><span className={`${styles.pill} ${p.activo ? styles.pillGreen : styles.pillRed}`}>{p.activo ? 'Activo' : 'Inactivo'}</span></td>
                        <td>
                          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                            <button className={styles.btnSecondary} style={{ padding: '0.5rem 0.8rem', gap: '0.4rem', fontSize: '0.85rem' }} title="Editar Producto" aria-label={`Editar producto ${p.nombre}`} onClick={() => openEditarProducto(p)}>
                              <Pencil size={15} /> Editar
                            </button>
                            <button className={styles.btnSecondary} style={{ padding: '0.5rem' }} title={p.activo ? 'Desactivar' : 'Activar'} aria-label={p.activo ? `Desactivar producto ${p.nombre}` : `Activar producto ${p.nombre}`} onClick={() => handleToggleActivo(p.id, p.activo)}>
                              {p.activo ? <ToggleRight size={18} color="var(--color-green)" /> : <ToggleLeft size={18} />}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Controles de Paginación */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', borderTop: '1px solid #e2e8f0', color: '#64748b', fontSize: '0.9rem' }}>
                  <span>Mostrando {productos.length} de {totalCount} resultados</span>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <button className={styles.btnSecondary} disabled={page === 1} onClick={() => goToPage(page - 1)} style={{ padding: '0.4rem' }}><ChevronLeft size={16} /></button>
                    <span>Página {page} de {totalPages}</span>
                    <button className={styles.btnSecondary} disabled={page >= totalPages} onClick={() => goToPage(page + 1)} style={{ padding: '0.4rem' }}><ChevronRight size={16} /></button>
                  </div>
                </div>
              </>
            )}
          </div>
        </section>
      ) : (
        <MarcasPanel />
      )}
    </div>
  );
}

export default function CatalogoPage() {
  return (
    <Suspense fallback={<div className={styles.loadingCenter}><Loader2 className={styles.spin} size={32} color="#64748b" /></div>}>
      <CatalogoContent />
    </Suspense>
  );
}
