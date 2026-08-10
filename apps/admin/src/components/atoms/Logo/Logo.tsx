import React from 'react';
import Link from 'next/link';
import styles from './Logo.module.css';

interface LogoProps {
  isCollapsed?: boolean;
}

const ColoredBooksIcon = ({ size = 32 }) => (
  <svg width={size} height={size} viewBox="3 3 18 18" fill="none" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={styles.svgIcon}>
    <path d="M5 4v16" stroke="#F04B4B" />
    <path d="M9 8v12" stroke="#2BBCEE" />
    <path d="M13 6v14" stroke="#1E8A38" />
    <path d="m17 6 3 14" stroke="#FBC940" />
  </svg>
);

export function Logo({ isCollapsed = false }: LogoProps) {
  return (
    <Link href="/" className={`${styles.logo} ${isCollapsed ? styles.collapsedLogo : ''}`} aria-label="Volver al inicio">
      <div className={styles.iconWrapper}>
        <ColoredBooksIcon size={32} />
      </div>
      {!isCollapsed && (
        <span className={styles.brandText}>ENTREGAS</span>
      )}
    </Link>
  );
}
