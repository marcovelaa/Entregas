import React from 'react';
import Link from 'next/link';
import styles from './Logo.module.css';

export function Logo() {
  return (
    <Link href="/" className={styles.logo} aria-label="Volver al inicio">
      <span className={styles.red}>E</span>
      <span className={styles.blue}>N</span>
      <span className={styles.green}>T</span>
      <span className={styles.yellow}>R</span>
      <span className={styles.red}>E</span>
      <span className={styles.blue}>G</span>
      <span className={styles.yellow}>A</span>
      <span className={styles.green}>S</span>
      <span className={styles.red}>.</span>
      <span className={styles.main}>com</span>
      <span className={styles.red}>.</span>
      <span className={styles.main}>bo</span>
    </Link>
  );
}
