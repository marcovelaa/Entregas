'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { refreshSession } from '../../../lib/auth-session';
import { Sidebar } from '../Sidebar/Sidebar';
import { TopBar } from '../TopBar/TopBar';
import { Modal } from '../../molecules/Modal/Modal';
import { AlertCircle } from 'lucide-react';
import styles from './AppShell.module.css';

export function AppShell({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<'loading' | 'anonymous' | 'authenticated'>('loading');
  const [globalError, setGlobalError] = useState<string | null>(null);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    refreshSession().then((hasSession) => {
      setStatus(hasSession ? 'authenticated' : 'anonymous');
    });

    const handleGlobalError = (e: any) => setGlobalError(e.detail);
    window.addEventListener('global-error', handleGlobalError);
    return () => window.removeEventListener('global-error', handleGlobalError);
  }, []);

  const isLoginPage = pathname?.startsWith('/login');

  useEffect(() => {
    if (status === 'anonymous' && !isLoginPage) {
      router.replace('/login');
    } else if (status === 'authenticated' && isLoginPage) {
      router.replace('/');
    }
  }, [status, isLoginPage, router]);

  if (status === 'loading') {
    return (
      <div className={styles.loaderContainer}>
        <div className={styles.loader}></div>
      </div>
    );
  }

  if (status === 'anonymous') {
    if (isLoginPage) {
      return <>{children}</>;
    }
    return (
      <div className={styles.loaderContainer}>
        <div className={styles.loader}></div>
      </div>
    );
  }

  // status === 'authenticated'
  if (isLoginPage) {
    return (
      <div className={styles.loaderContainer}>
        <div className={styles.loader}></div>
      </div>
    );
  }

  return (
    <div className={styles.appContainer}>
      <Sidebar />
      <div className={styles.mainContent}>
        <TopBar />
        <div className={styles.pageContent}>{children}</div>
      </div>

      <Modal
        isOpen={!!globalError}
        onClose={() => setGlobalError(null)}
        title="Acceso Denegado"
        maxWidth="400px"
      >
        <div style={{ padding: '1rem 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', textAlign: 'center' }}>
          <AlertCircle size={48} color="#ef4444" />
          <p style={{ color: '#334155', fontSize: '0.95rem' }}>
            {globalError}
          </p>
          <button 
            onClick={() => setGlobalError(null)}
            style={{ 
              marginTop: '1rem',
              padding: '0.6rem 1.5rem', 
              background: '#0f172a', 
              color: 'white', 
              border: 'none', 
              borderRadius: '6px', 
              cursor: 'pointer',
              fontWeight: 500
            }}
          >
            Entendido
          </button>
        </div>
      </Modal>
    </div>
  );
}
