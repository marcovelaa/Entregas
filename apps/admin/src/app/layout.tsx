import type { Metadata } from 'next';
import './globals.css';
import { Sidebar } from '../components/organisms/Sidebar/Sidebar';
import styles from './layout.module.css';

import { TopBar } from '../components/organisms/TopBar/TopBar';

export const metadata: Metadata = {
  title: 'Admin ERP - ENTREGAS',
  description: 'Sistema ERP de Entregas',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body>
        <div className={styles.appContainer}>
          <Sidebar />
          <div className={styles.mainContent}>
            <TopBar />
            <div className={styles.pageContent}>
              {children}
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
