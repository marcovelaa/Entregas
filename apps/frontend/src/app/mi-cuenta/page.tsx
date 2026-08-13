'use client';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from './MiCuenta.module.css';
import Link from 'next/link';
import { api } from '../../lib/api';

interface Cliente {
  id: string;
  nombres: string;
  apellidos: string;
  email: string;
  telefono: string | null;
}

interface Direccion {
  id: string;
  alias: string;
  destinatario_nombre: string;
  destinatario_apellidos: string;
  direccion_completa: string;
  ciudad: string;
  telefono: string;
  referencia: string | null;
  es_principal: boolean;
}

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
  costo_envio: number;
  direccion_envio_snapshot: any;
  creado_en: string;
  detalles: PedidoDetalle[];
}

const DIRECCION_FORM_INICIAL = {
  alias: '',
  destinatario_nombre: '',
  destinatario_apellidos: '',
  direccion_completa: '',
  ciudad: '',
  telefono: '',
  referencia: '',
};

export default function MiCuentaPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('resumen');
  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [perfilForm, setPerfilForm] = useState({ nombres: '', apellidos: '', telefono: '' });
  const [perfilGuardando, setPerfilGuardando] = useState(false);
  const [perfilMensaje, setPerfilMensaje] = useState<string | null>(null);

  const [direcciones, setDirecciones] = useState<Direccion[]>([]);
  const [mostrarFormDireccion, setMostrarFormDireccion] = useState(false);
  const [direccionEditandoId, setDireccionEditandoId] = useState<string | null>(null);
  const [direccionForm, setDireccionForm] = useState(DIRECCION_FORM_INICIAL);

  // Pedidos del cliente
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [pedidosCargando, setPedidosCargando] = useState(false);
  const [pedidoExpandidoId, setPedidoExpandidoId] = useState<string | null>(null);

  useEffect(() => {
    async function cargarPerfil() {
      try {
        const response = await api.get<Cliente>('/clientes/me');
        setCliente(response.data);
        setPerfilForm({
          nombres: response.data.nombres,
          apellidos: response.data.apellidos,
          telefono: response.data.telefono ?? '',
        });
        cargarPedidos();
      } catch {
        router.push('/ingresar');
      }
    }
    cargarPerfil();
  }, [router]);

  useEffect(() => {
    if (activeTab === 'direcciones') {
      cargarDirecciones();
    } else if (activeTab === 'pedidos') {
      cargarPedidos();
    }
  }, [activeTab]);

  async function cargarDirecciones() {
    try {
      const response = await api.get<Direccion[]>('/clientes/me/direcciones');
      setDirecciones(response.data);
    } catch {
      // Ignorar si no hay sesión
    }
  }

  async function cargarPedidos() {
    setPedidosCargando(true);
    try {
      const response = await api.get<Pedido[]>('/clientes/me/pedidos');
      setPedidos(response.data);
    } catch {
      // Ignorar si aún no hay pedidos
    } finally {
      setPedidosCargando(false);
    }
  }

  async function handleCerrarSesion() {
    await api.post('/clientes/auth/logout');
    router.push('/ingresar');
  }

  async function handleGuardarPerfil(e: React.FormEvent) {
    e.preventDefault();
    setPerfilGuardando(true);
    setPerfilMensaje(null);
    try {
      await api.patch('/clientes/me', perfilForm);
      setPerfilMensaje('Cambios guardados.');
    } catch {
      setPerfilMensaje('No pudimos guardar los cambios. Intentá de nuevo.');
    } finally {
      setPerfilGuardando(false);
    }
  }

  function handleNuevaDireccion() {
    setDireccionEditandoId(null);
    setDireccionForm(DIRECCION_FORM_INICIAL);
    setMostrarFormDireccion(true);
  }

  function handleEditarDireccion(direccion: Direccion) {
    setDireccionEditandoId(direccion.id);
    setDireccionForm({
      alias: direccion.alias,
      destinatario_nombre: direccion.destinatario_nombre,
      destinatario_apellidos: direccion.destinatario_apellidos,
      direccion_completa: direccion.direccion_completa,
      ciudad: direccion.ciudad,
      telefono: direccion.telefono,
      referencia: direccion.referencia ?? '',
    });
    setMostrarFormDireccion(true);
  }

  async function handleGuardarDireccion(e: React.FormEvent) {
    e.preventDefault();
    if (direccionEditandoId) {
      await api.put(`/clientes/me/direcciones/${direccionEditandoId}`, direccionForm);
    } else {
      await api.post('/clientes/me/direcciones', direccionForm);
    }
    setMostrarFormDireccion(false);
    await cargarDirecciones();
  }

  async function handleEliminarDireccion(id: string) {
    await api.delete(`/clientes/me/direcciones/${id}`);
    await cargarDirecciones();
  }

  async function handleMarcarPrincipal(id: string) {
    await api.patch(`/clientes/me/direcciones/${id}/principal`);
    await cargarDirecciones();
  }

  function getBadgeColor(estado: string) {
    switch (estado) {
      case 'PENDIENTE_PAGO':
        return { bg: '#fffbe6', text: '#873800', border: '#ffe58f' };
      case 'PAGADO':
        return { bg: '#e6f7ff', text: '#0050b3', border: '#91d5ff' };
      case 'EN_PREPARACION':
        return { bg: '#f9f0ff', text: '#531dab', border: '#d3ade6' };
      case 'ENVIADO':
        return { bg: '#e6fffb', text: '#006d75', border: '#87e8de' };
      case 'ENTREGADO':
        return { bg: '#f6ffed', text: '#237804', border: '#b7eb8f' };
      case 'CANCELADO':
        return { bg: '#fff2f0', text: '#a8071a', border: '#ffccc7' };
      default:
        return { bg: '#f5f5f5', text: '#595959', border: '#d9d9d9' };
    }
  }

  const pedidosActivosCount = pedidos.filter(
    (p) => p.estado !== 'ENTREGADO' && p.estado !== 'CANCELADO',
  ).length;

  const totalComprado = pedidos
    .filter((p) => p.estado !== 'CANCELADO')
    .reduce((acc, p) => acc + Number(p.total), 0);

  return (
    <main className={styles.container}>
      <h1 className={styles.title}>Mi Cuenta</h1>

      <div className={styles.layout}>
        {/* Sidebar Navigation */}
        <nav className={styles.sidebar}>
          <button
            className={`${styles.tabBtn} ${activeTab === 'resumen' ? styles.tabBtnActive : ''}`}
            onClick={() => setActiveTab('resumen')}
          >
            <svg className={styles.tabIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="7" height="7"></rect>
              <rect x="14" y="3" width="7" height="7"></rect>
              <rect x="14" y="14" width="7" height="7"></rect>
              <rect x="3" y="14" width="7" height="7"></rect>
            </svg>
            Resumen
          </button>

          <button
            className={`${styles.tabBtn} ${activeTab === 'pedidos' ? styles.tabBtnActive : ''}`}
            onClick={() => setActiveTab('pedidos')}
          >
            <svg className={styles.tabIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 16.2A2 2 0 0 1 18.2 18H5.8A2 2 0 0 1 4 16.2V7.8A2 2 0 0 1 5.8 6h12.4a2 2 0 0 1 1.8 1.8v8.4z"></path>
              <path d="M12 12h.01"></path>
            </svg>
            Mis Pedidos ({pedidos.length})
          </button>

          <button
            className={`${styles.tabBtn} ${activeTab === 'perfil' ? styles.tabBtnActive : ''}`}
            onClick={() => setActiveTab('perfil')}
          >
            <svg className={styles.tabIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
              <circle cx="12" cy="7" r="4"></circle>
            </svg>
            Detalles del Perfil
          </button>

          <button
            className={`${styles.tabBtn} ${activeTab === 'direcciones' ? styles.tabBtnActive : ''}`}
            onClick={() => setActiveTab('direcciones')}
          >
            <svg className={styles.tabIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
              <circle cx="12" cy="10" r="3"></circle>
            </svg>
            Mis Direcciones
          </button>

          <div className={styles.sidebarFooter}>
            <button className={styles.logoutBtn} onClick={handleCerrarSesion}>
              Cerrar sesión
            </button>
          </div>
        </nav>

        {/* Main Content Area */}
        <section className={styles.content}>
          {activeTab === 'resumen' && (
            <div>
              <h2 className={styles.sectionTitle}>Hola, {cliente?.nombres ?? '...'}</h2>
              <p style={{ color: '#475569', marginBottom: '2rem', lineHeight: '1.6' }}>
                Desde el panel de control de tu cuenta podés ver tus pedidos recientes, gestionar tus direcciones de envío y editar tu perfil.
              </p>

              <div className={styles.statsGrid}>
                <div className={styles.statCard}>
                  <div className={styles.statLabel}>Pedidos Activos</div>
                  <div className={styles.statValue}>{pedidosActivosCount}</div>
                </div>
                <div className={styles.statCard}>
                  <div className={styles.statLabel}>Total Comprado</div>
                  <div className={styles.statValue}>Bs. {totalComprado.toFixed(2)}</div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'pedidos' && (
            <div>
              <h2 className={styles.sectionTitle}>Historial de Pedidos</h2>

              {pedidosCargando ? (
                <p>Cargando tus pedidos...</p>
              ) : pedidos.length === 0 ? (
                <div className={styles.emptyState}>
                  <svg className={styles.emptyIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 16.2A2 2 0 0 1 18.2 18H5.8A2 2 0 0 1 4 16.2V7.8A2 2 0 0 1 5.8 6h12.4a2 2 0 0 1 1.8 1.8v8.4z"></path>
                    <path d="M12 12h.01"></path>
                  </svg>
                  <p className={styles.emptyText}>Aún no has realizado ningún pedido.</p>
                  <Link href="/" className={styles.primaryBtn}>Empezar a comprar</Link>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {pedidos.map((pedido) => {
                    const badge = getBadgeColor(pedido.estado);
                    const expandido = pedidoExpandidoId === pedido.id;
                    const fecha = new Date(pedido.creado_en).toLocaleDateString('es-BO', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    });

                    return (
                      <div
                        key={pedido.id}
                        className={styles.direccionCard}
                        style={{ padding: '1.25rem' }}
                      >
                        <div className={styles.direccionCardHeader}>
                          <div>
                            <strong style={{ fontSize: '1.1rem' }}>#{pedido.numero_pedido}</strong>
                            <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{fecha}</div>
                          </div>

                          <span
                            style={{
                              background: badge.bg,
                              color: badge.text,
                              border: `1px solid ${badge.border}`,
                              padding: '0.25rem 0.75rem',
                              borderRadius: '20px',
                              fontSize: '0.8rem',
                              fontWeight: 700,
                            }}
                          >
                            {pedido.estado.replace('_', ' ')}
                          </span>
                        </div>

                        <div style={{ marginTop: '0.75rem', fontSize: '0.95rem', fontWeight: 600 }}>
                          Total: Bs. {Number(pedido.total).toFixed(2)} BOB
                        </div>

                        <button
                          className={styles.secondaryBtn}
                          style={{ marginTop: '0.75rem' }}
                          onClick={() => setPedidoExpandidoId(expandido ? null : pedido.id)}
                        >
                          {expandido ? 'Ocultar Detalle' : 'Ver Detalle del Pedido'}
                        </button>

                        {expandido && (
                          <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #e2e8f0', fontSize: '0.85rem' }}>
                            <h4 style={{ margin: '0 0 0.5rem 0', color: '#1e293b' }}>Productos del Pedido:</h4>
                            <ul style={{ paddingLeft: '1.25rem', margin: '0 0 1rem 0', color: '#334155' }}>
                              {pedido.detalles?.map((det) => (
                                <li key={det.id}>
                                  <strong>{det.nombre_producto}</strong> x {det.cantidad} — Bs. {Number(det.subtotal).toFixed(2)}
                                </li>
                              ))}
                            </ul>

                            {pedido.direccion_envio_snapshot && (
                              <div style={{ background: '#f8fafc', padding: '0.75rem', borderRadius: '4px', color: '#475569' }}>
                                <strong>Dirección de Entrega:</strong>
                                <br />
                                {pedido.direccion_envio_snapshot.destinatario_nombre} {pedido.direccion_envio_snapshot.destinatario_apellidos}
                                <br />
                                {pedido.direccion_envio_snapshot.direccion_completa}, {pedido.direccion_envio_snapshot.ciudad}
                                <br />
                                Tel: {pedido.direccion_envio_snapshot.telefono}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {activeTab === 'perfil' && (
            <div>
              <h2 className={styles.sectionTitle}>Detalles del Perfil</h2>
              <form onSubmit={handleGuardarPerfil}>
                {perfilMensaje && <p style={{ marginBottom: '1rem', color: '#475569' }}>{perfilMensaje}</p>}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                  <div className={styles.formGroup}>
                    <label>Nombres</label>
                    <input
                      type="text"
                      className={styles.input}
                      value={perfilForm.nombres}
                      onChange={(e) => setPerfilForm((f) => ({ ...f, nombres: e.target.value }))}
                      required
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Apellidos</label>
                    <input
                      type="text"
                      className={styles.input}
                      value={perfilForm.apellidos}
                      onChange={(e) => setPerfilForm((f) => ({ ...f, apellidos: e.target.value }))}
                      required
                    />
                  </div>
                </div>
                <div className={styles.formGroup}>
                  <label>Correo Electrónico</label>
                  <input type="email" className={styles.input} value={cliente?.email ?? ''} disabled />
                </div>
                <div className={styles.formGroup}>
                  <label>Teléfono</label>
                  <input
                    type="tel"
                    className={styles.input}
                    value={perfilForm.telefono}
                    onChange={(e) => setPerfilForm((f) => ({ ...f, telefono: e.target.value }))}
                  />
                </div>

                <button type="submit" className={styles.submitBtn} style={{ marginTop: '1rem' }} disabled={perfilGuardando}>
                  {perfilGuardando ? 'Guardando...' : 'Guardar Cambios'}
                </button>
              </form>
              <p style={{ marginTop: '1.5rem' }}>
                <Link href="/recuperar-password">¿Querés cambiar tu contraseña?</Link>
              </p>
            </div>
          )}

          {activeTab === 'direcciones' && (
            <div>
              <h2 className={styles.sectionTitle}>Mis Direcciones</h2>

              {direcciones.length === 0 && !mostrarFormDireccion && (
                <div className={styles.emptyState}>
                  <svg className={styles.emptyIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                    <circle cx="12" cy="10" r="3"></circle>
                  </svg>
                  <p className={styles.emptyText}>No tenés ninguna dirección guardada.</p>
                  <button className={styles.submitBtn} onClick={handleNuevaDireccion}>Agregar nueva dirección</button>
                </div>
              )}

              {direcciones.map((direccion) => (
                <div key={direccion.id} className={styles.direccionCard}>
                  <div className={styles.direccionCardHeader}>
                    <span className={styles.direccionAlias}>{direccion.alias}</span>
                    {direccion.es_principal && <span className={styles.principalBadge}>Principal</span>}
                  </div>
                  <div className={styles.direccionBody}>
                    {direccion.destinatario_nombre} {direccion.destinatario_apellidos}
                    <br />
                    {direccion.direccion_completa}, {direccion.ciudad}
                    <br />
                    {direccion.telefono}
                  </div>
                  <div className={styles.direccionActions}>
                    <button className={styles.secondaryBtn} onClick={() => handleEditarDireccion(direccion)}>
                      Editar
                    </button>
                    {!direccion.es_principal && (
                      <button className={styles.secondaryBtn} onClick={() => handleMarcarPrincipal(direccion.id)}>
                        Marcar como principal
                      </button>
                    )}
                    <button className={styles.dangerBtn} onClick={() => handleEliminarDireccion(direccion.id)}>
                      Eliminar
                    </button>
                  </div>
                </div>
              ))}

              {direcciones.length > 0 && !mostrarFormDireccion && (
                <button className={styles.submitBtn} onClick={handleNuevaDireccion}>Agregar nueva dirección</button>
              )}

              {mostrarFormDireccion && (
                <form onSubmit={handleGuardarDireccion} style={{ marginTop: '1.5rem' }}>
                  <div className={styles.formGroup}>
                    <label>Alias (ej. Casa, Trabajo)</label>
                    <input
                      type="text"
                      className={styles.input}
                      value={direccionForm.alias}
                      onChange={(e) => setDireccionForm((f) => ({ ...f, alias: e.target.value }))}
                      required
                    />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                    <div className={styles.formGroup}>
                      <label>Nombre del destinatario</label>
                      <input
                        type="text"
                        className={styles.input}
                        value={direccionForm.destinatario_nombre}
                        onChange={(e) => setDireccionForm((f) => ({ ...f, destinatario_nombre: e.target.value }))}
                        required
                      />
                    </div>
                    <div className={styles.formGroup}>
                      <label>Apellidos del destinatario</label>
                      <input
                        type="text"
                        className={styles.input}
                        value={direccionForm.destinatario_apellidos}
                        onChange={(e) => setDireccionForm((f) => ({ ...f, destinatario_apellidos: e.target.value }))}
                        required
                      />
                    </div>
                  </div>
                  <div className={styles.formGroup}>
                    <label>Dirección completa</label>
                    <input
                      type="text"
                      className={styles.input}
                      value={direccionForm.direccion_completa}
                      onChange={(e) => setDireccionForm((f) => ({ ...f, direccion_completa: e.target.value }))}
                      required
                    />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                    <div className={styles.formGroup}>
                      <label>Ciudad</label>
                      <input
                        type="text"
                        className={styles.input}
                        value={direccionForm.ciudad}
                        onChange={(e) => setDireccionForm((f) => ({ ...f, ciudad: e.target.value }))}
                        required
                      />
                    </div>
                    <div className={styles.formGroup}>
                      <label>Teléfono</label>
                      <input
                        type="tel"
                        className={styles.input}
                        value={direccionForm.telefono}
                        onChange={(e) => setDireccionForm((f) => ({ ...f, telefono: e.target.value }))}
                        required
                      />
                    </div>
                  </div>
                  <div className={styles.formGroup}>
                    <label>Referencia (opcional)</label>
                    <input
                      type="text"
                      className={styles.input}
                      value={direccionForm.referencia}
                      onChange={(e) => setDireccionForm((f) => ({ ...f, referencia: e.target.value }))}
                    />
                  </div>
                  <div className={styles.formActions}>
                    <button type="submit" className={styles.submitBtn}>
                      {direccionEditandoId ? 'Guardar cambios' : 'Agregar dirección'}
                    </button>
                    <button type="button" className={styles.secondaryBtn} onClick={() => setMostrarFormDireccion(false)}>
                      Cancelar
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
