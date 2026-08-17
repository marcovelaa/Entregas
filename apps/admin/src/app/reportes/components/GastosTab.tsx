import React, { useState, useEffect } from 'react';
import { api } from '../../../lib/axios';
import { Plus, Trash2, Calendar, DollarSign, PackageSearch } from 'lucide-react';
import styles from '../page.module.css';
import modalStyles from '../../../styles/modal.module.css';

interface GastoData {
  id: string;
  categoria: string;
  descripcion: string;
  monto: number;
  fecha_gasto: string;
  usuario?: { nombres: string; apellidos: string | null };
}

export default function GastosTab() {
  const [gastos, setGastos] = useState<GastoData[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    categoria: 'OTROS',
    descripcion: '',
    monto: '',
    fecha_gasto: new Date().toISOString().slice(0, 10),
  });

  const fetchGastos = async () => {
    try {
      setLoading(true);
      const res = await api.get('/gastos');
      // Safely extract the array regardless of nesting levels
      const extracted = res.data?.data?.data || res.data?.data || res.data;
      setGastos(Array.isArray(extracted) ? extracted : []);
    } catch (error) {
      console.error(error);
      setGastos([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGastos();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/gastos', formData);
      setShowModal(false);
      setFormData({ categoria: 'OTROS', descripcion: '', monto: '', fecha_gasto: new Date().toISOString().slice(0, 10) });
      fetchGastos();
    } catch (error) {
      alert('Error al guardar gasto');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Seguro que querés eliminar este gasto?')) return;
    try {
      await api.delete(`/gastos/${id}`);
      fetchGastos();
    } catch (error) {
      alert('Error al eliminar');
    }
  };

  if (loading && gastos.length === 0) return <div>Cargando gastos...</div>;

  return (
    <div style={{ padding: '1rem 0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.25rem', color: '#0f172a' }}>Registro de Gastos Operativos</h2>
        <button 
          onClick={() => setShowModal(true)}
          style={{ background: '#0f172a', color: 'white', border: 'none', padding: '0.5rem 1rem', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
        >
          <Plus size={16} /> Nuevo Gasto Manual
        </button>
      </div>

      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Categoría</th>
              <th>Descripción</th>
              <th>Registrado Por</th>
              <th style={{ textAlign: 'right' }}>Monto (Bs)</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {gastos.length === 0 && (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>No hay gastos registrados aún.</td>
              </tr>
            )}
            {gastos.map(g => (
              <tr key={g.id}>
                <td>{new Date(g.fecha_gasto).toLocaleDateString()}</td>
                <td>
                  <span style={{ 
                    backgroundColor: g.categoria === 'LOGISTICA' ? '#dbeafe' : '#f1f5f9',
                    color: g.categoria === 'LOGISTICA' ? '#1e40af' : '#475569',
                    padding: '0.25rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600
                  }}>
                    {g.categoria}
                  </span>
                </td>
                <td style={{ color: g.descripcion.includes('Delivery subsidiado') ? '#0284c7' : 'inherit' }}>
                  {g.descripcion}
                </td>
                <td>{g.usuario ? `${g.usuario.nombres} ${g.usuario.apellidos || ''}` : 'Sistema'}</td>
                <td style={{ textAlign: 'right', fontWeight: 600 }}>Bs. {g.monto.toFixed(2)}</td>
                <td>
                  <button onClick={() => handleDelete(g.id)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}>
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className={modalStyles.modalOverlay}>
          <div className={modalStyles.modalContent}>
            <h3 className={modalStyles.modalHeader}>Registrar Nuevo Gasto</h3>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: '#475569' }}>Categoría</label>
                <select 
                  value={formData.categoria} 
                  onChange={e => setFormData({...formData, categoria: e.target.value})}
                  className={modalStyles.formInput}
                  style={{ marginBottom: 0 }}
                >
                  <option value="ALQUILER">Alquiler</option>
                  <option value="SERVICIOS">Servicios (Luz, Agua, Internet)</option>
                  <option value="SUELDOS">Sueldos / Jornales</option>
                  <option value="MARKETING">Marketing / Publicidad</option>
                  <option value="LOGISTICA">Logística / Delivery</option>
                  <option value="OTROS">Otros Gastos</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: '#475569' }}>Descripción</label>
                <input 
                  type="text" 
                  required
                  value={formData.descripcion}
                  onChange={e => setFormData({...formData, descripcion: e.target.value})}
                  className={modalStyles.formInput}
                  style={{ marginBottom: 0 }}
                  placeholder="Ej. Pago de Luz Agosto"
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: '#475569' }}>Monto (Bs)</label>
                <input 
                  type="number" 
                  step="0.1"
                  required
                  value={formData.monto}
                  onChange={e => setFormData({...formData, monto: e.target.value})}
                  className={modalStyles.formInput}
                  style={{ marginBottom: 0 }}
                  placeholder="Ej. 150.00"
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: '#475569' }}>Fecha</label>
                <input 
                  type="date" 
                  required
                  value={formData.fecha_gasto}
                  onChange={e => setFormData({...formData, fecha_gasto: e.target.value})}
                  className={modalStyles.formInput}
                  style={{ marginBottom: 0 }}
                />
              </div>
              <div className={modalStyles.btnGroup} style={{ marginTop: '1rem' }}>
                <button type="button" onClick={() => setShowModal(false)} className={modalStyles.btnCancel}>Cancelar</button>
                <button type="submit" className={modalStyles.btnSubmit}>Guardar Gasto</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
