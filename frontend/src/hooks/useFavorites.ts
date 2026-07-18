import { useState, useEffect } from 'react';

export type FavoriteType = 'customer' | 'lead' | 'order';

export interface FavoriteItem {
  id: string;
  type: FavoriteType;
  title: string;
  subtitle?: string;
  timestamp: number;
}

export function useFavorites() {
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('crm_favorites');
    if (stored) {
      try {
        setFavorites(JSON.parse(stored));
      } catch (e) {}
    }
    setIsLoaded(true);
  }, []);

  const saveFavorites = (newFavs: FavoriteItem[]) => {
    setFavorites(newFavs);
    localStorage.setItem('crm_favorites', JSON.stringify(newFavs));
  };

  const addFavorite = (item: Omit<FavoriteItem, 'timestamp'>) => {
    const exists = favorites.find(f => f.id === item.id && f.type === item.type);
    if (!exists) {
      saveFavorites([...favorites, { ...item, timestamp: Date.now() }]);
    }
  };

  const removeFavorite = (id: string, type: FavoriteType) => {
    saveFavorites(favorites.filter(f => !(f.id === id && f.type === type)));
  };

  const toggleFavorite = (item: Omit<FavoriteItem, 'timestamp'>) => {
    const exists = favorites.find(f => f.id === item.id && f.type === item.type);
    if (exists) {
      removeFavorite(item.id, item.type);
    } else {
      addFavorite(item);
    }
  };

  const isFavorite = (id: string, type: FavoriteType) => {
    return favorites.some(f => f.id === id && f.type === type);
  };

  return { favorites, addFavorite, removeFavorite, toggleFavorite, isFavorite, isLoaded };
}
