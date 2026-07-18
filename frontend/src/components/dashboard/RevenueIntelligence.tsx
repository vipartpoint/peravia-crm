'use client';

import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend } from 'recharts';
import { Skeleton } from '@/components/ui/Skeleton';

interface Props {
  loading?: boolean;
  revenueByProduct: any[];
  revenueByTerritory: any[];
  leadSources: any[];
}

export function RevenueIntelligence({ loading, revenueByProduct, revenueByTerritory, leadSources }: Props) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-[300px]">
        <Skeleton className="rounded-2xl" />
        <Skeleton className="rounded-2xl" />
        <Skeleton className="rounded-2xl" />
      </div>
    );
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-slate-800 p-3 rounded-lg shadow-lg border border-slate-100 dark:border-slate-700 z-50">
          <p className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-1">{label}</p>
          <p className="text-xs text-slate-600 dark:text-slate-300">
            {payload[0].value.toLocaleString('fa-IR')}
          </p>
        </div>
      );
    }
    return null;
  };

  const COLORS = ['#0FA9B0', '#F59E0B', '#8B5CF6', '#EC4899', '#10B981', '#3B82F6'];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* Revenue by Product */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800">
        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-6">درآمد بر اساس محصول</h3>
        <div className="h-[240px]">
          {revenueByProduct.length === 0 ? (
            <div className="h-full flex items-center justify-center text-sm text-slate-500 dark:text-slate-400">
              هنوز داده کافی برای تحلیل وجود ندارد.
            </div>
          ) : (
            <div className="w-full h-full" dir="ltr">
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={revenueByProduct} layout="vertical" margin={{ top: 0, right: 30, left: 20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E5E7EB" className="dark:stroke-slate-800" />
                  <XAxis type="number" axisLine={false} tickLine={false} tick={false} />
                  <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748B' }} width={80} />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: 'transparent' }} />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={16}>
                    {revenueByProduct.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {/* Revenue by Territory */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800">
        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-6">درآمد بر اساس منطقه</h3>
        <div className="h-[240px]">
          {revenueByTerritory.length === 0 ? (
            <div className="h-full flex items-center justify-center text-sm text-slate-500 dark:text-slate-400">
              هنوز داده کافی برای تحلیل وجود ندارد.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={revenueByTerritory} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" className="dark:stroke-slate-800" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748B' }} />
                <YAxis hide />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'transparent' }} />
                <Bar dataKey="value" fill="#8B5CF6" radius={[4, 4, 0, 0]} barSize={24} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Lead Sources */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800">
        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-2">منابع ورودی سرنخ‌ها</h3>
        <div className="h-[240px]">
          {leadSources.length === 0 ? (
            <div className="h-full flex items-center justify-center text-sm text-slate-500 dark:text-slate-400">
              هنوز داده کافی برای تحلیل وجود ندارد.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie
                  data={leadSources}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {leadSources.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '11px', color: '#64748B' }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}
