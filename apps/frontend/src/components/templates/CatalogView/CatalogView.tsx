'use client';
import React, { useState } from 'react';
import { ProductCard } from '../../molecules/ProductCard/ProductCard';
import { Product } from '@/types/product';
import { getLevelColor } from '@/data/mockProducts';
import styles from './CatalogView.module.css';

interface CatalogViewProps {
  products: Product[];
}

export default function CatalogView({ products }: CatalogViewProps) {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  return (
    <div className={styles.catalogLayout}>
      {/* Overlay para mobile */}
      {isDrawerOpen && (
        <div 
          onClick={() => setIsDrawerOpen(false)}
          style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.5)', zIndex: 999
          }}
        />
      )}

      {/* Sidebar de filtros */}
      <aside className={`${styles.sidebarWrapper} ${isDrawerOpen ? styles.open : ''}`}>
        <div className={styles.sidebarTitle}>
          Filtros
          <button className={styles.closeFilterBtn} onClick={() => setIsDrawerOpen(false)}>✕</button>
        </div>
        
        <div className={styles.filterGroup}>
          <h4 className={styles.filterTitle}>Nivel Educativo</h4>
          <label className={styles.filterItem}>
            <input type="checkbox" className={styles.filterCheckbox} /> Inicial
          </label>
          <label className={styles.filterItem}>
            <input type="checkbox" className={styles.filterCheckbox} /> Primaria
          </label>
          <label className={styles.filterItem}>
            <input type="checkbox" className={styles.filterCheckbox} /> Secundaria
          </label>
          <label className={styles.filterItem}>
            <input type="checkbox" className={styles.filterCheckbox} /> Plan Lector
          </label>
        </div>


      </aside>

      {/* Grilla de productos */}
      <section className={styles.productsArea}>
        <div className={styles.toolbar}>
          <div className={styles.toolbarRow}>
            <span className={styles.resultsCount}>{products.length} resultados</span>
            <button className={styles.mobileFilterBtn} onClick={() => setIsDrawerOpen(true)}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon></svg>
              Filtros
            </button>
          </div>
          <select className={styles.sortSelect} aria-label="Ordenar productos">
            <option>Ordenar por: Recomendados</option>
            <option>Menor precio</option>
            <option>Mayor precio</option>
            <option>Más vendidos</option>
          </select>
        </div>

        <div className={styles.grid}>
          {products.map((product) => (
            <ProductCard 
              key={product.id}
              id={product.id}
              title={product.title}
              category={product.category}
              categoryColor={getLevelColor(product.category)}
              price={product.price}
              imageUrl={product.imageUrl}
              badge={product.badge}
            />
          ))}
        </div>
      </section>
    </div>
  );
}
