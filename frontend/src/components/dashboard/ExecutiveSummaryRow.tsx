'use client';

import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { LineChart, Line, ResponsiveContainer } from 'recharts';

export interface SummaryMetric {
  title: string;
  value: string | number;
  percentageChange?: number;
  trend: 'up' | 'down' | 'neutral';
  statusLabel?: string;
  chartData?: any[];
  icon?: React.ElementType;
}

interface Props {
  metrics: SummaryMetric[];
  loading?: boolean;
}

export function ExecutiveSummaryRow({ metrics, loading }: Props) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-100 dark:border-slate-800 h-[140px] animate-pulse">
            <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded w-1/2 mb-4" />
            <div className="h-8 bg-slate-100 dark:bg-slate-800 rounded w-3/4" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {metrics.map((metric, idx) => {
        const isPositive = metric.trend === 'up';
        const isNeutral = metric.trend === 'neutral';
        const TrendIcon = isPositive ? TrendingUp : isNeutral ? Minus : TrendingDown;
        
        return (
          <div 
            key={idx} 
            className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-100 dark:border-slate-800 flex flex-col justify-between shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex justify-between items-start mb-2">
              <h3 className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{metric.title}</h3>
              {metric.icon && <metric.icon className="w-4 h-4 text-slate-400 dark:text-slate-500" />}
            </div>
            
            <div className="flex items-end justify-between gap-2 mb-3">
              <div className="text-2xl font-black text-slate-800 dark:text-white truncate">
                {metric.value}
              </div>
            </div>

            <div className="flex items-center justify-between mt-auto">
              {metric.percentageChange !== undefined ? (
                <div className={`flex items-center gap-1 text-[11px] font-bold px-1.5 py-0.5 rounded ${
                  isPositive 
                    ? 'text-emerald-700 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-500/10' 
                    : isNeutral 
                      ? 'text-slate-600 bg-slate-100 dark:text-slate-400 dark:bg-slate-800'
                      : 'text-rose-700 bg-rose-50 dark:text-rose-400 dark:bg-rose-500/10'
                }`}>
                  <TrendIcon className="w-3 h-3" />
                  <span>{Math.abs(metric.percentageChange)}%</span>
                </div>
              ) : (
                <div className="text-[11px] font-bold px-1.5 py-0.5 rounded text-slate-600 bg-slate-100 dark:text-slate-400 dark:bg-slate-800">
                  {metric.statusLabel || 'بدون تغییر'}
                </div>
              )}

              {metric.chartData && metric.chartData.length > 0 && (
                <div className="w-16 h-8 opacity-70">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={metric.chartData}>
                      <Line 
                        type="monotone" 
                        dataKey="value" 
                        stroke={isPositive ? '#10B981' : isNeutral ? '#94A3B8' : '#EF4444'} 
                        strokeWidth={2} 
                        dot={false}
                        isAnimationActive={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
