'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import styles from './MaterialCard.module.css';
import { useFavorites } from '@/context/FavoritesContext';

export interface PricingOptions {
  unidad?: number;
  paquete?: number;
  pallet?: number;
}

export interface MaterialCardProps {
  id: string;
  title: string;
  category: string;
  categoryColor?: string;
  pricing: PricingOptions;
  imageUrl: string;
}

export function MaterialCard({ id, title, category, categoryColor = 'var(--color-blue)', pricing, imageUrl }: MaterialCardProps) {
  // Determine default selected option
  const defaultOption = pricing.unidad ? 'unidad' : pricing.paquete ? 'paquete' : 'pallet';
  const [selectedOption, setSelectedOption] = useState<'unidad'|'paquete'|'pallet'>(defaultOption);

  const { isFavorite, toggleFavorite } = useFavorites();
  const favorited = isFavorite(id);

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleFavorite({
      id,
      title,
      category,
      price: pricing[selectedOption] || 0,
      imageUrl
    });
  };

  const getPrice = () => {
    return pricing[selectedOption] || 0;
  };

  return (
    <article className={styles.productCard}>
      <div className={styles.productImage}>
        <Link href={`/producto/${id}`}>
          <Image src={imageUrl} alt={title} fill sizes="(max-width: 768px) 100vw, 300px" className={styles.productImg} />
        </Link>
        
        <button 
          className={`${styles.favoriteBtn} ${favorited ? styles.favorited : ''}`} 
          onClick={handleFavoriteClick}
          aria-label={favorited ? 'Quitar de favoritos' : 'Añadir a favoritos'}
          title={favorited ? 'Quitar de favoritos' : 'Añadir a favoritos'}
        >
          <svg className={styles.iconSmall} viewBox="0 0 24 24" fill={favorited ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
          </svg>
        </button>
      </div>
      
      <div className={styles.productInfo}>
        <span className={styles.productCategory} style={{ color: categoryColor }}>{category}</span>
        <h3 className={styles.productTitle} title={title}>
          <Link href={`/producto/${id}`} style={{ color: 'inherit', textDecoration: 'none' }}>
            {title}
          </Link>
        </h3>
        
        {/* Selector de Volumen */}
        <div className={styles.volumeSelector}>
          {pricing.unidad && (
            <button 
              className={`${styles.volumeBtn} ${selectedOption === 'unidad' ? styles.volumeActive : ''}`}
              onClick={() => setSelectedOption('unidad')}
              title="Precio por Unidad"
            >
              Unidad
            </button>
          )}
          {pricing.paquete && (
            <button 
              className={`${styles.volumeBtn} ${selectedOption === 'paquete' ? styles.volumeActive : ''}`}
              onClick={() => setSelectedOption('paquete')}
              title="Paquete Mayorista"
            >
              Paquete
            </button>
          )}
          {pricing.pallet && (
            <button 
              className={`${styles.volumeBtn} ${selectedOption === 'pallet' ? styles.volumeActive : ''}`}
              onClick={() => setSelectedOption('pallet')}
              title="Pallet Industrial"
            >
              Pallet
            </button>
          )}
        </div>

        <div className={styles.productPriceRow}>
          <span className={styles.productPrice}>Bs. {getPrice().toFixed(2)}</span>
          <button className={styles.addToCartBtn} aria-label="Añadir al carrito">
            Añadir
          </button>
        </div>
      </div>
    </article>
  );
}
