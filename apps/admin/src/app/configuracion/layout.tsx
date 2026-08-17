'use client';
import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Header } from '../../components/organisms/Header/Header';
import styles from './configuracion.module.css';

export default function ConfiguracionLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const tabs = [
    { name: 'Datos del Negocio', href: '/configuracion/negocio' },
    { name: 'Usuarios', href: '/configuracion/usuarios' },
    { name: 'Roles y Permisos', href: '/configuracion/roles' },
  ];

  return (
    <div className={styles.container}>
      <Header title="Configuración del Sistema" />
      
      <div className={styles.tabsContainer}>
        <nav className={styles.tabsNav}>
          {tabs.map((tab) => (
            <Link 
              key={tab.href} 
              href={tab.href}
              className={`${styles.tab} ${pathname.startsWith(tab.href) ? styles.activeTab : ''}`}
            >
              {tab.name}
            </Link>
          ))}
        </nav>
      </div>

      <div className={styles.content}>
        {children}
      </div>
    </div>
  );
}
