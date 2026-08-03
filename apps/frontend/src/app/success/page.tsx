import React from 'react';
import Link from 'next/link';
import styles from './success.module.css';

export default function SuccessPage() {
  return (
    <div className={styles.pageWrapper}>
      <main className={styles.mainContent}>
        <div className={styles.successCard}>
          <div className={styles.iconContainer}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={styles.checkIcon}>
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
              <polyline points="22 4 12 14.01 9 11.01"></polyline>
            </svg>
          </div>
          <h1 className={styles.title}>¡Pedido Confirmado!</h1>
          <p className={styles.description}>
            Tu compra se procesó exitosamente. Hemos recibido tu pago por QR Simple.
          </p>
          <div className={styles.orderNumber}>
            <span>Número de Pedido:</span>
            <strong>#ENT-2026-8492</strong>
          </div>
          <p className={styles.whatsappNote}>
            En breve, un asesor se contactará con vos por WhatsApp para coordinar los detalles de entrega.
          </p>
          <div className={styles.actions}>
            <Link href="/" className={styles.homeBtn}>
              VOLVER AL INICIO
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
