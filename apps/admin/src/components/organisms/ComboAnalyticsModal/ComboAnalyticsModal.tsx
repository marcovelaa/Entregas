'use client';

import React, { useEffect, useState } from 'react';
import styles from './ComboAnalyticsModal.module.css';
import { api } from '@/lib/axios';
import {
  X,
  TrendingUp,
  DollarSign,
  Package,
  Layers,
  AlertTriangle,
  Loader2,
  Percent,
  Receipt,
  CreditCard,
  CheckCircle2,
} from 'lucide-react';

export interface ComboAnalyticsModalProps {
  comboId: string | null;
  onClose: () => void;
}

export function ComboAnalyticsModal({ comboId, onClose }: ComboAnalyticsModalProps) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!comboId) return;

    async function loadAnalytics() {
      setLoading(true);
      setErrorMsg(null);
      try {
        const res = await api.get(`/productos/${comboId}/analitica`);
        if (res.data.success && res.data.data) {
          setData(res.data.data);
        } else {
          setErrorMsg('No se pudieron obtener las analíticas del combo.');
        }
      } catch (err: any) {
        console.error('Error al cargar analítica de combo:', err);
        setErrorMsg('Error al conectar con la API de analítica de combos.');
      } finally {
        setLoading(false);
      }
    }

    loadAnalytics();
  }, [comboId]);

  if (!comboId) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerTitleGroup}>
            <div className={styles.headerIcon}>
              <Layers size={20} />
            </div>
            <div>
              <h3 className={styles.title}>Rendimiento Operativo del Combo</h3>
              <div className={styles.subtitle}>
                <span>{data?.nombre || 'Cargando combo...'}</span>
                {data?.sku && <span className={styles.badge}>SKU: {data.sku}</span>}
                {data?.canal && <span className={styles.badge}>{data.canal}</span>}
              </div>
            </div>
          </div>
          <button type="button" onClick={onClose} className={styles.closeBtn} title="Cerrar">
            <X size={18} />
          </button>
        </div>

        {/* Content Body */}
        <div className={styles.body}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '3.5rem 0', color: '#64748b' }}>
              <Loader2 size={28} className="spin" style={{ margin: '0 auto 0.5rem', color: '#0f172a' }} />
              Calculando analítica y desglose BOM...
            </div>
          ) : errorMsg ? (
            <div style={{ textAlign: 'center', padding: '2.5rem 0', color: '#ef4444' }}>
              <AlertTriangle size={32} style={{ margin: '0 auto 0.5rem' }} />
              <p style={{ fontWeight: 600, margin: 0 }}>{errorMsg}</p>
            </div>
          ) : data ? (
            <>
              {/* Top KPI Cards Grid */}
              <div className={styles.kpiGrid}>
                {/* KPI 1: Unidades Vendidas */}
                <div className={styles.kpiCard}>
                  <div className={styles.kpiHeader}>
                    <span className={styles.kpiLabel}>Kits Vendidos</span>
                    <Package size={16} className={styles.kpiIcon} />
                  </div>
                  <div className={styles.kpiValue}>{data.unidadesVendidas}</div>
                  <div className={styles.kpiSubtext}>
                    {data.cupoMaximo ? (
                      <>
                        <span>{data.cupoUsado} de {data.cupoMaximo} kits máx.</span>
                        <div className={styles.progressBarContainer}>
                          <div
                            className={styles.progressBar}
                            style={{
                              width: `${data.cupoPorcentaje || 0}%`,
                              backgroundColor: (data.cupoPorcentaje || 0) >= 100 ? '#ef4444' : '#0f172a',
                            }}
                          />
                        </div>
                      </>
                    ) : (
                      'Sin límite de cupo (Ilimitado)'
                    )}
                  </div>
                </div>

                {/* KPI 2: Total Recaudado */}
                <div className={styles.kpiCard}>
                  <div className={styles.kpiHeader}>
                    <span className={styles.kpiLabel}>Facturación Combo</span>
                    <DollarSign size={16} className={styles.kpiIcon} />
                  </div>
                  <div className={styles.kpiValue}>Bs. {Number(data.totalRecaudadoBs).toFixed(2)}</div>
                  <div className={styles.kpiSubtext}>
                    Precio kit: <strong>Bs. {Number(data.precioCombo).toFixed(2)}</strong>
                  </div>
                </div>

                {/* KPI 3: Ahorro al Cliente */}
                <div className={styles.kpiCard}>
                  <div className={styles.kpiHeader}>
                    <span className={styles.kpiLabel}>Ahorro Cliente</span>
                    <Percent size={16} className={styles.kpiIcon} />
                  </div>
                  <div className={styles.kpiValue}>
                    {Math.round(data.porcentajeAhorro)}% OFF
                  </div>
                  <div className={styles.kpiSubtext}>
                    Ahorro: <strong>Bs. {Number(data.ahorroPorKitBs).toFixed(2)}</strong> / kit (Suma: Bs. {Number(data.precioSumaComponentes).toFixed(2)})
                  </div>
                </div>

                {/* KPI 4: Stock Virtual / Armable */}
                <div className={styles.kpiCard}>
                  <div className={styles.kpiHeader}>
                    <span className={styles.kpiLabel}>Stock Armable</span>
                    <Layers size={16} className={styles.kpiIcon} />
                  </div>
                  <div className={styles.kpiValue}>{data.stockVirtualActual} <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#64748b' }}>combos</span></div>
                  <div className={styles.kpiSubtext}>
                    Listos para vender con el stock actual
                  </div>
                </div>
              </div>

              {/* Section: Productos incluidos */}
              <div>
                <h4 className={styles.sectionTitle}>
                  <Package size={16} /> Productos incluidos en el combo
                </h4>
                <div className={styles.tableContainer}>
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th>Producto</th>
                        <th>Cantidad por combo</th>
                        <th>Precio individual</th>
                        <th>Stock en depósito</th>
                        <th style={{ textAlign: 'right' }}>Rinde para</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.componentes?.map((comp: any) => (
                        <tr key={comp.id}>
                          <td>
                            <div style={{ fontWeight: 600, color: '#0f172a' }}>{comp.nombre}</div>
                            <div style={{ fontSize: '0.72rem', color: '#64748b' }}>SKU: {comp.sku || 'N/A'}</div>
                          </td>
                          <td style={{ fontWeight: 600 }}>{comp.cantidadEnCombo} un.</td>
                          <td>Bs. {Number(comp.precioIndividual).toFixed(2)}</td>
                          <td style={{ fontWeight: 600, color: comp.stockDisponible === 0 ? '#ef4444' : '#0f172a' }}>
                            {comp.stockDisponible} un.
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <span
                              style={{
                                fontWeight: 700,
                                fontSize: '0.88rem',
                                color: comp.esCuelloDeBotella ? '#b45309' : '#0f172a',
                                backgroundColor: comp.esCuelloDeBotella ? '#fef3c7' : '#f1f5f9',
                                padding: '0.2rem 0.55rem',
                                borderRadius: '6px',
                              }}
                            >
                              {comp.kitsPosibles} combos
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Section: Métodos de Pago */}
              {data.desglosePagos?.length > 0 && (
                <div>
                  <h4 className={styles.sectionTitle}>
                    <CreditCard size={16} /> Salida por Métodos de Pago
                  </h4>
                  <div className={styles.paymentsList}>
                    {data.desglosePagos.map((p: any) => (
                      <div key={p.metodo} className={styles.paymentPill}>
                        <span style={{ fontWeight: 700, color: '#0f172a' }}>{p.metodo}:</span>
                        <span>{p.cantidad} kits</span>
                        <span style={{ color: '#64748b' }}>(Bs. {Number(p.totalBs).toFixed(2)})</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Section: Últimas Ventas */}
              <div>
                <h4 className={styles.sectionTitle}>
                  <Receipt size={16} /> Últimas Transacciones del Combo
                </h4>
                {data.ultimasVentas?.length === 0 ? (
                  <p style={{ margin: 0, fontSize: '0.8rem', color: '#94a3b8' }}>
                    No hay transacciones registradas aún para este combo.
                  </p>
                ) : (
                  <div className={styles.tableContainer}>
                    <table className={styles.table}>
                      <thead>
                        <tr>
                          <th>Ticket / Boleta</th>
                          <th>Fecha</th>
                          <th>Cliente</th>
                          <th>Cantidad</th>
                          <th>Método Pago</th>
                          <th style={{ textAlign: 'right' }}>Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.ultimasVentas.map((v: any) => (
                          <tr key={v.id}>
                            <td style={{ fontWeight: 600, color: '#0f172a' }}>{v.ticket}</td>
                            <td style={{ fontSize: '0.78rem', color: '#64748b' }}>
                              {new Date(v.fecha).toLocaleString()}
                            </td>
                            <td>{v.cliente}</td>
                            <td style={{ fontWeight: 600 }}>{v.cantidad} kit(s)</td>
                            <td>
                              <span className={styles.badge}>{v.metodoPago}</span>
                            </td>
                            <td style={{ textAlign: 'right', fontWeight: 700, color: '#0f172a' }}>
                              Bs. {Number(v.total).toFixed(2)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}
