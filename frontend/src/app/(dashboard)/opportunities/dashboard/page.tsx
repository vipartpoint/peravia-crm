'use client';

import React, { useEffect, useState } from 'react';
import { api } from '@/services/api';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { Target, DollarSign, TrendingUp, AlertTriangle, PieChart as PieChartIcon, Activity } from 'lucide-react';
import { Funnel3D, FunnelLayer } from '@/components/ui/Funnel3D';
import { CustomSalesReportBuilder } from '@/components/reports/CustomSalesReportBuilder';
import { Skeleton } from '@/components/ui/Skeleton';
import { TrendingDown } from 'lucide-react';

const COLORS = ['#4f46e5', '#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];
const FUNNEL_COLORS = ['#94a3b8', '#60a5fa', '#818cf8', '#c084fc', '#fbbf24', '#34d399', '#f87171'];

export default function OpportunitiesDashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [funnelMetric, setFunnelMetric] = useState<'count' | 'value'>('count');

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const result = await api.get('/opportunities/dashboard/forecast');
        setData(result);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className="p-8 max-w-[1600px] mx-auto space-y-6">
        <Skeleton className="h-10 w-64 rounded-xl" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => <Skeleton key={i} className="h-32 rounded-2xl" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-96 rounded-2xl" />
          <Skeleton className="h-96 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!data) {
    return <div className="p-8 text-center text-slate-500">خطا در دریافت اطلاعات داشبورد</div>;
  }

  // Format data for Recharts
  const stageData = Object.entries(data.byStage).map(([name, value]: any) => ({
    name,
    count: value.count,
    value: value.value
  }));

  const SPANCOP_STAGES = [
    { id: 'Suspect', label: 'Suspect' },
    { id: 'Prospect', label: 'Prospect' },
    { id: 'Analysis', label: 'Analysis' },
    { id: 'Negotiate', label: 'Negotiate' },
    { id: 'Close', label: 'Close' },
    { id: 'Order', label: 'Order' },
    { id: 'Payment', label: 'Payment' }
  ];

  const topStageCount = data.byStage['Suspect']?.count || 1;

  const funnelData: FunnelLayer[] = SPANCOP_STAGES.map((stage, index) => {
    const count = data.byStage[stage.id]?.count || 0;
    const value = data.byStage[stage.id]?.value || 0;
    return {
      name: stage.label,
      id: stage.id,
      count,
      value,
      color: FUNNEL_COLORS[index % FUNNEL_COLORS.length]
    };
  });

  const demandData = Object.entries(data.productDemand).map(([name, stat]: any) => ({
    name: name.substring(0, 15) + (name.length > 15 ? '...' : ''),
    volume: stat.volume,
    weightedVolume: stat.weightedVolume
  }));

  const lostData = Object.entries(data.winLoss.lostReasons).map(([name, count]) => ({
    name,
    value: count
  }));

  const winRate = data.winLoss.totalClosed > 0 
    ? Math.round((data.winLoss.won / data.winLoss.totalClosed) * 100) 
    : 0;



  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto min-h-screen">
      <div className="mb-8">
        <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
          <PieChartIcon className="w-6 h-6 text-indigo-600" /> گزارش پیش‌بینی و قیف فروش
        </h1>
        <p className="text-slate-500 text-sm mt-1">تحلیل لحظه‌ای وضعیت فروش سازمانی (Enterprise Sales Pipeline)</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="flex items-center gap-2 text-slate-500 mb-2">
            <DollarSign className="w-4 h-4" />
            <span className="text-xs font-bold">ارزش کل قیف (پتانسیل)</span>
          </div>
          <p className="text-2xl font-black text-slate-800 dark:text-slate-100">{(data.pipelineValue / 1000000).toLocaleString()}<span className="text-sm font-medium text-slate-500 mr-1">م.ت</span></p>
        </div>

        <div className="bg-gradient-to-br from-indigo-500 to-indigo-700 p-5 rounded-2xl shadow-md text-white">
          <div className="flex items-center gap-2 text-indigo-100 mb-2">
            <Target className="w-4 h-4" />
            <span className="text-xs font-bold">پیش‌بینی موزون (Weighted)</span>
          </div>
          <p className="text-2xl font-black">{(data.weightedForecast / 1000000).toLocaleString()}<span className="text-sm font-medium text-indigo-200 mr-1">م.ت</span></p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="flex items-center gap-2 text-slate-500 mb-2">
            <TrendingUp className="w-4 h-4 text-emerald-500" />
            <span className="text-xs font-bold">نرخ تبدیل (Win Rate)</span>
          </div>
          <p className="text-2xl font-black text-emerald-600">{winRate}%</p>
          <p className="text-xs text-slate-400 mt-1">{data.winLoss.won} موفق از {data.winLoss.totalClosed} بسته شده</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="flex items-center gap-2 text-slate-500 mb-2">
            <TrendingDown className="w-4 h-4 text-rose-500" />
            <span className="text-xs font-bold">فرصت‌های از دست رفته</span>
          </div>
          <p className="text-2xl font-black text-rose-600">{data.winLoss.lost}</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="flex items-center gap-2 text-slate-500 mb-2">
            <PieChartIcon className="w-4 h-4" />
            <span className="text-xs font-bold">فرصت‌های باز</span>
          </div>
          <p className="text-2xl font-black text-blue-600">{data.openCount || 0}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        
        {/* Stage Value Chart */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <h3 className="font-bold text-slate-800 dark:text-slate-200 mb-6 border-b pb-2">ارزش ریالی در هر مرحله</h3>
          <div className="h-72 w-full" dir="ltr">
            <ResponsiveContainer>
              <BarChart data={stageData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12 }} tickFormatter={(val) => (val / 1000000).toLocaleString() + 'M'} />
                <RechartsTooltip formatter={(val: any) => [val.toLocaleString('fa-IR') + ' ریال', 'مبلغ']} cursor={{ fill: '#f1f5f9' }} />
                <Bar dataKey="value" fill="#4f46e5" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Funnel Distribution */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col">
          <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-700 mb-6 pb-2">
            <h3 className="font-bold text-slate-800 dark:text-slate-200">قیف فروش (SPANCOP)</h3>
            <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
              <button 
                onClick={() => setFunnelMetric('count')} 
                className={`px-3 py-1 text-xs font-bold rounded-md transition ${funnelMetric === 'count' ? 'bg-white dark:bg-slate-700 shadow-sm text-indigo-600 dark:text-indigo-400' : 'text-slate-500'}`}
              >
                تعداد
              </button>
              <button 
                onClick={() => setFunnelMetric('value')} 
                className={`px-3 py-1 text-xs font-bold rounded-md transition ${funnelMetric === 'value' ? 'bg-white dark:bg-slate-700 shadow-sm text-indigo-600 dark:text-indigo-400' : 'text-slate-500'}`}
              >
                مبلغ
              </button>
            </div>
          </div>
          <div className="h-[350px] w-full mt-2" dir="ltr">
            <Funnel3D data={funnelData} height={350} width={600} metric={funnelMetric} />
          </div>
        </div>

        {/* Product Demand Forecast */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <h3 className="font-bold text-slate-800 dark:text-slate-200 mb-6 border-b pb-2">پیش‌بینی تقاضای محصول (حجم)</h3>
          <div className="h-72 w-full" dir="ltr">
            <ResponsiveContainer>
              <AreaChart data={demandData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10 }} />
                <YAxis axisLine={false} tickLine={false} />
                <RechartsTooltip />
                <Legend />
                <Area type="monotone" dataKey="volume" name="حجم در جریان" stroke="#cbd5e1" fill="#f8fafc" />
                <Area type="monotone" dataKey="weightedVolume" name="حجم موزون (احتمالی)" stroke="#10b981" fill="#d1fae5" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Lost Reasons Pie Chart */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col">
          <h3 className="font-bold text-slate-800 dark:text-slate-200 mb-6 border-b pb-2 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-500" /> تحلیل دلایل شکست (Lost Reasons)
          </h3>
          <div className="flex-1 w-full" dir="ltr">
            {lostData.length > 0 ? (
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={lostData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="value">
                    {lostData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip />
                  <Legend verticalAlign="bottom" height={36}/>
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-slate-400">
                هیچ دیتایی برای نمایش وجود ندارد
              </div>
            )}
          </div>
        </div>
      </div>

      <CustomSalesReportBuilder />
    </div>
  );
}
