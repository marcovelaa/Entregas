'use client';
import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Search, Edit, ToggleLeft, ToggleRight, Users, X, AlertCircle, User, CreditCard, Phone, Mail, MapPin, Loader2 } from 'lucide-react';
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
        {/* Toolbar: Filter Sub-Tabs and Search */}
        <div className={styles.toolbar}>
          <div className={styles.filterTabs}>
            {(['todos', 'activos', 'inactivos'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTabFilter(tab)}
                className={`${styles.filterTab} ${activeTabFilter === tab ? styles.filterTabActive : ''}`}
              >
                {tab === 'todos' ? 'Todos' : tab === 'activos' ? 'Activos' : 'Inactivos'}
              </button>
            ))}
          </div>

          <div className={styles.searchWrapper}>
            <Search size={16} className={styles.searchIcon} />
            <input
              type="text"
              placeholder="Buscar cliente, CI/NIT, teléfono..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={styles.searchInput}
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className={styles.clearSearchBtn}
                title="Limpiar búsqueda"
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

      {/* Modal: Nuevo / Editar Cliente */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingCliente ? 'Editar Cliente' : 'Nuevo Cliente'}
        maxWidth="600px"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            saveCliente();
          }}
          className={styles.modalBody}
        >
          {/* Section 1: Personal Info */}
          <div className={styles.sectionHeader}>
            <User size={13} />
            <span>Información Personal</span>
          </div>

          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>
                Nombres <span className={styles.requiredStar}>*</span>
              </label>
              <div className={styles.inputWrapper}>
                <User size={15} className={styles.inputIcon} />
                <input
                  className={styles.formInputWithIcon}
                  placeholder="Ej. Juan Carlos"
                  value={nombres}
                  onChange={(e) => setNombres(e.target.value)}
                  autoFocus
                  required
                />
              </div>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Apellidos</label>
              <div className={styles.inputWrapper}>
                <User size={15} className={styles.inputIcon} />
                <input
                  className={styles.formInputWithIcon}
                  placeholder="Ej. Pérez García"
                  value={apellidos}
                  onChange={(e) => setApellidos(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Section 2: Identification */}
          <div className={styles.sectionHeader}>
            <CreditCard size={13} />
            <span>Identificación & Facturación</span>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Cédula de Identidad / NIT</label>
            <div className={styles.inputWrapper}>
              <CreditCard size={15} className={styles.inputIcon} />
              <input
                className={styles.formInputWithIcon}
                placeholder="Ej. 8472910 o NIT empresarial"
                value={documentoId}
                onChange={(e) => setDocumentoId(e.target.value)}
              />
            </div>
            <span className={styles.helperText}>Utilizado para emisión de comprobantes y facturación.</span>
          </div>

          {/* Section 3: Contact & Location */}
          <div className={styles.sectionHeader}>
            <Phone size={13} />
            <span>Contacto & Ubicación</span>
          </div>

          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Teléfono / WhatsApp</label>
              <div className={styles.inputWrapper}>
                <Phone size={15} className={styles.inputIcon} />
                <input
                  type="tel"
                  className={styles.formInputWithIcon}
                  placeholder="Ej. 77123456"
                  value={telefono}
                  onChange={(e) => setTelefono(e.target.value)}
                />
              </div>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Correo Electrónico</label>
              <div className={styles.inputWrapper}>
                <Mail size={15} className={styles.inputIcon} />
                <input
                  type="email"
                  className={styles.formInputWithIcon}
                  placeholder="cliente@ejemplo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Dirección de Entrega</label>
            <div className={styles.inputWrapper}>
              <MapPin size={15} className={styles.inputIcon} />
              <input
                className={styles.formInputWithIcon}
                placeholder="Av. Principal #123, Edificio Los Pinos"
                value={direccion}
                onChange={(e) => setDireccion(e.target.value)}
              />
            </div>
            <span className={styles.helperText}>Dirección física para envíos y pedidos a domicilio.</span>
          </div>

          {/* Footer Actions */}
          <div className={styles.modalFooter}>
            <button
              type="button"
              className={styles.cancelBtn}
              onClick={() => setIsModalOpen(false)}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className={styles.submitBtn}
              disabled={!nombres.trim() || saving}
            >
              {saving ? (
                <>
                  <Loader2 size={16} className="spin" /> Guardando...
                </>
              ) : editingCliente ? (
                'Guardar Cambios'
              ) : (
                'Registrar Cliente'
              )}
            </button>
          </div>
        </form>
      </Modal>
    </main>
  );
}
