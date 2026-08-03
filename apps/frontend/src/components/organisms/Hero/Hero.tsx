import React from 'react';
import styles from './Hero.module.css';

export default function Hero() {
  return (
    <section className={styles.hero} aria-labelledby="hero-title">
      <div className={styles.heroContent}>
        <h1 id="hero-title" className={styles.heroTitle}>
          Todo para el nuevo año escolar en un solo lugar
        </h1>
        <p className={styles.heroSubtitle}>
          Textos, plan lector y material académico con entrega a todo Bolivia.
        </p>
        <div className={styles.heroActions}>
          <button className={styles.btnPrimary}>Ver Catálogo 2026</button>
          <button className={styles.btnSecondary}>Lista de Útiles</button>
        </div>
      </div>
      <div className={styles.heroBackground} aria-hidden="true"></div>
    </section>
  );
}
