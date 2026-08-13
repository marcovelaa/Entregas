'use client';
import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '../../../lib/api';
import styles from '../RecuperarPassword.module.css';

export default function RestablecerPasswordPage() {
  const params = useParams<{ token: string }>();
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setCargando(true);
    try {
      await api.post('/clientes/auth/restablecer-password', { token: params.token, password });
      router.push('/ingresar');
    } catch {
      setError('El enlace no es válido o ya expiró. Solicitá uno nuevo.');
    } finally {
      setCargando(false);
    }
  }

  return (
    <main className={styles.pageWrapper}>
      <h1 className={styles.title}>Elegí una nueva contraseña</h1>
      <form onSubmit={handleSubmit}>
        {error && <p className={styles.error}>{error}</p>}
        <div className={styles.inputGroup}>
          <label htmlFor="password">Nueva contraseña</label>
          <input
            id="password"
            type="password"
            className={styles.input}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={8}
            required
          />
        </div>
        <button type="submit" className={styles.submitBtn} disabled={cargando}>
          {cargando ? 'Guardando...' : 'Guardar nueva contraseña'}
        </button>
      </form>
    </main>
  );
}
