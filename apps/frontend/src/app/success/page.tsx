'use client';

import React, { Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import styles from './success.module.css';

function SuccessContent() {
  const searchParams = useSearchParams();
  const numeroPedido = searchParams.get('numero_pedido') || 'ENT-2026-8492';
  const total = searchParams.get('total');
  const ciudad = searchParams.get('ciudad') || 'Santa Cruz';

  return (
    <div className={styles.successCard}>
      <div className={styles.iconContainer}>
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={styles.checkIcon}
        >
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
          <polyline points="22 4 12 14.01 9 11.01"></polyline>
        </svg>
      </div>
      <h1 className={styles.title}>¡Pedido Confirmado!</h1>
      <p className={styles.description}>
        Tu compra se procesó exitosamente. Hemos recibido la confirmación de tu pago por QR Banco BISA.
      </p>
      <div className={styles.orderNumber}>
        <span>Número de Pedido:</span>
        <strong>#{numeroPedido}</strong>
      </div>
      {total && (
        <div style={{ marginTop: '0.5rem', fontSize: '1rem', color: '#475569' }}>
          Total Pagado: <strong>Bs. {Number(total).toFixed(2)} BOB</strong> ({ciudad})
        </div>
      )}
      <p className={styles.whatsappNote}>
        En breve, un asesor se contactará con vos por WhatsApp para coordinar la entrega en {ciudad}.
      </p>
      <div className={styles.actions}>
        <Link href="/mi-cuenta" className={styles.homeBtn} style={{ marginBottom: '0.5rem', background: '#0284c7' }}>
          VER EN MI CUENTA
        </Link>
        <Link href="/" className={styles.homeBtn}>
          VOLVER AL INICIO
        </Link>
      </div>
    </div>
  );
}

export default function SuccessPage() {
  return (
    <div className={styles.pageWrapper}>
      <main className={styles.mainContent}>
        <Suspense fallback={<div>Cargando datos del pedido...</div>}>
          <SuccessContent />
        </Suspense>
      </main>
    </div>
  );
}
