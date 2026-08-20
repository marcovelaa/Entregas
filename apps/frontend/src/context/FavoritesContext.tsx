'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

export interface FavoriteItem {
  id: string;
  title: string;
  category: string;
  price: number;
  imageUrl: string;
  precioOriginal?: number;
  tipo_producto?: string;
  isBook?: boolean;
}

interface FavoritesContextType {
  favorites: FavoriteItem[];
  toggleFavorite: (item: FavoriteItem) => void;
  isFavorite: (id: string) => boolean;
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

export function FavoritesProvider({ children }: { children: React.ReactNode }) {
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setTimeout(() => setMounted(true), 0);
    const saved = localStorage.getItem('entregas_favorites');
    if (saved) {
      try {
        setFavorites(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse favorites');
      }
    }
  }, []);

  useEffect(() => {
    if (mounted) {
      localStorage.setItem('entregas_favorites', JSON.stringify(favorites));
    }
  }, [favorites, mounted]);

  const toggleFavorite = (item: FavoriteItem) => {
    setFavorites(prev => {
      const exists = prev.some(f => f.id === item.id);
      if (exists) {
        return prev.filter(f => f.id !== item.id);
      }
      return [...prev, item];
    });
  };

  const isFavorite = (id: string) => {
    return favorites.some(f => f.id === id);
  };

  return (
    <FavoritesContext.Provider value={{ favorites, toggleFavorite, isFavorite }}>
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  const context = useContext(FavoritesContext);
  if (context === undefined) {
    throw new Error('useFavorites must be used within a FavoritesProvider');
  }
  return context;
}
