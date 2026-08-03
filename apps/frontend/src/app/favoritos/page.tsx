'use client';
import React from 'react';
import { useFavorites } from '@/context/FavoritesContext';
import { ProductCard } from '@/components/molecules/ProductCard/ProductCard';

export default function FavoritosPage() {
  const { favorites } = useFavorites();

  return (
    <main style={{ padding: '2rem 5%', minHeight: '60vh' }}>
      <h1 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-main, #0f172a)', marginBottom: '1.5rem' }}>Mis Favoritos</h1>
      
      {favorites.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem 0', color: '#64748b' }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ width: '48px', height: '48px', marginBottom: '1rem', color: '#cbd5e1' }}>
             <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
          </svg>
          <p style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>No tienes ningún producto en favoritos todavía.</p>
        </div>
      ) : (
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', 
          gap: '1.5rem' 
        }}>
          {favorites.map(fav => (
            <ProductCard 
              key={fav.id}
              id={fav.id}
              title={fav.title}
              category={fav.category}
              price={fav.price}
              imageUrl={fav.imageUrl}
            />
          ))}
        </div>
      )}
    </main>
  );
}
