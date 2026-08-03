'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Loader2, Pencil, Search, ToggleLeft, ToggleRight, Tag, Trash2 } from 'lucide-react';
import { Modal } from '../../../components/molecules/Modal/Modal';
import styles from '../page.module.css';
import { api } from '../../../lib/axios';
import { Marca } from '../types';
import { slugify, emptyMarca } from '../utils';

export default function MarcasPanel() {
  const [marcas, setMarcas] = useState<Marca[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [error, setError] = useState<string | null>(null);

  const [panelOpen, setPanelOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'crear' | 'editar'>('crear');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ ...emptyMarca });
  const [submitting, setSubmitting] = useState(false);

  const fetchAll = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const res = await api.get('/marcas');
      setMarcas(Array.isArray(res.data) ? res.data : res.data.data || []);
    } catch (err: any) { setError('Error al cargar marcas.'); } 
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

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
                        <button className={styles.btnAction} title="Editar" onClick={() => openEditar(m)}><Pencil size={18} /></button>
                        <button className={`${styles.btnAction} ${styles.btnToggle}`} title={m.activo ? 'Desactivar' : 'Activar'} onClick={() => handleToggleActivo(m.id, m.activo)}>
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
              <label className={styles.formLabel}>Nombre *</label>
              <input required className={styles.formInput} value={form.nombre} onChange={e => setForm(f => ({ ...f, nombre: e.target.value, slug: slugify(e.target.value) }))} />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Slug (URL friendly)</label>
              <input className={styles.formInput} value={form.slug} onChange={e => setForm(f => ({ ...f, slug: e.target.value }))} />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Descripción</label>
              <textarea className={styles.formTextarea} value={form.descripcion} onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))} rows={3} />
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
