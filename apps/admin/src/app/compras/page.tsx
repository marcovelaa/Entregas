'use client';

import React, { useState, useEffect } from 'react';
import { Loader2, Plus, Eye, Ban } from 'lucide-react';
import { api } from '../../lib/axios';
import Link from 'next/link';
import CompraDetalleModal from './components/CompraDetalleModal';
import { Modal } from '../../components/molecules/Modal/Modal';
import styles from './page.module.css';

export default function ComprasPage() {
  const [compras, setCompras] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCompraId, setSelectedCompraId] = useState<string | null>(null);

  // Anular state
  const [compraAnularId, setCompraAnularId] = useState<string | null>(null);
  const [motivoAnulacion, setMotivoAnulacion] = useState('');
  const [submittingAnular, setSubmittingAnular] = useState(false);

  const fetchCompras = async () => {
    setLoading(true);
    try {
      const res = await api.get('/compras');
      setCompras(res.data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompras();
  }, []);

  const handleAnular = async () => {
    if (!compraAnularId || !motivoAnulacion.trim()) return;
    setSubmittingAnular(true);
    try {
      await api.patch(`/compras/${compraAnularId}/anular`, { motivo: motivoAnulacion });
      setCompraAnularId(null);
      setMotivoAnulacion('');
      fetchCompras(); // Refresh list to see the updated state
    } catch (err) {
      console.error('Error al anular la compra:', err);
      alert('No se pudo anular la compra. Verificá si la compra ya fue anulada o si tenés permisos.');
    } finally {
      setSubmittingAnular(false);
    }
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            Registro de Compras
          </h1>
          <p className={styles.subtitle}>Historial de compras e ingresos de inventario</p>
        </div>
        <div>
          <Link href="/compras/nueva" className={styles.btnPrimary} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none' }}>
            <Plus size={16} strokeWidth={1.5} /> Nueva Compra
          </Link>
        </div>
      </header>
      
      <main>
        <div className={styles.tableWrapper}>
          {loading ? (
            <div className={styles.loadingCenter}>
              <Loader2 className={styles.spin} size={24} />
            </div>
          ) : (
            <table className={styles.table}>
                <thead>
                  <tr>
                    <th>ID Compra</th>
                    <th>Fecha</th>
                    <th>Usuario</th>
                    <th>Proveedor</th>
                    <th>Total</th>
                    <th>Estado</th>
                    <th style={{ textAlign: 'right' }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {compras.length === 0 ? (
                    <tr>
                      <td colSpan={7} style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
                        No hay compras registradas.
                      </td>
                    </tr>
                  ) : (
                    compras.map(compra => (
                      <tr key={compra.id}>
                        <td className={styles.productName}>#{compra.id}</td>
                        <td>{new Date(compra.creado_en).toLocaleDateString()}</td>
                        <td style={{ color: '#475569', fontSize: '0.85rem' }}>
                          {compra.usuario ? `${compra.usuario.nombres} ${compra.usuario.apellidos || ''}` : 'Sistema'}
                        </td>
                        <td>{compra.proveedor?.nombre || 'Sin Proveedor'}</td>
                        <td className={styles.precio}>Bs. {compra.total.toFixed(2)}</td>
                        <td>
                          <span style={{ color: compra.estado === 'ANULADO' ? '#ef4444' : '#334155', fontWeight: 600 }}>
                            {compra.estado}
                          </span>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'flex-end', alignItems: 'center' }}>
                            <button 
                              className={styles.btnGhost} 
                              onClick={() => setSelectedCompraId(compra.id)}
                              title="Ver Detalle"
                            >
                              <Eye size={18} strokeWidth={1.5} />
                            </button>
                            {compra.estado !== 'ANULADO' && compra.estado !== 'CANCELADA' && (
                              <button 
                                className={styles.btnGhost} 
                                onClick={() => {
                                  setCompraAnularId(compra.id);
                                  setMotivoAnulacion('');
                                }}
                                title="Anular Compra"
                                style={{ color: '#ef4444' }}
                              >
                                <Ban size={18} strokeWidth={1.5} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}
        </div>
      </main>

      <CompraDetalleModal
        isOpen={!!selectedCompraId}
        onClose={() => setSelectedCompraId(null)}
        compraId={selectedCompraId}
      />

      {/* Modal para anular compra */}
      <Modal
        isOpen={!!compraAnularId}
        onClose={() => {
          if (!submittingAnular) {
            setCompraAnularId(null);
            setMotivoAnulacion('');
          }
        }}
        title="Anular Compra"
      >
        <div style={{ padding: '1rem 0' }}>
          <p style={{ color: '#475569', fontSize: '0.9rem', marginBottom: '1.5rem', lineHeight: 1.5 }}>
            Estás a punto de anular la compra <strong>#{compraAnularId}</strong>. Esta acción devolverá los productos afectados y revertirá el ingreso al inventario. Es obligatorio dejar un motivo de anulación para la auditoría.
          </p>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#0f172a' }}>Motivo de la anulación:</label>
            <textarea
              value={motivoAnulacion}
              onChange={(e) => setMotivoAnulacion(e.target.value)}
              placeholder="Ej: Error en la cantidad recibida, productos dañados..."
              rows={4}
              style={{
                width: '100%',
                padding: '0.75rem',
                borderRadius: '6px',
                border: '1px solid #cbd5e1',
                fontSize: '0.9rem',
                fontFamily: 'inherit',
                resize: 'none'
              }}
              disabled={submittingAnular}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem' }}>
            <button 
              onClick={() => setCompraAnularId(null)}
              style={{ 
                padding: '0.6rem 1.2rem', 
                background: 'transparent', 
                border: '1px solid #cbd5e1', 
                borderRadius: '6px',
                color: '#475569',
                cursor: 'pointer',
                fontWeight: 500
              }}
              disabled={submittingAnular}
            >
              Cancelar
            </button>
            <button 
              onClick={handleAnular}
              disabled={!motivoAnulacion.trim() || submittingAnular}
              style={{ 
                padding: '0.6rem 1.2rem', 
                background: '#ef4444', 
                border: 'none', 
                borderRadius: '6px',
                color: 'white',
                cursor: !motivoAnulacion.trim() || submittingAnular ? 'not-allowed' : 'pointer',
                opacity: !motivoAnulacion.trim() || submittingAnular ? 0.7 : 1,
                fontWeight: 500,
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              {submittingAnular ? <Loader2 className={styles.spin} size={16} /> : <Ban size={16} />}
              Confirmar Anulación
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
