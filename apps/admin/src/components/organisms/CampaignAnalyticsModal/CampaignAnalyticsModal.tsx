'use client';

import React, { useEffect, useState } from 'react';
import styles from './CampaignAnalyticsModal.module.css';
import { api } from '@/lib/axios';
import { X, TrendingUp, DollarSign, Ticket, ShoppingBag, Loader2, Calendar } from 'lucide-react';

export interface CampaignAnalyticsModalProps {
  discountId: string | null;
  onClose: () => void;
}

export function CampaignAnalyticsModal({ discountId, onClose }: CampaignAnalyticsModalProps) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!discountId) return;

    async function loadAnalytics() {
      setLoading(true);
      setErrorMsg(null);
      try {
        const res = await api.get(`/descuentos/${discountId}/analitica`);
        if (res.data.success && res.data.data) {
          setData(res.data.data);
        } else {
          setErrorMsg('No se encontraron datos analíticos para esta campaña.');
        }
      } catch (err: any) {
        console.error('Error al cargar analítica:', err);
        setErrorMsg('Error al conectar con la API de analítica.');
      } finally {
        setLoading(false);
      }
    }

    loadAnalytics();
  }, [discountId]);

  if (!discountId) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerTitleGroup}>
            <div className={styles.headerIcon}>
              <TrendingUp size={20} />
            </div>
            <div>
              <h3 className={styles.title}>Rendimiento Operativo de la Campaña</h3>
              <p className={styles.subtitle}>
                {data?.nombre ? `${data.nombre} ${data.codigoCupon ? `(Cupón: ${data.codigoCupon})` : ''}` : 'Cargando datos...'}
              </p>
            </div>
          </div>
          <button type="button" onClick={onClose} className={styles.closeBtn} title="Cerrar">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className={styles.body}>
          {loading ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '3rem 0', gap: '0.5rem', color: '#64748b' }}>
              <Loader2 size={20} style={{ animation: 'spin 1s linear infinite' }} />
              <span>Analizando historial de canjes...</span>
            </div>
          ) : errorMsg ? (
            <div className={styles.emptyState}>{errorMsg}</div>
          ) : data ? (
            <>
              {/* Top 4 KPI Cards */}
              <div className={styles.kpiGrid}>
                <div className={styles.kpiCard}>
                  <span className={styles.kpiLabel}>Ventas Generadas</span>
                  <span className={styles.kpiValue}>Bs. {data.totalVentasBs.toFixed(2)}</span>
                  <span className={styles.kpiSubtext}>Facturado con la promo</span>
                </div>

                <div className={styles.kpiCard}>
                  <span className={styles.kpiLabel}>Total Descontado</span>
                  <span className={styles.kpiValue} style={{ color: '#16a34a' }}>
                    Bs. {data.totalDescontadoBs.toFixed(2)}
                  </span>
                  <span className={styles.kpiSubtext}>Ahorro entregado</span>
                </div>

                <div className={styles.kpiCard}>
                  <span className={styles.kpiLabel}>Canjes Totales</span>
                  <span className={styles.kpiValue}>{data.totalUsos}</span>
                  <span className={styles.kpiSubtext}>Ticket(s) aplicados</span>
                </div>

                <div className={styles.kpiCard}>
                  <span className={styles.kpiLabel}>Ticket Promedio</span>
                  <span className={styles.kpiValue}>Bs. {data.ticketPromedioBs.toFixed(2)}</span>
                  <span className={styles.kpiSubtext}>Promedio por canje</span>
                </div>
              </div>

              {/* Top Products Section */}
              <div className={styles.sectionBlock}>
                <span className={styles.sectionTitle}>Top Productos más Vendidos con esta Promo</span>
                {data.topProductos && data.topProductos.length > 0 ? (
                  <table className={styles.productsTable}>
                    <thead>
                      <tr>
                        <th>Producto</th>
                        <th style={{ textAlign: 'center' }}>Unidades Vendidas</th>
                        <th style={{ textAlign: 'right' }}>Total Facturado (Bs.)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.topProductos.map((p: any, idx: number) => (
                        <tr key={idx}>
                          <td style={{ fontWeight: 600 }}>{p.nombre}</td>
                          <td style={{ textAlign: 'center' }}>{p.cantidad} u</td>
                          <td style={{ textAlign: 'right', fontWeight: 650 }}>Bs. {p.totalBs.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className={styles.emptyState}>No se registran ventas asociadas a productos aún.</div>
                )}
              </div>

              {/* Recent Redemptions List */}
              <div className={styles.sectionBlock}>
                <span className={styles.sectionTitle}>Últimos Canjes Registrados</span>
                {data.ultimosCanjes && data.ultimosCanjes.length > 0 ? (
                  <div className={styles.transactionsList}>
                    {data.ultimosCanjes.map((tx: any) => (
                      <div key={tx.id} className={styles.txRow}>
                        <div>
                          <span className={styles.txClient}>{tx.clienteNombre}</span>
                          <div className={styles.txMeta}>
                            Venta #{tx.ventaId} • {new Date(tx.fecha).toLocaleString()}
                          </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <span className={styles.txDiscount}>-Bs. {tx.montoDescontado.toFixed(2)}</span>
                          <div className={styles.txMeta}>Total ticket: Bs. {tx.montoVenta.toFixed(2)}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className={styles.emptyState}>Aún no hay canjes registrados para esta campaña.</div>
                )}
              </div>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export default CampaignAnalyticsModal;
