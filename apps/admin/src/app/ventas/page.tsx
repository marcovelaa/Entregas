'use client';

import React, { useEffect, useState } from 'react';
import { Store, Truck } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { PedidosKanban } from './components/PedidosKanban';
import { VentasHistorial } from './components/VentasHistorial';
import styles from './page.module.css';

function VentasContainerPage() {
  const searchParams = useSearchParams();
  const initialTab = searchParams.get('tab') === 'despacho' ? 'despacho' : 'historial';
  const [activeTab, setActiveTab] = useState<'historial' | 'despacho'>(initialTab);

  useEffect(() => {
    if (searchParams.get('tab') === 'despacho') {
      setActiveTab('despacho');
    }
  }, [searchParams]);

  return (
    <div className={styles.page}>
      <div aria-label="Secciones de ventas" className={styles.tabs} role="group">
        <button
          aria-pressed={activeTab === 'historial'}
          className={`${styles.tab} ${activeTab === 'historial' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('historial')}
          type="button"
        >
          <Store size={18} />
          Historial General
        </button>
        <button
          aria-pressed={activeTab === 'despacho'}
          className={`${styles.tab} ${activeTab === 'despacho' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('despacho')}
          type="button"
        >
          <Truck size={18} />
          Pedidos Online (Despacho)
        </button>
      </div>

      <div className={styles.content}>
        {activeTab === 'historial' && (
          <section aria-label="Historial General">
            <VentasHistorial />
          </section>
        )}
        {activeTab === 'despacho' && (
          <section aria-label="Pedidos Online (Despacho)">
            <PedidosKanban />
          </section>
        )}
      </div>
    </div>
  );
}

export default function VentasPage() {
  return (
    <React.Suspense fallback={<div className={styles.loading}>Cargando...</div>}>
      <VentasContainerPage />
    </React.Suspense>
  );
}
