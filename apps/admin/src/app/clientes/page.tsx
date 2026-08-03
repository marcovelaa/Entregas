'use client';
import React, { useState, useEffect } from 'react';
import { Loader2, Plus, Users, Search, Edit2, Power } from 'lucide-react';
import { api } from '../../lib/axios';
import { Modal } from '../../components/molecules/Modal/Modal';
import styles from '../catalogo/page.module.css';

export default function ClientesPage() {
  const [clientes, setClientes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCliente, setEditingCliente] = useState<any>(null);
  
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
    try {
      const payload = { nombres, apellidos, documento_id: documentoId, telefono, email, direccion };
      if (editingCliente) {
        await api.put(`/clientes/${editingCliente.id}`, payload);
      } else {
        await api.post('/clientes', payload);
      }
      setIsModalOpen(false);
      fetchClientes();
    } catch (error) {
      console.error('Error saving cliente:', error);
    }
  };

  const toggleStatus = async (cliente: any) => {
    try {
      await api.put(`/clientes/${cliente.id}`, { activo: !cliente.activo });
      fetchClientes();
    } catch (error) {
      console.error('Error toggling status:', error);
    }
  };

  return (
    <div className={styles.pageContainer}>
      <header className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Clientes</h1>
          <p className={styles.pageDescription}>Gestiona tu base de clientes.</p>
        </div>
      </header>

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
        <button className={styles.btnPrimary} onClick={() => openModal()}>
          <Plus size={18} style={{ marginRight: '0.5rem' }} /> Nuevo Cliente
        </button>
      </div>

      <div className={styles.card}>
        <div className={styles.tableWrapper}>
          {loading ? (
            <div style={{ padding: '3rem', textAlign: 'center' }}>
              <Loader2 className={styles.spin} size={32} style={{ display: 'inline', color: 'var(--color-primary)' }} />
            </div>
          ) : (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Nombres y Apellidos</th>
                  <th>C.I. / NIT</th>
                  <th>Teléfono</th>
                  <th>Dirección</th>
                  <th>Estado</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {clientes.length === 0 ? (
                  <tr><td colSpan={6} style={{ textAlign: 'center', padding: '2rem' }}>No hay clientes registrados.</td></tr>
                ) : clientes.map(c => (
                  <tr key={c.id}>
                    <td style={{ fontWeight: 600 }}>{c.nombres} {c.apellidos}</td>
                    <td>{c.documento_id || '-'}</td>
                    <td>{c.telefono || '-'}</td>
                    <td>{c.direccion || '-'}</td>
                    <td>
                      <span className={c.activo ? styles.badgeActive : styles.badgeInactive}>
                        {c.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                        <button className={styles.btnSecondary} style={{ padding: '0.4rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => openModal(c)} title="Editar">
                          <Edit2 size={16} />
                        </button>
                        <button className={c.activo ? styles.btnSecondary : styles.btnPrimary} style={{ padding: '0.4rem', display: 'flex', alignItems: 'center', justifyContent: 'center', color: c.activo ? 'var(--color-red)' : 'var(--color-green)' }} onClick={() => toggleStatus(c)} title={c.activo ? 'Desactivar' : 'Activar'}>
                          <Power size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingCliente ? 'Editar Cliente' : 'Nuevo Cliente'} maxWidth="600px">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Nombres *</label>
              <input className={styles.formInput} value={nombres} onChange={e => setNombres(e.target.value)} />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Apellidos</label>
              <input className={styles.formInput} value={apellidos} onChange={e => setApellidos(e.target.value)} />
            </div>
          </div>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Cédula de Identidad / NIT (Opcional)</label>
            <input className={styles.formInput} value={documentoId} onChange={e => setDocumentoId(e.target.value)} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Teléfono</label>
              <input className={styles.formInput} value={telefono} onChange={e => setTelefono(e.target.value)} />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Email</label>
              <input type="email" className={styles.formInput} value={email} onChange={e => setEmail(e.target.value)} />
            </div>
          </div>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Dirección Física</label>
            <input className={styles.formInput} value={direccion} onChange={e => setDireccion(e.target.value)} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
            <button className={styles.btnPrimary} onClick={saveCliente} disabled={!nombres}>Guardar</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
