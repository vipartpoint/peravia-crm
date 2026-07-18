'use client';

import React, { useEffect, useState } from 'react';
import { api } from '@/services/api';
import { formatDistanceToNow } from 'date-fns';
import { faIR } from 'date-fns/locale';
import { Activity, MessageSquare, CheckCircle, Plus, Edit, RefreshCw } from 'lucide-react';

export function RecentActivitiesWidget() {
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRecent = async () => {
      try {
        const res = await api.get('/activities/recent?limit=8');
        setActivities(Array.isArray(res) ? res : (res.data || []));
      } catch (err) {
        console.error('Failed to fetch recent activities', err);
      } finally {
        setLoading(false);
      }
    };
    fetchRecent();
  }, []);

  const getEntityBadge = (type: string) => {
    switch (type) {
      case 'Lead': return <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded">سرنخ</span>;
      case 'Opportunity': return <span className="text-[10px] bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded">فرصت فروش</span>;
      case 'Customer': return <span className="text-[10px] bg-emerald-100 text-emerald-600 px-2 py-0.5 rounded">مشتری</span>;
      case 'Order': return <span className="text-[10px] bg-amber-100 text-amber-600 px-2 py-0.5 rounded">سفارش</span>;
      default: return <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded">{type}</span>;
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <Activity className="w-5 h-5 text-blue-500" />
        <h3 className="font-bold text-slate-800 dark:text-slate-100">فعالیت‌های اخیر</h3>
      </div>
      
      <div className="space-y-4">
        {loading ? (
          [1, 2, 3, 4].map(i => (
            <div key={i} className="animate-pulse flex gap-3">
              <div className="w-8 h-8 bg-slate-200 rounded-full shrink-0"></div>
              <div className="flex-1 space-y-2">
                <div className="h-3 bg-slate-200 rounded w-1/2"></div>
                <div className="h-2 bg-slate-200 rounded w-3/4"></div>
              </div>
            </div>
          ))
        ) : activities.length === 0 ? (
          <p className="text-sm text-slate-500 text-center py-4">فعالیتی یافت نشد</p>
        ) : (
          activities.map((act) => (
            <div key={act.id} className="flex gap-3 group">
              <div className="w-8 h-8 rounded-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 flex items-center justify-center shrink-0 mt-1">
                {act.user?.username?.charAt(0).toUpperCase() || '?'}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                    {act.user?.username || 'سیستم'}
                  </p>
                  <span className="text-[10px] text-slate-400" dir="ltr">
                    {formatDistanceToNow(new Date(act.createdAt), { addSuffix: true, locale: faIR })}
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  {getEntityBadge(act.entityType)}
                  <p className="text-xs text-slate-600 dark:text-slate-400 truncate">
                    {act.title}
                  </p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
