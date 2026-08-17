'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { Loader2, Plus, Pencil, ToggleLeft, ToggleRight, Building2, Phone, MapPin, Mail, Search } from 'lucide-react';
import { api } from '../../lib/axios';
import { Modal } from '../../components/molecules/Modal/Modal';
import styles from './page.module.css';

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
  const [searchTerm, setSearchTerm] = useState('');
  
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

  const filteredProveedores = proveedores.filter(p => {
    const term = searchTerm.toLowerCase();
    return (
      p.nombre.toLowerCase().includes(term) ||
      (p.contacto && p.contacto.toLowerCase().includes(term)) ||
      (p.telefono && p.telefono.includes(term))
    );
  });

  return (
    <div className={styles.pageContainer}>
      <header className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Proveedores</h1>
        </div>
      </header>

      <main>
        <div className={styles.controlsWrapper}>
          <div style={{ position: 'relative', width: '380px' }}>
            <Search size={16} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
            <input 
              type="text" 
              placeholder="Buscar por nombre, contacto o teléfono..." 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className={styles.searchInput}
            />
          </div>
          <button className={styles.btnPrimary} onClick={openNew}>
            <Plus size={16} strokeWidth={1.5} /> Nuevo Proveedor
          </button>
        </div>
        <div className={styles.card}>
          <div className={styles.tableWrapper}>
          {loading ? (
            <div style={{ padding: '4rem', textAlign: 'center' }}><Loader2 className={styles.spin} size={40} style={{ display: 'inline', color: '#3b82f6' }} /></div>
          ) : (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Proveedor</th>
                  <th>Contacto</th>
                  <th>Teléfono</th>
                  <th>Email</th>
                  <th>Ubicación</th>
                  <th>Estado</th>
                  <th style={{ textAlign: 'right' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredProveedores.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>
                      No se encontraron proveedores.
                    </td>
                  </tr>
                ) : (
                  filteredProveedores.map(p => (
                    <tr key={p.id} style={{ opacity: p.activo ? 1 : 0.6 }}>
                      <td>
                        <div style={{ fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <Building2 size={16} color="#64748b" /> {p.nombre}
                        </div>
                      </td>
                      <td>
                        {p.contacto ? <span style={{ fontSize: '0.9rem', fontWeight: 600, color: '#334155' }}>{p.contacto}</span> : <span style={{ color: '#cbd5e1' }}>-</span>}
                      </td>
                      <td>
                        {p.telefono ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.9rem', color: '#475569' }}>
                            <Phone size={14}/> {p.telefono}
                          </div>
                        ) : (
                          <span style={{ color: '#cbd5e1' }}>-</span>
                        )}
                      </td>
                      <td>
                        {p.email ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.9rem', color: '#475569' }}>
                            <Mail size={14}/> {p.email}
                          </div>
                        ) : (
                          <span style={{ color: '#cbd5e1' }}>-</span>
                        )}
                      </td>
                      <td>
                        {p.direccion ? (
                          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.4rem', fontSize: '0.85rem', color: '#475569' }}>
                            <MapPin size={14} style={{ marginTop: '0.1rem', flexShrink: 0 }}/> 
                            <span style={{ maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.direccion}</span>
                          </div>
                        ) : (
                          <span style={{ color: '#cbd5e1' }}>-</span>
                        )}
                      </td>
                      <td>
                        <span style={{ color: p.activo ? '#10b981' : '#ef4444', fontWeight: 600, fontSize: '13px' }}>
                          {p.activo ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                          <button className={styles.btnSecondary} title="Editar" onClick={() => openEdit(p)}>
                            <Pencil size={16} />
                          </button>
                          <button className={styles.btnSecondary} title={p.activo ? "Desactivar" : "Activar"} onClick={() => handleToggleActivo(p.id, p.activo)}>
                            {p.activo ? <ToggleRight size={16} color="#10b981" /> : <ToggleLeft size={16} />}
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
