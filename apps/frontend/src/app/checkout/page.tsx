'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import styles from './checkout.module.css';

interface Direccion {
  id: string;
  alias: string;
  destinatario_nombre: string;
  destinatario_apellidos: string;
  direccion_completa: string;
  ciudad: string;
  telefono: string;
  referencia?: string;
  es_principal: boolean;
}

interface ItemCarrito {
  producto_id: string;
  nombre_producto: string;
  precio_unitario: number;
  cantidad: number;
  imagen_url?: string;
}

export default function CheckoutPage() {
  const router = useRouter();
  const [paso, setPaso] = useState<'FORMULARIO' | 'PAGO_QR'>('FORMULARIO');
  const [cargando, setCargando] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Direcciones guardadas del cliente (si está autenticado)
  const [direcciones, setDirecciones] = useState<Direccion[]>([]);
  const [direccionSeleccionadaId, setDireccionSeleccionadaId] = useState<string | null>(null);

  // Datos del formulario de envío
  const [envioForm, setEnvioForm] = useState({
    destinatario_nombre: '',
    destinatario_apellidos: '',
    direccion_completa: '',
    ciudad: 'Santa Cruz',
    telefono: '',
    referencia: '',
  });

  // Carrito de compras (ejemplo / persistente)
  const [items] = useState<ItemCarrito[]>([
    {
      producto_id: '1',
      nombre_producto: 'El monstruo de colores',
      precio_unitario: 60,
      cantidad: 1,
    },
    {
      producto_id: '2',
      nombre_producto: 'Matemáticas Avanzadas',
      precio_unitario: 120,
      cantidad: 1,
    },
  ]);

  // Totales
  const subtotal = items.reduce((acc, i) => acc + i.precio_unitario * i.cantidad, 0);
  const costoEnvio = subtotal >= 200 ? 0 : 15;
  const total = subtotal + costoEnvio;

  // Estado del Pago QR generado
  const [pedidoCreado, setPedidoCreado] = useState<{ id: string; numero_pedido: string } | null>(null);
  const [pagoQr, setPagoQr] = useState<{ id: string; qr_contenido: string; referencia_bisa: string } | null>(null);
  const [tiempoRestante, setTiempoRestante] = useState(900); // 15 min en segundos

  // Cargar direcciones del cliente autenticado
  useEffect(() => {
    async function cargarDirecciones() {
      try {
        const response = await api.get<Direccion[]>('/clientes/me/direcciones');
        setDirecciones(response.data);
        const principal = response.data.find((d) => d.es_principal) || response.data[0];
        if (principal) {
          setDireccionSeleccionadaId(principal.id);
          aplicarDireccionForm(principal);
        }
      } catch {
        // Invitado / no autenticado
      }
    }
    cargarDirecciones();
  }, []);

  function aplicarDireccionForm(dir: Direccion) {
    setEnvioForm({
      destinatario_nombre: dir.destinatario_nombre,
      destinatario_apellidos: dir.destinatario_apellidos,
      direccion_completa: dir.direccion_completa,
      ciudad: dir.ciudad,
      telefono: dir.telefono,
      referencia: dir.referencia || '',
    });
  }

  function handleSeleccionarDireccionGuardada(dir: Direccion) {
    setDireccionSeleccionadaId(dir.id);
    aplicarDireccionForm(dir);
  }

  // Crear pedido y generar QR
  async function handleFinalizarCompra(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg('');
    setCargando(true);

    try {
      // 1. Crear el Pedido con snapshot de dirección e ítems
      const resPedido = await api.post('/clientes/me/pedidos', {
        direccion_envio: envioForm,
        costo_envio: costoEnvio,
        detalles: items.map((i) => ({
          producto_id: i.producto_id,
          nombre_producto: i.nombre_producto,
          precio_unitario: i.precio_unitario,
          cantidad: i.cantidad,
        })),
      });

      const pedidoData = resPedido.data;
      setPedidoCreado({ id: pedidoData.id, numero_pedido: pedidoData.numero_pedido });

      // 2. Generar Pago QR BISA
      const resQr = await api.post('/pagos/qr/generar', {
        pedido_id: pedidoData.id,
      });

      setPagoQr(resQr.data);
      setPaso('PAGO_QR');
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Ocurrió un error al procesar el pedido');
    } finally {
      setCargando(false);
    }
  }

  // Polling del estado del QR y temporizador
  useEffect(() => {
    if (paso !== 'PAGO_QR' || !pagoQr) return;

    // Temporizador regresivo de 15 minutos
    const timer = setInterval(() => {
      setTiempoRestante((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    // Polling cada 3s para verificar estado de pago
    const poll = setInterval(async () => {
      try {
        const res = await api.get(`/pagos/qr/${pagoQr.id}/estado`);
        if (res.data.estado === 'CONFIRMADO') {
          clearInterval(poll);
          clearInterval(timer);
          router.push(
            `/success?numero_pedido=${encodeURIComponent(pedidoCreado?.numero_pedido || '')}&total=${total}&ciudad=${encodeURIComponent(envioForm.ciudad)}`,
          );
        }
      } catch {
        // Ignore polling error
      }
    }, 3000);

    return () => {
      clearInterval(timer);
      clearInterval(poll);
    };
  }, [paso, pagoQr, pedidoCreado, total, envioForm.ciudad, router]);

  // Botón para simular pago en modo sandbox / desarrollo
  async function handleSimularPagoSandbox() {
    if (!pagoQr) return;
    try {
      setCargando(true);
      await api.post('/pagos/bisa/webhook', {
        referencia_bisa: pagoQr.referencia_bisa,
        estado: 'CONFIRMADO',
        monto: total,
      });
      router.push(
        `/success?numero_pedido=${encodeURIComponent(pedidoCreado?.numero_pedido || '')}&total=${total}&ciudad=${encodeURIComponent(envioForm.ciudad)}`,
      );
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Error al simular pago');
    } finally {
      setCargando(false);
    }
  }

  const minutos = Math.floor(tiempoRestante / 60);
  const segundos = tiempoRestante % 60;
  const tiempoFormateado = `${minutos}:${segundos < 10 ? '0' : ''}${segundos}`;

  return (
    <div className={styles.pageWrapper}>
      <main className={styles.mainContent}>
        <div className={styles.checkoutLayout}>
          {paso === 'FORMULARIO' ? (
            <form onSubmit={handleFinalizarCompra} className={styles.formSection}>
              <h1 className={styles.pageTitle}>Finalizar Compra</h1>

              {errorMsg && <div className={styles.errorAlert}>{errorMsg}</div>}

              {/* Selección de direcciones guardadas (si existen) */}
              {direcciones.length > 0 && (
                <section className={styles.formBlock}>
                  <h2 className={styles.blockTitle}>Mis Direcciones Guardadas</h2>
                  <div className={styles.addressGrid}>
                    {direcciones.map((dir) => (
                      <div
                        key={dir.id}
                        onClick={() => handleSeleccionarDireccionGuardada(dir)}
                        className={`${styles.addressCard} ${direccionSeleccionadaId === dir.id ? styles.addressCardSelected : ''}`}
                      >
                        <strong>{dir.alias}</strong>
                        <p>{dir.destinatario_nombre} {dir.destinatario_apellidos}</p>
                        <p>{dir.direccion_completa}, {dir.ciudad}</p>
                        <p>Tel: {dir.telefono}</p>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Formulario de dirección de envío */}
              <section className={styles.formBlock}>
                <h2 className={styles.blockTitle}>Datos de Entrega</h2>
                <div className={styles.inputRow}>
                  <div className={styles.inputGroup}>
                    <label htmlFor="name">Nombre</label>
                    <input
                      type="text"
                      id="name"
                      required
                      value={envioForm.destinatario_nombre}
                      onChange={(e) => setEnvioForm({ ...envioForm, destinatario_nombre: e.target.value })}
                      className={styles.input}
                    />
                  </div>
                  <div className={styles.inputGroup}>
                    <label htmlFor="lastname">Apellidos</label>
                    <input
                      type="text"
                      id="lastname"
                      required
                      value={envioForm.destinatario_apellidos}
                      onChange={(e) => setEnvioForm({ ...envioForm, destinatario_apellidos: e.target.value })}
                      className={styles.input}
                    />
                  </div>
                </div>

                <div className={styles.inputGroup}>
                  <label htmlFor="address">Dirección completa</label>
                  <input
                    type="text"
                    id="address"
                    required
                    placeholder="Calle, Número, Zona"
                    value={envioForm.direccion_completa}
                    onChange={(e) => setEnvioForm({ ...envioForm, direccion_completa: e.target.value })}
                    className={styles.input}
                  />
                </div>

                <div className={styles.inputRow}>
                  <div className={styles.inputGroup}>
                    <label htmlFor="city">Ciudad</label>
                    <select
                      id="city"
                      value={envioForm.ciudad}
                      onChange={(e) => setEnvioForm({ ...envioForm, ciudad: e.target.value })}
                      className={styles.input}
                    >
                      <option>Santa Cruz</option>
                      <option>La Paz</option>
                      <option>Cochabamba</option>
                      <option>Tarija</option>
                      <option>Sucre</option>
                      <option>Resto del país</option>
                    </select>
                  </div>
                  <div className={styles.inputGroup}>
                    <label htmlFor="phone">Teléfono / WhatsApp</label>
                    <input
                      type="tel"
                      id="phone"
                      required
                      value={envioForm.telefono}
                      onChange={(e) => setEnvioForm({ ...envioForm, telefono: e.target.value })}
                      className={styles.input}
                    />
                  </div>
                </div>

                <div className={styles.inputGroup}>
                  <label htmlFor="ref">Referencia de entrega (Opcional)</label>
                  <input
                    type="text"
                    id="ref"
                    placeholder="Ej. Frente al supermercado, puerta azul"
                    value={envioForm.referencia}
                    onChange={(e) => setEnvioForm({ ...envioForm, referencia: e.target.value })}
                    className={styles.input}
                  />
                </div>
              </section>

              {/* Método de Pago */}
              <section className={styles.formBlock}>
                <h2 className={styles.blockTitle}>Método de Pago</h2>
                <div className={styles.paymentMethods}>
                  <label className={styles.paymentOption}>
                    <input type="radio" name="payment" defaultChecked />
                    <span className={styles.radioCustom}></span>
                    <div className={styles.paymentInfo}>
                      <span className={styles.paymentTitle}>
                        Pago seguro con QR Banco BISA
                      </span>
                      <span className={styles.paymentDesc}>
                        Al presionar el botón se generará tu código QR para pagar desde la app de tu banco.
                      </span>
                    </div>
                  </label>
                </div>
              </section>

              <button
                type="submit"
                disabled={cargando}
                className={styles.placeOrderBtn}
              >
                {cargando ? 'PROCESANDO...' : 'GENERAR PAGO CON QR'}
              </button>
            </form>
          ) : (
            /* Vista del Pago QR Generado con Polling */
            <div className={styles.formSection}>
              <h1 className={styles.pageTitle}>Escaneá y Pagá tu Pedido</h1>
              <p className={styles.blockDesc}>
                Pedido <strong>#{pedidoCreado?.numero_pedido}</strong> generado correctamente. Escaneá el código QR desde la app de tu banco.
              </p>

              <div className={styles.qrContainer}>
                <div className={styles.timerBadge}>
                  Tiempo para pagar: <strong>{tiempoFormateado}</strong>
                </div>

                <div className={styles.qrBox}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(pagoQr?.qr_contenido || '')}`}
                    alt="Código QR de Pago Banco BISA"
                    className={styles.qrImage}
                  />
                </div>

                <p className={styles.pollingNotice}>
                  Esperando confirmación de pago... Esta pantalla se actualizará automáticamente.
                </p>

                <div className={styles.sandboxBlock}>
                  <p>Modo Sandbox de Pruebas:</p>
                  <button
                    onClick={handleSimularPagoSandbox}
                    disabled={cargando}
                    className={styles.sandboxBtn}
                  >
                    {cargando ? 'Simulando...' : 'SIMULAR PAGO CONFIRMADO (MODO SANDBOX)'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Resumen del Pedido */}
          <div className={styles.summarySection}>
            <div className={styles.summarySticky}>
              <h2 className={styles.summaryTitle}>Resumen del Pedido</h2>

              <div className={styles.summaryItems}>
                {items.map((item, idx) => (
                  <div key={idx} className={styles.summaryItem}>
                    <div className={styles.itemInfo}>
                      <h4>{item.nombre_producto}</h4>
                      <span>Cantidad: {item.cantidad}</span>
                    </div>
                    <div className={styles.itemPrice}>Bs. {(item.precio_unitario * item.cantidad).toFixed(2)}</div>
                  </div>
                ))}
              </div>

              <div className={styles.totalsBlock}>
                <div className={styles.totalsRow}>
                  <span>Subtotal</span>
                  <span>Bs. {subtotal.toFixed(2)}</span>
                </div>
                <div className={styles.totalsRow}>
                  <span>Envío</span>
                  <span>{costoEnvio === 0 ? 'Gratis' : `Bs. ${costoEnvio.toFixed(2)}`}</span>
                </div>
                <div className={styles.totalsRowTotal}>
                  <span>Total</span>
                  <div className={styles.totalPriceWrapper}>
                    <span className={styles.currency}>BOB</span>
                    <span className={styles.totalValue}>Bs. {total.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
