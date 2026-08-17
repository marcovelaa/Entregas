'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Bell, AlertTriangle } from 'lucide-react';
import { api } from '../../../lib/axios';
import styles from './GlobalNotifications.module.css';

export function GlobalNotifications() {
  const [isOpen, setIsOpen] = useState(false);
  const [alertasInventario, setAlertasInventario] = useState<any[]>([]);
  const [alertasPedidos, setAlertasPedidos] = useState<any[]>([]);
  const [isNewNotification, setIsNewNotification] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 15000); // 15 seconds
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchData = async () => {
    try {
      const [resInv, resPed] = await Promise.all([
        api.get('/inventario/alertas').catch(() => ({ data: [] })),
        api.get('/pedidos?estado=PAGADO&limit=50').catch(() => ({ data: { data: [] } }))
      ]);

      const inventarioData = resInv.data || [];
      const pedidosData = (resPed.data?.data || []).filter((p: any) => !p.preparador_id);

      setAlertasInventario(inventarioData);
      
      setAlertasPedidos((prev) => {
        if (pedidosData.length > prev.length) {
          playNotificationSound();
          setIsNewNotification(true);
        }
        return pedidosData;
      });
    } catch (error) {
      console.error('Error fetching alertas:', error);
    }
  };

  const playNotificationSound = () => {
    try {
      const audio = new Audio('/sounds/bell.mp3');
      audio.play().catch((e) => console.log('Audio play failed due to browser policy:', e));
    } catch (error) {
      // Ignore audio errors
    }
  };

  const totalAlertas = alertasInventario.length + alertasPedidos.length;

  return (
    <div className={styles.container} ref={dropdownRef}>
      <button 
        className={`${styles.bellButton} ${isNewNotification ? styles.bellShake : ''}`} 
        onClick={() => {
          setIsOpen(!isOpen);
          setIsNewNotification(false);
        }}
        title="Notificaciones"
      >
        <Bell size={24} className={styles.icon} />
        {totalAlertas > 0 && (
          <span className={styles.badge}>{totalAlertas}</span>
        )}
      </button>

      {isOpen && (
        <div className={styles.dropdown}>
          <div className={styles.header}>
            <h3>Notificaciones</h3>
            <span className={styles.count}>{totalAlertas} nuevas</span>
          </div>
          <div className={styles.list}>
            {totalAlertas === 0 ? (
              <div className={styles.empty}>No tienes alertas pendientes. Todo en orden.</div>
            ) : (
              <>
                {alertasPedidos.map(pedido => (
                  <div key={`ped-${pedido.id}`} className={styles.alertItem} style={{ borderLeft: '4px solid #3b82f6' }}>
                    <div className={styles.iconWrapper} style={{ backgroundColor: '#eff6ff', color: '#3b82f6' }}>
                      <Bell size={18} className={styles.alertIcon} />
                    </div>
                    <div className={styles.alertContent}>
                      <p className={styles.alertTitle}>¡Nuevo Pedido Online!</p>
                      <p className={styles.alertMessage}>
                        Pedido {pedido.numero_pedido} está pagado y listo para armar.
                      </p>
                      <a href="/ventas?tab=despacho" className={styles.linkAction}>Ir a Despacho</a>
                    </div>
                  </div>
                ))}
                
                {alertasInventario.map(alerta => (
                  <div key={`inv-${alerta.id}`} className={styles.alertItem}>
                    <div className={styles.iconWrapper}>
                      <AlertTriangle size={18} className={styles.alertIcon} />
                    </div>
                    <div className={styles.alertContent}>
                      <p className={styles.alertTitle}>Stock bajo: {alerta.nombre}</p>
                      <p className={styles.alertMessage}>
                        SKU: {alerta.sku} | Quedan solo <strong>{alerta.cantidad_disponible}</strong> unidades.
                      </p>
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
          <div className={styles.footer}>
            <button className={styles.viewAllBtn} onClick={() => setIsOpen(false)}>
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
