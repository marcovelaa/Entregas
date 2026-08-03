import React from 'react';
import Link from 'next/link';
import styles from './Logo.module.css';

interface LogoProps {
  isCollapsed?: boolean;
}

const ColoredBooksIcon = ({ size = 38 }) => (
  <svg width={size} height={size} viewBox="3 3 18 18" fill="none" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 4v16" stroke="#F04B4B" />
    <path d="M9 8v12" stroke="#FBC940" />
    <path d="M13 6v14" stroke="#1E8A38" />
    <path d="m17 6 3 14" stroke="#2BBCEE" />
  </svg>
);

export function Logo({ isCollapsed = false }: LogoProps) {
  return (
    <Link href="/" className={styles.logo} aria-label="Volver al inicio">
      {isCollapsed ? (
        <div className={styles.iconWrapper}>
          <ColoredBooksIcon size={38} />
        </div>
      ) : (
        <div className={styles.textWrapper}>
          <span className={styles.red}>E</span>
          <span className={styles.blue}>N</span>
          <span className={styles.green}>T</span>
          <span className={styles.yellow}>R</span>
          <span className={styles.red}>E</span>
          <span className={styles.blue}>G</span>
          <span className={styles.yellow}>A</span>
          <span className={styles.green}>S</span>
        </div>
      )}
    </Link>
  );
}
