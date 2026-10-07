'use client';
import { useState, useEffect } from 'react';
import { api } from '@/services/api';
import { Target, RefreshCcw, Plus, Edit, Trash2, PieChart, BrainCircuit, BarChart3 } from 'lucide-react';
import { useGlobalEntity } from '@/contexts/GlobalEntityContext';
import SalesIntelligenceDashboard from '@/components/analytics/SalesIntelligenceDashboard';

export default function KpiPage() {
  const [loading, setLoading] = useState(true);
  const [calculating, setCalculating] = useState(false);
  const [targets, setTargets] = useState<any[]>([]);
  const [activeView, setActiveView] = useState<'analytics' | 'targets'>('analytics');
  const { openCreate, openEdit } = useGlobalEntity() as any;

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
      await api.post('/commissions/calculate', {});
      alert('محاسبه مجدد با موفقیت انجام شد!');
      fetchTargets();
    } catch (e) {
      alert('خطا در محاسبه مجدد');
    } finally {
      setCalculating(false);
    }
  };

  const handleDelete = async (id: string) => {
    const reason = prompt('لطفاً دلیل حذف را وارد کنید (برای ثبت در بایگانی ممیزی):');
    if (!reason) return;
    try {
      await api.delete(`/kpi/${id}`, { data: { reason } });
      fetchTargets();
    } catch (e: any) {
      alert(e.response?.data?.message || 'خطا در حذف هدف');
    }
  };

  const ProgressBar = ({ label, actual, target, percent, weight }: any) => {
    if (Number(target) === 0 && Number(weight) === 0) return null;
    
    const isSuccess = percent >= 100;
    const isWarning = percent >= 70 && percent < 100;
    const colorClass = isSuccess ? 'bg-emerald-500' : (isWarning ? 'bg-amber-500' : 'bg-rose-500');

    return (
      <div className="mb-4">
        <div className="flex justify-between text-xs mb-1 font-medium">
          <span className="text-gray-700 dark:text-gray-200">{label} <span className="text-indigo-400 font-bold ml-1">(وزن: {weight}%)</span></span>
          <span className="text-gray-500" dir="ltr">{Number(actual).toLocaleString()} / {Number(target).toLocaleString()} ({Math.round(percent)}%)</span>
        </div>
        <div className="w-full bg-gray-100 dark:bg-slate-800 rounded-full h-1.5">
          <div className={`${colorClass} h-1.5 rounded-full transition-all duration-1000`} style={{ width: `${Math.min(percent, 100)}%` }}></div>
        </div>
      </div>
    );
  };

  if (loading) return <div className="flex justify-center p-20"><div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div></div>;

  return (
    <div className="space-y-6 pb-20">
      <div className="flex justify-between items-center bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight flex items-center">
            <Target className="w-8 h-8 ml-3 text-indigo-600" />
            مرکز اهداف فروش و هوش تحلیلی (KPI)
          </h1>
          <p className="text-slate-500 text-sm mt-1 font-medium">
            دسترسی سریع به ۱۳ شاخص کلیدی، مقایسه‌های فصلی، عملکرد کارشناسان و اهداف وزنی
          </p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => openCreate('kpi')} className="bg-white border-2 border-indigo-600 text-indigo-700 hover:bg-indigo-50 px-4 py-2 rounded-xl flex items-center text-sm font-bold transition-all">
            <Plus className="w-5 h-5 ml-1" />
            تعریف هدف جدید
          </button>
          <button onClick={handleRecalculate} disabled={calculating} className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl flex items-center text-sm font-bold shadow-lg shadow-indigo-500/30 transition-all disabled:opacity-50">
            <RefreshCcw className={`w-5 h-5 ml-1 ${calculating ? 'animate-spin' : ''}`} />
            {calculating ? 'در حال محاسبه...' : 'به‌روزرسانی عملکرد'}
          </button>
        </div>
      </div>

      {/* View Switcher Tabs */}
      <div className="flex gap-2 border-b border-slate-200 dark:border-slate-800">
        <button
          onClick={() => setActiveView('analytics')}
          className={`flex items-center gap-2 px-5 py-3 font-bold text-sm border-b-2 transition ${activeView === 'analytics' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
        >
          <BrainCircuit className="w-4 h-4" />
          داشبورد هوش تحلیلی و ۱۳ شاخص فروش
        </button>
        <button
          onClick={() => setActiveView('targets')}
          className={`flex items-center gap-2 px-5 py-3 font-bold text-sm border-b-2 transition ${activeView === 'targets' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
        >
          <BarChart3 className="w-4 h-4" />
          کارت‌های اهداف فعال کارشناسان و مناطق ({targets.length})
        </button>
      </div>

      {activeView === 'analytics' ? (
        <SalesIntelligenceDashboard />
      ) : (
        <>
          {targets.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl border border-gray-100 dark:border-gray-800 text-center text-gray-500 shadow-sm flex flex-col items-center">
              <Target className="w-16 h-16 text-slate-300 mb-4" />
              <p>هیچ هدف فعالی یافت نشد.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {targets.map((t) => (
            <div key={t.id} className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden flex flex-col">
              {/* Header */}
              <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-start bg-slate-50/50 dark:bg-slate-800/20">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-black tracking-widest ${t.assignmentType === 'INDIVIDUAL' ? 'bg-blue-100 text-blue-700' : 'bg-fuchsia-100 text-fuchsia-700'}`}>
                      {t.assignmentType === 'INDIVIDUAL' ? 'فردی' : 'منطقه‌ای'}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${t.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700' : (t.status === 'DRAFT' ? 'bg-slate-200 text-slate-600' : 'bg-rose-100 text-rose-700')}`}>
                      {t.status}
                    </span>
                  </div>
                  <h3 className="font-bold text-lg text-slate-900 dark:text-slate-100">
                    {t.assignmentType === 'INDIVIDUAL' ? t.user?.username : t.territory?.name}
                  </h3>
                  <p className="text-xs text-slate-500 font-mono mt-1" dir="ltr">{new Date(t.periodStart).toISOString().split('T')[0]} ➔ {new Date(t.periodEnd).toISOString().split('T')[0]}</p>
                </div>
                
                <div className="flex flex-col items-end gap-2">
                  <div className="flex gap-1">
                    <button onClick={() => openEdit('kpi', t.id)} className="p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-500 hover:text-indigo-600 transition-colors">
                      <Edit className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(t.id)} className="p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-500 hover:text-rose-600 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Total Score Widget */}
              <div className="p-5 bg-indigo-50/50 dark:bg-indigo-900/10 border-b border-slate-100 dark:border-slate-800 flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-white dark:bg-slate-800 border-4 border-indigo-500 flex items-center justify-center shadow-inner">
                  <span className="font-black text-indigo-700 dark:text-indigo-400 text-lg">{Math.round(t.totalWeightedScore)}<span className="text-[10px]">%</span></span>
                </div>
                <div>
                  <h4 className="font-bold text-slate-800 dark:text-slate-200 flex items-center">
                    <PieChart className="w-4 h-4 ml-1 text-indigo-500" />
                    امتیاز کل عملکرد (معدل وزنی)
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-1">تجمعی از پیشرفت‌های شاخص‌ها بر اساس ضریب اهمیت</p>
                </div>
              </div>

              {/* Progress Bars */}
              <div className="p-5 flex-1">
                <div className="space-y-1">
                  <ProgressBar label="مبلغ فروش" actual={t.actualSalesAmount} target={t.targetSalesAmount} percent={Number(t.salesAchievementPercent)} weight={t.weightSalesAmount} />
                  <ProgressBar label="مبلغ وصولی" actual={t.actualCollectedAmount} target={t.targetCollectedAmount} percent={Number(t.collectionAchievementPercent)} weight={t.weightCollectedAmount} />
                  <ProgressBar label="تعداد سفارش" actual={t.actualOrdersCount} target={t.targetOrdersCount} percent={(t.actualOrdersCount/t.targetOrdersCount)*100 || 0} weight={t.weightOrdersCount} />
                  <ProgressBar label="تعداد ویزیت" actual={t.actualVisitsCount} target={t.targetVisitsCount} percent={Number(t.visitAchievementPercent)} weight={t.weightVisitsCount} />
                  <ProgressBar label="مشتریان جدید" actual={t.actualNewCustomers} target={t.targetNewCustomers} percent={(t.actualNewCustomers/t.targetNewCustomers)*100 || 0} weight={t.weightNewCustomers} />
                  <ProgressBar label="تبدیل لیدها" actual={t.actualLeadConversions} target={t.targetLeadConversions} percent={Number(t.conversionAchievementPercent)} weight={t.weightLeadConversions} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  )}
</div>
);
}



