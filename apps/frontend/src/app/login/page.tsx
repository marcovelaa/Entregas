'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import styles from './page.module.css';
import { Logo } from '@/components/atoms/Logo/Logo';

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isForgotPassword) {
      alert('Te enviamos un enlace de recuperación a tu correo.');
      setIsForgotPassword(false);
      return;
    }
    // Acá iría la llamada al backend para hacer login o registro.
    // Por ahora, simulamos un inicio de sesión exitoso y redirigimos a Mi Cuenta.
    router.push('/mi-cuenta');
  };

  return (
    <div className={styles.pageWrapper}>
      <header className={styles.topHeader}>
        <div className={styles.logoWrapper}>
          <Logo />
        </div>
        <Link href="/" className={styles.closeBtn} aria-label="Cerrar y volver a la tienda">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </Link>
      </header>

      <main className={styles.mainContent}>
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h1 className={styles.title}>
              {isForgotPassword ? 'Recuperar contraseña' : (isLogin ? 'Iniciar sesión' : 'Crear cuenta')}
            </h1>
            {!isForgotPassword && (
              <p className={styles.subtitle}>
                {isLogin ? (
                  <>¿Sos nuevo en ENTREGAS? <button type="button" className={styles.textLink} onClick={() => setIsLogin(false)}>Creá una cuenta</button></>
                ) : (
                  <>¿Ya tenés una cuenta? <button type="button" className={styles.textLink} onClick={() => setIsLogin(true)}>Iniciá sesión</button></>
                )}
              </p>
            )}
            {isForgotPassword && (
              <p className={styles.subtitle}>
                Ingresá tu correo electrónico y te enviaremos un enlace para restablecer tu contraseña.
              </p>
            )}
          </div>
          
          <form className={styles.form} onSubmit={handleSubmit}>
            {!isLogin && !isForgotPassword && (
              <div className={styles.formGroup}>
                <label htmlFor="nombre">Nombre completo</label>
                <input 
                  id="nombre"
                  type="text" 
                  placeholder="Ej. María Pérez" 
                  required 
                  className={styles.input}
                />
              </div>
            )}

            <div className={styles.formGroup}>
              <label htmlFor="email">E-mail</label>
              <input 
                id="email"
                type="email" 
                required 
                className={styles.input}
              />
            </div>

            {!isForgotPassword && (
              <div className={styles.formGroup}>
                <div className={styles.labelRow}>
                  <label htmlFor="password">Contraseña</label>
                  {isLogin && (
                    <button type="button" className={styles.forgotPassword} onClick={() => setIsForgotPassword(true)}>
                      ¿Olvidaste tu contraseña?
                    </button>
                  )}
                </div>
                <input 
                  id="password"
                  type="password" 
                  required 
                  className={styles.input}
                />
              </div>
            )}

            <button type="submit" className={styles.submitBtn}>
              {isForgotPassword ? 'Enviar enlace' : (isLogin ? 'Continuar' : 'Crear cuenta')}
            </button>
            
            {isForgotPassword && (
              <button type="button" className={styles.textLink} style={{ textAlign: 'center', marginTop: '0.5rem' }} onClick={() => setIsForgotPassword(false)}>
                Volver a Iniciar sesión
              </button>
            )}
          </form>

          {!isForgotPassword && (
            <>
              <div className={styles.divider}>
                <span>o</span>
              </div>

              <button type="button" className={styles.googleBtn} onClick={() => alert('Integración con Google en camino...')}>
                <svg width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Continuar con Google
              </button>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
