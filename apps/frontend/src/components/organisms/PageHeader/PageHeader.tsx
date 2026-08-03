import React from 'react';
import styles from './PageHeader.module.css';

interface PageHeaderProps {
  title: string;
  subtitle: string;
  badge?: string;
}

export default function PageHeader({ title, subtitle, badge }: PageHeaderProps) {
  return (
    <div className={styles.wrapper}>
      <section className={styles.header} aria-labelledby="page-title">
        <div className={styles.headerContent}>
          {badge && <span className={styles.badge}>{badge}</span>}
          <h1 id="page-title" className={styles.title}>
            {title}
          </h1>
          <p className={styles.subtitle}>
            {subtitle}
          </p>
        </div>
        <div className={styles.background} aria-hidden="true"></div>
      </section>
    </div>
  );
}
