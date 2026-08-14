'use client';
import React from 'react';
import styles from './Footer.module.css';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Logo } from '@/components/atoms/Logo/Logo';
import { IconBrandFacebook, IconBrandInstagram, IconBrandTiktok, IconBrandWhatsapp } from '@tabler/icons-react';

export default function Footer() {
  const pathname = usePathname();

  if (pathname === '/login') {
    return null;
  }

  return (
    <footer className={styles.footer}>
      <div className={styles.footerGrid}>
        <div className={styles.footerBrandCol}>
          <div className={styles.logoWrapper}>
            <Logo />
          </div>
          <p className={styles.brandDesc}>Tu aliado escolar en Bolivia.</p>
          <div className={styles.socialIcons}>
            <a href="#" aria-label="Facebook">
              <IconBrandFacebook size={22} stroke={1.5} />
            </a>
            <a href="#" aria-label="Instagram">
              <IconBrandInstagram size={22} stroke={1.5} />
            </a>
            <a href="#" aria-label="TikTok">
              <IconBrandTiktok size={22} stroke={1.5} />
            </a>
            <a href="#" aria-label="WhatsApp">
              <IconBrandWhatsapp size={22} stroke={1.5} />
            </a>
          </div>
        </div>
        <div className={styles.footerCol}>
          <input type="checkbox" id="footer-atencion" className={styles.accordionToggle} />
          <label htmlFor="footer-atencion" className={styles.footerSummary}>
            Atención al Cliente
            <span className={styles.expandIcon}>+</span>
          </label>
          <ul className={styles.accordionContent}>
            <li><Link href="#">Centro de Ayuda</Link></li>
            <li><Link href="#">Términos y Condiciones</Link></li>
            <li><Link href="#">Contacto</Link></li>
          </ul>
        </div>
        <div className={styles.footerCol}>
          <input type="checkbox" id="footer-navegacion" className={styles.accordionToggle} />
          <label htmlFor="footer-navegacion" className={styles.footerSummary}>
            Navegación
            <span className={styles.expandIcon}>+</span>
          </label>
          <ul className={styles.accordionContent}>
            <li><Link href="/mi-cuenta">Mi Perfil</Link></li>
            <li><Link href="/mi-cuenta/pedidos">Mis Pedidos</Link></li>
            <li><Link href="/favoritos">Mis Favoritos</Link></li>
            <li><Link href="/ofertas">Ofertas</Link></li>
          </ul>
        </div>
        <div className={styles.footerCol}>
          <input type="checkbox" id="footer-categorias" className={styles.accordionToggle} />
          <label htmlFor="footer-categorias" className={styles.footerSummary}>
            Categorías
            <span className={styles.expandIcon}>+</span>
          </label>
          <ul className={styles.accordionContent}>
            <li><Link href="/textosescolares">Textos Escolares</Link></li>
            <li><Link href="/plan-lector">Plan Lector</Link></li>
            <li><Link href="/cuadernos">Cuadernos</Link></li>
            <li><Link href="/material-escolar">Material Escolar</Link></li>
            <li><Link href="/papel">Papel</Link></li>
          </ul>
        </div>
      </div>
    </footer>
  );
}
