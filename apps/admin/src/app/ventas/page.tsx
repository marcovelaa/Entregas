'use client';

import React, { useState, useEffect } from 'react';
import { VentasHistorial } from './components/VentasHistorial';
import { PedidosKanban } from './components/PedidosKanban';
import { Store, Truck } from 'lucide-react';
import { useSearchParams } from 'next/navigation';

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
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Tabs Header */}
      <div style={{ 
        display: 'flex', 
        borderBottom: '1px solid #e2e8f0', 
        marginBottom: '1rem',
        padding: '0 2rem',
        backgroundColor: 'white',
        paddingTop: '1rem'
      }}>
        <button
          onClick={() => setActiveTab('historial')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '1rem 1.5rem',
            border: 'none',
            background: 'none',
            borderBottom: activeTab === 'historial' ? '2px solid #0f172a' : '2px solid transparent',
            color: activeTab === 'historial' ? '#0f172a' : '#64748b',
            fontWeight: activeTab === 'historial' ? 600 : 500,
            cursor: 'pointer',
            fontSize: '0.95rem',
            transition: 'all 0.2s'
          }}
        >
          <Store size={18} />
          Historial General
        </button>
        <button
          onClick={() => setActiveTab('despacho')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '1rem 1.5rem',
            border: 'none',
            background: 'none',
            borderBottom: activeTab === 'despacho' ? '2px solid #0f172a' : '2px solid transparent',
            color: activeTab === 'despacho' ? '#0f172a' : '#64748b',
            fontWeight: activeTab === 'despacho' ? 600 : 500,
            cursor: 'pointer',
            fontSize: '0.95rem',
            transition: 'all 0.2s'
          }}
        >
          <Truck size={18} />
          Pedidos Online (Despacho)
        </button>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {activeTab === 'historial' && <VentasHistorial />}
        {activeTab === 'despacho' && <PedidosKanban />}
      </div>
    </div>
  );
}

export default function VentasPage() {
  return (
    <React.Suspense fallback={<div style={{ padding: '2rem' }}>Cargando...</div>}>
      <VentasContainerPage />
    </React.Suspense>
  );
}
