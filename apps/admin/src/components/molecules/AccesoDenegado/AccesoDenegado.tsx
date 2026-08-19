'use client';

import { useRouter } from 'next/navigation';
import { ShieldAlert } from 'lucide-react';
import styles from './AccesoDenegado.module.css';

export function AccesoDenegado() {
  const router = useRouter();

  return (
    <div className={styles.container} role="alert">
      <ShieldAlert size={48} className={styles.icon} />
      <h1 className={styles.title}>Acceso Denegado</h1>
      <p className={styles.message}>
        No tienes permiso para ver esta sección.
      </p>
      <button
        type="button"
        className={styles.button}
        onClick={() => router.replace('/')}
      >
        Volver al Inicio
      </button>
    </div>
  );
}
