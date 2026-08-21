'use client';
import React, { useState } from 'react';
import styles from './Header.module.css';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { CartDrawer } from '../CartDrawer/CartDrawer';
import { useFavorites } from '@/context/FavoritesContext';
import { Logo } from '@/components/atoms/Logo/Logo';
import { useCart } from '@/context/CartContext';
import { Badge } from '@/components/atoms/Badge/Badge';

export default function Header() {
  const { favorites } = useFavorites();
  const { totalItems } = useCart();
  const { isCartOpen, setIsCartOpen } = useCart();
  const [searchQuery, setSearchQuery] = useState('');
  
  // TODO: Reemplazar esto con tu contexto de autenticación real (ej. useAuth())
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const mockUser = { nombre: 'Marco' }; // Simulación de los datos del usuario
  
  const pathname = usePathname();

  // No renderizar el Header en la página de login para evitar distracciones (CRO)
  if (pathname === '/login') {
    return null;
  }

  const executeSearch = () => {
    // Acá en el futuro iría la conexión con el backend o useRouter de Next
    console.log('--- NUEVA BÚSQUEDA ---');
    console.log('Término:', searchQuery);
    
    alert(`Buscando: ${searchQuery || 'Todo'}`);
  };


  return (
    <>
      <div className={styles.headerWrapper}>
        <div className={styles.utilityBar}>
          <div className={styles.utilityLeft}>
            <span className={styles.greeting}>
              {isAuthenticated ? (
                <>¡Hola, {mockUser.nombre}!</>
              ) : (
                <>¡Hola! <Link href="/login" className={styles.linkBlue}>Inicia sesión</Link> o <Link href="/login" className={styles.linkBlue}>regístrate</Link></>
              )}
            </span>
            <Link href="/preguntas-frecuentes">Preguntas frecuentes</Link>
            <Link href="#">Nosotros</Link>
          </div>
          <div className={styles.utilityRight}>
            <span>🚚 Envíos a todo Bolivia</span>
          </div>
        </div>

        <header className={styles.header}>
          <div className={styles.logoWrapper}>
            <Logo />
          </div>

        <div className={styles.searchContainer}>
              <div className={styles.searchWrapper}>
                

                
                <input 
                  type="text" 
                  placeholder="Busca textos, autores, mochilas o material académico..." 
                  className={styles.searchInput}
                  aria-label="Buscar productos"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && executeSearch()}
                />
                


                <button className={styles.searchBtn} aria-label="Ejecutar búsqueda" onClick={executeSearch}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: '20px', height: '20px' }}>
                    <circle cx="11" cy="11" r="8"></circle>
                    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                  </svg>
                </button>
              </div>
            </div>

            <div className={styles.headerActions}>
              <Link href="/mi-cuenta" className={styles.iconBtn} aria-label="Mi Cuenta" style={{ textDecoration: 'none' }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={styles.icon} aria-hidden="true">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
                <span className={styles.iconLabel}>Mi Cuenta</span>
              </Link>
              <Link href="/favoritos" className={styles.iconBtn} aria-label="Favoritos" style={{ textDecoration: 'none', position: 'relative' }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={styles.icon} aria-hidden="true">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                </svg>
                <span className={styles.iconLabel}>Favoritos</span>
                <Badge count={favorites.length} />
              </Link>
              <button className={styles.iconBtn} aria-label="Carrito de compras" onClick={() => setIsCartOpen(true)}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={styles.cartIcon} aria-hidden="true">
                  <path d="M5 8h14v12a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V8z"></path>
                  <path d="M9 8V6a3 3 0 1 1 6 0v2"></path>
                </svg>
                <Badge count={totalItems} />
              </button>
          </div>
        </header>

        <nav className={styles.categoryNav} aria-label="Navegación principal">
          <Link href="/" className={pathname === '/' ? styles.activeCategory : ''}>Inicio</Link>
          <Link href="/textosescolares" className={pathname.startsWith('/textosescolares') ? styles.activeCategory : ''}>Textos Escolares</Link>
          <Link href="/plan-lector" className={pathname === '/plan-lector' ? styles.activeCategory : ''}>Plan Lector</Link>
          <Link href="/material-escolar" className={pathname === '/material-escolar' ? styles.activeCategory : ''}>Material Escolar</Link>
          <Link href="/cuadernos" className={pathname === '/cuadernos' ? styles.activeCategory : ''}>Cuadernos</Link>
          <Link href="/papel" className={pathname === '/papel' ? styles.activeCategory : ''}>Papel</Link>
          <Link href="/ofertas" className={pathname === '/ofertas' ? styles.activeOferta : styles.ofertaLink}>Ofertas</Link>
        </nav>
      </div>

      <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
    </>
  );
}
