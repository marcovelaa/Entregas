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
        <div id="compra-invoice" style={{ padding: '10px 20px 30px', background: 'white', fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
          
          {/* Header Corporativo */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '30px', borderBottom: '2px solid #0f172a', paddingBottom: '20px' }}>
            <div>
              <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a', margin: '0 0 4px 0', letterSpacing: '-0.5px', textTransform: 'uppercase' }}>Detalle de Compra</h1>
              <p style={{ color: '#64748b', fontSize: '12px', margin: 0, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.5px' }}>DOC Nº <strong style={{ color: '#0f172a' }}>{compraId}</strong></p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '20px', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.5px' }}>ENTREGAS ERP</div>
              <p style={{ color: '#64748b', fontSize: '11px', margin: '4px 0 0 0', fontWeight: 500 }}>NIT: 1234567890</p>
            </div>
          </div>

          {/* Bloques de Datos */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '30px', marginBottom: '40px', background: '#f8fafc', padding: '25px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            <div style={{ flex: '1 1 250px' }}>
              <div style={{ fontSize: '10px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px' }}>Datos del Proveedor</div>
              <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr', gap: '8px', fontSize: '13px', color: '#0f172a' }}>
                <span style={{ color: '#475569', fontWeight: 500 }}>Nombre:</span> <strong>{compra.proveedor?.nombre || 'Sin Proveedor'}</strong>
                <span style={{ color: '#475569', fontWeight: 500 }}>Contacto:</span> <span>{compra.proveedor?.contacto || '—'}</span>
                <span style={{ color: '#475569', fontWeight: 500 }}>Teléfono:</span> <span>{compra.proveedor?.telefono || '—'}</span>
              </div>
            </div>
            
            <div style={{ flex: '1 1 250px' }}>
              <div style={{ fontSize: '10px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px' }}>Datos de la Operación</div>
              <div style={{ display: 'grid', gridTemplateColumns: '100px 1fr', gap: '8px', fontSize: '13px', color: '#0f172a' }}>
                <span style={{ color: '#475569', fontWeight: 500 }}>Fecha:</span> <strong>{new Date(compra.creado_en).toLocaleString()}</strong>
                <span style={{ color: '#475569', fontWeight: 500 }}>Recibo/Fact.:</span> <strong>{compra.numero_recibo || 'N/A'}</strong>
                <span style={{ color: '#475569', fontWeight: 500 }}>Registrado por:</span> <strong>{compra.usuario ? `${compra.usuario.nombres} ${compra.usuario.apellidos || ''}` : 'Sistema'}</strong>
                <span style={{ color: '#475569', fontWeight: 500 }}>Estado:</span> 
                <span style={{ color: compra.estado === 'ANULADO' ? '#ef4444' : '#0f172a', fontWeight: compra.estado === 'ANULADO' ? 700 : 500 }}>
                  {compra.estado}
                </span>
                {compra.estado === 'ANULADO' && compra.notas?.match(/\[ANULADA por (.*?)\]/) && (
                  <>
                    <span style={{ color: '#ef4444', fontWeight: 500 }}>Anulado por:</span> 
                    <strong style={{ color: '#ef4444' }}>{compra.notas.match(/\[ANULADA por (.*?)\]/)[1]}</strong>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Tabla Principal */}
          <div style={{ marginBottom: '40px', overflowX: 'auto' }}>
            <table style={{ width: '100%', minWidth: '500px', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={{ padding: '12px', textAlign: 'left', fontSize: '11px', fontWeight: 600, color: '#ffffff', background: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Producto</th>
                  <th style={{ padding: '12px', textAlign: 'center', fontSize: '11px', fontWeight: 600, color: '#ffffff', background: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Cant. Ingresada</th>
                  <th style={{ padding: '12px', textAlign: 'right', fontSize: '11px', fontWeight: 600, color: '#ffffff', background: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Costo Uni.</th>
                  <th style={{ padding: '12px', textAlign: 'right', fontSize: '11px', fontWeight: 600, color: '#ffffff', background: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {compra.detalles.map((d: any, i: number) => {
                  const costoUnitario = Number(d.precio_costo ?? d.costo_unitario ?? 0);
                  const subtotal = Number(d.subtotal ?? 0);

                  return (
                    <tr key={d.id} style={{ background: i % 2 === 0 ? '#ffffff' : '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                      <td style={{ padding: '12px', fontSize: '13px', color: '#0f172a' }}>
                        <div style={{ fontWeight: 600, marginBottom: '2px' }}>{d.producto?.nombre}</div>
                        {d.variante && <div style={{ color: '#64748b', fontSize: '12px' }}>Var: {d.variante.nombre}</div>}
                        <div style={{ fontSize: '11px', color: '#94a3b8', fontFamily: 'monospace', marginTop: '2px' }}>SKU: {d.producto?.sku || 'N/A'}</div>
                      </td>
                      <td style={{ padding: '12px', fontSize: '13px', color: '#0f172a', textAlign: 'center' }}>
                        {d.empaque ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', alignItems: 'center' }}>
                            <div>
                              <span style={{ fontWeight: 700, fontSize: '13px' }}>{d.cantidad}</span> 
                              <span style={{ fontSize: '12px', color: '#64748b', marginLeft: '4px' }}>x {d.empaque.nombre}</span>
                            </div>
                            {Number(d.empaque.multiplicador_unidades) > 1 && (
                              <div style={{ fontSize: '11px', color: '#10b981', fontWeight: 600, background: '#ecfdf5', padding: '2px 6px', borderRadius: '4px' }}>
                                = {d.cantidad * (d.empaque.multiplicador_unidades || 1)} u. sueltas
                              </div>
                            )}
                          </div>
                        ) : (
                          <div>
                            <span style={{ fontWeight: 700, fontSize: '13px' }}>{d.cantidad}</span> 
                            <span style={{ fontSize: '12px', color: '#64748b', marginLeft: '4px' }}>unidades</span>
                          </div>
                        )}
                      </td>
                      <td style={{ padding: '12px', fontSize: '13px', textAlign: 'right', color: '#475569' }}>
                        Bs. {costoUnitario.toFixed(2)}
                      </td>
                      <td style={{ padding: '12px', fontSize: '13px', textAlign: 'right', fontWeight: 700, color: '#0f172a' }}>
                        Bs. {subtotal.toFixed(2)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Totales Netos */}
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <div style={{ width: '100%', maxWidth: '350px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '15px 0', fontSize: '18px', fontWeight: 800, color: '#0f172a', borderTop: '2px solid #0f172a', borderBottom: '2px solid #0f172a' }}>
                <span>TOTAL COMPRA:</span>
                <span>Bs. {Number(compra?.total ?? 0).toFixed(2)}</span>
              </div>
            </div>
          </div>
          
          {/* Notas / Observaciones */}
          {compra.notas && (
            <div style={{ marginTop: '30px', padding: '15px', background: '#fff1f2', border: '1px solid #fecdd3', borderRadius: '6px' }}>
              <h4 style={{ margin: '0 0 8px 0', color: '#e11d48', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px' }}>Notas y Observaciones</h4>
              <p style={{ margin: 0, fontSize: '13px', color: '#881337', whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>
                {compra.notas}
              </p>
            </div>
          )}

          {/* Footer */}
          <div style={{ marginTop: '50px', borderTop: '1px solid #e2e8f0', paddingTop: '20px', textAlign: 'center' }}>
            <p style={{ margin: 0, fontSize: '10px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px' }}>Documento interno de compra - ERP Entregas.</p>
          </div>
        </div>
      )}
    </Modal>
  );
}
