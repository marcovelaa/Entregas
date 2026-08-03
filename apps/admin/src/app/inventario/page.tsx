'use client';
import React, { useState, useEffect } from 'react';
import { Loader2, Package, ArrowRightLeft } from 'lucide-react';
import { api } from '../../lib/axios';
import styles from './page.module.css';

export default function InventarioPage() {
  const [tab, setTab] = useState<'stock' | 'movimientos'>('stock');
  const [stock, setStock] = useState<any[]>([]);
  const [movimientos, setMovimientos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filtro UX para el Kardex
  const [filtroKardex, setFiltroKardex] = useState<'TODOS' | 'ENTRADAS' | 'SALIDAS'>('TODOS');

  useEffect(() => {
    fetchData();
  }, [tab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (tab === 'stock') {
        const res = await api.get('/inventario/stock');
        setStock(res.data.data || []);
      } else {
        const res = await api.get('/inventario/movimientos');
        setMovimientos(res.data.data || []);
      }
    } catch (error) {
      console.error('Error fetching inventario:', error);
    } finally {
      setLoading(false);
    }
  };

  const movimientosFiltrados = movimientos.filter(m => {
    if (filtroKardex === 'TODOS') return true;
    if (filtroKardex === 'ENTRADAS') return m.tipo_movimiento.includes('INGRESO');
    if (filtroKardex === 'SALIDAS') return !m.tipo_movimiento.includes('INGRESO');
    return true;
  });

  return (
    <div className={styles.pageContainer}>
      <header className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Inventario (Kardex)</h1>
          <p className={styles.pageDescription}>Controla el stock en tiempo real y rastrea la historia de movimientos.</p>
        </div>
      </header>

      <div className={styles.controlsWrapper}>
        <div className={styles.tabGroup}>
          <button 
            className={tab === 'stock' ? styles.btnPrimary : styles.btnSecondary} 
            onClick={() => setTab('stock')}
          >
            <Package size={18} style={{ marginRight: '0.5rem' }} /> Stock Actual
          </button>
          <button 
            className={tab === 'movimientos' ? styles.btnPrimary : styles.btnSecondary} 
            onClick={() => setTab('movimientos')}
          >
            <ArrowRightLeft size={18} style={{ marginRight: '0.5rem' }} /> Historial de Movimientos
          </button>
        </div>
        
        {/* Filtros visuales UX para Kardex */}
        {tab === 'movimientos' && (
          <div className={styles.filterGroup}>
            <button 
              className={`${styles.filterBtn} ${filtroKardex === 'TODOS' ? styles.filterBtnActive : ''}`}
              onClick={() => setFiltroKardex('TODOS')}
            >
              Todos
            </button>
            <button 
              className={`${styles.filterBtn} ${filtroKardex === 'ENTRADAS' ? `${styles.filterBtnActive} ${styles.entradas}` : ''}`}
              onClick={() => setFiltroKardex('ENTRADAS')}
            >
              Entradas
            </button>
            <button 
              className={`${styles.filterBtn} ${filtroKardex === 'SALIDAS' ? `${styles.filterBtnActive} ${styles.salidas}` : ''}`}
              onClick={() => setFiltroKardex('SALIDAS')}
            >
              Salidas
            </button>
          </div>
        )}
      </div>

      <div className={styles.card}>
        <div className={styles.tableWrapper}>
          {loading ? (
            <div style={{ padding: '4rem', textAlign: 'center' }}>
              <Loader2 className={styles.spin} size={40} style={{ display: 'inline', color: '#3b82f6' }} />
            </div>
          ) : tab === 'stock' ? (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Producto</th>
                  <th>SKU</th>
                  <th>Ubicación</th>
                  <th>Estado</th>
                  <th>Cant. Disponible</th>
                  <th>Reservado</th>
                </tr>
              </thead>
              <tbody>
                {stock.length === 0 ? (
                  <tr><td colSpan={6} style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>No hay inventario registrado.</td></tr>
                ) : stock.map(s => {
                  const minStock = s.stock_minimo || 5;
                  const isAgotado = s.cantidad_disponible === 0;
                  const isBajoStock = s.cantidad_disponible > 0 && s.cantidad_disponible <= minStock;
                  
                  return (
                    <tr key={s.id}>
                      <td style={{ fontWeight: 700, color: '#0f172a' }}>
                        {s.producto?.nombre}
                        {s.variante && <span style={{ color: '#64748b', fontWeight: 400, marginLeft: '0.4rem', fontSize: '0.8rem' }}>- {s.variante.nombre}</span>}
                      </td>
                      <td style={{ fontFamily: 'monospace', color: '#64748b' }}>{s.variante?.sku_base || s.producto?.sku || '-'}</td>
                      <td>
                        <span style={{ color: '#475569', fontWeight: 500 }}>
                          {s.ubicacion || 'Principal'}
                        </span>
                      </td>
                      <td>
                        <span style={{ color: '#334155', fontWeight: 500, display: 'inline-flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
                          <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', backgroundColor: isAgotado ? '#ef4444' : isBajoStock ? '#f59e0b' : '#10b981' }}></span>
                          {isAgotado ? 'Agotado' : isBajoStock ? 'Bajo stock' : 'Normal'}
                        </span>
                      </td>
                      <td style={{ fontWeight: 600, color: '#334155' }}>
                        {s.cantidad_disponible}
                      </td>
                      <td style={{ color: '#94a3b8', fontWeight: 500 }}>{s.reservado}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Producto</th>
                  <th>Movimiento</th>
                  <th>Cant.</th>
                  <th>Motivo</th>
                  <th>Usuario</th>
                </tr>
              </thead>
              <tbody>
                {movimientosFiltrados.length === 0 ? (
                  <tr><td colSpan={6} style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>No hay movimientos para este filtro.</td></tr>
                ) : movimientosFiltrados.map(m => {
                  const isIngreso = m.tipo_movimiento.includes('INGRESO');
                  return (
                    <tr key={m.id}>
                      <td style={{ color: '#64748b', fontSize: '0.9rem' }}>
                        {new Date(m.creado_en).toLocaleString('es-AR', { dateStyle: 'medium', timeStyle: 'short' })}
                      </td>
                      <td style={{ fontWeight: 700, color: '#0f172a' }}>
                        {m.producto?.nombre}
                        {m.variante && <span style={{ color: '#64748b', fontWeight: 400, marginLeft: '0.4rem', fontSize: '0.8rem' }}>- {m.variante.nombre}</span>}
                      </td>
                      <td>
                        <span style={{ color: '#334155', fontWeight: 500, display: 'inline-flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
                          <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', backgroundColor: isIngreso ? '#10b981' : '#ef4444' }}></span>
                          {m.tipo_movimiento.replace('_', ' ').toLowerCase().replace(/\b\w/g, (l: string) => l.toUpperCase())}
                        </span>
                      </td>
                      <td style={{ fontWeight: 600, color: '#334155' }}>
                        {isIngreso ? '+' : '-'}{m.cantidad}
                      </td>
                      <td style={{ color: '#475569' }}>{m.motivo || <span style={{color: '#cbd5e1'}}>-</span>}</td>
                      <td style={{ fontSize: '0.9rem', color: '#64748b' }}>
                        {m.usuario?.nombres ? `${m.usuario.nombres} ${m.usuario.apellidos}` : 'Sistema automático'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
