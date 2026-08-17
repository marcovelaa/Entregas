'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { Plus, Loader2, Pencil, Search, ToggleLeft, ToggleRight, Tag, Trash2 } from 'lucide-react';
import { Modal } from '../../../components/molecules/Modal/Modal';
import styles from '../page.module.css';
import { api } from '../../../lib/axios';
import { Marca } from '../types';
import { slugify, emptyMarca } from '../utils';

export default function MarcasPanel() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [marcas, setMarcas] = useState<Marca[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(() => searchParams.get('q') || '');
  const [error, setError] = useState<string | null>(null);

  const [panelOpen, setPanelOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'crear' | 'editar'>('crear');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ ...emptyMarca });
  const [submitting, setSubmitting] = useState(false);

  const fetchAll = useCallback(async (signal?: AbortSignal) => {
    setLoading(true); setError(null);
    try {
      const res = await api.get('/marcas', { signal });
      setMarcas(Array.isArray(res.data) ? res.data : res.data.data || []);
    } catch (err: any) {
      if (axios.isCancel(err) || err?.name === 'CanceledError' || err?.name === 'AbortError') return;
      setError('Error al cargar marcas.');
    } finally { setLoading(false); }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    fetchAll(controller.signal);
    return () => controller.abort();
  }, [fetchAll]);

  function openCrear() {
    setModalMode('crear'); setEditingId(null);
    setForm({ ...emptyMarca }); setPanelOpen(true);
  }

  function openEditar(item: Marca) {
    setModalMode('editar'); setEditingId(item.id);
    setForm({ nombre: item.nombre, slug: item.slug, descripcion: item.descripcion || '' });
    setPanelOpen(true);
  }

  async function handleToggleActivo(id: string, activo: boolean) {
    try { await api.patch(`/marcas/${id}`, { activo: !activo }); fetchAll(); } 
    catch (err: any) { alert('Error al actualizar estado'); }
  }



  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setSubmitting(true);
    try {
      const payload = { ...form, slug: form.slug || slugify(form.nombre) };
      if (modalMode === 'crear') await api.post('/marcas', payload);
      else await api.patch(`/marcas/${editingId}`, payload);
      setPanelOpen(false); fetchAll();
    } catch (err: any) { alert('Error al guardar'); } 
    finally { setSubmitting(false); }
  }

  const filtered = marcas.filter(m => m.nombre.toLowerCase().includes(search.toLowerCase()));

  // Sync search to the URL (shareable link) without gating the instant local filter above
  const isFirstRun = useRef(true);
  useEffect(() => {
    if (isFirstRun.current) {
      isFirstRun.current = false;
      return;
    }
    const timer = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      if (search) params.set('q', search); else params.delete('q');
      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    }, 500);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  return (
    <>
      {error && (
        <div className={styles.errorBanner}>
          <span>⚠️ {error}</span><button onClick={() => setError(null)} className={styles.errorClose}>✕</button>
        </div>
      )}

      <section className={styles.card} style={{ marginTop: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.5rem', borderBottom: '1px solid var(--border-color, #e2e8f0)' }}>
          <div className={styles.searchWrapper} style={{ width: '100%', maxWidth: '350px' }}>
            <Search size={16} className={styles.searchIcon} />
            <input type="text" className={styles.searchInput} placeholder="Buscar marca..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <button className={styles.btnPrimary} onClick={openCrear}>
            <Plus size={16} strokeWidth={1.5} /> Nueva Marca
          </button>
        </div>
        <div className={styles.tableWrapper}>
          {loading ? (
            <div className={styles.loadingCenter}><Loader2 className={styles.spin} size={32} color="var(--color-blue)" /><p>Cargando marcas...</p></div>
          ) : (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Nombre y Slug</th>
                  <th>Descripción</th>
                  <th>Estado</th>
                  <th style={{ textAlign: 'right' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={4} className={styles.emptyCell}>No hay marcas.</td></tr>
                ) : filtered.map(m => (
                  <tr key={m.id}>
                    <td>
                      <div className={styles.productInfo}>
                        <div className={styles.productIcon}><Tag size={20} /></div>
                        <div>
                          <div className={styles.productName}>{m.nombre}</div>
                          <div className={styles.skuLine}>Slug: <code className={styles.sku}>{m.slug}</code></div>
                        </div>
                      </div>
                    </td>
                    <td><span className={styles.textMuted}>{m.descripcion || '-'}</span></td>
                    <td>
                      <span className={`${styles.pill} ${m.activo ? styles.pillGreen : styles.pillRed}`}>{m.activo ? 'Activa' : 'Inactiva'}</span>
                    </td>
                    <td>
                      <div className={styles.actionsCell}>
                        <button className={styles.btnAction} title="Editar" aria-label={`Editar marca ${m.nombre}`} onClick={() => openEditar(m)}><Pencil size={18} /></button>
                        <button className={`${styles.btnAction} ${styles.btnToggle}`} title={m.activo ? 'Desactivar' : 'Activar'} aria-label={m.activo ? `Desactivar marca ${m.nombre}` : `Activar marca ${m.nombre}`} onClick={() => handleToggleActivo(m.id, m.activo)}>
                          {m.activo ? <ToggleRight size={20} color="var(--color-green)" /> : <ToggleLeft size={20} color="var(--text-muted)" />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>

      <Modal isOpen={panelOpen} onClose={() => setPanelOpen(false)} title={modalMode === 'crear' ? 'Nueva Marca' : 'Editar Marca'}>
        <form onSubmit={handleSubmit} className={styles.slideForm}>
          <div className={styles.formSection}>
            <div className={styles.formGroup}>
              <label className={styles.formLabel} htmlFor="marca-nombre">Nombre *</label>
              <input id="marca-nombre" required className={styles.formInput} value={form.nombre} onChange={e => setForm(f => ({ ...f, nombre: e.target.value, slug: slugify(e.target.value) }))} />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel} htmlFor="marca-slug">Slug (URL friendly)</label>
              <input id="marca-slug" className={styles.formInput} value={form.slug} onChange={e => setForm(f => ({ ...f, slug: e.target.value }))} />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel} htmlFor="marca-descripcion">Descripción</label>
              <textarea id="marca-descripcion" className={styles.formTextarea} value={form.descripcion} onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))} rows={3} />
            </div>
          </div>
          <div className={styles.formFooter} style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
            <button type="button" className={styles.btnCancel} onClick={() => setPanelOpen(false)} disabled={submitting}>Cancelar</button>
            <button type="submit" className={styles.btnPrimary} disabled={submitting}>{submitting ? 'Guardando...' : 'Guardar'}</button>
          </div>
        </form>
      </Modal>
    </>
  );
}
