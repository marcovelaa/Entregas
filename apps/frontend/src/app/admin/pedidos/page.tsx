'use client';

import React, { useEffect, useState } from 'react';
import { api } from '../../../lib/api';

interface PedidoDetalle {
  id: string;
  nombre_producto: string;
  precio_unitario: number;
  cantidad: number;
  subtotal: number;
}

interface Pedido {
  id: string;
  numero_pedido: string;
  estado: string;
  total: number;
  direccion_envio_snapshot: any;
  creado_en: string;
  detalles: PedidoDetalle[];
}

export default function AdminPedidosPage() {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [filtroEstado, setFiltroEstado] = useState<string>('');
  const [cargando, setCargando] = useState(false);
  const [actualizandoId, setActualizandoId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    cargarPedidos();
  }, [filtroEstado]);

  async function cargarPedidos() {
    setCargando(true);
    setErrorMsg(null);
    try {
      const query = filtroEstado ? `?estado=${filtroEstado}` : '';
      const response = await api.get<Pedido[]>(`/pedidos${query}`);
      setPedidos(response.data);
    } catch {
      setErrorMsg('No se pudieron cargar los pedidos del ERP.');
    } finally {
      setCargando(false);
    }
  }

  async function handleCambiarEstado(pedidoId: string, nuevoEstado: string) {
    setActualizandoId(pedidoId);
    try {
      await api.patch(`/pedidos/${pedidoId}/estado`, {
        nuevoEstado,
        motivo: `Actualización de estado realizada por operador ERP`,
      });
      await cargarPedidos();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error al cambiar estado del pedido');
    } finally {
      setActualizandoId(null);
    }
  }

  return (
    <div style={{ maxWidth: '1100px', margin: '2rem auto', padding: '0 1rem', fontFamily: 'sans-serif' }}>
      <h1 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '1.5rem' }}>
        ERP Operations — Cola de Pedidos
      </h1>

      {errorMsg && (
        <div style={{ background: '#fef2f2', color: '#991b1b', padding: '1rem', borderRadius: '6px', marginBottom: '1rem' }}>
          {errorMsg}
        </div>
      )}

      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '1.5rem' }}>
        <label style={{ fontWeight: 600, fontSize: '0.9rem' }}>Filtrar por Estado:</label>
        <select
          value={filtroEstado}
          onChange={(e) => setFiltroEstado(e.target.value)}
          style={{ padding: '0.5rem 1rem', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '0.9rem' }}
        >
          <option value="">Todos los Estados</option>
          <option value="PENDIENTE_PAGO">PENDIENTE DE PAGO</option>
          <option value="PAGADO">PAGADO</option>
          <option value="EN_PREPARACION">EN PREPARACIÓN</option>
          <option value="ENVIADO">ENVIADO</option>
          <option value="ENTREGADO">ENTREGADO</option>
          <option value="CANCELADO">CANCELADO</option>
        </select>
        <button
          onClick={cargarPedidos}
          style={{ padding: '0.5rem 1rem', background: '#0f172a', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
        >
          Refrescar
        </button>
      </div>

      {cargando ? (
        <p>Cargando lista de pedidos ERP...</p>
      ) : pedidos.length === 0 ? (
        <p style={{ color: '#64748b' }}>No se encontraron pedidos con los criterios seleccionados.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {pedidos.map((pedido) => (
            <div
              key={pedido.id}
              style={{
                background: 'white',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                padding: '1.25rem',
                boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <div>
                  <strong style={{ fontSize: '1.1rem' }}>#{pedido.numero_pedido}</strong>
                  <span style={{ marginLeft: '1rem', color: '#64748b', fontSize: '0.85rem' }}>
                    {new Date(pedido.creado_en).toLocaleString('es-BO')}
                  </span>
                </div>
                <span
                  style={{
                    background: '#f1f5f9',
                    color: '#0f172a',
                    padding: '0.25rem 0.75rem',
                    borderRadius: '20px',
                    fontWeight: 700,
                    fontSize: '0.85rem',
                  }}
                >
                  {pedido.estado}
                </span>
              </div>

              <div style={{ fontSize: '0.9rem', marginBottom: '0.75rem', color: '#334155' }}>
                Total: <strong>Bs. {Number(pedido.total).toFixed(2)} BOB</strong>
              </div>

              {pedido.direccion_envio_snapshot && (
                <div style={{ background: '#f8fafc', padding: '0.75rem', borderRadius: '4px', fontSize: '0.85rem', marginBottom: '1rem' }}>
                  <strong>Entrega:</strong> {pedido.direccion_envio_snapshot.destinatario_nombre} {pedido.direccion_envio_snapshot.destinatario_apellidos} — {pedido.direccion_envio_snapshot.direccion_completa}, {pedido.direccion_envio_snapshot.ciudad} (Tel: {pedido.direccion_envio_snapshot.telefono})
                </div>
              )}

              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center', paddingTop: '0.75rem', borderTop: '1px solid #f1f5f9' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#475569' }}>Acción ERP:</span>

                {pedido.estado === 'PENDIENTE_PAGO' && (
                  <button
                    disabled={actualizandoId === pedido.id}
                    onClick={() => handleCambiarEstado(pedido.id, 'PAGADO')}
                    style={{ background: '#0284c7', color: 'white', border: 'none', padding: '0.4rem 0.8rem', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}
                  >
                    Marcar Pagado
                  </button>
                )}

                {pedido.estado === 'PAGADO' && (
                  <button
                    disabled={actualizandoId === pedido.id}
                    onClick={() => handleCambiarEstado(pedido.id, 'EN_PREPARACION')}
                    style={{ background: '#7c3aed', color: 'white', border: 'none', padding: '0.4rem 0.8rem', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}
                  >
                    Iniciar Preparación
                  </button>
                )}

                {pedido.estado === 'EN_PREPARACION' && (
                  <button
                    disabled={actualizandoId === pedido.id}
                    onClick={() => handleCambiarEstado(pedido.id, 'ENVIADO')}
                    style={{ background: '#0d9488', color: 'white', border: 'none', padding: '0.4rem 0.8rem', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}
                  >
                    Despachar / Enviar
                  </button>
                )}

                {pedido.estado === 'ENVIADO' && (
                  <button
                    disabled={actualizandoId === pedido.id}
                    onClick={() => handleCambiarEstado(pedido.id, 'ENTREGADO')}
                    style={{ background: '#16a34a', color: 'white', border: 'none', padding: '0.4rem 0.8rem', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}
                  >
                    Marcar Entregado
                  </button>
                )}

                {pedido.estado !== 'ENTREGADO' && pedido.estado !== 'CANCELADO' && (
                  <button
                    disabled={actualizandoId === pedido.id}
                    onClick={() => handleCambiarEstado(pedido.id, 'CANCELADO')}
                    style={{ background: '#dc2626', color: 'white', border: 'none', padding: '0.4rem 0.8rem', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}
                  >
                    Cancelar Pedido
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
