'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import styles from './page.module.css';
import { api } from '@/lib/axios';
import { 
  Plus, Tag, Trash2, Edit, Ticket, Zap, Clock, AlertCircle, 
  BarChart2, Layers, Package, CheckCircle, ToggleLeft, ToggleRight, Loader2
} from 'lucide-react';
import { CampaignAnalyticsModal } from '@/components/organisms/CampaignAnalyticsModal';
import { ComboAnalyticsModal } from '@/components/organisms/ComboAnalyticsModal';

interface Descuento {
  id: string;
  nombre: string;
  descripcion?: string;
  codigoCupon?: string;
  tipo: 'PORCENTAJE' | 'MONTO_FIJO' | 'MONTO_FIJO_POR_UNIDAD' | 'COMBO' | 'LLEVA_X_PAGA_Y';
  valor: number;
  maxMontoDescuento?: number;
  alcance: 'GLOBAL' | 'CATEGORIA' | 'PRODUCTO' | 'VARIANTE' | 'EMPAQUE';
  canal: 'POS' | 'ECOMMERCE' | 'TODOS';
  cantidadRequerida: number;
  cantidadPaga: number;
  montoMinimoCompra?: number;
  limiteUsos?: number;
  limiteUsosPorCliente?: number;
  usosActuales: number;
  esAcumulable: boolean;
  prioridad: number;
  fechaInicio: string;
  fechaFin: string;
  activo: boolean;
  diasSemana?: number[];
  horaInicio?: string;
  horaFin?: string;
}

const DAY_LABELS: Record<number, string> = {
  0: 'Dom',
  1: 'Lun',
  2: 'Mar',
  3: 'Mié',
  4: 'Jue',
  5: 'Vie',
  6: 'Sáb',
};

function dayTimeLabel(d: Descuento): string | null {
  const days = d.diasSemana ?? [];
  const hasDays = days.length > 0;
  const hasTime = Boolean(d.horaInicio) && Boolean(d.horaFin);
  if (!hasDays && !hasTime) return null;

  const parts: string[] = [];
  if (hasDays) {
    const sorted = [...days].sort((a, b) => ((a + 6) % 7) - ((b + 6) % 7));
    parts.push(sorted.map((day) => DAY_LABELS[day] ?? String(day)).join(' · '));
  }
  if (hasTime) {
    const fmt = (t: string) => (t.endsWith(':00') ? t.slice(0, 2) : t);
    parts.push(`${fmt(d.horaInicio!)}-${fmt(d.horaFin!)}h`);
  }
  return parts.join(' · ');
}

export default function DescuentosDashboardPage() {
  const router = useRouter();
  const [mainTab, setMainTab] = useState<'promociones' | 'combos'>('promociones');
  const [descuentos, setDescuentos] = useState<Descuento[]>([]);
  const [combos, setCombos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTabFilter, setActiveTabFilter] = useState<'todas' | 'activas' | 'programadas' | 'vencidas'>('todas');
  const [selectedAnalyticsId, setSelectedAnalyticsId] = useState<string | null>(null);
  const [selectedComboAnalyticsId, setSelectedComboAnalyticsId] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [resDesc, resCombos] = await Promise.all([
        api.get('/descuentos'),
        api.get('/productos?tipo_producto=COMBO&limit=50'),
      ]);
      setDescuentos(resDesc.data.data || []);
      setCombos(resCombos.data.data || []);
    } catch (err) {
      console.error('Error cargando descuentos/combos:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDeleteDescuento = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar esta promoción?')) return;
    try {
      await api.delete(`/descuentos/${id}`);
      fetchData();
    } catch (err) {
      console.error('Error al eliminar descuento:', err);
    }
  };

  const handleToggleDescuento = async (id: string, currentStatus: boolean) => {
    try {
      await api.patch(`/descuentos/${id}`, { activo: !currentStatus });
      fetchData();
    } catch (err: any) {
      console.error('Error al cambiar estado de descuento:', err);
      alert('Error al cambiar estado: ' + (err?.response?.data?.message || err.message));
    }
  };

  const handleToggleCombo = async (id: string, currentStatus: boolean) => {
    try {
      await api.patch(`/productos/${id}`, { activo: !currentStatus });
      fetchData();
    } catch (err) {
      console.error('Error al cambiar estado de combo:', err);
    }
  };

  // Metrics for Promotions Tab
  const promoMetrics = useMemo(() => {
    const now = new Date();
    const next7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    let activeCount = 0;
    let totalUsos = 0;
    let porVencerCount = 0;

    descuentos.forEach((d) => {
      const inicio = new Date(d.fechaInicio);
      const fin = new Date(d.fechaFin);
      if (d.activo && inicio <= now && fin >= now) {
        activeCount++;
        if (fin <= next7Days) {
          porVencerCount++;
        }
      }
      if (d.codigoCupon && d.codigoCupon.trim() !== '') {
        totalUsos += d.usosActuales || 0;
      }
    });

    return {
      activas: activeCount,
      totalPromos: descuentos.length,
      totalUsos,
      porVencer: porVencerCount,
    };
  }, [descuentos]);

  // Metrics for Combos Tab
  const comboMetrics = useMemo(() => {
    const activeCombos = combos.filter((c) => c.activo).length;
    let totalComponentes = 0;
    combos.forEach((c) => {
      totalComponentes += c.componentes_combo?.length || 0;
    });

    return {
      totalCombos: combos.length,
      activeCombos,
      totalComponentes,
    };
  }, [combos]);

  // Tab Filtering for Promotions
  const filteredDescuentos = useMemo(() => {
    const now = new Date();
    return descuentos.filter((d) => {
      const inicio = new Date(d.fechaInicio);
      const fin = new Date(d.fechaFin);

      if (activeTabFilter === 'activas') {
        return d.activo && inicio <= now && fin >= now;
      }
      if (activeTabFilter === 'programadas') {
        return d.activo && inicio > now;
      }
      if (activeTabFilter === 'vencidas') {
        return fin < now || !d.activo;
      }
      return true;
    });
  }, [descuentos, activeTabFilter]);

  return (
    <main className={styles.main}>
      {/* Top Header */}
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Descuentos & Estrategia Comercial</h1>
          <p className={styles.subtitle}>
            Gestión centralizada de reglas de precios, promociones, cupones y paquetes comerciales
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          {mainTab === 'promociones' ? (
            <button onClick={() => router.push('/descuentos/nuevo')} className={styles.primaryBtn}>
              <Plus size={18} />
              <span>Nueva Promoción / Cupón</span>
            </button>
          ) : (
            <button
              onClick={() => router.push('/descuentos/combos/nuevo')}
              className={styles.primaryBtn}
            >
              <Plus size={18} />
              <span>Nuevo Combo / Kit</span>
            </button>
          )}
        </div>
      </header>

      {/* Main Navigation Segmented Control */}
      <div
        style={{
          display: 'flex',
          gap: '0.5rem',
          backgroundColor: '#ffffff',
          padding: '0.4rem',
          borderRadius: '12px',
          border: '1px solid #e2e8f0',
          width: 'fit-content',
        }}
      >
        <button
          onClick={() => setMainTab('promociones')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.65rem 1.25rem',
            borderRadius: '8px',
            border: 'none',
            fontWeight: 600,
            fontSize: '0.85rem',
            cursor: 'pointer',
            backgroundColor: mainTab === 'promociones' ? '#0f172a' : 'transparent',
            color: mainTab === 'promociones' ? '#ffffff' : '#64748b',
            transition: 'all 0.2s ease',
          }}
        >
          <Tag size={16} />
          <span>Promociones & Cupones</span>
          <span
            style={{
              fontSize: '0.75rem',
              backgroundColor: mainTab === 'promociones' ? '#334155' : '#f1f5f9',
              color: mainTab === 'promociones' ? '#ffffff' : '#475569',
              padding: '0.1rem 0.5rem',
              borderRadius: '10px',
              fontWeight: 700,
            }}
          >
            {descuentos.length}
          </span>
        </button>

        <button
          onClick={() => setMainTab('combos')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.65rem 1.25rem',
            borderRadius: '8px',
            border: 'none',
            fontWeight: 600,
            fontSize: '0.85rem',
            cursor: 'pointer',
            backgroundColor: mainTab === 'combos' ? '#0f172a' : 'transparent',
            color: mainTab === 'combos' ? '#ffffff' : '#64748b',
            transition: 'all 0.2s ease',
          }}
        >
          <Layers size={16} />
          <span>Combos & Kits (BOM)</span>
          <span
            style={{
              fontSize: '0.75rem',
              backgroundColor: mainTab === 'combos' ? '#334155' : '#f1f5f9',
              color: mainTab === 'combos' ? '#ffffff' : '#475569',
              padding: '0.1rem 0.5rem',
              borderRadius: '10px',
              fontWeight: 700,
            }}
          >
            {combos.length}
          </span>
        </button>
      </div>

      {/* Dynamic Metric Cards based on active tab */}
      {mainTab === 'promociones' ? (
        <section
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '1rem',
          }}
        >
          <div className={styles.card} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.25rem' }}>
            <div style={{ padding: '0.75rem', backgroundColor: '#ecfdf5', color: '#059669', borderRadius: '10px' }}>
              <Zap size={24} />
            </div>
            <div>
              <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>Campañas Activas</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0f172a' }}>{promoMetrics.activas}</div>
            </div>
          </div>

          <div className={styles.card} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.25rem' }}>
            <div style={{ padding: '0.75rem', backgroundColor: '#eff6ff', color: '#2563eb', borderRadius: '10px' }}>
              <Ticket size={24} />
            </div>
            <div>
              <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>Total Canjes Cupones</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0f172a' }}>{promoMetrics.totalUsos}</div>
            </div>
          </div>

          <div className={styles.card} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.25rem' }}>
            <div style={{ padding: '0.75rem', backgroundColor: '#fffbeb', color: '#d97706', borderRadius: '10px' }}>
              <Clock size={24} />
            </div>
            <div>
              <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>Vencen en 7 Días</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0f172a' }}>{promoMetrics.porVencer}</div>
            </div>
          </div>
        </section>
      ) : (
        <section
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '1rem',
          }}
        >
          <div className={styles.card} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.25rem' }}>
            <div style={{ padding: '0.75rem', backgroundColor: '#f1f5f9', color: '#0f172a', borderRadius: '10px' }}>
              <Layers size={24} />
            </div>
            <div>
              <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>Combos Publicados</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0f172a' }}>{comboMetrics.totalCombos}</div>
            </div>
          </div>

          <div className={styles.card} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.25rem' }}>
            <div style={{ padding: '0.75rem', backgroundColor: '#ecfdf5', color: '#059669', borderRadius: '10px' }}>
              <CheckCircle size={24} />
            </div>
            <div>
              <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>Combos Activos</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0f172a' }}>{comboMetrics.activeCombos}</div>
            </div>
          </div>

          <div className={styles.card} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.25rem' }}>
            <div style={{ padding: '0.75rem', backgroundColor: '#eff6ff', color: '#2563eb', borderRadius: '10px' }}>
              <Package size={24} />
            </div>
            <div>
              <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>Componentes Enlazados</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0f172a' }}>{comboMetrics.totalComponentes}</div>
            </div>
          </div>
        </section>
      )}

      {/* TAB 1: Promociones & Cupones View */}
      {mainTab === 'promociones' && (
        <section className={styles.card}>
          {/* Filter Sub-Tabs */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.75rem' }}>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              {(['todas', 'activas', 'programadas', 'vencidas'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTabFilter(tab)}
                  style={{
                    border: 'none',
                    background: activeTabFilter === tab ? '#f1f5f9' : 'transparent',
                    color: activeTabFilter === tab ? '#0f172a' : '#64748b',
                    padding: '0.4rem 0.8rem',
                    borderRadius: '6px',
                    fontSize: '0.85rem',
                    fontWeight: activeTabFilter === tab ? 700 : 500,
                    cursor: 'pointer',
                    textTransform: 'capitalize',
                  }}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
              <Loader2 size={28} className="spin" style={{ margin: '0 auto 0.5rem', color: '#0f172a' }} />
              Cargando promociones...
            </div>
          ) : filteredDescuentos.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
              <Tag size={32} color="#94a3b8" style={{ marginBottom: '0.5rem' }} />
              <p style={{ fontWeight: 600, margin: '0 0 0.25rem 0' }}>No se encontraron promociones</p>
              <p style={{ fontSize: '0.8rem', margin: 0 }}>Crea una regla de descuento o cupón para comenzar.</p>
            </div>
          ) : (
            <div className={styles.tableContainer}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Campaña / Nombre</th>
                    <th>Cupón</th>
                    <th>Tipo & Valor</th>
                    <th>Alcance & Canal</th>
                    <th>Usos / Límite</th>
                    <th>Vigencia</th>
                    <th>Estado</th>
                    <th style={{ textAlign: 'right' }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDescuentos.map((d) => {
                    const now = new Date();
                    const inicio = new Date(d.fechaInicio);
                    const fin = new Date(d.fechaFin);
                    const isLive = d.activo && inicio <= now && fin >= now;
                    const scheduleLabel = dayTimeLabel(d);

                    return (
                      <tr key={d.id}>
                        <td>
                          <div style={{ fontWeight: 600, color: '#0f172a' }}>{d.nombre}</div>
                          {d.descripcion && <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{d.descripcion}</div>}
                        </td>
                        <td>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', alignItems: 'flex-start' }}>
                            {d.codigoCupon ? (
                              <span className={styles.couponBadge}>{d.codigoCupon}</span>
                            ) : (
                              <span style={{ color: '#94a3b8', fontSize: '0.8rem' }}>Automático</span>
                            )}
                            {scheduleLabel && <span className={styles.scheduleBadge}>{scheduleLabel}</span>}
                          </div>
                        </td>
                        <td>
                          <div style={{ fontWeight: 600, color: '#0f172a' }}>
                            {d.tipo === 'PORCENTAJE' && `${d.valor}% OFF`}
                            {d.tipo === 'MONTO_FIJO' && `Bs. ${Number(d.valor).toFixed(2)} OFF`}
                            {d.tipo === 'MONTO_FIJO_POR_UNIDAD' && `Bs. ${Number(d.valor).toFixed(2)} / un.`}
                            {d.tipo === 'LLEVA_X_PAGA_Y' && `${d.cantidadRequerida}x${d.cantidadPaga}`}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{d.tipo}</div>
                        </td>
                        <td>
                          <div><span className={styles.scopeBadge}>{d.alcance}</span></div>
                          <span style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '2px', display: 'inline-block' }}>
                            {d.canal}
                          </span>
                        </td>
                        <td>
                          {d.limiteUsos && d.limiteUsos > 0 ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                              <span style={{ fontWeight: 700, color: '#0f172a' }}>{d.usosActuales}</span>
                              <span style={{ color: '#64748b', fontSize: '0.8rem' }}>/ {d.limiteUsos}</span>
                            </div>
                          ) : (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                              <span style={{ fontWeight: 700, color: '#0f172a' }}>{d.usosActuales}</span>
                              <span style={{ color: '#94a3b8', fontSize: '0.78rem' }}>· Ilimitado</span>
                            </div>
                          )}
                        </td>
                        <td>
                          <div style={{ fontSize: '0.8rem', color: '#334155' }}>
                            {new Date(d.fechaInicio).toLocaleDateString()} - {new Date(d.fechaFin).toLocaleDateString()}
                          </div>
                        </td>
                        <td>
                          <span className={`${styles.statusPill} ${isLive ? styles.statusActive : styles.statusExpired}`}>
                            {isLive ? 'Activo' : 'Inactivo'}
                          </span>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'flex-end', alignItems: 'center' }}>
                            <button
                              onClick={() => setSelectedAnalyticsId(d.id)}
                              className={styles.deleteBtn}
                              style={{ color: '#0f172a' }}
                              title="Ver Analíticas"
                            >
                              <BarChart2 size={16} />
                            </button>
                            <button
                              onClick={() => router.push(`/descuentos/${d.id}`)}
                              className={styles.deleteBtn}
                              style={{ color: '#2563eb' }}
                              title="Editar Descuento"
                            >
                              <Edit size={16} />
                            </button>
                            <button
                              onClick={() => handleToggleDescuento(d.id, d.activo)}
                              className={styles.deleteBtn}
                              style={{ color: d.activo ? '#16a34a' : '#94a3b8' }}
                              title={d.activo ? 'Desactivar' : 'Activar'}
                            >
                              {d.activo ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
                            </button>
                            <button
                              onClick={() => handleDeleteDescuento(d.id)}
                              className={styles.deleteBtn}
                              title="Eliminar"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {/* TAB 2: Combos & Kits View */}
      {mainTab === 'combos' && (
        <section className={styles.card}>
          <div style={{ marginBottom: '1.25rem', paddingBottom: '0.75rem', borderBottom: '1px solid #e2e8f0' }}>
            <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: '#0f172a' }}>
              Combos & Paquetes Promocionales (Kits BOM)
            </h3>
            <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.8rem', color: '#64748b' }}>
              Artículos virtuales empaquetados con deducción atómica de inventario al vender
            </p>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
              <Loader2 size={28} className="spin" style={{ margin: '0 auto 0.5rem', color: '#0f172a' }} />
              Cargando combos...
            </div>
          ) : combos.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
              <Layers size={32} color="#94a3b8" style={{ marginBottom: '0.5rem' }} />
              <p style={{ fontWeight: 600, margin: '0 0 0.25rem 0' }}>No tienes combos creados aún</p>
              <p style={{ fontSize: '0.8rem', margin: 0 }}>Crea un combo promocional uniendo 2 o más productos existentes.</p>
            </div>
          ) : (
            <div className={styles.tableContainer}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Nombre del Combo</th>
                    <th>SKU & Canal</th>
                    <th>Categoría</th>
                    <th>Componentes en Receta (BOM)</th>
                    <th>Cupo / Ventas</th>
                    <th>Precio del Combo</th>
                    <th>Estado</th>
                    <th style={{ textAlign: 'right' }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {combos.map((c) => {
                    const estadoVenta = c.estado_venta || (c.activo ? 'ACTIVO' : 'INACTIVO');
                    const comboActivo = estadoVenta === 'ACTIVO';
                    const estadoLabel = estadoVenta === 'ACTIVO' ? 'Activo' : estadoVenta === 'VENCIDO' ? 'Vencido' : estadoVenta === 'AGOTADO' ? 'Agotado' : 'Inactivo';
                    const hasCupo = typeof c.cupo_maximo === 'number' && c.cupo_maximo > 0;
                    const cupoUsado = c.cupo_usado ?? 0;
                    const cupoPct = hasCupo ? Math.min(100, Math.round((cupoUsado / c.cupo_maximo) * 100)) : 0;
                    const barColor = cupoPct >= 100 ? '#ef4444' : cupoPct >= 80 ? '#f59e0b' : '#0f172a';
                    const canal = c.canal_venta || 'AMBOS';

                    return (
                    <tr key={c.id}>
                      <td style={{ fontWeight: 600, color: '#0f172a' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <span
                            style={{
                              backgroundColor: '#f1f5f9',
                              color: '#334155',
                              border: '1px solid #e2e8f0',
                              fontSize: '0.7rem',
                              padding: '0.15rem 0.4rem',
                              borderRadius: '4px',
                              fontWeight: 700,
                            }}
                          >
                            KIT
                          </span>
                          {c.nombre}
                        </div>
                      </td>
                      <td>
                        <div style={{ fontSize: '0.82rem', color: '#0f172a', fontWeight: 500 }}>{c.sku || 'N/A'}</div>
                        <span
                          style={{
                            display: 'inline-block',
                            marginTop: '2px',
                            fontSize: '0.68rem',
                            fontWeight: 600,
                            padding: '0.1rem 0.45rem',
                            borderRadius: '4px',
                            backgroundColor: canal === 'ECOMMERCE' ? '#eff6ff' : canal === 'POS' ? '#f0fdf4' : '#f8fafc',
                            color: canal === 'ECOMMERCE' ? '#1d4ed8' : canal === 'POS' ? '#15803d' : '#64748b',
                            border: `1px solid ${canal === 'ECOMMERCE' ? '#bfdbfe' : canal === 'POS' ? '#bbf7d0' : '#e2e8f0'}`,
                          }}
                        >
                          {canal === 'ECOMMERCE' ? 'E-commerce' : canal === 'POS' ? 'POS' : 'Omnicanal'}
                        </span>
                      </td>
                      <td>{c.categoria?.nombre || 'General'}</td>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#0f172a' }}>
                            {c.componentes_combo?.length || 0} producto(s)
                          </span>
                          <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                            {c.componentes_combo?.map((comp: any) => `${comp.cantidad}x ${comp.componente_producto?.nombre || 'Item'}`).join(', ')}
                          </span>
                        </div>
                      </td>
                      <td>
                        {hasCupo ? (
                          <div style={{ minWidth: '100px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: '3px' }}>
                              <span style={{ fontWeight: 700, color: '#0f172a' }}>{cupoUsado}</span>
                              <span style={{ color: '#64748b' }}>/ {c.cupo_maximo} kits</span>
                            </div>
                            <div style={{ width: '100%', height: '6px', backgroundColor: '#e2e8f0', borderRadius: '3px', overflow: 'hidden' }}>
                              <div style={{ width: `${cupoPct}%`, height: '100%', backgroundColor: barColor, borderRadius: '3px', transition: 'width 0.3s' }} />
                            </div>
                            <div style={{ fontSize: '0.68rem', color: '#94a3b8', marginTop: '2px', textAlign: 'right' }}>
                              {cupoPct}% vendido
                            </div>
                          </div>
                        ) : (
                          <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                            Sin límite
                          </span>
                        )}
                      </td>
                      <td style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.95rem' }}>
                        Bs. {Number(c.precio_base).toFixed(2)}
                      </td>
                      <td>
                        <span className={`${styles.statusPill} ${comboActivo ? styles.statusActive : styles.statusExpired}`}>
                          {estadoLabel}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'flex-end', alignItems: 'center' }}>
                          <button
                            onClick={() => setSelectedComboAnalyticsId(c.id)}
                            className={styles.deleteBtn}
                            style={{ color: '#0f172a' }}
                            title="Ver Rendimiento del Combo"
                          >
                            <BarChart2 size={16} />
                          </button>
                          <button
                            onClick={() => router.push(`/descuentos/combos/${c.id}`)}
                            className={styles.deleteBtn}
                            style={{ color: '#2563eb' }}
                            title="Editar Combo"
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            onClick={() => handleToggleCombo(c.id, c.activo)}
                            className={styles.deleteBtn}
                            style={{ color: c.activo ? '#16a34a' : '#94a3b8' }}
                            title={c.activo ? 'Desactivar' : 'Activar'}
                          >
                            {c.activo ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
                          </button>
                        </div>
                      </td>
                    </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {/* Campaign Analytics Modal */}
      <CampaignAnalyticsModal
        discountId={selectedAnalyticsId}
        onClose={() => setSelectedAnalyticsId(null)}
      />

      {/* Combo Analytics Modal */}
      <ComboAnalyticsModal
        comboId={selectedComboAnalyticsId}
        onClose={() => setSelectedComboAnalyticsId(null)}
      />
    </main>
  );
}
