import React from 'react';
import Image from 'next/image';
import styles from './LevelsGrid.module.css';

export default function LevelsGrid() {
  return (
    <section className={styles.section} aria-labelledby="levels-title">
      <h2 id="levels-title" className={styles.sectionTitle}>Explora por Niveles</h2>
      <p className={styles.sectionSubtitle}>Encuentra el material adecuado para cada etapa educativa.</p>
      
      <div className={styles.levelsGrid}>
        <div className={styles.levelCardImage} tabIndex={0} role="button" aria-label="Nivel Inicial">
          <div className={styles.levelImgWrapper}>
            <Image src="https://images.unsplash.com/photo-1516627145497-ae6968895b74?q=80&w=600&auto=format&fit=crop" alt="Niños jugando en inicial" fill sizes="(max-width: 768px) 100vw, 250px" className={styles.levelImg} />
            <div className={`${styles.levelColorBar} ${styles.bgRed}`}></div>
          </div>
          <div className={styles.levelCardBody}>
            <h3 className={styles.textRed}>INICIAL</h3>
            <p>Estimulación temprana, juegos educativos y primeros trazos.</p>
          </div>
        </div>

        <div className={styles.levelCardImage} tabIndex={0} role="button" aria-label="Nivel Primaria">
          <div className={styles.levelImgWrapper}>
            <Image src="https://images.unsplash.com/photo-1588072432836-e10032774350?q=80&w=600&auto=format&fit=crop" alt="Estudiantes en primaria" fill sizes="(max-width: 768px) 100vw, 250px" className={styles.levelImg} />
            <div className={`${styles.levelColorBar} ${styles.bgYellow}`}></div>
          </div>
          <div className={styles.levelCardBody}>
            <h3 className={styles.textYellow}>PRIMARIA</h3>
            <p>Libros de texto, cuadernos y materiales para el desarrollo base.</p>
          </div>
        </div>

        <div className={styles.levelCardImage} tabIndex={0} role="button" aria-label="Nivel Secundaria">
          <div className={styles.levelImgWrapper}>
            <Image src="https://images.unsplash.com/photo-1427504494785-3a9ca7044f45?q=80&w=600&auto=format&fit=crop" alt="Adolescentes estudiando en secundaria" fill sizes="(max-width: 768px) 100vw, 250px" className={styles.levelImg} />
            <div className={`${styles.levelColorBar} ${styles.bgGreen}`}></div>
          </div>
          <div className={styles.levelCardBody}>
            <h3 className={styles.textGreen}>SECUNDARIA</h3>
            <p>Ciencias, matemáticas avanzadas y literatura especializada.</p>
          </div>
        </div>

        <div className={styles.levelCardImage} tabIndex={0} role="button" aria-label="Plan Lector">
          <div className={styles.levelImgWrapper}>
            <Image src="https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?q=80&w=600&auto=format&fit=crop" alt="Persona leyendo un libro" fill sizes="(max-width: 768px) 100vw, 250px" className={styles.levelImg} />
            <div className={`${styles.levelColorBar} ${styles.bgBlue}`}></div>
          </div>
          <div className={styles.levelCardBody}>
            <h3 className={styles.textBlue}>PLAN LECTOR</h3>
            <p>Títulos seleccionados para fomentar el hábito de la lectura.</p>
          </div>
        </div>

      </div>
    </section>
  );
}
