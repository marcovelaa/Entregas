'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Package, ShoppingCart, Users, Settings, LogOut, Library, Building2, ChevronLeft, ChevronRight, MonitorSmartphone, Receipt, Tag } from 'lucide-react';
import { Logo } from '../../atoms/Logo/Logo';
import styles from './Sidebar.module.css';

const navItems = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/caja', label: 'Caja (POS)', icon: MonitorSmartphone },
  { href: '/ventas', label: 'Ventas', icon: Receipt },
  { href: '/catalogo', label: 'Catálogo', icon: Library },
  { href: '/proveedores', label: 'Proveedores', icon: Building2 },
  { href: '/compras', label: 'Compras', icon: ShoppingCart },
  { href: '/inventario', label: 'Inventario', icon: Package },
  { href: '/clientes', label: 'Clientes', icon: Users },
  { href: '/descuentos', label: 'Descuentos', icon: Tag },
  { href: '/configuracion', label: 'Configuración', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    document.documentElement.style.setProperty(
      '--current-sidebar-width', 
      isCollapsed ? '80px' : '250px'
    );
  }, [isCollapsed]);

  return (
    <aside className={`${styles.sidebar} ${isCollapsed ? styles.collapsed : ''}`}>
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
                  {!isCollapsed && <span className={styles.text}>{item.label}</span>}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      <div className={styles.footer}>
        {!isCollapsed ? (
          <p className={styles.footerText}>Admin ERP v1.0</p>
        ) : (
          <p className={styles.footerText}>v1</p>
        )}
      </div>
    </aside>
  );
}
