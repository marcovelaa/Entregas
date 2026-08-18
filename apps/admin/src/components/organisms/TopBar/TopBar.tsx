'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { GlobalNotifications } from '../GlobalNotifications/GlobalNotifications';
import { getUser, SessionUser } from '../../../lib/auth-session';
import styles from './TopBar.module.css';

export function TopBar() {
  const [user, setUser] = useState<SessionUser | null>(null);

  useEffect(() => {
    setUser(getUser());
  }, []);

  const getInitials = (nombres: string = '', apellidos: string = '') => {
    return `${nombres.charAt(0)}${apellidos.charAt(0)}`.toUpperCase() || 'U';
  };

  return (
    <div className={styles.topbar}>
      <div className={styles.left}>
        {/* Placeholder for future global search or breadcrumbs */}
      </div>
      <div className={styles.right}>
        <div className={styles.notificationsWrapper}>
          <GlobalNotifications />
        </div>
        
        <div className={styles.divider}></div>
        
        <Link href="/perfil" className={styles.profile} style={{ textDecoration: 'none', color: 'inherit' }}>
          <div className={styles.avatar}>{user ? getInitials(user.nombres, user.apellidos !== '-' ? user.apellidos : '') : '...'}</div>
          <div className={styles.userInfo}>
            <span className={styles.userName}>{user ? `${user.nombres} ${user.apellidos !== '-' ? user.apellidos : ''}`.trim() : 'Cargando...'}</span>
            <span className={styles.userRole}>{user?.rol || 'Usuario'}</span>
          </div>
        </Link>
      </div>
    </div>
  );
}
