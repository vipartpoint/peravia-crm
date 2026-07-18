'use client';

import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';
import { Skeleton } from '@/components/ui/Skeleton';

interface Props {
  loading?: boolean;
  salesData: any[];
  ordersData: any[];
  funnelData: any[];
}

export function SalesAnalytics({ loading, salesData, ordersData, funnelData }: Props) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-[350px]">
        <Skeleton className="rounded-2xl" />
        <Skeleton className="rounded-2xl" />
      </div>
    );
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-slate-800 p-3 rounded-lg shadow-lg border border-slate-100 dark:border-slate-700">
          <p className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-1">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-xs text-slate-600 dark:text-slate-300" style={{ color: entry.color }}>
              {entry.name}: {entry.value.toLocaleString('fa-IR')}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* Sales Trend */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 lg:col-span-2">
        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-6">روند فروش و سفارشات</h3>
        <div className="h-[280px]">
          {salesData.length === 0 ? (
            <div className="h-full flex items-center justify-center text-sm text-slate-500 dark:text-slate-400">
              هنوز داده کافی برای تحلیل این بخش وجود ندارد.
            </div>
          ) : (
            <div className="w-full h-full" dir="ltr">
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={salesData} margin={{ top: 5, right: 0, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" className="dark:stroke-slate-800" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94A3B8' }} />
                  <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94A3B8' }} tickFormatter={(val) => `${(val/1000000)}m`} />
                  <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94A3B8' }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Line yAxisId="left" name="فروش (تومان)" type="monotone" dataKey="sales" stroke="#0FA9B0" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
                  <Line yAxisId="right" name="تعداد سفارش" type="monotone" dataKey="orders" stroke="#F59E0B" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {/* Sales Funnel */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800">
        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-6">قیف فروش</h3>
        <div className="h-[280px]">
          {funnelData.length === 0 ? (
            <div className="h-full flex items-center justify-center text-sm text-slate-500 dark:text-slate-400">
              هنوز داده کافی برای تحلیل این بخش وجود ندارد.
            </div>
          ) : (
            <div className="w-full h-full" dir="ltr">
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={funnelData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#E5E7EB" className="dark:stroke-slate-800" />
                  <XAxis type="number" axisLine={false} tickLine={false} tick={false} />
                  <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94A3B8' }} width={75} />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: 'transparent' }} />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={24}>
                    {funnelData.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={entry.fill || '#3B82F6'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
