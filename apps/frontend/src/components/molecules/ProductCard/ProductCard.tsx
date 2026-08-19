'use client';
import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import styles from './ProductCard.module.css';
import { useFavorites } from '@/context/FavoritesContext';
import { useCart } from '@/context/CartContext';

export interface ProductCardProps {
  id?: string;
  title: string;
  category: string;
  categoryColor?: string;
  price: number | string;
  imageUrl?: string;
  badge?: string;
  badgeStyle?: 'emerald' | 'blue' | 'indigo' | 'amber' | 'slate' | 'red' | 'none' | string;
  urgencyLabel?: string;
  tipo_producto?: string;
  precioOriginal?: number;
  componentes?: Array<{ nombre: string; cantidad: number; imagen_url?: string }>;
  componentesImagenes?: string[];
  modoImagen?: 'PROPIA' | 'GRID_AUTO';
  isBook?: boolean;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  id,
  title,
  category,
  categoryColor,
  price,
  imageUrl,
  badge,
  badgeStyle = 'emerald',
  urgencyLabel,
  tipo_producto,
  precioOriginal,
  componentes = [],
  componentesImagenes = [],
  modoImagen = 'GRID_AUTO',
  isBook = false,
}) => {
  const { isFavorite, toggleFavorite } = useFavorites();
  const { addToCart } = useCart();
  const favoriteId = id || title;
  const favorited = isFavorite(favoriteId);
  const numericPrice = Number(price) || 0;

  const isCombo = tipo_producto === 'COMBO';
  const hasSavings = Boolean(precioOriginal && precioOriginal > numericPrice);
  const ahorroPorcentaje = hasSavings && precioOriginal ? Math.round(((precioOriginal - numericPrice) / precioOriginal) * 100) : 0;

  // Resolve Badge Style
  const showBadge = Boolean(badge && badgeStyle !== 'none');
  const badgeClass =
    badgeStyle === 'red'
      ? styles.badgeRed
      : badgeStyle === 'blue'
      ? styles.badgeBlue
      : badgeStyle === 'indigo'
      ? styles.badgeIndigo
      : badgeStyle === 'amber'
      ? styles.badgeAmber
      : badgeStyle === 'slate'
      ? styles.badgeSlate
      : styles.badgeEmerald;

  // Resolve image display for Combos
  const hasCustomImage = Boolean(imageUrl && !imageUrl.includes('unsplash') && modoImagen === 'PROPIA');
  const validComponentImages = componentesImagenes.filter(Boolean);
  const useGrid = isCombo && !hasCustomImage && validComponentImages.length > 0;

  const gridClass =
    validComponentImages.length === 1
      ? styles.gridCount1
      : validComponentImages.length === 2
      ? styles.gridCount2
      : validComponentImages.length === 3
      ? styles.gridCount3
      : styles.gridCount4;

  const finalImageUrl = imageUrl || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?q=80&w=400&auto=format&fit=crop';

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleFavorite({
      id: favoriteId,
      title,
      category,
      price: numericPrice,
      imageUrl: finalImageUrl,
    });
  };

  const handleAddToCartClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart({
      id: favoriteId,
      title,
      category,
      price: numericPrice,
      imageUrl: finalImageUrl,
    });
  };

  const cardRef = React.useRef<HTMLElement>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLElement>) => {
    if (!cardRef.current || !isBook) return;

    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    
    // Map to approx -7 to 7 degrees
    const rotateX = ((y - centerY) / centerY) * -7;
    const rotateY = ((x - centerX) / centerX) * 7;
    
    requestAnimationFrame(() => {
      if (cardRef.current) {
        cardRef.current.style.setProperty('--rotateX', `${rotateX}deg`);
        cardRef.current.style.setProperty('--rotateY', `${rotateY}deg`);
      }
    });
  };

  const handleMouseLeave = () => {
    if (!cardRef.current || !isBook) return;
    requestAnimationFrame(() => {
      if (cardRef.current) {
        cardRef.current.style.setProperty('--rotateX', '0deg');
        cardRef.current.style.setProperty('--rotateY', '0deg');
      }
    });
  };

  const descriptionStub = componentes.length > 0 
    ? componentes.map(c => c.nombre).join(', ') 
    : 'Libro de texto y actividades diseñado para potenciar el aprendizaje continuo.';

  return (
    <article 
      className={`${styles.productCard} ${isBook ? styles.productCardBook : ''}`}
    >
      {id && <Link href={`/producto/${id}`} className={styles.cardLink} aria-label={`Ver detalle de ${title}`} />}
      
      <div 
        className={styles.imageContainer}
        style={{ viewTransitionName: isBook && id ? `book-cover-${id}` : 'none' } as React.CSSProperties}
      >
        <button
          className={`${styles.favoriteBtn} ${favorited ? styles.favorited : ''}`}
          onClick={handleFavoriteClick}
          aria-label={favorited ? 'Quitar de favoritos' : 'Añadir a favoritos'}
          title={favorited ? 'Quitar de favoritos' : 'Añadir a favoritos'}
        >
          <svg viewBox="0 0 24 24" fill={favorited ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
        </button>

        {showBadge && <span className={`${styles.badge} ${badgeClass}`}>{badge}</span>}

        {urgencyLabel && <span className={`${styles.badge} ${styles.badgeUrgency}`}>{urgencyLabel}</span>}

        {useGrid ? (
          <div className={`${styles.imageGridContainer} ${gridClass}`}>
            {validComponentImages.slice(0, 4).map((imgUrl, idx) => (
              <div
                key={idx}
                className={`${styles.gridCell} ${validComponentImages.length === 3 && idx === 0 ? styles.gridCellSpan2 : ''}`}
              >
                <img src={imgUrl} alt={`Componente ${idx + 1}`} className={styles.gridImg} />
              </div>
            ))}
          </div>
        ) : (
          <div className={styles.bookCoverWrapper}>
            <Image
              src={finalImageUrl}
              alt={title}
              fill
              sizes="(max-width: 768px) 100vw, 220px"
              className={styles.productImg}
            />
            <div className={styles.glare}></div>
          </div>
        )}
      </div>

      <div className={styles.productInfo}>
        {!isBook && (
          <div className={styles.metaRow}>
            <span className={styles.category} style={categoryColor ? { color: categoryColor } : {}}>
              {category}
            </span>
          </div>
        )}

        <h3 className={styles.title} title={title}>{title}</h3>

        <div className={styles.footerRow}>
          <div className={styles.priceCol}>
            {hasSavings && precioOriginal && (
              <div className={styles.oldPriceRow}>
                <span className={styles.oldPrice}>Bs. {precioOriginal.toFixed(2)}</span>
                <span className={styles.savingsTag}>-{ahorroPorcentaje}%</span>
              </div>
            )}
            <span className={styles.price}>Bs. {numericPrice.toFixed(2)}</span>
          </div>

          <button className={styles.addToCartBtn} aria-label="Agregar al carrito" onClick={handleAddToCartClick}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="9" cy="21" r="1"></circle>
              <circle cx="20" cy="21" r="1"></circle>
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
            </svg>
          </button>
        </div>
      </div>
    </article>
  );
};
