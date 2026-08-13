'use client';
import React, { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { api } from '../../lib/api';
import styles from './Ingresar.module.css';

function IngresarForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setCargando(true);
    try {
      await api.post('/clientes/auth/login', { email, password });
      const redirectTo = searchParams.get('redirect') || '/mi-cuenta';
      router.push(redirectTo);
    } catch {
      setError('Correo o contraseña incorrectos.');
    } finally {
      setCargando(false);
    }
  }

  return (
    <main className={styles.pageWrapper}>
      <h1 className={styles.title}>Ingresar</h1>
      <form onSubmit={handleSubmit}>
        {error && <p className={styles.error}>{error}</p>}
        <div className={styles.inputGroup}>
          <label htmlFor="email">Correo electrónico</label>
          <input
            id="email"
            type="email"
            className={styles.input}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className={styles.inputGroup}>
          <label htmlFor="password">Contraseña</label>
          <input
            id="password"
            type="password"
            className={styles.input}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <button type="submit" className={styles.submitBtn} disabled={cargando}>
          {cargando ? 'Ingresando...' : 'Ingresar'}
        </button>
      </form>
      <p className={styles.footerLink}>
        ¿No tenés cuenta? <Link href="/registro">Registrate</Link>
      </p>
      <p className={styles.footerLink}>
        <Link href="/recuperar-password">¿Olvidaste tu contraseña?</Link>
      </p>
    </main>
  );
}

export default function IngresarPage() {
  return (
    <Suspense fallback={<main className={styles.pageWrapper}><h1 className={styles.title}>Cargando...</h1></main>}>
      <IngresarForm />
    </Suspense>
  );
}
