'use client';
import React, { ReactNode } from 'react';
import { usePermissions } from '../../../hooks/usePermissions';
import { Lock } from 'lucide-react';
import styles from './RequirePermission.module.css';

interface RequirePermissionProps {
  p: string;
  children: ReactNode;
  fallback?: 'hide' | 'lock';
}

export function RequirePermission({ p, children, fallback = 'lock' }: RequirePermissionProps) {
  const { can, user } = usePermissions();

  // If user is null (still loading session from client), we could return null or keep it locked.
  // We'll return null to avoid flash of locked content.
  if (!user) return null;

  if (can(p)) {
    return <>{children}</>;
  }

  if (fallback === 'hide') {
    return null;
  }

  // Fallback = lock (show as disabled)
  return (
    <div className={styles.lockedWrapper} title="No tienes permiso para realizar esta acción">
      <div style={{ opacity: 0.5 }}>{children}</div>
      <Lock size={16} className={styles.lockIcon} />
    </div>
  );
}
