'use client';

import React from 'react';
import { PackageOpen, AlertTriangle, TrendingDown } from 'lucide-react';
import { Skeleton } from '@/components/ui/Skeleton';

interface InventoryItem {
  id: string;
  name: string;
  stock: number;
  minStock: number;
  status: 'critical' | 'low' | 'normal';
}

interface Props {
  loading?: boolean;
  lowStockItems: InventoryItem[];
}

export function InventoryIntelligence({ loading, lowStockItems }: Props) {
  if (loading) {
    return (
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 h-[300px]">
        <Skeleton className="w-1/3 h-6 mb-6" />
        <div className="space-y-3">
          <Skeleton className="w-full h-12" />
          <Skeleton className="w-full h-12" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col h-[300px]">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">هوش موجودی انبار</h3>
          <span className="px-2 py-0.5 bg-orange-100 dark:bg-orange-500/20 text-orange-700 dark:text-orange-400 text-[10px] font-bold rounded-full">
            {lowStockItems.length} کالای رو به اتمام
          </span>
        </div>
        <PackageOpen className="w-4 h-4 text-slate-400" />
      </div>

      <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-2">
        {lowStockItems.length === 0 ? (
          <div className="h-full flex items-center justify-center text-sm text-slate-500 dark:text-slate-400">
            تمام محصولات موجودی کافی دارند.
          </div>
        ) : (
          lowStockItems.map((item) => {
            const isCritical = item.status === 'critical';
            return (
              <div key={item.id} className={`flex items-center justify-between p-3 rounded-xl border ${
                isCritical 
                  ? 'bg-rose-50/50 dark:bg-rose-500/10 border-rose-100 dark:border-rose-500/20' 
                  : 'bg-orange-50/50 dark:bg-orange-500/10 border-orange-100 dark:border-orange-500/20'
              }`}>
                <div className="flex items-center gap-3">
                  {isCritical ? <AlertTriangle className="w-4 h-4 text-rose-500" /> : <TrendingDown className="w-4 h-4 text-orange-500" />}
                  <div>
                    <h4 className={`text-sm font-semibold ${isCritical ? 'text-rose-700 dark:text-rose-400' : 'text-slate-700 dark:text-slate-300'}`}>
                      {item.name}
                    </h4>
                    <p className={`text-[10px] mt-0.5 ${isCritical ? 'text-rose-600/80 dark:text-rose-400/80' : 'text-slate-500'}`}>
                      حداقل مجاز: {item.minStock}
                    </p>
                  </div>
                </div>
                <div className="text-left">
                  <span className={`text-sm font-black ${isCritical ? 'text-rose-600 dark:text-rose-500' : 'text-orange-600 dark:text-orange-500'}`}>
                    {item.stock} <span className="text-[10px] font-normal">بشکه</span>
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
