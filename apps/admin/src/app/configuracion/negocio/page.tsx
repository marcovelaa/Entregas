'use client';

import React, { useState, useEffect } from 'react';
import { Save } from 'lucide-react';

import styles from './page.module.css';

export default function ConfiguracionNegocioPage() {
  const [config, setConfig] = useState({
    nombre: 'ENTREGAS.com.bo',
    direccion: 'Av. Banzer Km 2.5, Santa Cruz, Bolivia',
    telefono: '+591 70000000',
    nit: '1029384029',
  });

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('entregas_config_negocio');
    if (saved) {
      setConfig(JSON.parse(saved));
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setConfig({ ...config, [e.target.name]: e.target.value });
  };

  const handleSave = () => {
    setSaving(true);
    localStorage.setItem('entregas_config_negocio', JSON.stringify(config));
    setTimeout(() => {
      setSaving(false);
      alert('Configuración de negocio guardada correctamente.');
    }, 400);
  };

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>
        Datos del Negocio (Tickets y Recibos)
      </h2>
      
      <div className={styles.card}>
        <p className={styles.description}>
          Esta información aparecerá impresa en el encabezado de los tickets de caja y comprobantes de venta online.
        </p>
        <div className={styles.formGroup}>
          <div className={styles.field}>
            <label className={styles.label}>
              Nombre Comercial
            </label>
            <input 
              name="nombre"
              value={config.nombre}
              onChange={handleChange}
              className={styles.input}
              placeholder="Ej. Mi Tienda S.R.L."
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>
              NIT
            </label>
            <input 
              name="nit"
              value={config.nit}
              onChange={handleChange}
              className={styles.input}
              placeholder="Ej. 1234567890"
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>
              Dirección de la Sucursal
            </label>
            <input 
              name="direccion"
              value={config.direccion}
              onChange={handleChange}
              className={styles.input}
              placeholder="Ej. Av. Siempre Viva 123, Ciudad"
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>
              Teléfono de Contacto
            </label>
            <input 
              name="telefono"
              value={config.telefono}
              onChange={handleChange}
              className={styles.input}
              placeholder="Ej. +591 70000000"
            />
          </div>

          <div className={styles.actions}>
            <button 
              onClick={handleSave}
              disabled={saving}
              className={`${styles.btnSave} ${saving ? styles.btnSaveDisabled : ''}`}
            >
              <Save size={18} />
              {saving ? 'Guardando...' : 'Guardar Cambios'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
