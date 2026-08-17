'use client';

import React, { useState, useEffect } from 'react';
import { PackageSearch, Truck, CheckCircle2, Clock, DollarSign } from 'lucide-react';
import { api } from '../../../lib/axios';
import styles from './PedidosKanban.module.css';
import modalStyles from '../../../styles/modal.module.css';

type OrderState = 'PAGADO' | 'EN_PREPARACION' | 'ENVIADO' | 'ENTREGADO';

export function PedidosKanban() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPedidos = async () => {
    try {
      setLoading(true);
      const [pagados, prep, env, entregados] = await Promise.all([
        api.get('/pedidos?estado=PAGADO&limit=100&page=1'),
        api.get('/pedidos?estado=EN_PREPARACION&limit=100&page=1'),
        api.get('/pedidos?estado=ENVIADO&limit=100&page=1'),
        api.get('/pedidos?estado=ENTREGADO&limit=20&page=1'), // Solo los últimos 20 entregados
      ]);
      setOrders([
        ...(pagados.data.data || []),
        ...(prep.data.data || []),
        ...(env.data.data || []),
        ...(entregados.data.data || []),
      ]);
    } catch (error) {
      console.error('Error fetching pedidos:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPedidos();
  }, []);

  const [promptState, setPromptState] = useState<{ orderId: string, newState: OrderState } | null>(null);
  const [customCost, setCustomCost] = useState('');
  const [toast, setToast] = useState<{ message: string } | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);

  const showToast = (message: string) => {
    setToast({ message });
    setTimeout(() => setToast(null), 4000);
  };

  const esTransicionValidaUI = (actual: OrderState, nuevo: OrderState): boolean => {
    const permitidas: Record<string, string[]> = {
      'PAGADO': ['EN_PREPARACION'],
      'EN_PREPARACION': ['PAGADO', 'ENVIADO'],
      'ENVIADO': ['EN_PREPARACION', 'ENTREGADO'],
      'ENTREGADO': ['ENVIADO'],
    };
    return permitidas[actual]?.includes(nuevo) || false;
  };

  const executeMove = async (id: string, newState: OrderState, payload = {}) => {
    try {
      await api.patch(`/pedidos/${id}/estado`, {
        nuevo_estado: newState,
        ...payload
      });
      fetchPedidos();
    } catch (error: any) {
      console.error('Error moviendo pedido:', error);
      const msg = error.response?.data?.message || 'Hubo un error al cambiar el estado del pedido';
      showToast(`No se pudo mover: ${msg}`);
    }
  };

  const moveOrder = async (id: string, newState: OrderState) => {
    const order = orders.find(o => o.id === id);
    if (!order) return;
    
    if (!esTransicionValidaUI(order.estado, newState)) {
      showToast(`No podés mover de ${order.estado} a ${newState} directamente. Seguí el flujo.`);
      return;
    }

    if (newState === 'ENVIADO' && order.estado === 'EN_PREPARACION') {
      setPromptState({ orderId: id, newState });
      setCustomCost(''); // reset
      return;
    }
    
    await executeMove(id, newState);
  };

  const handleDragStart = (e: React.DragEvent, orderId: string) => {
    e.dataTransfer.setData('orderId', orderId);
  };

  const handleDrop = async (e: React.DragEvent, newState: OrderState) => {
    e.preventDefault();
    const orderId = e.dataTransfer.getData('orderId');
    if (!orderId) return;
    
    const order = orders.find(o => o.id === orderId);
    if (!order || order.estado === newState) return;
    
    await moveOrder(orderId, newState);
  };

  const renderColumn = (state: OrderState, title: string, icon: React.ReactNode, color: string) => {
    const colOrders = orders.filter(o => o.estado === state);
    return (
      <div 
        className={styles.column}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => handleDrop(e, state)}
      >
        <div className={styles.columnHeader} style={{ borderBottomColor: color }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {icon} {title}
          </div>
          <span className={styles.badge}>{colOrders.length}</span>
        </div>
        <div className={styles.cardList}>
          {colOrders.map(order => (
            <div 
              key={order.id} 
              className={styles.card} 
              style={{ borderLeft: `4px solid ${color}`, cursor: 'pointer', padding: '12px' }}
              draggable
              onDragStart={(e) => handleDragStart(e, order.id)}
              onClick={() => setSelectedOrder(order)}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <span style={{ fontWeight: 600, fontSize: '0.85rem', color: '#334155' }}>
                  #{order.numero_pedido.slice(-6).toUpperCase()}
                </span>
                <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                  {new Date(order.creado_en).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                </span>
              </div>
              <div style={{ fontSize: '0.9rem', fontWeight: 500, color: '#0f172a', marginBottom: '4px' }}>
                {order.cliente ? `${order.cliente.nombres} ${order.cliente.apellidos || ''}` : 'Consumidor Final'}
              </div>
              <div style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '8px' }}>
                {order.detalles?.reduce((acc: number, d: any) => acc + d.cantidad, 0)} artículos | Bs. {parseFloat(order.total).toFixed(2)}
              </div>

              {(order.nombre_preparador || order.nombre_repartidor) && (
                <div style={{ fontSize: '0.7rem', color: '#475569', backgroundColor: '#f1f5f9', padding: '4px 6px', borderRadius: '4px', marginBottom: '8px' }}>
                  {order.nombre_preparador && <div>Arma: {order.nombre_preparador.split(' ')[0]}</div>}
                  {order.nombre_repartidor && <div>Lleva: {order.nombre_repartidor.split(' ')[0]}</div>}
                </div>
              )}
              
              <div className={styles.actions} style={{ display: 'flex', gap: '4px', marginTop: 'auto' }}>
                {state === 'PAGADO' && (
                  <button className={`${styles.actionBtn} ${styles.primary}`} onClick={(e) => { e.stopPropagation(); moveOrder(order.id, 'EN_PREPARACION') }} style={{ flex: 1, padding: '4px', fontSize: '0.8rem' }}>
                    Alistar
                  </button>
                )}
                {state === 'EN_PREPARACION' && (
                  <>
                    <button className={`${styles.actionBtn}`} onClick={(e) => { e.stopPropagation(); moveOrder(order.id, 'PAGADO') }} style={{ backgroundColor: '#e2e8f0', color: '#475569', padding: '4px', fontSize: '0.8rem' }}>
                      ←
                    </button>
                    <button className={`${styles.actionBtn} ${styles.primary}`} onClick={(e) => { e.stopPropagation(); moveOrder(order.id, 'ENVIADO') }} style={{ flex: 1, padding: '4px', fontSize: '0.8rem' }}>
                      Despachar
                    </button>
                  </>
                )}
                {state === 'ENVIADO' && (
                  <>
                    <button className={`${styles.actionBtn}`} onClick={(e) => { e.stopPropagation(); moveOrder(order.id, 'EN_PREPARACION') }} style={{ backgroundColor: '#e2e8f0', color: '#475569', padding: '4px', fontSize: '0.8rem' }}>
                      ←
                    </button>
                    <button className={`${styles.actionBtn} ${styles.primary}`} onClick={(e) => { e.stopPropagation(); moveOrder(order.id, 'ENTREGADO') }} style={{ flex: 1, padding: '4px', fontSize: '0.8rem' }}>
                      Entregar
                    </button>
                  </>
                )}
                {state === 'ENTREGADO' && (
                  <button className={`${styles.actionBtn}`} onClick={(e) => { e.stopPropagation(); moveOrder(order.id, 'ENVIADO') }} style={{ flex: 1, backgroundColor: '#e2e8f0', color: '#475569', padding: '4px', fontSize: '0.8rem' }}>
                    ← Revertir a Despacho
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  if (loading && orders.length === 0) {
    return <div style={{ padding: '2rem', textAlign: 'center' }}>Cargando pedidos...</div>;
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Alistamiento y Despacho</h1>
        <p className={styles.subtitle}>Gestioná las ventas online y asigná los costos de envío directamente acá.</p>
      </div>

      <div className={styles.kanbanBoard}>
        {renderColumn('PAGADO', 'Pendientes', <Clock size={18} color="#f59e0b" />, '#f59e0b')}
        {renderColumn('EN_PREPARACION', 'Alistamiento', <PackageSearch size={18} color="#3b82f6" />, '#3b82f6')}
        {renderColumn('ENVIADO', 'En Camino', <Truck size={18} color="#8b5cf6" />, '#8b5cf6')}
        {renderColumn('ENTREGADO', 'Entregados', <CheckCircle2 size={18} color="#10b981" />, '#10b981')}
      </div>

      {promptState && (
        <div className={modalStyles.modalOverlay}>
          <div className={modalStyles.modalContent}>
            <h3 className={modalStyles.modalHeader}>Delivery a Cargo de la Tienda</h3>
            <p className={modalStyles.modalBody}>
              ¿La empresa asume el costo de este envío? (Ej. Promoción de Envío Gratis).<br/>
              <strong>Ingresá el monto que pagaremos al repartidor.</strong><br/>
              <em style={{ color: '#64748b' }}>Si el cliente le paga directamente a la moto al recibir, dejalo en 0.</em>
            </p>
            <input 
              type="number" 
              value={customCost} 
              onChange={e => setCustomCost(e.target.value)}
              placeholder="Ej. 15.00"
              className={modalStyles.formInput}
              autoFocus
            />
            <div className={modalStyles.btnGroup}>
              <button 
                onClick={() => setPromptState(null)} 
                className={modalStyles.btnCancel}
              >
                Cancelar
              </button>
              <button 
                onClick={() => {
                  const num = Number(customCost);
                  const payload = !isNaN(num) && customCost !== '' ? { costo_envio: num } : { costo_envio: 0 };
                  setPromptState(null);
                  executeMove(promptState.orderId, promptState.newState, payload);
                }}
                style={{ padding: '0.5rem 1rem' }}
              >
                Confirmar y Despachar
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          backgroundColor: '#ef4444',
          color: 'white',
          padding: '12px 24px',
          borderRadius: '6px',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
          zIndex: 1050,
          fontWeight: 500,
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          animation: 'slideUp 0.3s ease-out'
        }}>
          {toast.message}
          <button 
            onClick={() => setToast(null)}
            style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', padding: '0 4px', fontSize: '1.25rem' }}
          >
            ×
          </button>
        </div>
      )}

      {selectedOrder && (
        <>
          {/* Backdrop */}
          <div 
            style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.4)', zIndex: 1040 }}
            onClick={() => setSelectedOrder(null)}
          />
          {/* Modal Centrado */}
          <div style={{
            position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', 
            width: '500px', maxWidth: '90%', maxHeight: '90vh',
            backgroundColor: 'white', zIndex: 1050, boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)',
            display: 'flex', flexDirection: 'column', borderRadius: '8px', overflow: 'hidden'
          }}>
            <div style={{ padding: '1.5rem', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f8fafc' }}>
              <div>
                <h2 style={{ margin: 0, fontSize: '1.25rem', color: '#0f172a' }}>Pedido #{selectedOrder.numero_pedido.slice(-6).toUpperCase()}</h2>
                <span style={{ fontSize: '0.85rem', color: '#64748b' }}>{new Date(selectedOrder.creado_en).toLocaleString()}</span>
              </div>
              <button onClick={() => setSelectedOrder(null)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#64748b' }}>×</button>
            </div>
            
            <div style={{ padding: '1.5rem', flex: 1, overflowY: 'auto' }}>
              <h3 style={{ fontSize: '1rem', color: '#334155', marginBottom: '1rem', borderBottom: '2px solid #e2e8f0', paddingBottom: '0.5rem' }}>
                <PackageSearch size={16} style={{ verticalAlign: 'middle', marginRight: '6px' }} />
                Artículos a Alistar
              </h3>
              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 2rem 0' }}>
                {selectedOrder.detalles?.map((d: any) => (
                  <li key={d.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem 0', borderBottom: '1px solid #f1f5f9' }}>
                    <div>
                      <span style={{ fontWeight: 600, color: '#0f172a', marginRight: '8px' }}>{d.cantidad}x</span>
                      <span style={{ color: '#475569' }}>{d.nombre_producto}</span>
                    </div>
                    <span style={{ color: '#64748b' }}>Bs. {parseFloat(d.subtotal).toFixed(2)}</span>
                  </li>
                ))}
              </ul>

              <h3 style={{ fontSize: '1rem', color: '#334155', marginBottom: '1rem', borderBottom: '2px solid #e2e8f0', paddingBottom: '0.5rem' }}>
                <Truck size={16} style={{ verticalAlign: 'middle', marginRight: '6px' }} />
                Datos de Envío
              </h3>
              <div style={{ backgroundColor: '#f8fafc', padding: '1rem', borderRadius: '6px', marginBottom: '2rem' }}>
                <p style={{ margin: '0 0 0.5rem 0', fontWeight: 600 }}>{selectedOrder.direccion_envio_snapshot?.destinatario_nombre} {selectedOrder.direccion_envio_snapshot?.destinatario_apellidos}</p>
                <p style={{ margin: '0 0 0.5rem 0', color: '#475569' }}>{selectedOrder.direccion_envio_snapshot?.direccion_completa}</p>
                <p style={{ margin: '0 0 0.5rem 0', color: '#475569' }}>Telf: {selectedOrder.direccion_envio_snapshot?.telefono}</p>
                {selectedOrder.notas && (
                  <div style={{ marginTop: '1rem', padding: '0.75rem', backgroundColor: '#fef3c7', color: '#92400e', borderRadius: '4px', fontSize: '0.9rem' }}>
                    <strong>Nota del cliente:</strong> {selectedOrder.notas}
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600, fontSize: '1.1rem', color: '#0f172a', padding: '1rem 0', borderTop: '2px solid #e2e8f0' }}>
                <span>Total a Cobrar</span>
                <span>Bs. {parseFloat(selectedOrder.total).toFixed(2)}</span>
              </div>
              {selectedOrder.costo_envio > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', color: '#64748b' }}>
                  <span>(Incluye Delivery: Bs. {parseFloat(selectedOrder.costo_envio).toFixed(2)})</span>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
