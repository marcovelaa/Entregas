import React from 'react';
import { GlobalNotifications } from '../GlobalNotifications/GlobalNotifications';
import styles from './TopBar.module.css';

export function TopBar() {
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
        
        <div className={styles.profile}>
          <div className={styles.avatar}>AD</div>
          <div className={styles.userInfo}>
            <span className={styles.userName}>Admin</span>
            <span className={styles.userRole}>Administrador</span>
          </div>
        </div>
      </div>
    </div>
  );
}
