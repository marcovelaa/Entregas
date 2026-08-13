'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import { api } from '../../lib/api';
import styles from './RecuperarPassword.module.css';

export default function RecuperarPasswordPage() {
  const [email, setEmail] = useState('');
  const [enviado, setEnviado] = useState(false);
  const [devToken, setDevToken] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const response = await api.post('/clientes/auth/solicitar-recuperacion', { email });
    setEnviado(true);
    setDevToken(response.data.devToken ?? null);
  }

  if (enviado) {
    return (
      <main className={styles.pageWrapper}>
        <h1 className={styles.title}>Revisá tu correo</h1>
        <p>Si el correo existe, vas a recibir instrucciones para restablecer tu contraseña.</p>
        {devToken && (
          <div className={styles.devTokenBox}>
            Modo desarrollo — todavía no hay envío real de email. Usá este enlace:{' '}
            <Link href={`/recuperar-password/${devToken}`}>/recuperar-password/{devToken}</Link>
          </div>
        )}
      </main>
    );
  }

  return (
    <main className={styles.pageWrapper}>
      <h1 className={styles.title}>Recuperar contraseña</h1>
      <form onSubmit={handleSubmit}>
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
        <button type="submit" className={styles.submitBtn}>
          Enviar instrucciones
        </button>
      </form>
    </main>
  );
}
