'use client';

import { useState } from 'react';
import { Logo } from '../../components/atoms/Logo/Logo';
import { login, getErrorMessage } from '../../lib/auth-session';
import styles from './page.module.css';

export default function LoginPage() {
  const [email, setEmail] = useState('admin@entregas.com.bo');
  const [password, setPassword] = useState('temporal123');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    setSubmitting(true);
    setError(null);

    try {
      await login(email, password);
      // Hard nav to root so AppShell re-bootstraps from a clean React tree
      window.location.replace('/');
    } catch (err) {
      setError(getErrorMessage(err, 'No pudimos iniciar sesión. Intentá de nuevo.'));
      setSubmitting(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.logoWrapper}>
          <Logo />
        </div>
        
        <h1 className={styles.title}>Iniciar Sesión</h1>

        {error && (
          <div className={styles.alert} role="alert">
            {error}
          </div>
        )}

        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.inputGroup}>
            <label htmlFor="email" className={styles.label}>
              Correo electrónico
            </label>
            <input
              id="email"
              type="email"
              className={styles.input}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
            />
          </div>

          <div className={styles.inputGroup}>
            <label htmlFor="password" className={styles.label}>
              Contraseña
            </label>
            <input
              id="password"
              type="password"
              className={styles.input}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
          </div>

          <button
            type="submit"
            className={styles.submitBtn}
            disabled={submitting}
          >
            {submitting ? 'Ingresando…' : 'Ingresar'}
          </button>
        </form>
      </div>
    </div>
  );
}
