'use client';
import React, { useState, useEffect } from 'react';
import { Ban, Search, FileText, RotateCcw } from 'lucide-react';
import { api } from '../../lib/axios';
import styles from './page.module.css';

export default function VentasPage() {
  const [ventas, setVentas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [ventaAAnular, setVentaAAnular] = useState<any>(null);
  const [motivoAnulacion, setMotivoAnulacion] = useState('');
  const [procesando, setProcesando] = useState(false);
  
  // Estado para el modal de detalles
  const [ventaSeleccionada, setVentaSeleccionada] = useState<any>(null);

  const fetchVentas = async () => {
    try {
      setLoading(true);
      const res = await api.get('/ventas?limit=50&page=1');
      setVentas(res.data.data);
    } catch (error) {
      console.error('Error fetching ventas:', error);
      alert('Error cargando historial de ventas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVentas();
  }, []);

  const openAnularModal = (venta: any) => {
    setVentaAAnular(venta);
    setMotivoAnulacion('');
  };

  const closeAnularModal = () => {
    setVentaAAnular(null);
    setMotivoAnulacion('');
  };

  const handleConfirmarAnular = async () => {
    if (!motivoAnulacion.trim()) {
      alert('Debe ingresar un motivo para la anulación');
      return;
    }
    
    try {
      setProcesando(true);
      await api.post(`/ventas/${ventaAAnular.id}/anular`, {
        motivo: motivoAnulacion
      });
      alert('Venta anulada correctamente');
      closeAnularModal();
      fetchVentas();
    } catch (error: any) {
      console.error('Error anulando venta:', error);
      const msg = error.response?.data?.message || error.message;
      alert(`Error al anular venta: ${Array.isArray(msg) ? msg.join(', ') : msg}`);
    } finally {
      setProcesando(false);
    }
  };

  const handleRevertir = async (venta: any) => {
    if (!confirm(`¿Estás seguro de que deseas revertir la anulación del ticket ${String(venta.id).padStart(7, '0')}?`)) return;
    try {
      setLoading(true);
      await api.post(`/ventas/${venta.id}/revertir-anulacion`);
      alert('Anulación revertida correctamente');
      fetchVentas();
    } catch (error: any) {
      console.error('Error revirtiendo anulación:', error);
      const msg = error.response?.data?.message || error.message;
      alert(`Error al revertir: ${Array.isArray(msg) ? msg.join(', ') : msg}`);
      setLoading(false);
    }
  };

  const handlePrint = (venta: any) => {
    const iframe = document.getElementById('print-iframe') as HTMLIFrameElement;
    if (!iframe) return;
    
    const doc = iframe.contentWindow?.document;
    if (!doc) return;

    const ticketHTML = `
      <html>
        <head>
          <title>Imprimir Comprobante</title>
          <style>
            @page { margin: 0; size: 80mm 200mm; }
            body { font-family: "Courier New", Courier, monospace; margin: 0; padding: 10px; width: 80mm; color: #000; }
            .header { text-align: center; margin-bottom: 10px; }
            .header h2 { margin: 0; font-size: 1.2rem; font-family: sans-serif; letter-spacing: -1px; text-transform: uppercase; font-weight: 900; }
            .header h2 span { text-transform: lowercase; letter-spacing: normal; }
            .header p { margin: 2px 0; font-size: 0.8rem; }
            .info { border-bottom: 1px dashed #000; padding-bottom: 5px; margin-bottom: 5px; font-size: 0.75rem; }
            .info-row { display: flex; justify-content: space-between; margin-bottom: 2px; }
            table { width: 100%; border-collapse: collapse; font-size: 0.75rem; margin-bottom: 5px; }
            th { text-align: left; padding-bottom: 3px; border-bottom: 1px dashed #000; }
            td { padding: 3px 0; vertical-align: top; }
            .total-row { border-top: 1px dashed #000; display: flex; justify-content: space-between; font-weight: bold; font-size: 0.9rem; padding-top: 5px; margin-bottom: 10px; }
            .footer { text-align: center; font-size: 0.75rem; }
          </style>
        </head>
        <body>
          <div class="header">
            <h2>ENTREGAS<span>.com.bo</span></h2>
            <p>Santa Cruz, Bolivia</p>
            <p style="font-weight: bold; margin-top: 5px;">COMPROBANTE DE VENTA</p>
          </div>
          <div class="info">
            <div class="info-row"><span>Ticket #:</span><span>${String(venta.id).padStart(7, '0')}</span></div>
            <div class="info-row"><span>Fecha:</span><span>${new Date(venta.creado_en).toLocaleString('es-BO')}</span></div>
            <div class="info-row"><span>Cajero:</span><span>${venta.usuario_id}</span></div>
            <div class="info-row"><span>Método:</span><span>${venta.metodo_pago}</span></div>
          </div>
          <table>
            <thead><tr><th style="width: 15%">Cant</th><th style="width: 55%">Desc</th><th style="text-align: right; width: 30%">Subt</th></tr></thead>
            <tbody>
              ${venta.detalles?.map((d: any) => `
                <tr>
                  <td>${d.cantidad}</td>
                  <td>${d.producto?.nombre || 'Prod'} ${d.variante ? `(${d.variante.nombre})` : ''}</td>
                  <td style="text-align: right">${parseFloat(d.subtotal).toFixed(2)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          <div class="total-row"><span>TOTAL Bs.</span><span>${parseFloat(venta.total).toFixed(2)}</span></div>
          <div class="footer"><p>¡Gracias por su compra!</p><p>Conserve este ticket.</p></div>
        </body>
      </html>
    `;

    doc.open();
    doc.write(ticketHTML);
    doc.close();

    setTimeout(() => {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
    }, 250);
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Historial de Ventas</h1>
      </div>

      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Ticket #</th>
              <th>Fecha</th>
              <th>Cliente</th>
              <th>Productos</th>
              <th>Total</th>
              <th>Método</th>
              <th>Estado</th>
              <th style={{ textAlign: 'right' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', padding: '2rem' }}>Cargando ventas...</td>
              </tr>
            ) : ventas.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>No hay ventas registradas</td>
              </tr>
            ) : (
              ventas.map((venta) => (
                <tr key={venta.id}>
                  <td style={{ fontWeight: 600 }}>
                    <span title={`Ticket #${String(venta.id).padStart(7, '0')}`}>
                      {String(venta.id).padStart(7, '0')}
                    </span>
                  </td>
                  <td>{new Date(venta.creado_en).toLocaleString('es-BO', { dateStyle: 'short', timeStyle: 'short' })}</td>
                  <td>{venta.cliente ? `${venta.cliente.nombres} ${venta.cliente.apellidos || ''}` : 'Consumidor Final'}</td>
                  <td>
                    <div style={{ maxWidth: '250px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: '#475569' }} title={venta.detalles?.map((d: any) => `${d.cantidad}x ${d.producto?.nombre}`).join(', ')}>
                      {venta.detalles?.length === 0 ? 'Sin productos' : (
                        venta.detalles?.length === 1 ? (
                          `${venta.detalles[0].cantidad}x ${venta.detalles[0].producto?.nombre || 'Producto'}`
                        ) : (
                          `${venta.detalles?.length} artículos variados`
                        )
                      )}
                    </div>
                  </td>
                  <td style={{ fontWeight: 'bold' }}>Bs. {parseFloat(venta.total).toFixed(2)}</td>
                  <td>{venta.metodo_pago}</td>
                  <td>
                    <span style={{ color: '#334155', fontWeight: 500, display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', backgroundColor: venta.estado === 'COMPLETADA' ? '#10b981' : '#ef4444' }}></span>
                      {venta.estado.charAt(0) + venta.estado.slice(1).toLowerCase()}
                    </span>
                    {venta.estado === 'ANULADA' && venta.motivo_anulacion && (
                      <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '4px', maxWidth: '150px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={venta.motivo_anulacion}>
                        {venta.motivo_anulacion}
                      </div>
                    )}
                  </td>
                  <td style={{ textAlign: 'right', display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                    <button 
                      className={styles.btnIcon}
                      onClick={() => setVentaSeleccionada(venta)}
                      title="Ver Detalles"
                    >
                      <FileText size={18} />
                    </button>
                    {venta.estado === 'ANULADA' ? (
                      <button 
                        className={styles.btnIconWarning}
                        onClick={() => handleRevertir(venta)}
                        title="Revertir Anulación"
                      >
                        <RotateCcw size={18} />
                      </button>
                    ) : (
                      <button 
                        className={styles.btnIconDanger} 
                        onClick={() => openAnularModal(venta)}
                        title="Anular Venta"
                      >
                        <Ban size={18} />
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <iframe id="print-iframe" style={{ display: 'none' }} title="Print Frame" />

      {/* MODAL DE DETALLES DE VENTA */}
      {ventaSeleccionada && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div style={{
            background: 'white', padding: '1.5rem', borderRadius: '12px', width: '500px', maxWidth: '95%', maxHeight: '90vh', overflowY: 'auto',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)', border: '1px solid #f1f5f9'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ margin: 0, fontSize: '1.2rem', color: '#0f172a', fontWeight: 600 }}>
                Detalles del Ticket <span style={{ color: '#64748b', fontWeight: 400 }}>#{String(ventaSeleccionada.id).padStart(7, '0')}</span>
              </h2>
              <span style={{ color: '#334155', fontWeight: 500, display: 'inline-flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
                <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', backgroundColor: ventaSeleccionada.estado === 'COMPLETADA' ? '#10b981' : '#ef4444' }}></span>
                {ventaSeleccionada.estado.charAt(0) + ventaSeleccionada.estado.slice(1).toLowerCase()}
              </span>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem', marginBottom: '1.5rem', border: '1px solid #e2e8f0', padding: '1rem', borderRadius: '8px', backgroundColor: '#f8fafc' }}>
              <div>
                <div style={{ fontSize: '12px', textTransform: 'uppercase', color: '#64748b', fontWeight: 600, marginBottom: '4px' }}>Fecha</div>
                <div style={{ fontSize: '14px', color: '#0f172a', fontWeight: 500 }}>{new Date(ventaSeleccionada.creado_en).toLocaleString('es-BO')}</div>
              </div>
              <div>
                <div style={{ fontSize: '12px', textTransform: 'uppercase', color: '#64748b', fontWeight: 600, marginBottom: '4px' }}>Cliente</div>
                <div style={{ fontSize: '14px', color: '#0f172a', fontWeight: 500 }}>{ventaSeleccionada.cliente ? `${ventaSeleccionada.cliente.nombres} ${ventaSeleccionada.cliente.apellidos || ''}` : 'Consumidor Final'}</div>
              </div>
              <div>
                <div style={{ fontSize: '12px', textTransform: 'uppercase', color: '#64748b', fontWeight: 600, marginBottom: '4px' }}>Método</div>
                <div style={{ fontSize: '14px', color: '#0f172a', fontWeight: 500 }}>{ventaSeleccionada.metodo_pago}</div>
              </div>
              <div>
                <div style={{ fontSize: '12px', textTransform: 'uppercase', color: '#64748b', fontWeight: 600, marginBottom: '4px' }}>Cajero</div>
                <div style={{ fontSize: '14px', color: '#0f172a', fontWeight: 500 }}>{ventaSeleccionada.usuario_id}</div>
              </div>
            </div>

            <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden', marginBottom: '1.5rem' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                  <tr>
                    <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: 600, color: '#475569', fontSize: '12px', textTransform: 'uppercase' }}>Producto</th>
                    <th style={{ padding: '0.75rem', textAlign: 'center', fontWeight: 600, color: '#475569', fontSize: '12px', textTransform: 'uppercase' }}>Cant</th>
                    <th style={{ padding: '0.75rem', textAlign: 'right', fontWeight: 600, color: '#475569', fontSize: '12px', textTransform: 'uppercase' }}>Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {ventaSeleccionada.detalles?.map((d: any, idx: number) => (
                    <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '0.75rem', color: '#1e293b' }}>
                        {d.producto?.nombre} 
                        {d.variante && <span style={{ color: '#64748b', fontSize: '12px', marginLeft: '4px' }}>({d.variante.nombre})</span>}
                      </td>
                      <td style={{ padding: '0.75rem', textAlign: 'center', color: '#1e293b' }}>{d.cantidad}</td>
                      <td style={{ padding: '0.75rem', textAlign: 'right', color: '#1e293b', fontWeight: 500 }}>Bs. {parseFloat(d.subtotal).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan={2} style={{ padding: '0.75rem', textAlign: 'right', fontWeight: 600, color: '#0f172a', fontSize: '13px' }}>TOTAL:</td>
                    <td style={{ padding: '0.75rem', textAlign: 'right', fontWeight: 700, color: '#0f172a', fontSize: '16px' }}>Bs. {parseFloat(ventaSeleccionada.total).toFixed(2)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button 
                onClick={() => handlePrint(ventaSeleccionada)}
                style={{
                  padding: '0.6rem 1rem', background: '#e0f2fe', color: '#0369a1', fontSize: '13px',
                  border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600,
                  display: 'flex', alignItems: 'center', gap: '0.4rem', transition: 'background 0.2s'
                }}
              >
                <FileText size={16} /> Reimprimir Ticket
              </button>
              <button 
                onClick={() => setVentaSeleccionada(null)}
                style={{
                  padding: '0.6rem 1rem', background: '#0f172a', color: 'white', fontSize: '13px',
                  border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 500,
                  transition: 'background 0.2s'
                }}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE ANULACIÓN */}
      {ventaAAnular && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div style={{
            background: 'white', padding: '2.5rem', borderRadius: '16px', width: '420px', maxWidth: '90%',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)', border: '1px solid #f1f5f9'
          }}>
            <h2 style={{ marginTop: 0, marginBottom: '0.5rem', fontSize: '1.25rem', color: '#0f172a', fontWeight: 600 }}>
              Anular Venta <span style={{ color: '#64748b', fontWeight: 400 }}>#{String(ventaAAnular.id).padStart(7, '0')}</span>
            </h2>
            <p style={{ fontSize: '0.9rem', color: '#64748b', marginBottom: '1.5rem', lineHeight: 1.5 }}>
              El stock regresará automáticamente al inventario. Indica el motivo de la devolución.
            </p>
            
            <textarea
              value={motivoAnulacion}
              onChange={(e) => setMotivoAnulacion(e.target.value)}
              placeholder="Ej. Devolución por defecto de fábrica..."
              rows={3}
              style={{
                width: '100%', padding: '0.875rem', borderRadius: '10px', border: '1px solid #e2e8f0',
                marginBottom: '2rem', fontFamily: 'inherit', resize: 'none', fontSize: '0.95rem',
                outline: 'none', transition: 'border-color 0.2s', backgroundColor: '#f8fafc'
              }}
              onFocus={(e) => e.target.style.borderColor = '#94a3b8'}
              onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
              autoFocus
            />

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button 
                onClick={closeAnularModal}
                disabled={procesando}
                style={{
                  padding: '0.625rem 1.25rem', background: 'transparent', color: '#64748b',
                  border: '1px solid #e2e8f0', borderRadius: '8px', cursor: 'pointer', fontWeight: 500,
                  transition: 'background 0.2s'
                }}
                onMouseOver={(e) => e.currentTarget.style.background = '#f8fafc'}
                onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
              >
                Cancelar
              </button>
              <button 
                onClick={handleConfirmarAnular}
                disabled={procesando || !motivoAnulacion.trim()}
                style={{
                  padding: '0.625rem 1.25rem', background: '#0f172a', color: 'white',
                  border: 'none', borderRadius: '8px', cursor: (procesando || !motivoAnulacion.trim()) ? 'not-allowed' : 'pointer', fontWeight: 500,
                  opacity: (procesando || !motivoAnulacion.trim()) ? 0.5 : 1, transition: 'background 0.2s'
                }}
                onMouseOver={(e) => { if (!procesando && motivoAnulacion.trim()) e.currentTarget.style.background = '#1e293b' }}
                onMouseOut={(e) => e.currentTarget.style.background = '#0f172a'}
              >
                {procesando ? 'Procesando...' : 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
