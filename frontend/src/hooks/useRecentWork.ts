import { useState, useEffect } from 'react';

export type RecentWorkType = 'record' | 'report' | 'ai_session';

export interface RecentWorkItem {
  id: string;
  type: RecentWorkType;
  entityType?: string; // e.g., 'customer', 'lead', 'order'
  title: string;
  subtitle?: string;
  href?: string;
  timestamp: number;
}

export function useRecentWork(maxItems = 10) {
  const [recentWork, setRecentWork] = useState<RecentWorkItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('crm_recent_work');
    if (stored) {
      try {
        setRecentWork(JSON.parse(stored));
      } catch (e) {}
    }
    setIsLoaded(true);
  }, []);

  const addRecent = (item: Omit<RecentWorkItem, 'timestamp'>) => {
    const newItems = [
      { ...item, timestamp: Date.now() },
      ...recentWork.filter(w => !(w.id === item.id && w.type === item.type))
    ].slice(0, maxItems);
    
    setRecentWork(newItems);
    localStorage.setItem('crm_recent_work', JSON.stringify(newItems));
  };

  return { recentWork, addRecent, isLoaded };
}
