'use client';

import React from 'react';
import { Lightbulb, ShieldAlert, Target, Sparkles, ChevronLeft } from 'lucide-react';
import { Skeleton } from '@/components/ui/Skeleton';
import Link from 'next/link';

interface Insight {
  id: string;
  type: 'opportunity' | 'risk' | 'prediction' | 'action';
  title: string;
  explanation: string;
  priority: 'high' | 'medium' | 'low';
  suggestedAction: string;
  link?: string;
}

interface Props {
  insights: Insight[];
  loading?: boolean;
}

export function AiInsightsCenter({ insights, loading }: Props) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-32 rounded-2xl" />
        ))}
      </div>
    );
  }

  const getTypeStyles = (type: Insight['type']) => {
    switch (type) {
      case 'opportunity':
        return {
          icon: <Target className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />,
          bg: 'bg-emerald-50 dark:bg-emerald-500/10',
          border: 'border-emerald-100 dark:border-emerald-500/20',
          label: 'فرصت‌ها'
        };
      case 'risk':
        return {
          icon: <ShieldAlert className="w-5 h-5 text-rose-600 dark:text-rose-400" />,
          bg: 'bg-rose-50 dark:bg-rose-500/10',
          border: 'border-rose-100 dark:border-rose-500/20',
          label: 'ریسک‌ها'
        };
      case 'prediction':
        return {
          icon: <Sparkles className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />,
          bg: 'bg-indigo-50 dark:bg-indigo-500/10',
          border: 'border-indigo-100 dark:border-indigo-500/20',
          label: 'پیش‌بینی‌ها'
        };
      case 'action':
        return {
          icon: <Lightbulb className="w-5 h-5 text-amber-600 dark:text-amber-400" />,
          bg: 'bg-amber-50 dark:bg-amber-500/10',
          border: 'border-amber-100 dark:border-amber-500/20',
          label: 'پیشنهاد اقدام'
        };
    }
  };

  if (insights.length === 0) {
    return (
      <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 text-center">
        <Sparkles className="w-8 h-8 mx-auto text-slate-400 mb-3" />
        <p className="text-sm font-medium text-slate-600 dark:text-slate-400">هوش مصنوعی در حال تحلیل داده‌های شماست...</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {insights.map((insight) => {
        const styles = getTypeStyles(insight.type);
        const isHigh = insight.priority === 'high';

        return (
          <div 
            key={insight.id} 
            className={`p-5 rounded-2xl border flex flex-col justify-between transition-transform hover:-translate-y-1 ${styles.bg} ${styles.border}`}
          >
            <div>
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-2">
                  {styles.icon}
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{styles.label}</span>
                </div>
                {isHigh && (
                  <span className="px-1.5 py-0.5 bg-white dark:bg-slate-900 rounded shadow-sm text-[10px] font-bold text-rose-600 dark:text-rose-400">فوری</span>
                )}
              </div>
              <h4 className="font-bold text-slate-800 dark:text-slate-100 text-sm mb-1 leading-relaxed">
                {insight.title}
              </h4>
              <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
                {insight.explanation}
              </p>
            </div>
            
            <div className="pt-3 border-t border-black/5 dark:border-white/5 mt-auto flex items-center justify-between">
              <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                {insight.suggestedAction}
              </span>
              {insight.link && (
                <Link href={insight.link} className="p-1 hover:bg-white/50 dark:hover:bg-slate-800 rounded-lg transition-colors">
                  <ChevronLeft className="w-4 h-4 text-slate-500" />
                </Link>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
