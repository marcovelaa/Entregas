'use client';
import React, { useState, useEffect } from 'react';
import { api } from '../../lib/axios';
import styles from './page.module.css';
import { LayoutDashboard, Receipt, Package, Users, DollarSign, TrendingDown, AlertTriangle, Calculator } from 'lucide-react';
import GastosTab from './components/GastosTab';

export default function ReportesPage() {
  const [activeTab, setActiveTab] = useState('general');

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Reportes y Analítica</h1>
      </div>

      <div style={{ display: 'flex', gap: '10px', borderBottom: '1px solid #e2e8f0', marginBottom: '20px', overflowX: 'auto' }}>
        <button 
          onClick={() => setActiveTab('general')}
          style={{ padding: '10px 15px', display: 'flex', alignItems: 'center', gap: '8px', background: 'transparent', border: 'none', borderBottom: activeTab === 'general' ? '2px solid #0f172a' : '2px solid transparent', color: activeTab === 'general' ? '#0f172a' : '#64748b', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}
        >
          <LayoutDashboard size={18} /> Visión General
        </button>
        <button 
          onClick={() => setActiveTab('ventas')}
          style={{ padding: '10px 15px', display: 'flex', alignItems: 'center', gap: '8px', background: 'transparent', border: 'none', borderBottom: activeTab === 'ventas' ? '2px solid #0f172a' : '2px solid transparent', color: activeTab === 'ventas' ? '#0f172a' : '#64748b', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}
        >
          <Receipt size={18} /> Ventas
        </button>
        <button 
          onClick={() => setActiveTab('inventario')}
          style={{ padding: '10px 15px', display: 'flex', alignItems: 'center', gap: '8px', background: 'transparent', border: 'none', borderBottom: activeTab === 'inventario' ? '2px solid #0f172a' : '2px solid transparent', color: activeTab === 'inventario' ? '#0f172a' : '#64748b', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}
        >
          <Package size={18} /> Salud del Stock
        </button>
        <button 
          onClick={() => setActiveTab('vendedores')}
          style={{ padding: '10px 15px', display: 'flex', alignItems: 'center', gap: '8px', background: 'transparent', border: 'none', borderBottom: activeTab === 'vendedores' ? '2px solid #0f172a' : '2px solid transparent', color: activeTab === 'vendedores' ? '#0f172a' : '#64748b', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}
        >
          <Users size={18} /> Vendedores
        </button>
        <button 
          onClick={() => setActiveTab('gastos')}
          style={{ padding: '10px 15px', display: 'flex', alignItems: 'center', gap: '8px', background: 'transparent', border: 'none', borderBottom: activeTab === 'gastos' ? '2px solid #0f172a' : '2px solid transparent', color: activeTab === 'gastos' ? '#0f172a' : '#64748b', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}
        >
          <Calculator size={18} /> Gastos Operativos
        </button>
      </div>

      {activeTab === 'general' && <TabGeneral />}
      {activeTab === 'ventas' && <TabVentas />}
      {activeTab === 'inventario' && <TabInventario />}
      {activeTab === 'vendedores' && <TabVendedores />}
      {activeTab === 'gastos' && <GastosTab />}
    </div>
  );
}

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, CartesianGrid as RechartsCartesianGrid, Tooltip as RechartsBarTooltip, XAxis as RechartsXAxis, YAxis as RechartsYAxis, ResponsiveContainer as RechartsResponsiveContainer, Legend } from 'recharts';

function TabGeneral() {
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
    return <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>Cargando analítica...</div>;
  }

  if (!data) {
    return <div style={{ padding: '40px', textAlign: 'center', color: '#ef4444' }}>No se pudo cargar el resumen.</div>;
  }

  const COLORS = ['#0ea5e9', '#10b981', '#f59e0b', '#ef4444'];

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 250px), 1fr))', gap: '20px', marginBottom: '30px' }}>
        <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '20px' }}>
          <div style={{ fontSize: '13px', color: '#64748b', fontWeight: 600 }}>INGRESOS (30 DÍAS)</div>
          <div style={{ fontSize: '28px', fontWeight: 700, color: '#0f172a', marginTop: '5px' }}>Bs. {data.totalIngresos.toFixed(2)}</div>
          <div style={{ fontSize: '12px', color: data.variacionIngresos >= 0 ? '#10b981' : '#ef4444', marginTop: '8px', fontWeight: 600 }}>
            {data.variacionIngresos >= 0 ? '▲' : '▼'} {Math.abs(data.variacionIngresos).toFixed(1)}% vs mes anterior
          </div>
        </div>
        <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '20px' }}>
          <div style={{ fontSize: '13px', color: '#64748b', fontWeight: 600 }}>TICKET PROMEDIO</div>
          <div style={{ fontSize: '28px', fontWeight: 700, color: '#0f172a', marginTop: '5px' }}>Bs. {data.ticketPromedio.toFixed(2)}</div>
          <div style={{ fontSize: '12px', color: data.variacionTicket >= 0 ? '#10b981' : '#ef4444', marginTop: '8px', fontWeight: 600 }}>
            {data.variacionTicket >= 0 ? '▲' : '▼'} {Math.abs(data.variacionTicket).toFixed(1)}% vs mes anterior
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px' }}>
        <div style={{ flex: '2 1 300px', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '20px' }}>
          <h3 style={{ fontSize: '16px', color: '#0f172a', marginBottom: '20px', fontWeight: 600 }}>Tendencia de Ventas (Últimos 30 días)</h3>
          <div style={{ width: '100%', height: 300 }}>
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

        <div style={{ flex: '1 1 300px', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '20px', display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ fontSize: '16px', color: '#0f172a', marginBottom: '20px', fontWeight: 600 }}>Métodos de Pago</h3>
          <div style={{ width: '100%', height: 300 }}>
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

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', marginTop: '20px' }}>
        {/* Top 5 Productos */}
        <div style={{ flex: '1 1 300px', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '20px' }}>
          <h3 style={{ fontSize: '16px', color: '#0f172a', marginBottom: '20px', fontWeight: 600 }}>Top 5 Productos Más Vendidos</h3>
          <div style={{ width: '100%', height: 300 }}>
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

        {/* Ventas por Categoría */}
        <div style={{ flex: '1 1 300px', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '20px', display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ fontSize: '16px', color: '#0f172a', marginBottom: '20px', fontWeight: 600 }}>Ventas por Categoría</h3>
          <div style={{ width: '100%', height: 300 }}>
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

        {/* Horarios Pico */}
        <div style={{ flex: '2 1 100%', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '20px' }}>
          <h3 style={{ fontSize: '16px', color: '#0f172a', marginBottom: '20px', fontWeight: 600 }}>Horarios Pico de Venta</h3>
          <div style={{ width: '100%', height: 250 }}>
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

function TabInventario() {
  const [salud, setSalud] = useState<{
    capitalInmovilizado: number, 
    stockCritico: number, 
    lentosMovimientos: number,
    valorTotalInventario: number,
    topCapitalInmovilizado: any[],
    topStockCritico: any[],
    topLentosMovimientos: any[]
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInventario = async () => {
      try {
        const resSalud = await api.get('/reportes/salud-stock');
        if (resSalud.data.success) {
          setSalud(resSalud.data.data);
        }
      } catch (error) {
        console.error('Error fetching inventario data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchInventario();
  }, []);

  // Safe variables for percentages
  const porcentajeInmovilizado = salud && salud.valorTotalInventario > 0 
    ? (salud.capitalInmovilizado / salud.valorTotalInventario) * 100 
    : 0;

  return (
    <div>
      <div className={styles.statsGrid} style={{ marginBottom: '30px' }}>
        
        {/* NEW CARD: Valor Total Inventario */}
        <div className={styles.statCard}>
          <div className={styles.statHeader}>
            <h3 className={styles.statTitle}>Valor Total Inventario</h3>
            <div className={styles.statIcon}><DollarSign size={20} strokeWidth={1.5} /></div>
          </div>
          <div className={styles.statValue}>Bs. {salud?.valorTotalInventario.toLocaleString('en-US', {minimumFractionDigits: 2}) || '0.00'}</div>
          <p className={styles.statDesc}>Suma del costo de todo el stock actual</p>
        </div>

        {/* Capital Inmovilizado con barra de porcentaje */}
        <div className={styles.statCard}>
          <div className={styles.statHeader}>
            <h3 className={styles.statTitle} style={{ color: porcentajeInmovilizado > 20 ? '#e11d48' : '#64748b' }}>Capital Inmovilizado</h3>
            <div className={styles.statIcon} style={{ color: porcentajeInmovilizado > 20 ? '#e11d48' : '#94a3b8' }}><TrendingDown size={20} strokeWidth={1.5} /></div>
          </div>
          <div className={styles.statValue}>Bs. {salud?.capitalInmovilizado.toLocaleString('en-US', {minimumFractionDigits: 2}) || '0.00'}</div>
          <div className={styles.progressBarContainer}>
            <div 
              className={styles.progressBarFill} 
              style={{ width: `${Math.min(porcentajeInmovilizado, 100)}%`, background: porcentajeInmovilizado > 20 ? '#ef4444' : '#f59e0b' }} 
            />
          </div>
          <p className={styles.statDesc} style={{ marginTop: '8px' }}>
            Representa el <strong style={{color: porcentajeInmovilizado > 20 ? '#ef4444' : '#f59e0b', fontWeight: 600}}>{porcentajeInmovilizado.toFixed(1)}%</strong> del valor total (huesos)
          </p>
        </div>
        
        {/* Stock Critico */}
        <div className={styles.statCard} style={{ borderColor: (salud?.stockCritico || 0) > 0 ? '#fda4af' : '#e2e8f0' }}>
          <div className={styles.statHeader}>
            <h3 className={styles.statTitle} style={{ color: (salud?.stockCritico || 0) > 0 ? '#e11d48' : '#64748b' }}>Stock Crítico</h3>
            <div className={styles.statIcon} style={{ color: (salud?.stockCritico || 0) > 0 ? '#e11d48' : '#94a3b8' }}><AlertTriangle size={20} strokeWidth={1.5} /></div>
          </div>
          <div className={styles.statValue} style={{ color: (salud?.stockCritico || 0) > 0 ? '#e11d48' : '#0f172a' }}>{salud?.stockCritico || 0} alertas</div>
          <p className={styles.statDesc} style={{ color: (salud?.stockCritico || 0) > 0 ? '#be123c' : '#64748b' }}>Productos por debajo del nivel mínimo</p>
        </div>
        
        {/* Lento Movimiento */}
        <div className={styles.statCard}>
          <div className={styles.statHeader}>
            <h3 className={styles.statTitle}>Lento Mov. (Huesos)</h3>
            <div className={styles.statIcon}><Package size={20} strokeWidth={1.5} /></div>
          </div>
          <div className={styles.statValue} style={{ color: '#d97706' }}>{salud?.lentosMovimientos || 0} ítems</div>
          <p className={styles.statDesc}>Más de 60 días sin ventas</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 350px), 1fr))', gap: '30px' }}>
        
        {/* Top 10 Stock Crítico */}
        <div style={{ minWidth: 0 }}>
          <h3 style={{ fontSize: '1.1rem', marginBottom: '16px', color: '#334155', fontWeight: 600 }}>Top 10 Stock Crítico</h3>
          <div className={styles.tableContainer}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>SKU</th>
                  <th>Producto</th>
                  <th>Vendidos (30d)</th>
                  <th>Stock / Mínimo</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={4} style={{ textAlign: 'center', padding: '2rem' }}>Cargando...</td></tr>
                ) : !salud?.topStockCritico?.length ? (
                  <tr><td colSpan={4} style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>No hay alertas críticas</td></tr>
                ) : (
                  salud.topStockCritico.map((item) => (
                    <tr key={item.id}>
                      <td style={{ fontFamily: 'monospace', color: '#64748b' }}>{item.sku}</td>
                      <td style={{ fontWeight: 500 }}>{item.producto}</td>
                      <td style={{ textAlign: 'center', color: '#475569', fontWeight: 600 }}>{item.ventas30Dias} uds.</td>
                      <td>
                        <span style={{ color: '#e11d48', fontWeight: 700 }}>{item.stock}</span> / <span style={{ color: '#64748b' }}>{item.minimo}</span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* LENTOS MOVIMIENTOS */}
        <div style={{ minWidth: 0 }}>
          <h3 style={{ fontSize: '1.1rem', color: '#334155', fontWeight: 600, marginBottom: '16px' }}>Top Lentos Movimientos</h3>
          <div className={styles.tableContainer}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>SKU</th>
                  <th>Producto</th>
                  <th>Última Venta</th>
                  <th style={{ textAlign: 'right' }}>Stock Disp.</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={4} style={{ textAlign: 'center', padding: '2rem' }}>Cargando...</td></tr>
                ) : !salud?.topLentosMovimientos?.length ? (
                  <tr><td colSpan={4} style={{ textAlign: 'center', padding: '2rem', color: '#10b981' }}>Excelente rotación</td></tr>
                ) : (
                  salud.topLentosMovimientos.map((item) => (
                    <tr key={item.id}>
                      <td style={{ fontFamily: 'monospace', color: '#64748b' }}>{item.sku}</td>
                      <td style={{ fontWeight: 500 }}>{item.producto}</td>
                      <td style={{ color: '#64748b', fontSize: '0.8rem' }}>
                        {typeof item.diasSinVender === 'number' ? `Hace ${item.diasSinVender} días` : item.diasSinVender}
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 'bold', color: '#d97706' }}>{item.stock}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      
      {/* CAPITAL INMOVILIZADO */}
      <div style={{ marginTop: '30px', marginBottom: '20px' }}>
        <h3 style={{ fontSize: '1.1rem', color: '#334155', fontWeight: 600, marginBottom: '16px' }}>Top Capital Inmovilizado (Huesos)</h3>
        <div className={styles.tableContainer} style={{ maxWidth: '100%' }}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>SKU</th>
                <th>Producto</th>
                <th>Última Venta</th>
                <th style={{ textAlign: 'right' }}>Stock Estancado</th>
                <th style={{ textAlign: 'right' }}>Valor Inmov. (Bs.)</th>
                <th style={{ textAlign: 'right' }}>% del Estancado</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} style={{ textAlign: 'center', padding: '2rem' }}>Cargando...</td></tr>
              ) : !salud?.topCapitalInmovilizado?.length ? (
                <tr><td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: '#10b981' }}>Cero capital inmovilizado</td></tr>
              ) : (
                salud.topCapitalInmovilizado.map((item) => {
                  const pesoPorcentaje = salud.capitalInmovilizado > 0 ? (Number(item.valorInmovilizado) / salud.capitalInmovilizado) * 100 : 0;
                  return (
                    <tr key={item.id}>
                      <td style={{ fontFamily: 'monospace', color: '#64748b' }}>{item.sku}</td>
                      <td style={{ fontWeight: 500 }}>{item.producto}</td>
                      <td style={{ color: '#64748b', fontSize: '0.8rem' }}>
                        {typeof item.diasSinVender === 'number' ? `Hace ${item.diasSinVender} días` : item.diasSinVender}
                      </td>
                      <td style={{ textAlign: 'right', color: '#d97706', fontWeight: 600 }}>{item.stock} uds.</td>
                      <td style={{ textAlign: 'right', fontWeight: 'bold', color: '#ef4444' }}>
                        {item.valorInmovilizado.toLocaleString('en-US', {minimumFractionDigits: 2})}
                      </td>
                      <td style={{ textAlign: 'right', color: '#334155', fontWeight: 600 }}>
                        {pesoPorcentaje.toFixed(1)}%
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function PlaceholderTab({ title, message }: { title: string, message: string }) {
  return (
    <div style={{ padding: '40px 20px', textAlign: 'center', background: '#f8fafc', border: '1px dashed #cbd5e1', borderRadius: '12px' }}>
      <h2 style={{ fontSize: '1.2rem', color: '#334155', marginBottom: '10px' }}>{title}</h2>
      <p style={{ color: '#64748b', maxWidth: '600px', margin: '0 auto' }}>{message}</p>
    </div>
  );
}

function TabVentas() {
  const [ventas, setVentas] = useState<any[]>([]);
  const [meta, setMeta] = useState<any>({ totalPages: 1, currentPage: 1, totalRecords: 0, totalMonto: 0 });
  const [loading, setLoading] = useState(true);
  
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [metodoPago, setMetodoPago] = useState('');
  const [estado, setEstado] = useState('');
  const [canalVenta, setCanalVenta] = useState('');
  const [vendedorId, setVendedorId] = useState('');
  const [tieneDescuento, setTieneDescuento] = useState('');
  const [search, setSearch] = useState('');
  const [vendedores, setVendedores] = useState<any[]>([]);
  const [page, setPage] = useState(1);

  const [debouncedSearch, setDebouncedSearch] = useState('');

  const [selectedTicket, setSelectedTicket] = useState<string | null>(null);
  const [ticketDetails, setTicketDetails] = useState<any>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  const handleRowClick = async (numeroTicket: string) => {
    setSelectedTicket(numeroTicket);
    setLoadingDetails(true);
    try {
      const res = await api.get(`/reportes/ventas/${numeroTicket}`);
      if (res.data.success) {
        setTicketDetails(res.data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleDescargarPDF = async () => {
    const element = document.getElementById('proforma-invoice');
    if (!element || !ticketDetails) return;
    
    try {
      // @ts-ignore
      const html2pdf = (await import('html2pdf.js')).default;
      const opt: any = {
        margin:       15,
        filename:     `Proforma_${ticketDetails.numeroTicket}.pdf`,
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { scale: 2, useCORS: true },
        jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
      };
      
      html2pdf().from(element).set(opt).save();
    } catch (e) {
      console.error('Error generando PDF', e);
      alert('Error al generar el PDF.');
    }
  };

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedSearch(search), 500);
    return () => clearTimeout(handler);
  }, [search]);

  useEffect(() => {
    api.get('/reportes/vendedores')
      .then(res => { if (res.data.success) setVendedores(res.data.data); })
      .catch(console.error);
  }, []);

  const fetchReporte = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('limit', '20');
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      if (metodoPago) params.append('metodoPago', metodoPago);
      if (estado) params.append('estado', estado);
      if (canalVenta) params.append('canalVenta', canalVenta);
      if (vendedorId) params.append('vendedorId', vendedorId);
      if (tieneDescuento) params.append('tieneDescuento', tieneDescuento);
      if (debouncedSearch) params.append('search', debouncedSearch);

      const res = await api.get(`/reportes/ventas?${params.toString()}`);
      if (res.data.success) {
        setVentas(res.data.data);
        setMeta(res.data.meta);
      }
    } catch (error) {
      console.error('Error fetching reportes:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReporte();
  }, [page, startDate, endDate, metodoPago, estado, canalVenta, vendedorId, tieneDescuento, debouncedSearch]);

  const handleExportCSV = () => {
    if (ventas.length === 0) {
      alert("No hay datos para exportar.");
      return;
    }
    const headers = ['Ticket', 'Fecha', 'Cliente', 'NIT/CI', 'Articulos', 'Vendedor', 'Canal', 'Método', 'Estado', 'Descuento', 'Total'];
    const rows = ventas.map(v => [
      v.numeroTicket,
      new Date(v.fecha).toLocaleString('es-BO'),
      `"${v.cliente}"`,
      `"${v.clienteDocumento || ''}"`,
      v.cantidadArticulos || 0,
      `"${v.vendedor}"`,
      v.canalVenta || 'PRESENCIAL',
      v.metodoPago,
      v.estado,
      v.descuentoTotal?.toString().replace('.', ',') || '0,00',
      v.total.toString().replace('.', ',')
    ]);
    
    const csvContent = "\uFEFF" + headers.join(";") + "\n" + rows.map(e => e.join(";")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `reporte_ventas_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleExportGeneralPDF = async () => {
    if (ventas.length === 0) {
      alert("No hay datos para exportar.");
      return;
    }
    
    const html2pdf = (await import('html2pdf.js')).default;
    
    // Sort to find real dates
    const sortedVentas = [...ventas].sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime());
    const firstDate = startDate ? new Date(startDate).toLocaleDateString('es-BO') : new Date(sortedVentas[0].fecha).toLocaleDateString('es-BO');
    const lastDate = endDate ? new Date(endDate).toLocaleDateString('es-BO') : new Date(sortedVentas[sortedVentas.length - 1].fecha).toLocaleDateString('es-BO');
    const periodoStr = `Del ${firstDate} al ${lastDate}`;
    
    // Borde negro delgado
    const borderColor = '#000000';
    
    const printContainer = document.createElement('div');
    printContainer.id = 'pdf-export-temp-container';
    printContainer.innerHTML = `
      <style>
        #pdf-export-temp-container { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #334155; }
        #pdf-export-temp-container tr { page-break-inside: avoid; }
        #pdf-export-temp-container th { background: #0f172a; color: #ffffff; font-weight: 600; text-align: left; padding: 12px; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; }
        #pdf-export-temp-container td { border-bottom: 1px solid #e2e8f0; padding: 10px 12px; font-size: 11px; color: #334155; }
        #pdf-export-temp-container tbody tr:nth-child(even) { background-color: #f8fafc; }
        #pdf-export-temp-container tbody tr.anulada td { color: #ef4444; text-decoration: line-through; }
      </style>
      <div style="padding: 40px; width: 100%; box-sizing: border-box; background: white;">
        
        <!-- Header -->
        <div style="display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #0f172a; padding-bottom: 20px; margin-bottom: 30px;">
          <div>
            <div style="font-size: 28px; font-weight: 800; color: #0f172a; letter-spacing: -0.5px; margin-bottom: 4px;">ENTREGAS ERP</div>
            <div style="font-size: 11px; color: #64748b; font-weight: 500; text-transform: uppercase; letter-spacing: 1px;">Reporte Ejecutivo de Ventas</div>
          </div>
          <div style="text-align: right;">
            <p style="margin: 0 0 4px 0; color: #0f172a; font-size: 12px; font-weight: 600;">Fecha de Emisión: ${new Date().toLocaleDateString('es-BO')}</p>
            <p style="margin: 0; color: #64748b; font-size: 11px;">Hora: ${new Date().toLocaleTimeString('es-BO')}</p>
          </div>
        </div>

        <!-- Meta Info -->
        <div style="display: flex; gap: 40px; margin-bottom: 30px; background: #f8fafc; padding: 20px; border-radius: 8px; border: 1px solid #e2e8f0;">
          <div>
            <div style="font-size: 10px; color: #64748b; text-transform: uppercase; font-weight: 700; margin-bottom: 4px;">Periodo Analizado</div>
            <div style="font-size: 13px; color: #0f172a; font-weight: 600;">${periodoStr}</div>
          </div>
          ${estado ? `<div>
            <div style="font-size: 10px; color: #64748b; text-transform: uppercase; font-weight: 700; margin-bottom: 4px;">Estado</div>
            <div style="font-size: 13px; color: #0f172a; font-weight: 600;">${estado}</div>
          </div>` : ''}
          ${metodoPago ? `<div>
            <div style="font-size: 10px; color: #64748b; text-transform: uppercase; font-weight: 700; margin-bottom: 4px;">Método de Pago</div>
            <div style="font-size: 13px; color: #0f172a; font-weight: 600;">${metodoPago}</div>
          </div>` : ''}
          ${canalVenta ? `<div>
            <div style="font-size: 10px; color: #64748b; text-transform: uppercase; font-weight: 700; margin-bottom: 4px;">Canal de Venta</div>
            <div style="font-size: 13px; color: #0f172a; font-weight: 600;">${canalVenta}</div>
          </div>` : ''}
        </div>

        <!-- Resumen Financiero -->
        <div style="display: flex; gap: 20px; margin-bottom: 30px;">
          <div style="flex: 1; border-left: 4px solid #10b981; padding: 15px 20px; background: #f0fdf4; border-radius: 0 8px 8px 0;">
            <div style="font-size: 11px; font-weight: 700; color: #065f46; text-transform: uppercase; letter-spacing: 0.5px;">Ingresos Brutos</div>
            <div style="font-size: 24px; font-weight: 800; color: #064e3b; margin-top: 5px;">Bs. ${meta.totalMonto.toFixed(2)}</div>
          </div>
          <div style="flex: 1; border-left: 4px solid #3b82f6; padding: 15px 20px; background: #eff6ff; border-radius: 0 8px 8px 0;">
            <div style="font-size: 11px; font-weight: 700; color: #1e40af; text-transform: uppercase; letter-spacing: 0.5px;">Volumen (Transacciones)</div>
            <div style="font-size: 24px; font-weight: 800; color: #1e3a8a; margin-top: 5px;">${meta.totalRecords}</div>
          </div>
          <div style="flex: 1; border-left: 4px solid #ef4444; padding: 15px 20px; background: #fef2f2; border-radius: 0 8px 8px 0;">
            <div style="font-size: 11px; font-weight: 700; color: #991b1b; text-transform: uppercase; letter-spacing: 0.5px;">Total Descuentos</div>
            <div style="font-size: 24px; font-weight: 800; color: #7f1d1d; margin-top: 5px;">Bs. ${(meta.totalDescuento || 0).toFixed(2)}</div>
          </div>
        </div>

        <!-- Tabla -->
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 40px;">
          <thead>
            <tr>
              <th>Ticket ID</th>
              <th>Fecha y Hora</th>
              <th>Cliente</th>
              <th style="text-align: center;">Artículos</th>
              <th>Canal</th>
              <th>Método Pago</th>
              <th style="text-align: right;">Descuento</th>
              <th style="text-align: right;">Total Importe</th>
            </tr>
          </thead>
          <tbody>
            ${ventas.map(v => `
              <tr class="${v.estado === 'ANULADA' ? 'anulada' : ''}">
                <td style="font-weight: 600; color: #0f172a;">${v.numeroTicket}</td>
                <td>${new Date(v.fecha).toLocaleString('es-BO', { dateStyle: 'short', timeStyle: 'short' })}</td>
                <td>${v.cliente}</td>
                <td style="text-align: center; font-weight: 600;">${v.cantidadArticulos || 0}</td>
                <td>${v.canalVenta || 'PRESENCIAL'}</td>
                <td>${v.metodoPago}</td>
                <td style="text-align: right; color: ${v.descuentoTotal > 0 ? '#ef4444' : 'inherit'};">${v.descuentoTotal > 0 ? '-Bs. ' + v.descuentoTotal.toFixed(2) : '-'}</td>
                <td style="text-align: right; font-weight: 700; color: #0f172a;">Bs. ${v.total.toFixed(2)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <!-- Footer -->
        <div style="border-top: 1px solid #e2e8f0; padding-top: 20px; text-align: center;">
          <p style="margin: 0; font-size: 10px; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px;">Documento generado automáticamente por el sistema ERP Entregas. Uso interno confidencial.</p>
        </div>
      </div>
    `;
    
    const opt: any = {
      margin: 10,
      filename: `Reporte_General_Ventas_${new Date().toISOString().split('T')[0]}.pdf`,
      image: { type: 'jpeg', quality: 1 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' },
      pagebreak: { mode: 'css', avoid: 'tr' }
    };

    html2pdf().set(opt).from(printContainer).save();
  };

  const setQuickDate = (type: 'hoy' | 'semana' | 'mes' | 'anterior') => {
    const today = new Date();
    let start = new Date();
    let end = new Date();
    
    if (type === 'hoy') {
      // Hoy
    } else if (type === 'semana') {
      start.setDate(today.getDate() - today.getDay());
    } else if (type === 'mes') {
      start = new Date(today.getFullYear(), today.getMonth(), 1);
    } else if (type === 'anterior') {
      start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      end = new Date(today.getFullYear(), today.getMonth(), 0);
    }
    
    setStartDate(start.toISOString().split('T')[0]);
    setEndDate(end.toISOString().split('T')[0]);
    setPage(1);
  };

  return (
    <div>
      <div style={{ marginBottom: '20px', display: 'flex', gap: '15px', flexWrap: 'wrap', alignItems: 'flex-end', background: '#f8fafc', padding: '15px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
        
        <div style={{ flex: '1 1 200px' }}>
          <label style={{display: 'block', fontSize: '12px', marginBottom: '5px', color: '#64748b', fontWeight: 600}}>BUSCAR TICKET O CLIENTE</label>
          <input 
            type="text" 
            placeholder="Ej: Juan Perez o #ticket..." 
            value={search} 
            onChange={e => {setSearch(e.target.value); setPage(1);}} 
            style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }} 
          />
        </div>

        <div>
          <label style={{display: 'block', fontSize: '12px', marginBottom: '5px', color: '#64748b', fontWeight: 600}}>VENDEDOR</label>
          <select value={vendedorId} onChange={e => { setVendedorId(e.target.value); setPage(1); }} style={{ padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', minWidth: '150px' }}>
            <option value="">Todos los Vendedores</option>
            {vendedores.map(v => (
              <option key={v.id} value={v.id}>{v.nombre || `${v.nombres || ''} ${v.apellidos || ''}`.trim()}</option>
            ))}
          </select>
        </div>

        <div>
          <label style={{display: 'block', fontSize: '12px', marginBottom: '5px', color: '#64748b', fontWeight: 600}}>F. INICIO</label>
          <input type="date" value={startDate} onChange={e => {setStartDate(e.target.value); setPage(1);}} style={{ padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
        </div>
        <div>
          <label style={{display: 'block', fontSize: '12px', marginBottom: '5px', color: '#64748b', fontWeight: 600}}>F. FIN</label>
          <input type="date" value={endDate} onChange={e => {setEndDate(e.target.value); setPage(1);}} style={{ padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
        </div>
        
        <div style={{ display: 'flex', gap: '5px' }}>
          <button onClick={() => setQuickDate('hoy')} style={{ padding: '8px 12px', fontSize: '12px', borderRadius: '6px', border: '1px solid #e2e8f0', background: 'white', cursor: 'pointer' }}>Hoy</button>
          <button onClick={() => setQuickDate('semana')} style={{ padding: '8px 12px', fontSize: '12px', borderRadius: '6px', border: '1px solid #e2e8f0', background: 'white', cursor: 'pointer' }}>Semana</button>
          <button onClick={() => setQuickDate('mes')} style={{ padding: '8px 12px', fontSize: '12px', borderRadius: '6px', border: '1px solid #e2e8f0', background: 'white', cursor: 'pointer' }}>Este Mes</button>
          <button onClick={() => setQuickDate('anterior')} style={{ padding: '8px 12px', fontSize: '12px', borderRadius: '6px', border: '1px solid #e2e8f0', background: 'white', cursor: 'pointer' }}>Mes Anterior</button>
        </div>

        <div>
          <label style={{display: 'block', fontSize: '12px', marginBottom: '5px', color: '#64748b', fontWeight: 600}}>MÉTODO DE PAGO</label>
          <select value={metodoPago} onChange={e => { setMetodoPago(e.target.value); setPage(1); }} style={{ padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', minWidth: '150px' }}>
            <option value="">Todos</option>
            <option value="EFECTIVO">Efectivo</option>
            <option value="QR">QR</option>
            <option value="TARJETA">Tarjeta</option>
          </select>
        </div>
        <div>
          <label style={{display: 'block', fontSize: '12px', marginBottom: '5px', color: '#64748b', fontWeight: 600}}>ESTADO</label>
          <select value={estado} onChange={e => { setEstado(e.target.value); setPage(1); }} style={{ padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', minWidth: '150px' }}>
            <option value="">Todos</option>
            <option value="COMPLETADA">Completada</option>
            <option value="ANULADA">Anulada</option>
          </select>
        </div>
        <div>
          <label style={{display: 'block', fontSize: '12px', marginBottom: '5px', color: '#64748b', fontWeight: 600}}>CANAL</label>
          <select value={canalVenta} onChange={e => { setCanalVenta(e.target.value); setPage(1); }} style={{ padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', minWidth: '130px' }}>
            <option value="">Todos</option>
            <option value="PRESENCIAL">Presencial</option>
            <option value="ONLINE">Online</option>
          </select>
        </div>
        <div>
          <label style={{display: 'block', fontSize: '12px', marginBottom: '5px', color: '#64748b', fontWeight: 600}}>DESCUENTO</label>
          <select value={tieneDescuento} onChange={e => { setTieneDescuento(e.target.value); setPage(1); }} style={{ padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', minWidth: '150px' }}>
            <option value="">Todas las Ventas</option>
            <option value="SI">Con Descuento</option>
            <option value="NO">Sin Descuento</option>
          </select>
        </div>
        <div style={{ marginLeft: 'auto', alignSelf: 'flex-end', display: 'flex', gap: '10px' }}>
          <button 
            onClick={handleExportGeneralPDF}
            style={{
              padding: '10px 16px', background: '#3b82f6', color: 'white', borderRadius: '8px',
              border: 'none', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px'
            }}
          >
            Descargar PDF
          </button>
          <button 
            onClick={handleExportCSV}
            style={{
              padding: '10px 16px', background: '#0f172a', color: 'white', borderRadius: '8px',
              border: 'none', fontWeight: 600, cursor: 'pointer'
            }}
          >
            Exportar CSV
          </button>
        </div>
      </div>

      <div id="general-ventas-table-container">
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', marginBottom: '20px' }}>
          <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '15px', flex: '1 1 200px' }}>
            <div style={{ fontSize: '13px', color: '#64748b', fontWeight: 600 }}>MONTO TOTAL (FILTRADO)</div>
            <div style={{ fontSize: '24px', fontWeight: 700, color: '#0f172a', marginTop: '5px' }}>Bs. {meta.totalMonto.toFixed(2)}</div>
          </div>
          <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '15px', flex: '1 1 200px' }}>
            <div style={{ fontSize: '13px', color: '#64748b', fontWeight: 600 }}>REGISTROS ENCONTRADOS</div>
            <div style={{ fontSize: '24px', fontWeight: 700, color: '#0f172a', marginTop: '5px' }}>{meta.totalRecords} tickets</div>
          </div>
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '15px', flex: '1 1 200px' }}>
            <div style={{ fontSize: '13px', color: '#ef4444', fontWeight: 600 }}>DESCUENTOS APLICADOS</div>
            <div style={{ fontSize: '24px', fontWeight: 700, color: '#991b1b', marginTop: '5px' }}>Bs. {(meta.totalDescuento || 0).toFixed(2)}</div>
          </div>
        </div>

        <div className={styles.tableContainer}>
          <table style={{ width: '100%', minWidth: '750px', borderCollapse: 'collapse', marginTop: '20px', background: 'white', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0', color: '#475569', fontSize: '13px', textAlign: 'left' }}>
                <th style={{ padding: '15px' }}>Ticket</th>
                <th style={{ padding: '15px' }}>Fecha</th>
                <th style={{ padding: '15px' }}>Cliente</th>
                <th style={{ padding: '15px', textAlign: 'center' }}>Artículos</th>
                <th style={{ padding: '15px' }}>Vendedor</th>
                <th style={{ padding: '15px' }}>Canal</th>
                <th style={{ padding: '15px' }}>Pago</th>
                <th style={{ padding: '15px', textAlign: 'right' }}>Descuento</th>
                <th style={{ padding: '15px', textAlign: 'right' }}>Total (Bs.)</th>
                <th style={{ padding: '15px', textAlign: 'center' }}>Estado</th>
              </tr>
            </thead>
            <tbody>
            {loading ? (
              <tr>
                <td colSpan={10} style={{ padding: '40px 0', textAlign: 'center', color: '#64748b' }}>Cargando ventas...</td>
              </tr>
            ) : ventas.length === 0 ? (
              <tr>
                <td colSpan={10} style={{ padding: '40px 0', textAlign: 'center', color: '#64748b' }}>No hay ventas registradas</td>
              </tr>
            ) : (
              ventas.map((venta) => (
                <tr 
                  key={venta.id} 
                  onClick={() => handleRowClick(venta.numeroTicket)}
                  style={{ cursor: 'pointer', borderBottom: '1px solid #f1f5f9' }}
                  className={styles.rowHover}
                >
                  <td style={{ padding: '15px', fontWeight: 600, fontSize: '13px', color: '#0f172a' }}>{venta.numeroTicket}</td>
                  <td style={{ padding: '15px', fontSize: '13px', color: '#475569' }}>{new Date(venta.fecha).toLocaleString('es-BO', { dateStyle: 'short', timeStyle: 'short' })}</td>
                  <td style={{ padding: '15px', fontSize: '13px', color: '#0f172a' }}>
                    <div style={{ fontWeight: 500 }}>{venta.cliente}</div>
                  </td>
                  <td style={{ padding: '15px', fontSize: '13px', color: '#475569', textAlign: 'center', fontWeight: 600 }}>{venta.cantidadArticulos || 0}</td>
                  <td style={{ padding: '15px', fontSize: '13px', color: '#475569' }}>{venta.vendedor}</td>
                  <td style={{ padding: '15px' }}>
                    <span style={{ 
                      color: venta.canalVenta === 'ONLINE' ? '#3b82f6' : '#64748b', 
                      fontWeight: 600, 
                      fontSize: '11px',
                      background: venta.canalVenta === 'ONLINE' ? '#eff6ff' : '#f8fafc',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      letterSpacing: '0.5px'
                    }}>
                      {venta.canalVenta || 'PRESENCIAL'}
                    </span>
                  </td>
                  <td style={{ padding: '15px', fontSize: '13px', color: '#475569' }}>{venta.metodoPago}</td>
                  <td style={{ padding: '15px', fontSize: '13px', textAlign: 'right', color: venta.descuentoTotal > 0 ? '#ef4444' : '#94a3b8' }}>
                    {venta.descuentoTotal > 0 ? `- Bs. ${venta.descuentoTotal.toFixed(2)}` : '-'}
                  </td>
                  <td style={{ padding: '15px', fontSize: '14px', textAlign: 'right', fontWeight: 700, color: '#0f172a' }}>
                    Bs. {venta.total.toFixed(2)}
                  </td>
                  <td style={{ padding: '15px', textAlign: 'center' }}>
                    <span style={{ 
                      color: venta.estado === 'COMPLETADA' ? '#166534' : '#991b1b', 
                      fontWeight: 600, fontSize: '11px', 
                      padding: '4px 8px', borderRadius: '4px', 
                      backgroundColor: venta.estado === 'COMPLETADA' ? '#dcfce7' : '#fee2e2'
                    }}>
                      {venta.estado}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {!loading && meta.totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px' }}>
          <div style={{ fontSize: '14px', color: '#64748b' }}>
            Mostrando página {meta.currentPage} de {meta.totalPages} ({meta.totalRecords} registros)
          </div>
          <div style={{ display: 'flex', gap: '5px' }}>
            <button 
              disabled={page === 1}
              onClick={() => setPage(page - 1)}
              style={{ padding: '6px 12px', border: '1px solid #e2e8f0', borderRadius: '6px', background: page === 1 ? '#f8fafc' : 'white', cursor: page === 1 ? 'not-allowed' : 'pointer', color: page === 1 ? '#94a3b8' : '#0f172a' }}
            >
              Anterior
            </button>
            <button 
              disabled={page === meta.totalPages}
              onClick={() => setPage(page + 1)}
              style={{ padding: '6px 12px', border: '1px solid #e2e8f0', borderRadius: '6px', background: page === meta.totalPages ? '#f8fafc' : 'white', cursor: page === meta.totalPages ? 'not-allowed' : 'pointer', color: page === meta.totalPages ? '#94a3b8' : '#0f172a' }}
            >
              Siguiente
            </button>
          </div>
        </div>
      )}

      {/* MODAL DETALLE DE TICKET */}
      {selectedTicket && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
          background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(4px)',
          display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999
        }}>
          <div style={{ background: 'white', border: '1px solid #cbd5e1', borderRadius: '4px', width: '100%', maxWidth: '900px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div id="proforma-invoice" style={{ padding: 'clamp(16px, 4vw, 50px)', background: 'white', fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
              
              {/* Header Corporativo */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '30px', borderBottom: '2px solid #0f172a', paddingBottom: '20px' }}>
                <div>
                  <h1 style={{ fontSize: '28px', fontWeight: 800, color: '#0f172a', margin: '0 0 4px 0', letterSpacing: '-0.5px', textTransform: 'uppercase' }}>Comprobante de Venta</h1>
                  <p style={{ color: '#64748b', fontSize: '13px', margin: 0, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.5px' }}>TICKET Nº <strong style={{ color: '#0f172a' }}>{selectedTicket}</strong></p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '22px', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.5px' }}>ENTREGAS ERP</div>
                  <p style={{ color: '#64748b', fontSize: '12px', margin: '4px 0 0 0', fontWeight: 500 }}>NIT: 1234567890</p>
                  <p style={{ color: '#64748b', fontSize: '12px', margin: '2px 0 0 0', fontWeight: 500 }}>Av. Principal #123, Santa Cruz</p>
                </div>
              </div>

              {loadingDetails ? (
                <div style={{ padding: '60px 0', textAlign: 'center', color: '#64748b', fontSize: '14px' }}>Cargando información del documento...</div>
              ) : ticketDetails ? (
                <div>
                  {/* Bloques de Datos */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '30px', marginBottom: '40px', background: '#f8fafc', padding: '25px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    <div style={{ flex: '1 1 250px' }}>
                      <div style={{ fontSize: '10px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px' }}>Datos del Cliente</div>
                      <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr', gap: '8px', fontSize: '13px', color: '#0f172a' }}>
                        <span style={{ color: '#475569', fontWeight: 500 }}>Nombre:</span> <strong>{ticketDetails.cliente?.nombre || 'Cliente General'}</strong>
                        {ticketDetails.cliente?.documento_id && <><span style={{ color: '#475569', fontWeight: 500 }}>NIT/CI:</span> <strong>{ticketDetails.cliente.documento_id}</strong></>}
                        {ticketDetails.cliente?.telefono && <><span style={{ color: '#475569', fontWeight: 500 }}>Teléfono:</span> <span>{ticketDetails.cliente.telefono}</span></>}
                        {ticketDetails.cliente?.email && <><span style={{ color: '#475569', fontWeight: 500 }}>Email:</span> <span>{ticketDetails.cliente.email}</span></>}
                        {ticketDetails.cliente?.direccion && <><span style={{ color: '#475569', fontWeight: 500 }}>Dirección:</span> <span>{ticketDetails.cliente.direccion}</span></>}
                      </div>
                    </div>
                    
                    <div style={{ flex: '1 1 250px' }}>
                      <div style={{ fontSize: '10px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px' }}>Datos de la Operación</div>
                      <div style={{ display: 'grid', gridTemplateColumns: '100px 1fr', gap: '8px', fontSize: '13px', color: '#0f172a' }}>
                        <span style={{ color: '#475569', fontWeight: 500 }}>Fecha y Hora:</span> <strong>{new Date(ticketDetails.fecha).toLocaleString()}</strong>
                        <span style={{ color: '#475569', fontWeight: 500 }}>Atendido por:</span> <span>{ticketDetails.vendedor}</span>
                        <span style={{ color: '#475569', fontWeight: 500 }}>Método Pago:</span> <strong>{ticketDetails.metodoPago}</strong>
                        <span style={{ color: '#475569', fontWeight: 500 }}>Canal:</span> <span>{ticketDetails.canalVenta || 'PRESENCIAL'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Tabla Principal */}
                  <div style={{ marginBottom: '40px', overflowX: 'auto' }}>
                    <table style={{ width: '100%', minWidth: '500px', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr>
                          <th style={{ padding: '12px', textAlign: 'center', fontSize: '11px', fontWeight: 600, color: '#ffffff', background: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Cant.</th>
                          <th style={{ padding: '12px', textAlign: 'left', fontSize: '11px', fontWeight: 600, color: '#ffffff', background: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Descripción del Producto</th>
                          <th style={{ padding: '12px', textAlign: 'right', fontSize: '11px', fontWeight: 600, color: '#ffffff', background: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Precio Unitario</th>
                          <th style={{ padding: '12px', textAlign: 'right', fontSize: '11px', fontWeight: 600, color: '#ffffff', background: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Subtotal</th>
                        </tr>
                      </thead>
                      <tbody>
                        {ticketDetails.detalles.map((d: any, i: number) => (
                          <tr key={d.id} style={{ background: i % 2 === 0 ? '#ffffff' : '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                            <td style={{ padding: '12px', fontSize: '13px', color: '#0f172a', verticalAlign: 'top', textAlign: 'center', fontWeight: 600 }}>{d.cantidad}</td>
                            <td style={{ padding: '12px', fontSize: '13px', color: '#0f172a' }}>
                              <div style={{ fontWeight: 600 }}>{d.producto}</div>
                              {d.variante && <div style={{ color: '#64748b', fontSize: '12px', marginTop: '2px' }}>{d.variante}</div>}
                              {d.aprobador && (
                                <div style={{ fontSize: '10px', color: '#ef4444', marginTop: '4px', textTransform: 'uppercase', fontWeight: 600 }}>
                                  * Descuento autorizado por: {d.aprobador}
                                </div>
                              )}
                            </td>
                            <td style={{ padding: '12px', fontSize: '13px', textAlign: 'right', color: '#475569', verticalAlign: 'top' }}>
                              Bs. {d.precioUnitario?.toFixed(2) || (d.subtotal/d.cantidad).toFixed(2)}
                            </td>
                            <td style={{ padding: '12px', fontSize: '13px', textAlign: 'right', fontWeight: 700, color: '#0f172a', verticalAlign: 'top' }}>
                              Bs. {d.subtotal.toFixed(2)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Totales Netos */}
                  <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <div style={{ width: '100%', maxWidth: '350px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', fontSize: '13px', color: '#475569', borderBottom: '1px solid #e2e8f0' }}>
                        <span>Subtotal Neto:</span>
                        <span style={{ color: '#0f172a', fontWeight: 600 }}>Bs. {(ticketDetails.total + ticketDetails.descuentoTotal).toFixed(2)}</span>
                      </div>
                      {ticketDetails.descuentoTotal > 0 && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', fontSize: '13px', color: '#ef4444', borderBottom: '1px solid #e2e8f0', fontWeight: 500 }}>
                          <span>Descuento Aplicado:</span>
                          <span>- Bs. {ticketDetails.descuentoTotal.toFixed(2)}</span>
                        </div>
                      )}
                      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '15px 0', fontSize: '18px', fontWeight: 800, color: '#0f172a', borderBottom: '2px solid #0f172a' }}>
                        <span>TOTAL A PAGAR:</span>
                        <span>Bs. {ticketDetails.total.toFixed(2)}</span>
                      </div>
                      
                      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', fontSize: '12px', color: '#64748b', marginTop: '10px' }}>
                        <span>Abonado con {ticketDetails.metodoPago}:</span>
                        <span>Bs. {ticketDetails.montoPagado.toFixed(2)}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', fontSize: '12px', color: '#64748b' }}>
                        <span>Cambio Entregado:</span>
                        <span>Bs. {ticketDetails.vuelto.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Footer */}
                  <div style={{ marginTop: '50px', borderTop: '1px solid #e2e8f0', paddingTop: '20px', textAlign: 'center' }}>
                    <p style={{ margin: 0, fontSize: '10px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px' }}>Documento generado automáticamente por el sistema ERP Entregas. Uso interno confidencial.</p>
                  </div>
                </div>
              ) : (
                <div style={{ color: '#ef4444' }}>Error al cargar los datos del ticket</div>
              )}
            </div>
            
            <div style={{ padding: 'clamp(12px, 3vw, 20px) clamp(16px, 4vw, 50px)', background: '#f8fafc', borderTop: '1px solid #e2e8f0', display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button 
                onClick={handleDescargarPDF}
                style={{ padding: '10px 24px', background: 'white', color: '#0f172a', border: '1px solid #cbd5e1', borderRadius: '4px', fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', transition: 'all 0.2s', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}
                onMouseOver={(e) => e.currentTarget.style.background = '#f1f5f9'}
                onMouseOut={(e) => e.currentTarget.style.background = 'white'}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                Descargar en PDF
              </button>
              <button 
                onClick={() => setSelectedTicket(null)}
                style={{ padding: '10px 24px', background: '#0f172a', color: 'white', border: '1px solid #0f172a', borderRadius: '4px', fontWeight: 500, cursor: 'pointer', fontSize: '13px', transition: 'all 0.2s' }}
                onMouseOver={(e) => e.currentTarget.style.background = '#1e293b'}
                onMouseOut={(e) => e.currentTarget.style.background = '#0f172a'}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}

function TabVendedores() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const fetchVendedores = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      const res = await api.get(`/reportes/vendedores?${params.toString()}`);
      if (res.data.success) {
        setData(res.data.data);
      }
    } catch (error) {
      console.error('Error fetching vendedores:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVendedores();
  }, [startDate, endDate]);

  const handleExportCSV = () => {
    if (data.length === 0) return;
    const headers = ['Vendedor', 'Total Ventas (Bs)', 'Cantidad Tickets', 'Ticket Promedio (Bs)'];
    const rows = data.map(v => [
      `"${v.nombre}"`,
      v.totalVentas.toFixed(2).replace('.', ','),
      v.cantidadTickets,
      v.ticketPromedio.toFixed(2).replace('.', ',')
    ]);
    
    const csvContent = "\uFEFF" + headers.join(";") + "\n" + rows.map(e => e.join(";")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `rendimiento_vendedores_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const setQuickDate = (type: 'hoy' | 'semana' | 'mes' | 'anterior') => {
    const today = new Date();
    let start = new Date();
    let end = new Date();
    
    if (type === 'hoy') {
      // Hoy
    } else if (type === 'semana') {
      start.setDate(today.getDate() - today.getDay());
    } else if (type === 'mes') {
      start = new Date(today.getFullYear(), today.getMonth(), 1);
    } else if (type === 'anterior') {
      start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      end = new Date(today.getFullYear(), today.getMonth(), 0);
    }
    
    setStartDate(start.toISOString().split('T')[0]);
    setEndDate(end.toISOString().split('T')[0]);
  };

  return (
    <div>
      <div style={{ marginBottom: '20px', display: 'flex', gap: '15px', flexWrap: 'wrap', alignItems: 'center' }}>
        <div>
          <label style={{display: 'block', fontSize: '12px', marginBottom: '5px', color: '#64748b', fontWeight: 600}}>F. INICIO</label>
          <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} style={{ padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
        </div>
        <div>
          <label style={{display: 'block', fontSize: '12px', marginBottom: '5px', color: '#64748b', fontWeight: 600}}>F. FIN</label>
          <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} style={{ padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
        </div>
        <div style={{ display: 'flex', gap: '5px', alignSelf: 'flex-end', paddingBottom: '2px' }}>
          <button onClick={() => setQuickDate('hoy')} style={{ padding: '8px 12px', fontSize: '12px', borderRadius: '6px', border: '1px solid #e2e8f0', background: 'white', cursor: 'pointer' }}>Hoy</button>
          <button onClick={() => setQuickDate('semana')} style={{ padding: '8px 12px', fontSize: '12px', borderRadius: '6px', border: '1px solid #e2e8f0', background: 'white', cursor: 'pointer' }}>Semana</button>
          <button onClick={() => setQuickDate('mes')} style={{ padding: '8px 12px', fontSize: '12px', borderRadius: '6px', border: '1px solid #e2e8f0', background: 'white', cursor: 'pointer' }}>Este Mes</button>
          <button onClick={() => setQuickDate('anterior')} style={{ padding: '8px 12px', fontSize: '12px', borderRadius: '6px', border: '1px solid #e2e8f0', background: 'white', cursor: 'pointer' }}>Mes Anterior</button>
        </div>
        <div style={{ marginLeft: 'auto', alignSelf: 'flex-end' }}>
          <button 
            onClick={handleExportCSV}
            style={{ padding: '10px 16px', background: '#0f172a', color: 'white', borderRadius: '8px', border: 'none', fontWeight: 600, cursor: 'pointer' }}
          >
            Exportar CSV
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', marginBottom: '30px' }}>
        <div style={{ flex: '1 1 100%', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '20px', background: 'white' }}>
          <h3 style={{ fontSize: '16px', color: '#0f172a', marginBottom: '20px', fontWeight: 600 }}>Ranking de Ventas (Top Vendedores)</h3>
          <div style={{ width: '100%', height: 350 }}>
            {loading ? (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: '#64748b' }}>Cargando métricas...</div>
            ) : data.length === 0 ? (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: '#64748b' }}>No hay ventas en este periodo.</div>
            ) : (
              <RechartsResponsiveContainer>
                <BarChart data={data} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <RechartsCartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#e2e8f0" />
                  <RechartsXAxis type="number" tickFormatter={(val) => `Bs ${val}`} />
                  <RechartsYAxis dataKey="nombre" type="category" width={150} tick={{ fontSize: 12, fill: '#0f172a' }} />
                  <RechartsBarTooltip formatter={(val: any) => [`Bs. ${val.toFixed(2)}`, 'Ventas Totales']} />
                  <Bar dataKey="totalVentas" fill="#0f172a" radius={[0, 4, 4, 0]} barSize={24} />
                </BarChart>
              </RechartsResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Vendedor / Staff</th>
              <th style={{ textAlign: 'right' }}>Total Facturado</th>
              <th style={{ textAlign: 'right' }}>Tickets Emitidos</th>
              <th style={{ textAlign: 'right' }}>Ticket Promedio</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={4} style={{ textAlign: 'center', padding: '2rem' }}>Cargando...</td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={4} style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>No hay datos para las fechas seleccionadas</td>
              </tr>
            ) : (
              data.map((item) => (
                <tr key={item.id}>
                  <td style={{ fontWeight: 600, color: '#0f172a' }}>{item.nombre}</td>
                  <td style={{ textAlign: 'right', fontWeight: 'bold', color: '#10b981' }}>Bs. {item.totalVentas.toFixed(2)}</td>
                  <td style={{ textAlign: 'right' }}>{item.cantidadTickets}</td>
                  <td style={{ textAlign: 'right', color: '#64748b' }}>Bs. {item.ticketPromedio.toFixed(2)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
