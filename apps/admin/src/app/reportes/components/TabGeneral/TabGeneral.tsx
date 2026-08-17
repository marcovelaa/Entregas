'use client';
import React, { useState, useEffect } from 'react';
import { api } from '../../../../lib/axios';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, CartesianGrid as RechartsCartesianGrid, Tooltip as RechartsBarTooltip, XAxis as RechartsXAxis, YAxis as RechartsYAxis, ResponsiveContainer as RechartsResponsiveContainer, Legend } from 'recharts';
import styles from './TabGeneral.module.css';

export default function TabGeneral() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchResumen = async () => {
      try {
        const res = await api.get('/reportes/resumen');
        if (res.data.success) {
          setData(res.data.data);
        }
      } catch (error) {
        console.error('Error fetching resumen:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchResumen();
  }, []);

  if (loading) {
    return <div className={styles.loading}>Cargando analítica...</div>;
  }

  if (!data) {
    return <div className={styles.error}>No se pudo cargar el resumen.</div>;
  }

  const COLORS = ['#0ea5e9', '#10b981', '#f59e0b', '#ef4444'];

  return (
    <div>
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statTitle}>INGRESOS (30 DÍAS)</div>
          <div className={styles.statValue}>Bs. {data.totalIngresos.toFixed(2)}</div>
          <div className={`${styles.statTrend} ${data.variacionIngresos >= 0 ? styles.trendUp : styles.trendDown}`}>
            {data.variacionIngresos >= 0 ? '▲' : '▼'} {Math.abs(data.variacionIngresos).toFixed(1)}% vs mes anterior
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statTitle}>TICKET PROMEDIO</div>
          <div className={styles.statValue}>Bs. {data.ticketPromedio.toFixed(2)}</div>
          <div className={`${styles.statTrend} ${data.variacionTicket >= 0 ? styles.trendUp : styles.trendDown}`}>
            {data.variacionTicket >= 0 ? '▲' : '▼'} {Math.abs(data.variacionTicket).toFixed(1)}% vs mes anterior
          </div>
        </div>
      </div>

      <div className={styles.chartsRow}>
        <div className={styles.chartCardLarge}>
          <h3 className={styles.chartTitle}>Tendencia de Ventas (Últimos 30 días)</h3>
          <div className={styles.chartContainer}>
            <ResponsiveContainer>
              <AreaChart data={data.ventasPorDia} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorVentas" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0f172a" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#0f172a" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="fecha" tick={{ fontSize: 12, fill: '#64748b' }} tickFormatter={(val) => val.split('-').slice(1).join('/')} />
                <YAxis tick={{ fontSize: 12, fill: '#64748b' }} tickFormatter={(val) => `Bs ${val}`} />
                <RechartsTooltip formatter={(val: any) => [`Bs. ${val.toFixed(2)}`, 'Ventas']} labelFormatter={(label) => `Fecha: ${label}`} />
                <Area type="monotone" dataKey="total" stroke="#0f172a" strokeWidth={3} fillOpacity={1} fill="url(#colorVentas)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className={styles.chartCardSmall}>
          <h3 className={styles.chartTitle}>Métodos de Pago</h3>
          <div className={styles.chartContainer}>
            <ResponsiveContainer>
              <PieChart>
                <Pie data={data.metodosPago} cx="50%" cy="45%" innerRadius={60} outerRadius={90} paddingAngle={5} dataKey="total" nameKey="nombre">
                  {data.metodosPago.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <RechartsTooltip formatter={(val: any) => [`Bs. ${val.toFixed(2)}`, 'Total']} />
                <Legend verticalAlign="bottom" height={36} iconType="square" wrapperStyle={{ fontSize: '13px', paddingTop: '10px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className={styles.chartsRow} style={{ marginTop: '20px' }}>
        <div className={styles.chartCardSmall}>
          <h3 className={styles.chartTitle}>Top 5 Productos Más Vendidos</h3>
          <div className={styles.chartContainer}>
            <ResponsiveContainer>
              <BarChart data={data.topProductos} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <RechartsCartesianGrid strokeDasharray="3 3" horizontal={false} />
                <RechartsXAxis type="number" />
                <RechartsYAxis dataKey="nombre" type="category" width={120} tick={{ fontSize: 11 }} />
                <RechartsTooltip formatter={(val: any) => [val, 'Unidades']} />
                <Bar dataKey="cantidad" fill="#0ea5e9" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className={styles.chartCardSmall}>
          <h3 className={styles.chartTitle}>Ventas por Categoría</h3>
          <div className={styles.chartContainer}>
            <ResponsiveContainer>
              <PieChart>
                <Pie data={data.ventasPorCategoria} cx="50%" cy="45%" innerRadius={50} outerRadius={80} paddingAngle={2} dataKey="total" nameKey="nombre">
                  {data.ventasPorCategoria.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[(index + 1) % COLORS.length]} />
                  ))}
                </Pie>
                <RechartsTooltip formatter={(val: any) => [`Bs. ${val.toFixed(2)}`, 'Total']} />
                <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className={styles.chartCardFull}>
          <h3 className={styles.chartTitle}>Horarios Pico de Venta</h3>
          <div className={styles.chartContainerSmall}>
            <ResponsiveContainer>
              <BarChart data={data.horariosPico} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <RechartsCartesianGrid strokeDasharray="3 3" vertical={false} />
                <RechartsXAxis dataKey="hora" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <RechartsTooltip formatter={(val: any) => [val, 'Ventas']} />
                <Bar dataKey="cantidad" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
