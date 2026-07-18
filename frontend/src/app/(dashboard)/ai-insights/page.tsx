'use client';
import { useState, useEffect } from 'react';
import { api } from '@/services/api';
import { BrainCircuit, RefreshCw, AlertTriangle, CheckCircle, XCircle, ChevronRight, Zap } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export default function AiInsightsPage() {
  const [loading, setLoading] = useState(true);
  const [recalculating, setRecalculating] = useState(false);
  const [insights, setInsights] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('All');

  useEffect(() => {
    fetchInsights();
  }, []);

  const fetchInsights = async () => {
    setLoading(true);
    try {
      const data = await api.get('/ai-insights');
      setInsights(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleRecalculate = async () => {
    setRecalculating(true);
    try {
      await api.post('/ai-insights/recalculate', {});
      await fetchInsights();
      alert('تحلیل‌ها با موفقیت بروزرسانی شدند.');
    } catch (e) {
      alert('خطا در بروزرسانی تحلیل‌ها');
    } finally {
      setRecalculating(false);
    }
  };

  const handleStatusChange = async (id: string, status: string) => {
    try {
      await api.patch(`/ai-insights/${id}/status`, { status });
      await fetchInsights();
    } catch (e) {
      alert('خطا در تغییر وضعیت');
    }
  };

  const tabs = [
    { id: 'All', label: 'همه' },
    { id: 'LeadScore', label: 'امتیاز لیدها' },
    { id: 'ChurnRisk', label: 'ریسک ریزش' },
    { id: 'NextBestProduct', label: 'پیشنهاد محصول' },
    { id: 'FollowupRecommendation', label: 'پیشنهاد پیگیری' },
    { id: 'ManagerAlert', label: 'هشدارهای مدیریتی' },
  ];

  const filteredInsights = activeTab === 'All' ? insights : insights.filter(i => i.insightType === activeTab);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'High': return 'bg-rose-100 text-rose-700 border-rose-200';
      case 'Medium': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'Low': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      default: return 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700';
    }
  };

  const getPriorityBorder = (priority: string) => {
    switch (priority) {
      case 'High': return 'border-t-rose-500';
      case 'Medium': return 'border-t-amber-500';
      case 'Low': return 'border-t-emerald-500';
      default: return 'border-t-slate-500';
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto min-h-screen space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center">
            <BrainCircuit className="w-8 h-8 ml-3 text-indigo-600" />
            هوش فروش (AI Insights)
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">موتور تحلیلی و توصیه‌گر هوشمند فروش</p>
        </div>
        <Button 
          variant="primary"
          onClick={handleRecalculate}
          disabled={recalculating}
          className="shadow-lg shadow-indigo-500/20 disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ml-2 ${recalculating ? 'animate-spin' : ''}`} />
          {recalculating ? 'در حال تحلیل...' : 'به‌روزرسانی تحلیل‌ها'}
        </Button>
      </div>

      <div className="flex overflow-x-auto gap-2 pb-2 no-scrollbar border-b border-slate-200 dark:border-slate-700">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`whitespace-nowrap px-4 py-2.5 text-sm transition-all border-b-2 ${
              activeTab === t.id 
                ? 'border-indigo-600 text-indigo-700 font-bold' 
                : 'border-transparent text-slate-500 dark:text-slate-400 font-medium hover:text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:bg-slate-800/50'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center p-20"><div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredInsights.map(insight => (
            <div key={insight.id} className={`bg-white dark:bg-slate-900 p-5 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col relative border-t-4 ${getPriorityBorder(insight.priority)} hover:shadow-md transition-shadow`}>
              
              <div className="flex justify-between items-start mb-4">
                <span className={`px-2 py-1 rounded-md text-xs font-bold border ${getPriorityColor(insight.priority)}`}>
                  اولویت: {insight.priority === 'High' ? 'بالا' : insight.priority === 'Medium' ? 'متوسط' : 'پایین'}
                </span>
                {insight.score !== null && (
                  <span className="font-mono font-bold text-slate-800 dark:text-slate-100 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2 py-1 rounded-md text-xs">
                    امتیاز: {insight.score}
                  </span>
                )}
              </div>

              <h3 className="font-bold text-lg text-slate-900 mb-2 flex items-start">
                <Zap className="w-5 h-5 ml-2 text-amber-500 flex-shrink-0 mt-0.5" />
                {insight.insightTitle}
              </h3>
              
              <p className="text-slate-600 dark:text-slate-300 text-sm mb-4 leading-relaxed flex-grow">
                {insight.insightDescription}
              </p>

              <div className="bg-indigo-50/50 rounded-xl p-4 mb-4 border border-indigo-100/50">
                <p className="text-xs text-indigo-700 font-bold mb-1">پیشنهاد سیستم:</p>
                <p className="text-sm font-medium text-indigo-900">{insight.recommendedAction || 'اقدامی یافت نشد'}</p>
              </div>

              <div className="flex justify-between items-center mt-auto pt-4 border-t border-slate-100 dark:border-slate-800">
                <div className="flex gap-2">
                  <button onClick={() => handleStatusChange(insight.id, 'Applied')} className="text-emerald-600 hover:bg-emerald-50 border border-transparent hover:border-emerald-200 p-2 rounded-lg transition" title="انجام شد (Apply)">
                    <CheckCircle className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleStatusChange(insight.id, 'Dismissed')} className="text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 p-2 rounded-lg transition" title="رد کردن (Dismiss)">
                    <XCircle className="w-4 h-4" />
                  </button>
                </div>
                <span className="text-xs text-slate-400 font-mono" dir="ltr">
                  {new Date(insight.createdAt).toLocaleDateString('fa-IR')}
                </span>
              </div>
            </div>
          ))}
          {filteredInsights.length === 0 && (
            <div className="col-span-full p-16 text-center bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-300">
              <BrainCircuit className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500 dark:text-slate-400 font-medium">هیچ تحلیلی برای نمایش وجود ندارد.</p>
              <button onClick={handleRecalculate} className="mt-4 text-indigo-600 text-sm font-bold hover:underline">
                اجرای مجدد تحلیل‌ها
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
