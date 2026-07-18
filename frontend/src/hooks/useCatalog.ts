import { useState, useEffect, useCallback } from 'react';
import { api } from '@/services/api';

export interface CatalogItem {
  id: string;
  code: string;
  nameFa: string;
  nameEn?: string;
  isActive: boolean;
  isSystem: boolean;
  usageCount: number;
}

export function useCatalog(type: string) {
  const [data, setData] = useState<CatalogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchCatalog = useCallback(async () => {
    try {
      setLoading(true);
      // Fetching activeOnly catalog items (pagination disabled/high size for dropdown)
      const res = await api.get(`/catalogs/${type}?activeOnly=true&pageSize=100`);
      setData(res.data || []);
      setError(null);
    } catch (err: any) {
      console.error(`Failed to load catalog ${type}:`, err);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [type]);

  useEffect(() => {
    fetchCatalog();
  }, [fetchCatalog]);

  return { data, loading, error, refetch: fetchCatalog };
}
