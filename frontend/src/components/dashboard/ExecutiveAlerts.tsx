'use client';

import React from 'react';
import { AlertCircle, AlertTriangle, Clock, CreditCard, Box } from 'lucide-react';
import { Skeleton } from '@/components/ui/Skeleton';
import Link from 'next/link';

interface Alert {
  id: string;
  type: 'overdue_receivable' | 'bounced_cheque' | 'low_stock' | 'pending_approval' | 'churn_risk';
  title: string;
  description: string;
  time: string;
  link?: string;
}

interface Props {
  loading?: boolean;
  alerts: Alert[];
}

export function ExecutiveAlerts({ loading, alerts }: Props) {
  if (loading) {
    return (
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 h-[300px]">
        <Skeleton className="w-1/3 h-6 mb-6" />
        <div className="space-y-4">
          <Skeleton className="w-full h-16" />
          <Skeleton className="w-full h-16" />
        </div>
      </div>
    );
  }

  const getTypeStyles = (type: Alert['type']) => {
    switch (type) {
      case 'overdue_receivable':
      case 'bounced_cheque':
        return { icon: <CreditCard className="w-4 h-4 text-rose-600" />, bg: 'bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-100 dark:border-rose-500/20' };
      case 'churn_risk':
        return { icon: <AlertCircle className="w-4 h-4 text-amber-600" />, bg: 'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-100 dark:border-amber-500/20' };
      case 'low_stock':
        return { icon: <Box className="w-4 h-4 text-orange-600" />, bg: 'bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-100 dark:border-orange-500/20' };
      case 'pending_approval':
        return { icon: <Clock className="w-4 h-4 text-blue-600" />, bg: 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-100 dark:border-blue-500/20' };
      default:
        return { icon: <AlertTriangle className="w-4 h-4 text-slate-600" />, bg: 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-100 dark:border-slate-700' };
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col h-full">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">هشدارهای مدیریتی</h3>
        <span className="px-2 py-0.5 bg-rose-100 dark:bg-rose-500/20 text-rose-700 dark:text-rose-400 text-[10px] font-bold rounded-full">
          {alerts.length} هشدار
        </span>
      </div>

      <div className="space-y-3 flex-1 overflow-y-auto pr-2 custom-scrollbar">
        {alerts.length === 0 ? (
          <div className="h-full flex items-center justify-center text-sm text-slate-500 dark:text-slate-400">
            هیچ هشدار فعالی وجود ندارد.
          </div>
        ) : (
          alerts.map((alert) => {
            const styles = getTypeStyles(alert.type);
            const content = (
              <div key={alert.id} className={`p-3 rounded-xl border flex gap-3 ${styles.bg}`}>
                <div className="mt-0.5 shrink-0">{styles.icon}</div>
                <div>
                  <h4 className="text-xs font-bold mb-1">{alert.title}</h4>
                  <p className="text-[11px] opacity-80 leading-relaxed mb-1">{alert.description}</p>
                  <span className="text-[9px] opacity-60">{alert.time}</span>
                </div>
              </div>
            );

            return alert.link ? (
              <Link href={alert.link} key={alert.id} className="block transition-transform hover:-translate-y-0.5">
                {content}
              </Link>
            ) : content;
          })
        )}
      </div>
    </div>
  );
}
