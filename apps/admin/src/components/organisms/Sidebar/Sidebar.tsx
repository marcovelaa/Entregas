'use client';

import React, { useState, useEffect, useLayoutEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Package, ShoppingCart, Users, Settings, LogOut, Library, Building2, ChevronLeft, ChevronRight, MonitorSmartphone, Receipt, Tag, Truck, BarChart, Menu, UserCircle } from 'lucide-react';
import { Logo } from '../../atoms/Logo/Logo';
import { clearSession, redirectToLogin, getUser, SessionUser } from '../../../lib/auth-session';
import styles from './Sidebar.module.css';

const navItems = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard, requiredPermiso: null },
  { href: '/caja', label: 'Caja (POS)', icon: MonitorSmartphone, requiredPermiso: 'caja:ver' },
  { href: '/ventas', label: 'Ventas', icon: Receipt, requiredPermiso: 'ventas:ver' },
  { href: '/reportes', label: 'Reportes', icon: BarChart, requiredPermiso: 'reportes:ver' },
  { href: '/catalogo', label: 'Catálogo', icon: Library, requiredPermiso: 'catalogo:ver' },
  { href: '/proveedores', label: 'Proveedores', icon: Building2, requiredPermiso: 'proveedores:ver' },
  { href: '/compras', label: 'Compras', icon: ShoppingCart, requiredPermiso: 'compras:ver' },
  { href: '/inventario', label: 'Inventario', icon: Package, requiredPermiso: 'inventario:ver' },
  { href: '/clientes', label: 'Clientes', icon: Users, requiredPermiso: 'clientes:ver' },
  { href: '/descuentos', label: 'Descuentos', icon: Tag, requiredPermiso: 'descuentos:ver' },
  { href: '/configuracion', label: 'Configuración', icon: Settings, requiredPermiso: 'iam:usuarios:ver' },
];

export function Sidebar() {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [user, setUser] = useState<SessionUser | null>(null);

  const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

  useEffect(() => {
    setUser(getUser());
  }, []);

  useIsomorphicLayoutEffect(() => {
    // Only update CSS variable for desktop state. Mobile is handled entirely by CSS media queries.
    document.documentElement.style.setProperty(
      '--current-sidebar-width', 
      isCollapsed ? '80px' : '250px'
    );
  }, [isCollapsed]);

  // Close mobile menu when navigating
  useEffect(() => {
    setIsMobileOpen(false);
  }, [pathname]);

  return (
    <>
      <button 
        className={styles.hamburgerBtn}
        onClick={() => setIsMobileOpen(true)}
        aria-label="Abrir menú"
      >
        <Menu size={24} />
      </button>

      {isMobileOpen && (
        <div className={styles.overlay} onClick={() => setIsMobileOpen(false)} />
      )}

      <aside className={`${styles.sidebar} ${isCollapsed ? styles.collapsed : ''} ${isMobileOpen ? styles.mobileOpen : ''}`}>
        <div className={styles.logoContainer}>
          <Logo isCollapsed={isCollapsed} />
          
          <button 
            className={styles.collapseBtn} 
            onClick={() => setIsCollapsed(!isCollapsed)}
            title={isCollapsed ? "Expandir" : "Contraer"}
          >
            {isCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
          </button>
        </div>
        <nav className={styles.nav}>
          <ul className={styles.navList}>
            {navItems.map((item) => {
              // Si el item requiere un permiso y el usuario no lo tiene (ni tiene '*'), no lo mostramos.
              if (
                item.requiredPermiso && 
                user && 
                user.permisos && 
                !user.permisos.includes(item.requiredPermiso) && 
                !user.permisos.includes('*')
              ) {
                return null;
              }

              const Icon = item.icon;
              const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));

              return (
                <li key={item.href} className={styles.navItem}>
                  <Link 
                    href={item.href} 
                    className={`${styles.navLink} ${isActive ? styles.active : ''}`}
                    title={isCollapsed ? item.label : undefined}
                  >
                    <Icon size={20} className={styles.icon} />
                    <span className={styles.text}>{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
        <div className={styles.footer}>
          <button 
            className={styles.logoutBtn}
            onClick={() => {
              clearSession();
              redirectToLogin();
            }}
            title={isCollapsed ? "Cerrar Sesión" : undefined}
          >
            <LogOut size={20} className={styles.icon} />
            <span className={styles.text}>Cerrar Sesión</span>
          </button>
          <p className={styles.footerText} style={{ marginTop: '1rem' }}>
            <span className={styles.footerTextFull}>Admin ERP v1.0</span>
            <span className={styles.footerTextShort}>v1</span>
          </p>
        </div>
      </aside>
    </>
  );
}
