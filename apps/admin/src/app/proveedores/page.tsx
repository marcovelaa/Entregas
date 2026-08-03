'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { Loader2, Plus, Pencil, ToggleLeft, ToggleRight, Building2, Phone, MapPin, Mail, Truck } from 'lucide-react';
import { api } from '../../lib/axios';
import { Modal } from '../../components/molecules/Modal/Modal';
import styles from '../catalogo/page.module.css'; // Reusing catalog styles for consistency

interface Proveedor {
  id: string;
  nombre: string;
  contacto?: string;
  telefono?: string;
  direccion?: string;
  email?: string;
  activo: boolean;
}

export default function ProveedoresPage() {
  const [proveedores, setProveedores] = useState<Proveedor[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editingItem, setEditingItem] = useState<Proveedor | null>(null);
  
  // Form state
  const [form, setForm] = useState({
    nombre: '',
    contacto: '',
    telefono: '',
    direccion: '',
    email: '',
  });

  const fetchProveedores = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/proveedores?limit=100');
      setProveedores(res.data.data);
    } catch (err) {
      console.error('Error fetching proveedores:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProveedores();
  }, [fetchProveedores]);

  function openNew() {
    setEditingItem(null);
    setForm({ nombre: '', contacto: '', telefono: '', direccion: '', email: '' });
    setIsModalOpen(true);
  }

  function openEdit(item: Proveedor) {
    setEditingItem(item);
    setForm({
      nombre: item.nombre,
      contacto: item.contacto || '',
      telefono: item.telefono || '',
      direccion: item.direccion || '',
      email: item.email || '',
    });
    setIsModalOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editingItem) {
        await api.patch(`/proveedores/${editingItem.id}`, form);
      } else {
        await api.post('/proveedores', form);
      }
      setIsModalOpen(false);
      fetchProveedores();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error al guardar');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleToggleActivo(id: string, activo: boolean) {
    try {
      await api.patch(`/proveedores/${id}`, { activo: !activo });
      fetchProveedores();
    } catch (err) {
      alert('Error al actualizar estado');
    }
  }

  return (
    <div className={styles.container}>
      <header className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            Proveedores
          </h1>
          <p className={styles.pageSubtitle}>Directorio de proveedores y contactos</p>
        </div>
      </header>

      <main className={styles.main}>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '0.75rem' }}>
          <button className={styles.btnPrimary} onClick={openNew}>
            <Plus size={16} strokeWidth={1.5} /> Nuevo Proveedor
          </button>
        </div>
        <div className={styles.card}>
          <div className={styles.tableWrapper}>
          {loading ? (
            <div className={styles.loadingCenter}><Loader2 className={styles.spin} size={24} /></div>
          ) : (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Proveedor</th>
                  <th>Contacto</th>
                  <th>Ubicación / Email</th>
                  <th>Estado</th>
                  <th style={{ textAlign: 'right' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {proveedores.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                      No hay proveedores registrados aún.
                    </td>
                  </tr>
                ) : (
                  proveedores.map(p => (
                    <tr key={p.id} style={{ opacity: p.activo ? 1 : 0.6 }}>
                      <td>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <Building2 size={16} color="var(--text-muted)" /> {p.nombre}
                        </div>
                      </td>
                      <td>
                        {p.contacto && <div style={{ fontSize: '0.9rem' }}>{p.contacto}</div>}
                        {p.telefono && <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}><Phone size={12}/> {p.telefono}</div>}
                        {!p.contacto && !p.telefono && <span style={{ color: 'var(--text-muted)' }}>-</span>}
                      </td>
                      <td>
                        {p.email && <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}><Mail size={12}/> {p.email}</div>}
                        {p.direccion && <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}><MapPin size={12}/> {p.direccion}</div>}
                        {!p.email && !p.direccion && <span style={{ color: 'var(--text-muted)' }}>-</span>}
                      </td>
                      <td>
                        {p.activo ? (
                          <span className={styles.statusActive}>Activo</span>
                        ) : (
                          <span className={styles.statusInactive}>Inactivo</span>
                        )}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                          <button className={styles.btnSecondary} style={{ padding: '0.4rem' }} title="Editar" onClick={() => openEdit(p)}>
                            <Pencil size={16} />
                          </button>
                          <button className={styles.btnSecondary} style={{ padding: '0.4rem' }} title="Activar/Desactivar" onClick={() => handleToggleActivo(p.id, p.activo)}>
                            {p.activo ? <ToggleRight size={16} color="var(--color-green)" /> : <ToggleLeft size={16} />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
        </div>
      </main>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingItem ? 'Editar Proveedor' : 'Nuevo Proveedor'}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Razón Social o Nombre *</label>
            <input required className={styles.formInput} placeholder="Ej. Papelería Central SRL" value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })} autoFocus />
          </div>

          <div style={{ display: 'flex', gap: '1rem' }}>
            <div className={styles.formGroup} style={{ flex: 1 }}>
              <label className={styles.formLabel}>Persona de Contacto</label>
              <input className={styles.formInput} placeholder="Ej. Juan Pérez" value={form.contacto} onChange={e => setForm({ ...form, contacto: e.target.value })} />
            </div>
            <div className={styles.formGroup} style={{ flex: 1 }}>
              <label className={styles.formLabel}>Teléfono / WhatsApp</label>
              <input className={styles.formInput} placeholder="Ej. 70012345" value={form.telefono} onChange={e => setForm({ ...form, telefono: e.target.value })} />
            </div>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Correo Electrónico</label>
            <input type="email" className={styles.formInput} placeholder="Ej. ventas@papeleriacentral.com" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Dirección</label>
            <textarea className={styles.formInput} placeholder="Ej. Av. Blanco Galindo Km 3..." value={form.direccion} onChange={e => setForm({ ...form, direccion: e.target.value })} rows={2} style={{ resize: 'vertical' }} />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
            <button type="button" className={styles.btnSecondary} onClick={() => setIsModalOpen(false)}>Cancelar</button>
            <button type="submit" className={styles.btnPrimary} disabled={submitting || !form.nombre.trim()}>
              {submitting ? <Loader2 size={16} className={styles.spin} /> : 'Guardar Proveedor'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
