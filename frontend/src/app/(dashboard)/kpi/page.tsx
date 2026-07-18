'use client';
import { useState, useEffect } from 'react';
import { api } from '@/services/api';
import { Target, RefreshCcw, TrendingUp } from 'lucide-react';

export default function KpiPage() {
  const [loading, setLoading] = useState(true);
  const [calculating, setCalculating] = useState(false);
  const [targets, setTargets] = useState<any[]>([]);

  useEffect(() => {
    fetchTargets();
  }, []);

  const fetchTargets = async () => {
    try {
      const res = await api.get('/kpi');
      setTargets(Array.isArray(res) ? res : res.data || []);
    } catch (e) {
      console.error(e);
      setTargets([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRecalculate = async () => {
    setCalculating(true);
    try {
      await api.post('/kpi/recalculate', {});
      await api.post('/commissions/calculate', {}); // Also recalculate commissions
      alert('محاسبه مجدد با موفقیت انجام شد!');
      fetchTargets();
    } catch (e) {
      alert('خطا در محاسبه مجدد');
    } finally {
      setCalculating(false);
    }
  };

  const ProgressBar = ({ label, actual, target, percent }: any) => {
    const isSuccess = percent >= 100;
    const isWarning = percent >= 70 && percent < 100;
    const colorClass = isSuccess ? 'bg-emerald-500' : (isWarning ? 'bg-amber-500' : 'bg-rose-500');

    return (
      <div className="mb-4">
        <div className="flex justify-between text-sm mb-1 font-medium">
          <span className="text-gray-700 dark:text-gray-200">{label}</span>
          <span className="text-gray-500" dir="ltr">{Number(actual).toLocaleString()} / {Number(target).toLocaleString()} ({Math.round(percent)}%)</span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-2.5">
          <div className={`${colorClass} h-2.5 rounded-full transition-all duration-1000`} style={{ width: `${Math.min(percent, 100)}%` }}></div>
        </div>
      </div>
    );
  };

  if (loading) return <div className="flex justify-center p-20"><div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div></div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight flex items-center">
            <Target className="w-8 h-8 ml-3 text-indigo-600" />
            تارگت‌ها و شاخص‌های کلیدی (KPI)
          </h1>
          <p className="text-gray-500 text-sm mt-1 font-medium">وضعیت پیشرفت نسبت به اهداف تعیین شده</p>
        </div>
        <button 
          onClick={handleRecalculate} 
          disabled={calculating}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl flex items-center text-sm font-bold shadow-lg shadow-indigo-500/30 transition-all disabled:opacity-50"
        >
          <RefreshCcw className={`w-5 h-5 ml-1 ${calculating ? 'animate-spin' : ''}`} />
          {calculating ? 'در حال محاسبه...' : 'محاسبه مجدد KPI'}
        </button>
      </div>

      {targets.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl border border-gray-100 dark:border-gray-800 text-center text-gray-500 shadow-sm">
          تارگتی برای شما ثبت نشده است.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {targets.map((t) => (
            <div key={t.id} className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800">
              <div className="flex justify-between items-start mb-6 pb-4 border-b border-gray-50">
                <div>
                  <h3 className="font-bold text-lg text-gray-900">{t.user?.username || 'کاربر نامشخص'}</h3>
                  <p className="text-sm text-gray-500">{t.territory?.name || 'بدون منطقه'}</p>
                </div>
                <div className="text-left">
                  <span className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-lg text-xs font-bold inline-block mb-1">دوره‌ی {t.periodType}</span>
                  <p className="text-xs text-gray-400 font-mono" dir="ltr">{new Date(t.periodStart).toISOString().split('T')[0]} / {new Date(t.periodEnd).toISOString().split('T')[0]}</p>
                </div>
              </div>

              <div className="space-y-2">
                <ProgressBar label="حجم فروش (تومان)" actual={t.actualSalesAmount} target={t.targetSalesAmount} percent={Number(t.salesAchievementPercent)} />
                <ProgressBar label="مبلغ وصولی (تومان)" actual={t.actualCollectedAmount} target={t.targetCollectedAmount} percent={Number(t.collectionAchievementPercent)} />
                
                <div className="grid grid-cols-2 gap-4 mt-6">
                  <div className="bg-gray-50 p-3 rounded-xl border border-gray-100 dark:border-gray-800">
                    <ProgressBar label="تعداد سفارش" actual={t.actualOrdersCount} target={t.targetOrdersCount} percent={(t.actualOrdersCount/t.targetOrdersCount)*100 || 0} />
                  </div>
                  <div className="bg-gray-50 p-3 rounded-xl border border-gray-100 dark:border-gray-800">
                    <ProgressBar label="ویزیت‌ها" actual={t.actualVisitsCount} target={t.targetVisitsCount} percent={Number(t.visitAchievementPercent)} />
                  </div>
                  <div className="bg-gray-50 p-3 rounded-xl border border-gray-100 dark:border-gray-800">
                    <ProgressBar label="مشتریان جدید" actual={t.actualNewCustomers} target={t.targetNewCustomers} percent={(t.actualNewCustomers/t.targetNewCustomers)*100 || 0} />
                  </div>
                  <div className="bg-gray-50 p-3 rounded-xl border border-gray-100 dark:border-gray-800">
                    <ProgressBar label="تبدیل لیدها" actual={t.actualLeadConversions} target={t.targetLeadConversions} percent={Number(t.conversionAchievementPercent)} />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
