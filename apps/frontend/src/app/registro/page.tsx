'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '../../lib/api';
import styles from './Registro.module.css';

export default function RegistroPage() {
  const router = useRouter();
  const [form, setForm] = useState({ nombres: '', apellidos: '', email: '', telefono: '', password: '' });
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);

  function handleChange(field: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement>) => setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setCargando(true);
    try {
      await api.post('/clientes/auth/registro', form);
      router.push('/mi-cuenta');
    } catch (err: any) {
      if (err?.response?.status === 409) {
        setError('Ya existe una cuenta con este correo electrónico.');
      } else {
        setError('No pudimos crear tu cuenta. Revisá los datos e intentá de nuevo.');
      }
    } finally {
      setCargando(false);
    }
  }

  return (
    <main className={styles.pageWrapper}>
      <h1 className={styles.title}>Crear cuenta</h1>
      <form onSubmit={handleSubmit}>
        {error && <p className={styles.error}>{error}</p>}
        <div className={styles.inputGroup}>
          <label htmlFor="nombres">Nombres</label>
          <input id="nombres" className={styles.input} value={form.nombres} onChange={handleChange('nombres')} required />
        </div>
        <div className={styles.inputGroup}>
          <label htmlFor="apellidos">Apellidos</label>
          <input id="apellidos" className={styles.input} value={form.apellidos} onChange={handleChange('apellidos')} required />
        </div>
        <div className={styles.inputGroup}>
          <label htmlFor="email">Correo electrónico</label>
          <input id="email" type="email" className={styles.input} value={form.email} onChange={handleChange('email')} required />
        </div>
        <div className={styles.inputGroup}>
          <label htmlFor="telefono">Teléfono (opcional)</label>
          <input id="telefono" className={styles.input} value={form.telefono} onChange={handleChange('telefono')} />
        </div>
        <div className={styles.inputGroup}>
          <label htmlFor="password">Contraseña</label>
          <input
            id="password"
            type="password"
            className={styles.input}
            value={form.password}
            onChange={handleChange('password')}
            minLength={8}
            required
          />
        </div>
        <button type="submit" className={styles.submitBtn} disabled={cargando}>
          {cargando ? 'Creando cuenta...' : 'Crear cuenta'}
        </button>
      </form>
      <p className={styles.footerLink}>
        ¿Ya tenés cuenta? <Link href="/ingresar">Ingresá</Link>
      </p>
    </main>
  );
}
