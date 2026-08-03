import React from 'react';
import Link from 'next/link';
import styles from './success.module.css';

export default function SuccessPage() {
  return (
    <div className={styles.pageWrapper}>
      <main className={styles.mainContent}>
        <div className={styles.successCard}>
          <div className={styles.iconWrapper}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={styles.checkIcon}>
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
              <polyline points="22 4 12 14.01 9 11.01"></polyline>
            </svg>
          </div>
          
          <h1 className={styles.title}>¡Pago Confirmado!</h1>
          <p className={styles.orderId}>Tu número de orden es: <strong>#ENT-84920</strong></p>
          
          <div className={styles.whatsappInfo} style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '24px', marginTop: '24px', textAlign: 'left' }}>
            <h3 style={{ fontSize: '1.2rem', marginBottom: '16px', color: 'var(--color-green)' }}>✓ Compra registrada exitosamente</h3>
            <p style={{ color: 'var(--text-muted)', lineHeight: '1.6', marginBottom: '16px' }}>
              Hemos recibido la confirmación de tu pago por QR. Tu pedido ya está en nuestro sistema y el equipo de ventas acaba de recibir la notificación.
            </p>
            <div style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)', padding: '16px', borderRadius: '8px', borderLeft: '4px solid var(--color-blue)' }}>
              <p style={{ margin: 0, fontWeight: '500', color: 'var(--text-main)' }}>
                <strong>Próximo paso:</strong> Una vendedora te contactará por WhatsApp al número que registraste para coordinar el envío. ¡No tenés que hacer nada más!
              </p>
            </div>
          </div>

          <div className={styles.actions}>
            <Link href="/" className={styles.homeLink}>Volver a la tienda</Link>
          </div>
        </div>
      </main>
    </div>
  );
}
