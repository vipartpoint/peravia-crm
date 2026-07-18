'use client';

import React from 'react';
import { Users, UserMinus, UserCheck, Activity } from 'lucide-react';
import { Skeleton } from '@/components/ui/Skeleton';

interface CustomerMetric {
  id: string;
  name: string;
  value: string;
  indicator?: 'positive' | 'negative' | 'warning';
}

interface Props {
  loading?: boolean;
  topCustomers: CustomerMetric[];
  churnRisks: CustomerMetric[];
}

export function CustomerIntelligence({ loading, topCustomers, churnRisks }: Props) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-[300px]">
        <Skeleton className="rounded-2xl" />
        <Skeleton className="rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col h-[300px]">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">مشتریان برتر (ارزش طول عمر)</h3>
          <UserCheck className="w-4 h-4 text-emerald-500" />
        </div>
        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-3">
          {topCustomers.length === 0 ? (
            <div className="h-full flex items-center justify-center text-sm text-slate-500">اطلاعاتی موجود نیست.</div>
          ) : (
            topCustomers.map((c, i) => (
              <div key={c.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800/50">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-slate-400 w-4">{i + 1}.</span>
                  <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">{c.name}</span>
                </div>
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-1 rounded">{c.value}</span>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col h-[300px]">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">ریزش‌های احتمالی (Churn Risk)</h3>
          <UserMinus className="w-4 h-4 text-rose-500" />
        </div>
        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-3">
          {churnRisks.length === 0 ? (
            <div className="h-full flex items-center justify-center text-sm text-slate-500">اطلاعاتی موجود نیست.</div>
          ) : (
            churnRisks.map((c, i) => (
              <div key={c.id} className="flex items-center justify-between p-3 bg-rose-50/50 dark:bg-rose-500/5 rounded-xl border border-rose-100 dark:border-rose-500/20">
                <div className="flex items-center gap-3">
                  <Activity className="w-4 h-4 text-rose-400" />
                  <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">{c.name}</span>
                </div>
                <span className="text-xs font-bold text-rose-600 dark:text-rose-400 bg-white dark:bg-slate-900 px-2 py-1 rounded shadow-sm">{c.value}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
