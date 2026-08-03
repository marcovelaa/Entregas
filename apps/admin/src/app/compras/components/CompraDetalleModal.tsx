'use client';
import React, { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { api } from '../../../lib/axios';
import { Modal } from '../../../components/molecules/Modal/Modal';
import styles from '../../catalogo/page.module.css';

export default function CompraDetalleModal({ isOpen, onClose, compraId }: any) {
  const [compra, setCompra] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && compraId) {
      setLoading(true);
      api.get(`/compras/${compraId}`)
        .then(res => setCompra(res.data.data))
        .catch(err => console.error(err))
        .finally(() => setLoading(false));
    }
  }, [isOpen, compraId]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Detalle de Compra #${compraId}`}>
      {loading || !compra ? (
        <div style={{ padding: '2rem', textAlign: 'center' }}><Loader2 className={styles.spin} size={24} style={{ display: 'inline' }} /></div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1.5rem', borderBottom: '1px solid var(--border-light)', paddingBottom: '1.5rem' }}>
            <div>
              <p style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#94a3b8', margin: '0 0 0.2rem 0', fontWeight: 600 }}>Proveedor</p>
              <p style={{ fontWeight: 600, margin: 0, fontSize: '0.95rem' }}>{compra.proveedor?.nombre || 'Sin Proveedor'}</p>
            </div>
            <div>
              <p style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#94a3b8', margin: '0 0 0.2rem 0', fontWeight: 600 }}>Fecha</p>
              <p style={{ fontWeight: 600, margin: 0, fontSize: '0.95rem' }}>{new Date(compra.creado_en).toLocaleDateString('es-BO', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
            </div>
            <div>
              <p style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#94a3b8', margin: '0 0 0.2rem 0', fontWeight: 600 }}>Recibo/Factura</p>
              <p style={{ fontWeight: 600, margin: 0, fontSize: '0.95rem' }}>{compra.numero_recibo || 'N/A'}</p>
            </div>
            <div>
              <p style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#94a3b8', margin: '0 0 0.2rem 0', fontWeight: 600 }}>Total Pagado</p>
              <p style={{ fontWeight: 800, margin: 0, color: '#0f172a', fontSize: '1.1rem' }}>Bs. {Number(compra?.total ?? 0).toFixed(2)}</p>
            </div>
          </div>

          <div>
            <h4 style={{ marginBottom: '1rem', fontWeight: 700, fontSize: '1rem', color: '#0f172a' }}>Detalle de Productos</h4>
            <div style={{ overflowX: 'auto' }}>
              <table className={styles.table} style={{ fontSize: '0.85rem', width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #e2e8f0', color: '#64748b' }}>
                    <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 600 }}>Producto</th>
                    <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 600 }}>Cant.</th>
                    <th style={{ padding: '0.75rem 1rem', textAlign: 'right', fontWeight: 600 }}>Costo Uni.</th>
                    <th style={{ padding: '0.75rem 1rem', textAlign: 'right', fontWeight: 600 }}>Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {compra.detalles.map((d: any) => {
                    const costoUnitario = Number(d.precio_costo ?? d.costo_unitario ?? 0);
                    const subtotal = Number(d.subtotal ?? 0);

                    return (
                      <tr key={d.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '1rem', verticalAlign: 'top' }}>
                          <div style={{ fontWeight: 600, color: '#0f172a', marginBottom: '0.25rem' }}>
                            {d.producto?.nombre}
                            {d.variante ? <span style={{ color: '#64748b', fontWeight: 400 }}> ({d.variante.nombre})</span> : ''}
                            {d.empaque ? <span style={{ color: '#3b82f6', fontSize: '0.8rem', marginLeft: '0.5rem', background: '#eff6ff', padding: '0.1rem 0.4rem', borderRadius: '4px' }}>{d.empaque.nombre}</span> : ''}
                          </div>
                          <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontFamily: 'monospace' }}>SKU: {d.producto?.sku || 'N/A'}</span>
                        </td>
                        <td style={{ padding: '1rem', verticalAlign: 'top' }}>
                          {d.empaque ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                              <div>
                                <span style={{ fontWeight: 700, fontSize: '0.95rem', color: '#0f172a' }}>{d.cantidad}</span> 
                                <span style={{ fontSize: '0.8rem', color: '#64748b', marginLeft: '4px' }}>x {d.empaque.nombre}</span>
                              </div>
                              <div style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: 600 }}>
                                Total: {d.cantidad * (d.empaque.multiplicador_unidades || 1)} unidades
                              </div>
                            </div>
                          ) : (
                            <div>
                              <span style={{ fontWeight: 700, fontSize: '0.95rem', color: '#0f172a' }}>{d.cantidad}</span> 
                              <span style={{ fontSize: '0.8rem', color: '#64748b', marginLeft: '4px' }}>unidades</span>
                            </div>
                          )}
                        </td>
                        <td style={{ padding: '1rem', textAlign: 'right', verticalAlign: 'top', color: '#475569' }}>
                          Bs. {costoUnitario.toFixed(2)}
                        </td>
                        <td style={{ padding: '1rem', textAlign: 'right', verticalAlign: 'top', fontWeight: 700, color: '#0f172a' }}>
                          Bs. {subtotal.toFixed(2)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
}
