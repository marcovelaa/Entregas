'use client';

import React, { useState, useEffect } from 'react';
import { Loader2, ShoppingCart, Plus, Search, CheckCircle } from 'lucide-react';
import { api } from '../../lib/axios';
import Link from 'next/link';
import CompraDetalleModal from './components/CompraDetalleModal';
import styles from './page.module.css';

export default function ComprasPage() {
  const [compras, setCompras] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCompraId, setSelectedCompraId] = useState<string | null>(null);

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
                    <th>Proveedor</th>
                    <th>Total</th>
                    <th>Estado</th>
                    <th style={{ textAlign: 'right' }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {compras.length === 0 ? (
                    <tr>
                      <td colSpan={6} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                        No hay compras registradas
                      </td>
                    </tr>
                  ) : (
                    compras.map(compra => (
                      <tr key={compra.id}>
                        <td className={styles.productName}>#{compra.id}</td>
                        <td>{new Date(compra.creado_en).toLocaleDateString()}</td>
                        <td>{compra.proveedor?.nombre || 'Sin Proveedor'}</td>
                        <td className={styles.precio}>Bs. {compra.total.toFixed(2)}</td>
                        <td>
                          <span style={{ color: '#334155', fontWeight: 500, display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', backgroundColor: compra.estado === 'COMPLETADA' ? '#10b981' : compra.estado === 'PENDIENTE' ? '#f59e0b' : '#ef4444' }}></span>
                            {compra.estado.charAt(0) + compra.estado.slice(1).toLowerCase()}
                          </span>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <button className={styles.btnGhost} onClick={() => setSelectedCompraId(compra.id)}>
                            Ver Detalle
                          </button>
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
    </div>
  );
}
