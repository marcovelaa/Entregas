'use client';

import React, { useState } from 'react';
import styles from './materialEscolar.module.css';
import { ProductCard } from '@/components/molecules/ProductCard/ProductCard';

// Mock Data
const categories = [
  { id: 'all', name: 'Todos los Cuadernos' },
  { id: 'anillados', name: 'Anillados / Espiral' },
  { id: 'cosidos', name: 'Cosidos / Empastados' },
  { id: 'universitarios', name: 'Universitarios' }
];


export default function CuadernosPage() {
  const [activeCategory, setActiveCategory] = useState('all');
  const [products, setProducts] = useState<any[]>([]);
  
  React.useEffect(() => {
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
    fetch(`${API_URL}/productos?page=1&limit=50`)
      .then(res => res.json())
      .then(data => {
        if (data && data.data) {
          const filtered = data.data.filter((p: any) => 
            p.categoria?.slug === 'cuadernos'
          );
          setProducts(filtered);
        }
      })
      .catch(err => console.error('Error fetching products', err));
  }, []);

  // Dynamic filters state
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [selectedSheets, setSelectedSheets] = useState<number[]>([]);

  const availableSizes = Array.from(new Set(products.filter(p => p.categoria?.slug === 'cuadernos').map(p => p.atributos?.size).filter(Boolean))) as string[];
  const availableSheets = Array.from(new Set(products.filter(p => p.categoria?.slug === 'cuadernos').map(p => p.atributos?.sheets).filter(Boolean))) as number[];

  const handleSizeToggle = (size: string) => {
    setSelectedSizes(prev => prev.includes(size) ? prev.filter(s => s !== size) : [...prev, size]);
  };
  const handleSheetsToggle = (sheet: number) => {
    setSelectedSheets(prev => prev.includes(sheet) ? prev.filter(s => s !== sheet) : [...prev, sheet]);
  };

  const filteredProducts = products; // simplified for now

  const currentCategoryName = categories.find(c => c.id === activeCategory)?.name || 'Catálogo';

  return (
    <div className={styles.pageWrapper}>
      <div className={styles.layoutContainer}>
        {/* Sidebar Filters */}
        <aside className={styles.sidebar}>
          <div className={styles.sidebarSticky}>
            
            {/* Familias */}
            <div className={styles.filterSection}>
              <h3 className={styles.filterTitle}>Familias</h3>
              <div className={styles.categoryList}>
                {categories.map(cat => (
                  <label key={cat.id} className={styles.categoryItem}>
                    <input 
                      type="radio" 
                      name="family" 
                      className={styles.categoryRadio}
                      checked={activeCategory === cat.id}
                      onChange={() => {
                        setActiveCategory(cat.id);
                        setSelectedSizes([]);
                        setSelectedSheets([]);
                      }}
                    />
                    <div className={styles.customRadio}></div>
                    <span className={styles.categoryLabel}>{cat.name}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Filtros Dinámicos */}
            {(activeCategory === 'all' || activeCategory === 'anillados' || activeCategory === 'cosidos' || activeCategory === 'universitarios') && (
              <>
                <div className={styles.filterSection}>
                  <h3 className={styles.filterTitle}>Tamaño (Cuadernos)</h3>
                  {availableSizes.map(size => (
                    <label key={size} className={styles.checkboxItem}>
                      <input 
                        type="checkbox" 
                        className={styles.checkboxInput}
                        checked={selectedSizes.includes(size)}
                        onChange={() => handleSizeToggle(size)}
                      />
                      <span className={styles.checkboxLabel}>{size}</span>
                    </label>
                  ))}
                </div>
                <div className={styles.filterSection}>
                  <h3 className={styles.filterTitle}>Cantidad de Hojas</h3>
                  {availableSheets.map(sheet => (
                    <label key={sheet} className={styles.checkboxItem}>
                      <input 
                        type="checkbox" 
                        className={styles.checkboxInput}
                        checked={selectedSheets.includes(sheet)}
                        onChange={() => handleSheetsToggle(sheet)}
                      />
                      <span className={styles.checkboxLabel}>{sheet} hojas</span>
                    </label>
                  ))}
                </div>
              </>
            )}

          </div>
        </aside>

        {/* Main Area */}
        <main className={styles.catalogArea}>
          <div className={styles.catalogHeader}>
            <h2 className={styles.catalogTitle}>{currentCategoryName}</h2>
            <span className={styles.itemCount}>{filteredProducts.length} productos</span>
          </div>

          {filteredProducts.length > 0 ? (
            <div className={styles.productsGrid}>
              {filteredProducts.map(product => {
                const imageUrl = product.imagenes && product.imagenes.length > 0 
                  ? (product.imagenes[0].url.startsWith('http') ? product.imagenes[0].url : `http://localhost:3001${product.imagenes[0].url}`)
                  : 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?q=80&w=400&auto=format&fit=crop';
                const numericPrice = Number(product.precio_base) || 0;
                return (
                  <ProductCard
                    key={product.id}
                    id={product.id.toString()}
                    title={product.nombre}
                    category={product.categoria?.nombre || 'General'}
                    price={numericPrice}
                    imageUrl={imageUrl}
                  />
                )
              })}
            </div>
          ) : (
            <div className={styles.emptyState}>
              <h3>No encontramos productos</h3>
              <p>Intenta quitando algunos filtros para ver más resultados.</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
