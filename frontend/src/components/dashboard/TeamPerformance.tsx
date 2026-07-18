'use client';

import React from 'react';
import { Trophy, Medal, Target } from 'lucide-react';
import { Skeleton } from '@/components/ui/Skeleton';

interface TeamMember {
  id: string;
  name: string;
  sales: number;
  target: number;
  conversionRate: number;
  avatar?: string;
}

interface Props {
  loading?: boolean;
  members: TeamMember[];
}

export function TeamPerformance({ loading, members }: Props) {
  if (loading) {
    return (
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 h-[300px]">
        <Skeleton className="w-1/3 h-6 mb-6" />
        <div className="space-y-4">
          <Skeleton className="w-full h-12" />
          <Skeleton className="w-full h-12" />
          <Skeleton className="w-full h-12" />
        </div>
      </div>
    );
  }

  if (members.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 h-[300px] flex items-center justify-center">
        <p className="text-sm text-slate-500 dark:text-slate-400">هنوز داده کافی برای تحلیل عملکرد تیم وجود ندارد.</p>
      </div>
    );
  }

  const sortedMembers = [...members].sort((a, b) => b.sales - a.sales);
  const maxSales = Math.max(...sortedMembers.map(m => m.sales));

  return (
    <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col h-full">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">عملکرد تیم فروش</h3>
        <Trophy className="w-4 h-4 text-amber-500" />
      </div>

      <div className="space-y-4 flex-1 overflow-y-auto pr-2 custom-scrollbar">
        {sortedMembers.map((member, idx) => {
          const progress = Math.min(100, (member.sales / member.target) * 100);
          const isTop = idx === 0;

          return (
            <div key={member.id} className="group">
              <div className="flex justify-between items-center mb-1.5">
                <div className="flex items-center gap-2">
                  <div className="w-6 text-center">
                    {isTop ? <Medal className="w-5 h-5 text-amber-500 inline-block" /> : <span className="text-xs font-bold text-slate-400">#{idx + 1}</span>}
                  </div>
                  <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">{member.name}</span>
                </div>
                <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  {member.sales.toLocaleString('fa-IR')} <span className="text-[10px] text-slate-400 font-normal">تومان</span>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="flex-1 h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden relative">
                  <div 
                    className={`absolute top-0 right-0 h-full rounded-full transition-all duration-1000 ${isTop ? 'bg-amber-500' : 'bg-teal-500'}`}
                    style={{ width: `${(member.sales / maxSales) * 100}%` }}
                  />
                </div>
                <div className="w-16 text-left">
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${progress >= 100 ? 'text-emerald-700 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-500/10' : 'text-slate-500 bg-slate-50 dark:text-slate-400 dark:bg-slate-800'}`}>
                    {Math.round(progress)}% هدف
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
