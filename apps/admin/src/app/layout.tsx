import type { Metadata } from 'next';
import './globals.css';
import { AppShell } from '../components/organisms/AppShell/AppShell';

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
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
