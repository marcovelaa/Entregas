'use client';
import React, { useState, useEffect } from 'react';
import { Ban, FileText, RotateCcw } from 'lucide-react';
import { api } from '../../../lib/axios';
import { TicketImpresion } from '../../../components/molecules/TicketImpresion/TicketImpresion';
import styles from './VentasHistorial.module.css';

export function VentasHistorial() {
  const [ventas, setVentas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [ventaAAnular, setVentaAAnular] = useState<any>(null);
  const [motivoAnulacion, setMotivoAnulacion] = useState('');
  const [procesando, setProcesando] = useState(false);
  
  // Estado para el modal de detalles
  const [ventaSeleccionada, setVentaSeleccionada] = useState<any>(null);

  // Configuración del Negocio
  const [configNegocio, setConfigNegocio] = useState({
    nombre: 'ENTREGAS.com.bo',
    direccion: 'Av. Banzer Km 2.5, Santa Cruz, Bolivia',
    telefono: '+591 70000000',
    nit: '1029384029',
  });

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
    const savedConfig = localStorage.getItem('entregas_config_negocio');
    if (savedConfig) {
      setConfigNegocio(JSON.parse(savedConfig));
    }
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

  return (
    <div className={styles.container}>
      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <colgroup>
            <col className={styles.ticketColumn} />
            <col className={styles.dateColumn} />
            <col className={styles.clientColumn} />
            <col className={styles.productsColumn} />
            <col className={styles.totalColumn} />
            <col className={styles.methodColumn} />
            <col className={styles.statusColumn} />
            <col className={styles.actionsColumn} />
          </colgroup>
          <thead>
            <tr>
              <th scope="col">Ticket #</th>
              <th scope="col">Fecha</th>
              <th scope="col">Cliente</th>
              <th scope="col">Productos</th>
              <th className={styles.alignEnd} scope="col">Total</th>
              <th scope="col">Método</th>
              <th scope="col">Estado</th>
              <th className={styles.alignEnd} scope="col">Acciones</th>
            </tr>
          </thead>
          <tbody aria-busy={loading}>
            {loading ? (
              <tr className={styles.statusRow}>
                <td colSpan={8}>Cargando ventas...</td>
              </tr>
            ) : ventas.length === 0 ? (
              <tr className={styles.statusRow}>
                <td className={styles.emptyState} colSpan={8}>No hay ventas registradas</td>
              </tr>
            ) : (
              ventas.map((venta) => {
                const ticket = String(venta.id).padStart(7, '0');
                const cliente = venta.cliente
                  ? `${venta.cliente.nombres} ${venta.cliente.apellidos || ''}`.trim()
                  : 'Consumidor Final';
                const detalles = venta.detalles ?? [];
                const productos = detalles
                  .map((detalle: any) => `${detalle.cantidad}x ${detalle.producto?.nombre}`)
                  .join(', ');
                const resumenProductos = detalles.length === 0
                  ? 'Sin productos'
                  : detalles.length === 1
                    ? `${detalles[0].cantidad}x ${detalles[0].producto?.nombre || 'Producto'}`
                    : `${detalles.length} artículos variados`;
                const anulada = venta.estado === 'ANULADA';

                return (
                  <tr className={styles.saleRow} key={venta.id}>
                    <td className={styles.ticketCell} data-label="Ticket #">
                      <span title={`Ticket #${ticket}`}>{ticket}</span>
                    </td>
                    <td className={styles.dateCell} data-label="Fecha">
                      {new Date(venta.creado_en).toLocaleString('es-BO', { dateStyle: 'short', timeStyle: 'short' })}
                    </td>
                    <td className={styles.clientCell} data-label="Cliente">
                      <span className={styles.truncate} title={cliente}>{cliente}</span>
                    </td>
                    <td className={styles.productsCell} data-label="Productos">
                      <span className={styles.productSummary} title={productos}>{resumenProductos}</span>
                    </td>
                    <td className={styles.totalCell} data-label="Total">Bs. {parseFloat(venta.total).toFixed(2)}</td>
                    <td className={styles.methodCell} data-label="Método">{venta.metodo_pago}</td>
                    <td className={styles.statusCell} data-label="Estado">
                      <span className={`${styles.statusBadge} ${anulada ? styles.statusCancelled : styles.statusCompleted}`}>
                        {venta.estado}
                      </span>
                      {anulada && venta.motivo_anulacion && (
                        <span className={styles.statusReason} title={venta.motivo_anulacion}>
                          {venta.motivo_anulacion}
                        </span>
                      )}
                    </td>
                    <td className={styles.actionsCell} data-label="Acciones">
                      <div className={styles.actions}>
                        <button
                          aria-label={`Ver detalles de la venta ${ticket}`}
                          className={styles.btnIcon}
                          onClick={() => setVentaSeleccionada(venta)}
                          type="button"
                        >
                          <FileText aria-hidden="true" size={18} />
                        </button>
                        {anulada ? (
                          <button
                            aria-label={`Revertir anulación de la venta ${ticket}`}
                            className={styles.btnIconWarning}
                            onClick={() => handleRevertir(venta)}
                            type="button"
                          >
                            <RotateCcw aria-hidden="true" size={18} />
                          </button>
                        ) : (
                          <button
                            aria-label={`Anular venta ${ticket}`}
                            className={styles.btnIconDanger}
                            onClick={() => openAnularModal(venta)}
                            type="button"
                          >
                            <Ban aria-hidden="true" size={18} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* MODAL DE DETALLES DE VENTA (PREVIEW DE TICKET) */}
      {ventaSeleccionada && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem'
        }}>
          <div style={{ background: 'white', borderRadius: '8px', overflow: 'hidden' }}>
            <TicketImpresion 
              ticketData={ventaSeleccionada}
              configNegocio={configNegocio}
              onClose={() => setVentaSeleccionada(null)}
            />
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
