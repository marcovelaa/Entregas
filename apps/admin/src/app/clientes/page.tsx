'use client';
import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Search, Edit, ToggleLeft, ToggleRight, Users, X, AlertCircle } from 'lucide-react';
import { api } from '../../lib/axios';
import { Modal } from '../../components/molecules/Modal/Modal';
import styles from './page.module.css';

export default function ClientesPage() {
  const [clientes, setClientes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTabFilter, setActiveTabFilter] = useState<'todos' | 'activos' | 'inactivos'>('todos');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCliente, setEditingCliente] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  
  const [nombres, setNombres] = useState('');
  const [apellidos, setApellidos] = useState('');
  const [documentoId, setDocumentoId] = useState('');
  const [telefono, setTelefono] = useState('');
  const [email, setEmail] = useState('');
  const [direccion, setDireccion] = useState('');

  useEffect(() => {
    fetchClientes();
  }, []);

  const fetchClientes = async () => {
    setLoading(true);
    try {
      const res = await api.get('/clientes');
      setClientes(res.data.data || []);
    } catch (error) {
      console.error('Error fetching clientes:', error);
    } finally {
      setLoading(false);
    }
  };

  const openModal = (cliente?: any) => {
    setEditingCliente(cliente || null);
    setNombres(cliente?.nombres || '');
    setApellidos(cliente?.apellidos || '');
    setDocumentoId(cliente?.documento_id || '');
    setTelefono(cliente?.telefono || '');
    setEmail(cliente?.email || '');
    setDireccion(cliente?.direccion || '');
    setIsModalOpen(true);
  };

  const saveCliente = async () => {
    if (!nombres.trim()) return;
    setSaving(true);
    try {
      const payload = {
        nombres: nombres.trim(),
        apellidos: apellidos.trim() || undefined,
        documento_id: documentoId.trim() || undefined,
        telefono: telefono.trim() || undefined,
        email: email.trim() || undefined,
        direccion: direccion.trim() || undefined,
      };
      if (editingCliente) {
        await api.put(`/clientes/${editingCliente.id}`, payload);
      } else {
        await api.post('/clientes', payload);
      }
      setIsModalOpen(false);
      fetchClientes();
    } catch (error: any) {
      console.error('Error saving cliente:', error);
      const msg = error.response?.data?.message;
      alert(Array.isArray(msg) ? msg.join(', ') : (msg || 'Error al guardar el cliente'));
    } finally {
      setSaving(false);
    }
  };

  const toggleStatus = async (cliente: any) => {
    try {
      await api.put(`/clientes/${cliente.id}`, { activo: !cliente.activo });
      setClientes(prev => prev.map(c => c.id === cliente.id ? { ...c, activo: !c.activo } : c));
    } catch (error) {
      console.error('Error toggling status:', error);
      fetchClientes();
    }
  };

  const filteredClientes = useMemo(() => {
    return clientes.filter((c) => {
      const matchesFilter =
        activeTabFilter === 'todos' ||
        (activeTabFilter === 'activos' && c.activo) ||
        (activeTabFilter === 'inactivos' && !c.activo);

      if (!matchesFilter) return false;

      if (!searchTerm.trim()) return true;
      const term = searchTerm.toLowerCase();
      const fullName = `${c.nombres || ''} ${c.apellidos || ''}`.toLowerCase();
      const doc = (c.documento_id || '').toLowerCase();
      const tel = (c.telefono || '').toLowerCase();
      const mail = (c.email || '').toLowerCase();

      return fullName.includes(term) || doc.includes(term) || tel.includes(term) || mail.includes(term);
    });
  }, [clientes, activeTabFilter, searchTerm]);

  return (
    <main className={styles.main}>
      {/* Header */}
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Clientes</h1>
          <p className={styles.subtitle}>Gestiona tu base de clientes y cuentas registradas.</p>
        </div>
        <button className={styles.primaryBtn} onClick={() => openModal()}>
          <Plus size={18} /> Nuevo Cliente
        </button>
      </header>

      {/* Main Card */}
      <section className={styles.card}>
        {/* Filter Sub-Tabs and Search */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.75rem' }}>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {(['todos', 'activos', 'inactivos'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTabFilter(tab)}
                style={{
                  border: 'none',
                  background: activeTabFilter === tab ? '#f1f5f9' : 'transparent',
                  color: activeTabFilter === tab ? '#0f172a' : '#64748b',
                  padding: '0.4rem 0.8rem',
                  borderRadius: '6px',
                  fontSize: '0.85rem',
                  fontWeight: activeTabFilter === tab ? 700 : 500,
                  cursor: 'pointer',
                  textTransform: 'capitalize',
                }}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className={styles.searchBar} style={{ margin: 0 }}>
            <Search size={16} color="#94a3b8" />
            <input
              type="text"
              placeholder="Buscar por nombre, CI/NIT, teléfono..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={styles.searchInput}
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#94a3b8', padding: 0 }}
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        {/* Table / Skeleton */}
        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Cliente</th>
                <th>C.I. / NIT</th>
                <th>Teléfono</th>
                <th>Email</th>
                <th>Dirección</th>
                <th>Estado</th>
                <th style={{ textAlign: 'right' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, idx) => (
                  <tr key={`skeleton-${idx}`}>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <div className={`${styles.skeleton} ${styles.skeletonText}`} style={{ width: '140px' }} />
                        <div className={`${styles.skeleton} ${styles.skeletonText}`} style={{ width: '90px', height: '11px' }} />
                      </div>
                    </td>
                    <td>
                      <div className={`${styles.skeleton} ${styles.skeletonText}`} style={{ width: '85px' }} />
                    </td>
                    <td>
                      <div className={`${styles.skeleton} ${styles.skeletonText}`} style={{ width: '95px' }} />
                    </td>
                    <td>
                      <div className={`${styles.skeleton} ${styles.skeletonText}`} style={{ width: '130px' }} />
                    </td>
                    <td>
                      <div className={`${styles.skeleton} ${styles.skeletonText}`} style={{ width: '110px' }} />
                    </td>
                    <td>
                      <div className={`${styles.skeleton} ${styles.skeletonBadge}`} />
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'flex-end' }}>
                        <div className={`${styles.skeleton} ${styles.skeletonBtn}`} />
                        <div className={`${styles.skeleton} ${styles.skeletonBtn}`} />
                      </div>
                    </td>
                  </tr>
                ))
              ) : filteredClientes.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
                    <Users size={32} color="#94a3b8" style={{ margin: '0 auto 0.5rem', display: 'block' }} />
                    <p style={{ fontWeight: 600, margin: '0 0 0.25rem 0', color: '#0f172a' }}>No se encontraron clientes</p>
                    <p style={{ fontSize: '0.8rem', margin: 0 }}>
                      {searchTerm ? 'Intenta con otro término de búsqueda.' : 'Registra un nuevo cliente para comenzar.'}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredClientes.map((c) => (
                  <tr key={c.id}>
                    <td>
                      <div style={{ fontWeight: 600, color: '#0f172a' }}>
                        {c.nombres} {c.apellidos || ''}
                      </div>
                    </td>
                    <td>
                      <span style={{ color: c.documento_id ? '#0f172a' : '#94a3b8', fontSize: '0.85rem' }}>
                        {c.documento_id || '—'}
                      </span>
                    </td>
                    <td>
                      <span style={{ color: c.telefono ? '#0f172a' : '#94a3b8', fontSize: '0.85rem' }}>
                        {c.telefono || '—'}
                      </span>
                    </td>
                    <td>
                      <span style={{ color: c.email ? '#334155' : '#94a3b8', fontSize: '0.85rem' }}>
                        {c.email || '—'}
                      </span>
                    </td>
                    <td>
                      <span style={{ color: c.direccion ? '#334155' : '#94a3b8', fontSize: '0.85rem' }}>
                        {c.direccion || '—'}
                      </span>
                    </td>
                    <td>
                      <span className={`${styles.statusPill} ${c.activo ? styles.statusActive : styles.statusInactive}`}>
                        {c.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'flex-end', alignItems: 'center' }}>
                        <button
                          onClick={() => openModal(c)}
                          className={styles.actionBtn}
                          style={{ color: '#2563eb' }}
                          title="Editar Cliente"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => toggleStatus(c)}
                          className={`${styles.actionBtn} ${c.activo ? styles.actionBtnActive : styles.actionBtnInactive}`}
                          title={c.activo ? 'Desactivar Cliente' : 'Activar Cliente'}
                        >
                          {c.activo ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingCliente ? 'Editar Cliente' : 'Nuevo Cliente'} maxWidth="560px">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', padding: '0.5rem 0' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Nombres *</label>
              <input
                className={styles.formInput}
                placeholder="Ej. Juan"
                value={nombres}
                onChange={(e) => setNombres(e.target.value)}
                autoFocus
              />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Apellidos</label>
              <input
                className={styles.formInput}
                placeholder="Ej. Pérez"
                value={apellidos}
                onChange={(e) => setApellidos(e.target.value)}
              />
            </div>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Cédula de Identidad / NIT</label>
            <input
              className={styles.formInput}
              placeholder="Ej. 12345678 o NIT"
              value={documentoId}
              onChange={(e) => setDocumentoId(e.target.value)}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Teléfono / Celular</label>
              <input
                className={styles.formInput}
                placeholder="Ej. 77123456"
                value={telefono}
                onChange={(e) => setTelefono(e.target.value)}
              />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Correo Electrónico</label>
              <input
                type="email"
                className={styles.formInput}
                placeholder="cliente@ejemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Dirección Física</label>
            <input
              className={styles.formInput}
              placeholder="Av. Principal #123, Zona Central"
              value={direccion}
              onChange={(e) => setDireccion(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem', borderTop: '1px solid #f1f5f9', paddingTop: '1rem' }}>
            <button
              type="button"
              className={styles.actionBtn}
              style={{ padding: '0.6rem 1rem', border: '1px solid #cbd5e1', borderRadius: '8px', color: '#475569', fontWeight: 600 }}
              onClick={() => setIsModalOpen(false)}
            >
              Cancelar
            </button>
            <button
              type="button"
              className={styles.primaryBtn}
              onClick={saveCliente}
              disabled={!nombres.trim() || saving}
              style={{ opacity: (!nombres.trim() || saving) ? 0.6 : 1 }}
            >
              {saving ? 'Guardando...' : editingCliente ? 'Guardar Cambios' : 'Crear Cliente'}
            </button>
          </div>
        </div>
      </Modal>
    </main>
  );
}
