'use client';
import React, { useState } from 'react';
import styles from './MiCuenta.module.css';
import Link from 'next/link';

export default function MiCuentaPage() {
  const [activeTab, setActiveTab] = useState('resumen');

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
            Mis Pedidos
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
        </nav>

        {/* Main Content Area */}
        <section className={styles.content}>
          
          {activeTab === 'resumen' && (
            <div>
              <h2 className={styles.sectionTitle}>Hola, Estudiante</h2>
              <p style={{ color: '#475569', marginBottom: '2rem', lineHeight: '1.6' }}>
                Desde el panel de control de tu cuenta podés ver tus pedidos recientes, gestionar tus direcciones de envío y editar tu contraseña y los detalles de tu cuenta.
              </p>

              <div className={styles.statsGrid}>
                <div className={styles.statCard}>
                  <div className={styles.statLabel}>Pedidos Activos</div>
                  <div className={styles.statValue}>0</div>
                </div>
                <div className={styles.statCard}>
                  <div className={styles.statLabel}>Total Comprado</div>
                  <div className={styles.statValue}>Bs. 0.00</div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'pedidos' && (
            <div>
              <h2 className={styles.sectionTitle}>Historial de Pedidos</h2>
              <div className={styles.emptyState}>
                <svg className={styles.emptyIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 16.2A2 2 0 0 1 18.2 18H5.8A2 2 0 0 1 4 16.2V7.8A2 2 0 0 1 5.8 6h12.4a2 2 0 0 1 1.8 1.8v8.4z"></path>
                  <path d="M12 12h.01"></path>
                </svg>
                <p className={styles.emptyText}>Aún no has realizado ningún pedido.</p>
                <Link href="/" className={styles.primaryBtn}>Empezar a comprar</Link>
              </div>
            </div>
          )}

          {activeTab === 'perfil' && (
            <div>
              <h2 className={styles.sectionTitle}>Detalles del Perfil</h2>
              <form onSubmit={(e) => e.preventDefault()}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                  <div className={styles.formGroup}>
                    <label>Nombre</label>
                    <input type="text" className={styles.input} defaultValue="Estudiante" />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Apellido</label>
                    <input type="text" className={styles.input} />
                  </div>
                </div>
                <div className={styles.formGroup}>
                  <label>Correo Electrónico</label>
                  <input type="email" className={styles.input} defaultValue="estudiante@ejemplo.com" />
                </div>
                <div className={styles.formGroup}>
                  <label>Contraseña Actual</label>
                  <input type="password" className={styles.input} placeholder="Dejar en blanco si no querés cambiarla" />
                </div>
                <div className={styles.formGroup}>
                  <label>Nueva Contraseña</label>
                  <input type="password" className={styles.input} />
                </div>
                
                <button type="submit" className={styles.submitBtn} style={{ marginTop: '1rem' }}>Guardar Cambios</button>
              </form>
            </div>
          )}

          {activeTab === 'direcciones' && (
            <div>
              <h2 className={styles.sectionTitle}>Mis Direcciones</h2>
              <div className={styles.emptyState}>
                <svg className={styles.emptyIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                  <circle cx="12" cy="10" r="3"></circle>
                </svg>
                <p className={styles.emptyText}>No tenés ninguna dirección guardada.</p>
                <button className={styles.submitBtn}>Agregar nueva dirección</button>
              </div>
            </div>
          )}

        </section>
      </div>
    </main>
  );
}
