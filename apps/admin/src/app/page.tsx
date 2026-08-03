'use client';
import { useEffect, useState } from 'react';
import styles from './page.module.css';
import { api } from '@/lib/axios';
import { TrendingUp, ShoppingCart, AlertTriangle, DollarSign, Plus, ArrowUpRight, CreditCard } from 'lucide-react';
import Link from 'next/link';

interface DashboardMetrics {
  ventasHoy: {
    total: number;
    cantidad: number;
    ticketPromedio: number;
  };
  graficoSemanal: { dia: string; total: number }[];
  distribucionPagos: { metodo: string; monto: number; porcentaje: number }[];
  alertasStock: { id: string; nombre: string; sku: string; stock: number; stockMinimo: number }[];
  resumenInventario: { totalProductos: number; totalStock: number; itemsCriticos: number };
  ventasRecientes: { id: string; ticket: string; total: number; metodoPago: string; fecha: string; cliente: string }[];
}

export default function DashboardPage() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const res = await api.get('/dashboard/metrics');
        setMetrics(res.data.data);
      } catch (err) {
        console.error('Error al cargar métricas del dashboard:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchMetrics();
  }, []);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Buenos días';
    if (hour < 19) return 'Buenas tardes';
    return 'Buenas noches';
  };

  if (loading) {
    return (
      <main className={styles.main}>
        <div className={styles.loader}>
          <div className={styles.spinner}></div>
          <span>Cargando centro de comando...</span>
        </div>
      </main>
    );
  }

  // Max value for chart scaling
  const maxSemana = Math.max(...(metrics?.graficoSemanal?.map((g) => Number(g.total || 0)) || [100]), 100);

  return (
    <main className={styles.main}>
      {/* HEADER */}
      <header className={styles.header}>
        <div>
          <h1 className={styles.greeting}>{getGreeting()}, Administrador</h1>
          <p className={styles.dateSub}>
            {new Date().toLocaleDateString('es-BO', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <Link href="/pos" className={styles.posBtn}>
          <Plus size={18} />
          <span>Nueva Venta (POS)</span>
        </Link>
      </header>

      {/* KPI METRICS (4 CARDS) */}
      <section className={styles.kpiGrid}>
        <div className={styles.kpiCard}>
          <div className={`${styles.kpiIcon} ${styles.kpiIconBlue}`}>
            <TrendingUp size={24} />
          </div>
          <div className={styles.kpiContent}>
            <span className={styles.kpiLabel}>Ingresos de Hoy</span>
            <span className={styles.kpiValue}>Bs. {Number(metrics?.ventasHoy?.total || 0).toFixed(2)}</span>
          </div>
        </div>

        <div className={styles.kpiCard}>
          <div className={`${styles.kpiIcon} ${styles.kpiIconPurple}`}>
            <ShoppingCart size={24} />
          </div>
          <div className={styles.kpiContent}>
            <span className={styles.kpiLabel}>Tickets Emitidos</span>
            <span className={styles.kpiValue}>{metrics?.ventasHoy?.cantidad || 0}</span>
          </div>
        </div>

        <div className={styles.kpiCard}>
          <div className={`${styles.kpiIcon} ${styles.kpiIconAmber}`}>
            <DollarSign size={24} />
          </div>
          <div className={styles.kpiContent}>
            <span className={styles.kpiLabel}>Ticket Promedio</span>
            <span className={styles.kpiValue}>Bs. {Number(metrics?.ventasHoy?.ticketPromedio || 0).toFixed(2)}</span>
          </div>
        </div>

        <div className={styles.kpiCard}>
          <div className={`${styles.kpiIcon} ${styles.kpiIconRed}`}>
            <AlertTriangle size={24} />
          </div>
          <div className={styles.kpiContent}>
            <span className={styles.kpiLabel}>Inventario Crítico</span>
            <span className={styles.kpiValue}>{metrics?.resumenInventario?.itemsCriticos || 0} items</span>
          </div>
        </div>
      </section>

      {/* MAIN LAYOUT (2 COLUMNS) */}
      <section className={styles.contentLayout}>
        
        {/* LEFT COLUMN: Charts & Recent Transactions */}
        <div className={styles.column}>
          
          {/* WEEKLY REVENUE CHART */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <h3 className={styles.cardTitle}>
                <TrendingUp size={18} />
                Ventas de los Últimos 7 Días
              </h3>
            </div>
            <div className={styles.chartContainer}>
              {metrics?.graficoSemanal?.map((item, index) => {
                const totalNum = Number(item.total || 0);
                const heightPercent = maxSemana > 0 ? (totalNum / maxSemana) * 100 : 0;
                const isMax = totalNum === maxSemana && totalNum > 0;

                return (
                  <div key={index} className={styles.chartColumn}>
                    <span className={styles.barVal}>
                      {totalNum > 0 ? `Bs. ${totalNum}` : '-'}
                    </span>
                    <div className={styles.barTrack}>
                      <div
                        className={`${styles.barFill} ${isMax ? styles.barFillHighlight : ''}`}
                        style={{ height: `${Math.max(heightPercent, 6)}%` }}
                      ></div>
                    </div>
                    <span className={styles.barDay}>{item.dia}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* RECENT SALES TABLE */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <h3 className={styles.cardTitle}>
                <ShoppingCart size={18} />
                Últimas Transacciones
              </h3>
              <Link href="/ventas" className={styles.cardAction}>
                Ver Historial <ArrowUpRight size={14} />
              </Link>
            </div>

            <div className={styles.tableContainer}>
              {!metrics?.ventasRecientes || metrics.ventasRecientes.length === 0 ? (
                <p className={styles.emptyState}>No hay ventas registradas recientemente.</p>
              ) : (
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Cliente</th>
                      <th>Ticket</th>
                      <th>Método</th>
                      <th>Hora</th>
                      <th style={{ textAlign: 'right' }}>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {metrics.ventasRecientes.map((v) => {
                      const metodo = (v.metodoPago || 'EFECTIVO').toUpperCase();
                      const badgeClass =
                        metodo === 'QR'
                          ? styles.payQr
                          : metodo === 'TARJETA'
                          ? styles.payTarjeta
                          : styles.payEfectivo;

                      return (
                        <tr key={v.id}>
                          <td className={styles.clientName}>{v.cliente}</td>
                          <td>
                            <span className={styles.ticketBadge}>{v.ticket}</span>
                          </td>
                          <td>
                            <span className={`${styles.payBadge} ${badgeClass}`}>{metodo}</span>
                          </td>
                          <td style={{ color: '#64748b', fontSize: '0.8rem' }}>
                            {new Date(v.fecha).toLocaleTimeString('es-BO', { hour: '2-digit', minute: '2-digit' })}
                          </td>
                          <td className={styles.amount}>Bs. {Number(v.total || 0).toFixed(2)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: Payment Distribution & Stock Alerts */}
        <div className={styles.column}>
          
          {/* PAYMENT METHODS BREAKDOWN */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <h3 className={styles.cardTitle}>
                <CreditCard size={18} />
                Métodos de Pago
              </h3>
            </div>
            <div className={styles.paymentList}>
              {metrics?.distribucionPagos?.map((item, idx) => (
                <div key={idx} className={styles.paymentItem}>
                  <div className={styles.paymentMeta}>
                    <span className={styles.paymentName}>{item.metodo}</span>
                    <span className={styles.paymentAmount}>
                      Bs. {Number(item.monto || 0).toFixed(2)} ({item.porcentaje}%)
                    </span>
                  </div>
                  <div className={styles.progressTrack}>
                    <div
                      className={styles.progressFill}
                      style={{
                        width: `${item.porcentaje}%`,
                        background:
                          item.metodo === 'EFECTIVO'
                            ? '#16a34a'
                            : item.metodo === 'QR'
                            ? '#2563eb'
                            : '#9333ea',
                      }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* CRITICAL STOCK ALERTS */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <h3 className={styles.cardTitle}>
                <AlertTriangle size={18} style={{ color: '#dc2626' }} />
                Inventario en Riesgo
              </h3>
              <Link href="/inventario" className={styles.cardAction}>
                Ver Inventario <ArrowUpRight size={14} />
              </Link>
            </div>
            <div className={styles.stockList}>
              {!metrics?.alertasStock || metrics.alertasStock.length === 0 ? (
                <p className={styles.emptyState}>No hay productos con stock crítico en este momento 👍</p>
              ) : (
                metrics.alertasStock.map((item) => (
                  <div key={item.id} className={styles.stockItem}>
                    <div className={styles.stockInfo}>
                      <span className={styles.stockName}>{item.nombre}</span>
                      <span className={styles.stockSku}>SKU: {item.sku}</span>
                    </div>
                    <span className={styles.stockPill}>{item.stock} uni.</span>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

      </section>
    </main>
  );
}

