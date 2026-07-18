'use client';

import React, { useState, useEffect } from 'react';
import { ShieldCheck, Trophy, Sparkles, Navigation, Users, BarChart } from 'lucide-react';
import { BarChart as RechartsBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend } from 'recharts';

export default function AdoptionDashboard() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  // Since we don't have a backend to fetch team-wide metrics, we simulate realistic values 
  // to demonstrate the frontend MVP as requested by the user.
  const mockTourCompletion = [
    { name: 'داشبورد', value: 85 },
    { name: 'مشتریان', value: 72 },
    { name: 'سرنخ‌ها', value: 64 },
    { name: 'سفارشات', value: 48 },
    { name: 'انبار', value: 30 },
    { name: 'هوش مصنوعی', value: 15 },
  ];

  const mockAiAdoption = [
    { name: 'مستمر (هر روز)', value: 12 },
    { name: 'گاهی اوقات', value: 34 },
    { name: 'فقط یک بار', value: 25 },
    { name: 'هرگز استفاده نکرده', value: 29 },
  ];

  const COLORS = ['#10B981', '#3B82F6', '#F59E0B', '#EF4444'];

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-slate-800 p-3 rounded-lg shadow-lg border border-slate-100 dark:border-slate-700">
          <p className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-1">{label || payload[0].name}</p>
          <p className="text-xs text-slate-600 dark:text-slate-300">
            {payload[0].value}٪ کاربران
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-black text-slate-800 dark:text-white flex items-center gap-3">
            <BarChart className="w-6 h-6 text-indigo-500" />
            داشبورد تحلیل پذیرش سازمانی (Adoption Analytics)
          </h1>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-2">
            نظارت بر سطح یادگیری، استفاده از امکانات و وضعیت سلامت کاربران سیستم
          </p>
        </div>
        <div className="px-3 py-1.5 bg-amber-50 dark:bg-amber-500/10 border border-amber-100 dark:border-amber-500/20 rounded-lg">
          <span className="text-xs font-bold text-amber-700 dark:text-amber-500">نسخه آزمایشی مبتنی بر مرورگر</span>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-500/10 rounded-xl flex items-center justify-center shrink-0">
            <ShieldCheck className="w-6 h-6 text-emerald-500" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 mb-1">میانگین سلامت کاربری</p>
            <p className="text-2xl font-black text-slate-800 dark:text-white">۶۸٪</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-500/10 rounded-xl flex items-center justify-center shrink-0">
            <Sparkles className="w-6 h-6 text-indigo-500" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 mb-1">نرخ پذیرش هوش مصنوعی</p>
            <p className="text-2xl font-black text-slate-800 dark:text-white">۴۶٪</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-50 dark:bg-blue-500/10 rounded-xl flex items-center justify-center shrink-0">
            <Navigation className="w-6 h-6 text-blue-500" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 mb-1">اتمام آموزش اولیه (Onboarding)</p>
            <p className="text-2xl font-black text-slate-800 dark:text-white">۷۲٪</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-rose-50 dark:bg-rose-500/10 rounded-xl flex items-center justify-center shrink-0">
            <Users className="w-6 h-6 text-rose-500" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 mb-1">کاربران غیرفعال (۷ روز)</p>
            <p className="text-2xl font-black text-slate-800 dark:text-white">۱۴ نفر</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        {/* Tour Completion Chart */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-6">نرخ تکمیل آموزش‌های تعاملی (Tours)</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <RechartsBarChart data={mockTourCompletion} layout="vertical" margin={{ top: 0, right: 0, left: 30, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E5E7EB" className="dark:stroke-slate-800" />
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748B' }} width={80} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'transparent' }} />
                <Bar dataKey="value" fill="#3B82F6" radius={[0, 4, 4, 0]} barSize={20} />
              </RechartsBarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* AI Adoption Pie Chart */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-6">وضعیت پذیرش دستیار هوشمند</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={mockAiAdoption}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={90}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {mockAiAdoption.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '11px', color: '#64748B' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
        {/* Most Used Modules */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2">
            <Trophy className="w-4 h-4 text-emerald-500" /> بیشترین ماژول‌های استفاده شده
          </h3>
          <div className="space-y-3">
            {['پایگاه داده مشتریان', 'مدیریت سرنخ‌ها', 'داشبورد عملیاتی'].map((module, i) => (
              <div key={i} className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700/50">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{module}</span>
                <span className="text-xs font-bold text-slate-400">استفاده روزانه</span>
              </div>
            ))}
          </div>
        </div>

        {/* Least Used Modules */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2">
            <Trophy className="w-4 h-4 text-rose-500" /> کمترین ماژول‌های استفاده شده
          </h3>
          <div className="space-y-3">
            {['تحلیل‌های هوش مصنوعی', 'مدیریت انبار', 'هدف‌گذاری تیمی'].map((module, i) => (
              <div key={i} className="flex justify-between items-center p-3 bg-rose-50/50 dark:bg-rose-500/5 rounded-xl border border-rose-100 dark:border-rose-500/20">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{module}</span>
                <span className="text-xs font-bold text-rose-500">نیازمند آموزش بیشتر</span>
              </div>
            ))}
          </div>
        </div>
      </div>

    </div>
  );
}
