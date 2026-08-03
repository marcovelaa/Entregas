'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Bell, AlertTriangle } from 'lucide-react';
import { api } from '../../../lib/axios';
import styles from './GlobalNotifications.module.css';

export function GlobalNotifications() {
  const [isOpen, setIsOpen] = useState(false);
  const [alertas, setAlertas] = useState<any[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchAlertas();
    const interval = setInterval(fetchAlertas, 300000);
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

  const fetchAlertas = async () => {
    try {
      const res = await api.get('/inventario/alertas');
      setAlertas(res.data || []);
    } catch (error) {
      console.error('Error fetching alertas:', error);
    }
  };

  return (
    <div className={styles.container} ref={dropdownRef}>
      <button 
        className={styles.bellButton} 
        onClick={() => setIsOpen(!isOpen)}
        title="Notificaciones"
      >
        <Bell size={24} className={styles.icon} />
        {alertas.length > 0 && (
          <span className={styles.badge}>{alertas.length}</span>
        )}
      </button>

      {isOpen && (
        <div className={styles.dropdown}>
          <div className={styles.header}>
            <h3>Alertas del Sistema</h3>
            <span className={styles.count}>{alertas.length} nuevas</span>
          </div>
          <div className={styles.list}>
            {alertas.length === 0 ? (
              <div className={styles.empty}>No tienes alertas pendientes. Todo en orden.</div>
            ) : (
              alertas.map(alerta => (
                <div key={alerta.id} className={styles.alertItem}>
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
              ))
            )}
          </div>
          <div className={styles.footer}>
            <button className={styles.viewAllBtn} onClick={() => { setIsOpen(false); window.location.href='/inventario' }}>
              Ir al Inventario
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
