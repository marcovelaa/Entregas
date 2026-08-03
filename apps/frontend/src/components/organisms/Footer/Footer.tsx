import React from 'react';
import styles from './Footer.module.css';
import Link from 'next/link';

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.footerGrid}>
        <div className={styles.footerCol}>
          <h3>Sobre ENTREGAS</h3>
          <ul>
            <li><Link href="#">Quiénes Somos</Link></li>
            <li><Link href="#">Nuestras Sucursales</Link></li>
            <li><Link href="#">Trabaja con Nosotros</Link></li>
            <li><Link href="#">Términos y Condiciones</Link></li>
          </ul>
        </div>
        <div className={styles.footerCol}>
          <h3>Atención al Cliente</h3>
          <ul>
            <li><Link href="#">Centro de Ayuda</Link></li>
            <li><Link href="#">Cómo Comprar</Link></li>
            <li><Link href="#">Política de Devoluciones</Link></li>
            <li><Link href="#">Contacto</Link></li>
          </ul>
        </div>
        <div className={styles.footerCol}>
          <h3>Categorías Populares</h3>
          <ul>
            <li><Link href="#">Textos Escolares 2026</Link></li>
            <li><Link href="#">Plan Lector</Link></li>
            <li><Link href="#">Mochilas y Bolsos</Link></li>
            <li><Link href="#">Arte y Diseño</Link></li>
          </ul>
        </div>
        <div className={styles.footerCol}>
          <h3>Suscríbete</h3>
          <p className={styles.newsletterText}>Recibe ofertas exclusivas y novedades para el año escolar.</p>
          <div className={styles.newsletterBox}>
            <input type="email" placeholder="Tu correo electrónico" aria-label="Correo electrónico para boletín" />
            <button aria-label="Suscribirse">Enviar</button>
          </div>
        </div>
      </div>
      <div className={styles.footerBottom}>
        <p>© 2026 ENTREGAS.com.bo - El sistema integral para librerías en Bolivia.</p>
      </div>
    </footer>
  );
}
