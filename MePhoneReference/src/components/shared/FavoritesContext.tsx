import React, { createContext, useContext, useState, ReactNode } from 'react';

interface FavoriteItem {
  id: string;
  type: 'contact' | 'email';
  entityId: number;
}

interface FavoritesContextType {
  favorites: FavoriteItem[];
  isFavorite: (type: 'contact' | 'email', entityId: number) => boolean;
  toggleFavorite: (type: 'contact' | 'email', entityId: number) => void;
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

export function useFavorites() {
  const context = useContext(FavoritesContext);
  if (context === undefined) {
    throw new Error('useFavorites must be used within a FavoritesProvider');
  }
  return context;
}

interface FavoritesProviderProps {
  children: ReactNode;
}

export function FavoritesProvider({ children }: FavoritesProviderProps) {
  const [favorites, setFavorites] = useState<FavoriteItem[]>([
    // Initialize with some default favorites based on the existing data
    { id: 'contact-1', type: 'contact', entityId: 1 },
    { id: 'contact-3', type: 'contact', entityId: 3 },
    { id: 'contact-6', type: 'contact', entityId: 6 },
    { id: 'email-2', type: 'email', entityId: 2 },
    { id: 'email-4', type: 'email', entityId: 4 },
  ]);

  const isFavorite = (type: 'contact' | 'email', entityId: number): boolean => {
    return favorites.some(fav => fav.type === type && fav.entityId === entityId);
  };

  const toggleFavorite = (type: 'contact' | 'email', entityId: number): void => {
    const favoriteId = `${type}-${entityId}`;
    
    setFavorites(prev => {
      const existingFavorite = prev.find(fav => fav.type === type && fav.entityId === entityId);
      
      if (existingFavorite) {
        // Remove from favorites
        return prev.filter(fav => fav.id !== favoriteId);
      } else {
        // Add to favorites
        return [...prev, { id: favoriteId, type, entityId }];
      }
    });
  };

  return (
    <FavoritesContext.Provider value={{ favorites, isFavorite, toggleFavorite }}>
      {children}
    </FavoritesContext.Provider>
  );
}