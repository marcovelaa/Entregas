import React from 'react';
import styles from './destacados.module.css';
import Image from 'next/image';

export default function DestacadosPage() {
  const PlusIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <line x1="12" y1="5" x2="12" y2="19"></line>
      <line x1="5" y1="12" x2="19" y2="12"></line>
    </svg>
  );

  return (
    <main className={styles.main}>
      <div className={styles.container}>
        <div className={styles.headerTitle}>
          <h1>Selección <span className={styles.textHighlight}>Premium</span></h1>
          <p>Los mejores materiales educativos recomendados por profesores y colegios.</p>
        </div>

        {/* HERO SHOWCASE (Clean Editorial Style) */}
        <section className={styles.heroShowcase}>
          <div className={styles.heroContent}>
            <span className={styles.heroBadge}>Producto Estrella</span>
            <h2 className={styles.heroTitle}>Pack Robótica Educativa Avanzada</h2>
            <p className={styles.heroDesc}>
              El kit definitivo que todos los colegios están pidiendo para este ciclo lectivo. 
              Incluye sensores, placa base y el libro de proyectos paso a paso.
            </p>
            <div className={styles.heroPrice}>
              <span className={styles.oldPrice}>Bs. 450.00</span>
              <span className={styles.currentPrice}>Bs. 320.00</span>
            </div>
            <button className={styles.heroCta}>Añadir al Carrito</button>
          </div>
          <div className={styles.heroImageWrapper}>
            <Image 
              src="https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=1000&auto=format&fit=crop" 
              alt="Kit Robótica" 
              fill 
              className={styles.heroImage}
              style={{ objectFit: 'cover' }}
            />
          </div>
        </section>

        {/* CLEAN GRID */}
        <section className={styles.bentoSection}>
          <h3 className={styles.sectionTitle}>Más Buscados</h3>
          <div className={styles.cleanGrid}>
            
            <div className={styles.gridCard}>
              <div className={styles.cardTag}>5/5 por Profesores</div>
              <div className={styles.cardImage}>
                <Image src="https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?q=80&w=600&auto=format&fit=crop" alt="Libro" fill sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw" style={{objectFit: 'cover'}} />
              </div>
              <div className={styles.cardInfo}>
                <h4>El Monstruo de Colores</h4>
                <p>Plan Lector - Primaria</p>
                <div className={styles.cardAction}>
                  <span>Bs. 60.00</span>
                  <button className={styles.addBtn} aria-label="Añadir"><PlusIcon /></button>
                </div>
              </div>
            </div>

            <div className={styles.gridCard}>
              <div className={styles.cardTag}>Top Ventas</div>
              <div className={styles.cardImage}>
                <Image src="https://images.unsplash.com/photo-1543286386-2e659306cd6c?q=80&w=600&auto=format&fit=crop" alt="Matemáticas" fill sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw" style={{objectFit: 'cover'}} />
              </div>
              <div className={styles.cardInfo}>
                <h4>Matemáticas Avanzadas 6to</h4>
                <p>Secundaria - Texto Escolar</p>
                <div className={styles.cardAction}>
                  <span>Bs. 120.00</span>
                  <button className={styles.addBtn} aria-label="Añadir"><PlusIcon /></button>
                </div>
              </div>
            </div>

            <div className={styles.gridCard}>
              <div className={styles.cardTag}>Últimas Unidades</div>
              <div className={styles.cardImage}>
                <Image src="https://images.unsplash.com/photo-1583468982228-19f19164aee2?q=80&w=600&auto=format&fit=crop" alt="Material" fill sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw" style={{objectFit: 'cover'}} />
              </div>
              <div className={styles.cardInfo}>
                <h4>Set de Geometría Premium</h4>
                <p>Material Escolar</p>
                <div className={styles.cardAction}>
                  <span>Bs. 45.00</span>
                  <button className={styles.addBtn} aria-label="Añadir"><PlusIcon /></button>
                </div>
              </div>
            </div>

            <div className={styles.gridCard}>
              <div className={styles.cardTag}>Oferta</div>
              <div className={styles.cardImage}>
                <Image src="https://images.unsplash.com/photo-1503694978374-8a2fa686963a?q=80&w=600&auto=format&fit=crop" alt="Libro" fill sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw" style={{objectFit: 'cover'}} />
              </div>
              <div className={styles.cardInfo}>
                <h4>Diccionario Bilingüe Escolar</h4>
                <p>Textos de Apoyo</p>
                <div className={styles.cardAction}>
                  <span>Bs. 85.00</span>
                  <button className={styles.addBtn} aria-label="Añadir"><PlusIcon /></button>
                </div>
              </div>
            </div>

          </div>
        </section>
      </div>
    </main>
  );
}
