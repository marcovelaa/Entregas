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
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCategoryMenuOpen, setIsCategoryMenuOpen] = useState(false);
  const [isFilterMenuOpen, setIsFilterMenuOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('Todas las categorías');
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    envio: false,
    ofertas: false,
    nuevo: false
  });
  
  const pathname = usePathname();

  const handleCategorySelect = (category: string) => {
    setSelectedCategory(category);
    setIsCategoryMenuOpen(false);
  };

  const handleFilterToggle = (key: keyof typeof filters) => {
    setFilters(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const executeSearch = () => {
    setIsCategoryMenuOpen(false);
    setIsFilterMenuOpen(false);
    
    // Acá en el futuro iría la conexión con el backend o useRouter de Next
    console.log('--- NUEVA BÚSQUEDA ---');
    console.log('Término:', searchQuery);
    console.log('Categoría:', selectedCategory);
    console.log('Filtros activos:', filters);
    
    alert(`Buscando: ${searchQuery || 'Todo'}\nCategoría: ${selectedCategory}`);
  };

  const categoriesList = [
    'Todas las categorías',
    'Textos Escolares',
    'Plan Lector',
    'Material Escolar',
    'Papel y Cuadernos',
    'Ofertas Especiales'
  ];

  return (
    <>
      <div className={styles.headerWrapper}>
        <div className={styles.utilityBar}>
          <div className={styles.utilityLeft}>
            <span className={styles.greeting}>
              ¡Hola! <Link href="#" className={styles.linkBlue}>Inicia sesión</Link> o <Link href="#" className={styles.linkBlue}>regístrate</Link>
            </span>
            <Link href="#">Preguntas frecuentes</Link>
            <Link href="#">Nosotros</Link>
          </div>
          <div className={styles.utilityRight}>
            <span>🚚 Envíos a todo Bolivia</span>
          </div>
        </div>

        <header className={styles.header}>
        <Logo />

        <div className={styles.searchContainer}>
              <div className={styles.searchWrapper}>
                
                {/* Custom Category Dropdown */}
                <div className={styles.dropdownContainer}>
                  <div 
                    className={styles.searchCategorySelect} 
                    onClick={() => { setIsCategoryMenuOpen(!isCategoryMenuOpen); setIsFilterMenuOpen(false); }}
                    tabIndex={0}
                    role="button"
                  >
                    {selectedCategory}
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{marginLeft: '6px'}}><polyline points="6 9 12 15 18 9"></polyline></svg>
                  </div>
                  {isCategoryMenuOpen && (
                    <div className={styles.dropdownMenu}>
                      {categoriesList.map(cat => (
                        <div 
                          key={cat} 
                          className={styles.dropdownItem}
                          onClick={() => handleCategorySelect(cat)}
                          style={{ fontWeight: selectedCategory === cat ? 'bold' : 'normal', color: selectedCategory === cat ? 'var(--color-blue)' : 'inherit' }}
                        >
                          {cat}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                
                <input 
                  type="text" 
                  placeholder="Busca textos, autores, mochilas o material académico..." 
                  className={styles.searchInput}
                  aria-label="Buscar productos"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && executeSearch()}
                  onClick={() => { setIsCategoryMenuOpen(false); setIsFilterMenuOpen(false); }}
                />
                
                {/* Custom Filter Dropdown */}
                <div className={styles.dropdownContainer}>
                  <button 
                    className={styles.searchFilterBtn} 
                    aria-label="Filtros avanzados"
                    onClick={() => { setIsFilterMenuOpen(!isFilterMenuOpen); setIsCategoryMenuOpen(false); }}
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={styles.iconSmall} aria-hidden="true">
                      <line x1="4" y1="21" x2="4" y2="14"></line>
                      <line x1="4" y1="10" x2="4" y2="3"></line>
                      <line x1="12" y1="21" x2="12" y2="12"></line>
                      <line x1="12" y1="8" x2="12" y2="3"></line>
                      <line x1="20" y1="21" x2="20" y2="16"></line>
                      <line x1="20" y1="12" x2="20" y2="3"></line>
                      <line x1="1" y1="14" x2="7" y2="14"></line>
                      <line x1="9" y1="8" x2="15" y2="8"></line>
                      <line x1="17" y1="16" x2="23" y2="16"></line>
                    </svg>
                    {(filters.envio || filters.ofertas || filters.nuevo) && (
                      <span style={{ position: 'absolute', top: '8px', right: '8px', width: '8px', height: '8px', backgroundColor: 'var(--color-red)', borderRadius: '50%' }}></span>
                    )}
                  </button>
                  {isFilterMenuOpen && (
                    <div className={styles.filterMenu}>
                      <h4 className={styles.filterTitle}>Filtros de Búsqueda</h4>
                      <div className={styles.filterOption}>
                        <input type="checkbox" id="envio" checked={filters.envio} onChange={() => handleFilterToggle('envio')} />
                        <label htmlFor="envio">Envío express disponible</label>
                      </div>
                      <div className={styles.filterOption}>
                        <input type="checkbox" id="ofertas" checked={filters.ofertas} onChange={() => handleFilterToggle('ofertas')} />
                        <label htmlFor="ofertas">Descuentos activos</label>
                      </div>
                      <div className={styles.filterOption}>
                        <input type="checkbox" id="nuevo" checked={filters.nuevo} onChange={() => handleFilterToggle('nuevo')} />
                        <label htmlFor="nuevo">Catálogo 2026</label>
                      </div>
                      <button className={styles.applyFilterBtn} onClick={() => setIsFilterMenuOpen(false)}>
                        Aplicar Filtros
                      </button>
                    </div>
                  )}
                </div>

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
          <Link href="/destacados" className={pathname === '/destacados' ? styles.activeCategory : ''}>Destacados</Link>
          <Link href="/textosescolares" className={pathname.startsWith('/textosescolares') ? styles.activeCategory : ''}>Textos Escolares</Link>
          <Link href="/plan-lector" className={pathname === '/plan-lector' ? styles.activeCategory : ''}>Plan Lector</Link>
          <Link href="/material-escolar" className={pathname === '/material-escolar' ? styles.activeCategory : ''}>Material Escolar</Link>
          <Link href="/papel" className={pathname === '/papel' ? styles.activeCategory : ''}>Papel</Link>
          <Link href="/ofertas" className={styles.redLink}>Ofertas</Link>
        </nav>
      </div>

      <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
    </>
  );
}
