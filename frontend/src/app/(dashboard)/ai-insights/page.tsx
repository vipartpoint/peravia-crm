'use client';
import { useState, useEffect, useMemo } from 'react';
import { api } from '@/services/api';
import {
  BrainCircuit, RefreshCw, AlertTriangle, CheckCircle, XCircle, Zap,
  Search, Filter, LayoutGrid, List, Sparkles, Clock, ShieldAlert,
  Target, ChevronLeft, ChevronRight, Check, ChevronDown, ChevronUp, UserCheck
} from 'lucide-react';
import { Button } from '@/components/ui/Button';

export default function AiInsightsPage() {
  const [loading, setLoading] = useState(true);
  const [recalculating, setRecalculating] = useState(false);
  const [insights, setInsights] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('All');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  
  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(9);

  // Expanded cards tracker for long descriptions
  const [expandedCards, setExpandedCards] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetchInsights();
  }, []);

  const fetchInsights = async () => {
    setLoading(true);
    try {
      const data = await api.get('/ai-insights');
      setInsights(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
      setInsights([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRecalculate = async () => {
    setRecalculating(true);
    try {
      await api.post('/ai-insights/recalculate', {});
      await fetchInsights();
      alert('تحلیل‌های هوش فروش با موفقیت به‌روزرسانی شدند.');
    } catch (e) {
      alert('خطا در به‌روزرسانی تحلیل‌ها');
    } finally {
      setRecalculating(false);
    }
  };

  const handleStatusChange = async (id: string, status: string) => {
    try {
      await api.patch(`/ai-insights/${id}/status`, { status });
      // Optimistic update locally
      setInsights(prev => prev.map(i => i.id === id ? { ...i, status } : i));
    } catch (e) {
      alert('خطا در تغییر وضعیت تحلیل');
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedCards(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const tabs = [
    { id: 'All', label: 'همه تحلیل‌ها', icon: BrainCircuit },
    { id: 'LeadScore', label: 'امتیاز لیدها', icon: Target },
    { id: 'ChurnRisk', label: 'ریسک ریزش مشتری', icon: AlertTriangle },
    { id: 'NextBestProduct', label: 'پیشنهاد کالا', icon: Sparkles },
    { id: 'FollowupRecommendation', label: 'پیشنهاد پیگیری', icon: Clock },
    { id: 'ManagerAlert', label: 'هشدارهای مدیریتی', icon: ShieldAlert },
  ];

  // Helper counts per tab
  const tabCounts = useMemo(() => {
    const counts: Record<string, number> = { All: insights.length };
    insights.forEach(i => {
      counts[i.insightType] = (counts[i.insightType] || 0) + 1;
    });
    return counts;
  }, [insights]);

  // Filtered insights based on tab, search, priority, status
  const filteredInsights = useMemo(() => {
    return insights.filter(i => {
      // Tab filter
      if (activeTab !== 'All' && i.insightType !== activeTab) return false;

      // Priority filter
      if (priorityFilter !== 'All' && i.priority !== priorityFilter) return false;

      // Status filter
      if (statusFilter !== 'All' && (i.status || 'Pending') !== statusFilter) return false;

      // Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = (i.insightTitle || '').toLowerCase().includes(q);
        const matchDesc = (i.insightDescription || '').toLowerCase().includes(q);
        const matchAction = (i.recommendedAction || '').toLowerCase().includes(q);
        if (!matchTitle && !matchDesc && !matchAction) return false;
      }

      return true;
    });
  }, [insights, activeTab, priorityFilter, statusFilter, searchQuery]);

  // Reset to page 1 whenever filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, priorityFilter, statusFilter, searchQuery, pageSize]);

  // Pagination calculation
  const totalItems = filteredInsights.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const paginatedInsights = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredInsights.slice(start, start + pageSize);
  }, [filteredInsights, currentPage, pageSize]);

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'ChurnRisk':
        return { label: 'ریسک ریزش', color: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-900', icon: AlertTriangle };
      case 'LeadScore':
        return { label: 'امتیاز لید', color: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-900', icon: Target };
      case 'NextBestProduct':
        return { label: 'پیشنهاد محصول', color: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-900', icon: Sparkles };
      case 'FollowupRecommendation':
        return { label: 'توصیه پیگیری', color: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900', icon: Clock };
      case 'ManagerAlert':
        return { label: 'هشدار مدیریت', color: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-900', icon: ShieldAlert };
      default:
        return { label: 'تحلیل عمومی', color: 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-900', icon: BrainCircuit };
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'High':
        return { label: 'اولویت بالا', color: 'bg-rose-500 text-white' };
      case 'Medium':
        return { label: 'اولویت متوسط', color: 'bg-amber-500 text-white' };
      case 'Low':
        return { label: 'اولویت عادی', color: 'bg-emerald-500 text-white' };
      default:
        return { label: 'عادی', color: 'bg-slate-400 text-white' };
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto min-h-screen space-y-6">
      
      {/* 1. Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2">
            <BrainCircuit className="w-8 h-8 text-indigo-600" />
            هوش فروش و توصیه‌گر هوشمند (AI Insights)
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm mt-1">
            سیستم تحلیل خودکار رفتار خرید، شناسایی مشتریان در خطر ریزش و پیشنهاد اقدامات فروش
          </p>
        </div>
        <Button 
          variant="primary"
          onClick={handleRecalculate}
          disabled={recalculating}
          className="shadow-md shadow-indigo-500/20 disabled:opacity-50 text-xs font-bold px-4 py-2.5 rounded-xl"
        >
          <RefreshCw className={`w-4 h-4 ml-2 ${recalculating ? 'animate-spin' : ''}`} />
          {recalculating ? 'در حال تحلیل مجدد...' : 'به‌روزرسانی موتور تحلیل'}
        </Button>
      </div>

      {/* 2. Top Metric Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-400 block">کل تحلیل‌ها</span>
            <span className="text-2xl font-black text-slate-800 dark:text-slate-100">{insights.length}</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 flex items-center justify-center font-bold">
            <BrainCircuit className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-rose-500 block">اقدام فوری (اولویت بالا)</span>
            <span className="text-2xl font-black text-rose-600">
              {insights.filter(i => i.priority === 'High' && i.status !== 'Dismissed').length}
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 flex items-center justify-center font-bold">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-amber-500 block">مشتریان در خطر ریزش</span>
            <span className="text-2xl font-black text-amber-600">
              {insights.filter(i => i.insightType === 'ChurnRisk' && i.status !== 'Dismissed').length}
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 flex items-center justify-center font-bold">
            <UserCheck className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-emerald-500 block">اقدامات انجام‌شده</span>
            <span className="text-2xl font-black text-emerald-600">
              {insights.filter(i => i.status === 'Applied').length}
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 flex items-center justify-center font-bold">
            <CheckCircle className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* 3. Category Tabs with Counts */}
      <div className="flex overflow-x-auto gap-2 pb-1 border-b border-slate-200 dark:border-slate-800 no-scrollbar">
        {tabs.map(t => {
          const Icon = t.icon;
          const count = tabCounts[t.id] || 0;
          const isActive = activeTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`flex items-center gap-2 whitespace-nowrap px-4 py-3 text-xs font-bold transition-all border-b-2 rounded-t-xl ${
                isActive 
                  ? 'border-indigo-600 text-indigo-600 bg-indigo-50/40 dark:bg-indigo-950/20' 
                  : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{t.label}</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono ${isActive ? 'bg-indigo-600 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'}`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* 4. Controls & Filters Toolbar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute right-3 top-3 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="جستجو در عنوان، شرح یا اقدام پیشنهادی..."
            className="w-full pr-9 pl-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-xs text-slate-800 dark:text-slate-100 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {/* Filters and View Toggles */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Priority filter */}
          <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300">
            <span className="text-[11px] text-slate-400 font-bold">اولویت:</span>
            <select
              value={priorityFilter}
              onChange={e => setPriorityFilter(e.target.value)}
              className="border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-xl px-2.5 py-1.5 text-xs font-medium outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="All">همه اولویت‌ها</option>
              <option value="High">فقط بالا (High)</option>
              <option value="Medium">متوسط (Medium)</option>
              <option value="Low">عادی (Low)</option>
            </select>
          </div>

          {/* Status filter */}
          <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300">
            <span className="text-[11px] text-slate-400 font-bold">وضعیت:</span>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-xl px-2.5 py-1.5 text-xs font-medium outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="All">همه وضعیت‌ها</option>
              <option value="Pending">در انتظار اقدام</option>
              <option value="Applied">اعمال‌شده</option>
              <option value="Dismissed">ردشده</option>
            </select>
          </div>

          {/* Page Size */}
          <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300">
            <span className="text-[11px] text-slate-400 font-bold">تعداد:</span>
            <select
              value={pageSize}
              onChange={e => setPageSize(Number(e.target.value))}
              className="border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-xl px-2.5 py-1.5 text-xs font-mono font-medium outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value={9}>۹ در صفحه</option>
              <option value={18}>۱۸ در صفحه</option>
              <option value={36}>۳۶ در صفحه</option>
            </select>
          </div>

          {/* View Mode Toggle */}
          <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl mr-auto sm:mr-0">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg transition ${viewMode === 'grid' ? 'bg-white dark:bg-slate-900 text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-700'}`}
              title="نمای کارتی منظم"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-lg transition ${viewMode === 'list' ? 'bg-white dark:bg-slate-900 text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-700'}`}
              title="نمای جدولی فشرده (بدون اسکرول)"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* 5. Main Content Area */}
      {loading ? (
        <div className="flex flex-col items-center justify-center p-20 space-y-4">
          <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-500 text-xs font-medium">در حال واکشی و مرتب‌سازی تحلیل‌ها...</p>
        </div>
      ) : paginatedInsights.length === 0 ? (
        <div className="p-16 text-center bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-slate-300 dark:border-slate-800">
          <BrainCircuit className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 font-bold text-sm">هیچ موردی مطابق فیلترهای انتخابی یافت نشد.</p>
          {(searchQuery || priorityFilter !== 'All' || statusFilter !== 'All') && (
            <button
              onClick={() => { setSearchQuery(''); setPriorityFilter('All'); setStatusFilter('All'); }}
              className="mt-3 text-xs text-indigo-600 font-bold hover:underline"
            >
              پاک کردن فیلترها
            </button>
          )}
        </div>
      ) : viewMode === 'grid' ? (
        /* GRID VIEW: Clean, Structured, Balanced Heights */
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {paginatedInsights.map(insight => {
            const typeInfo = getTypeBadge(insight.insightType);
            const priorityInfo = getPriorityBadge(insight.priority);
            const TypeIcon = typeInfo.icon;
            const isApplied = insight.status === 'Applied';
            const isDismissed = insight.status === 'Dismissed';
            const isExpanded = !!expandedCards[insight.id];
            const hasLongDesc = (insight.insightDescription || '').length > 130;

            return (
              <div
                key={insight.id}
                className={`bg-white dark:bg-slate-900 rounded-3xl border transition-all duration-200 flex flex-col justify-between overflow-hidden shadow-sm hover:shadow-md ${
                  isApplied ? 'border-emerald-200 dark:border-emerald-900/40 bg-emerald-50/10' :
                  isDismissed ? 'opacity-60 border-slate-200 dark:border-slate-800 bg-slate-50/50' :
                  'border-slate-200 dark:border-slate-800 hover:border-indigo-300'
                }`}
              >
                {/* Card Header */}
                <div className="p-5 pb-3">
                  <div className="flex justify-between items-center mb-3 gap-2">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border ${typeInfo.color}`}>
                      <TypeIcon className="w-3.5 h-3.5" />
                      {typeInfo.label}
                    </span>

                    <div className="flex items-center gap-1.5">
                      {insight.score !== null && (
                        <span className="font-mono font-black text-[11px] text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-lg border border-slate-200 dark:border-slate-700">
                          نمره: {insight.score}
                        </span>
                      )}
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${priorityInfo.color}`}>
                        {priorityInfo.label}
                      </span>
                    </div>
                  </div>

                  {/* Title */}
                  <h3 className="font-black text-sm text-slate-900 dark:text-slate-100 line-clamp-2 leading-relaxed mb-2">
                    {insight.insightTitle}
                  </h3>

                  {/* Description with Expand Toggle */}
                  <div className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    <p className={!isExpanded && hasLongDesc ? 'line-clamp-2' : ''}>
                      {insight.insightDescription || 'توضیحی ثبت نشده است.'}
                    </p>
                    {hasLongDesc && (
                      <button
                        onClick={() => toggleExpand(insight.id)}
                        className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold mt-1 flex items-center gap-0.5 hover:underline"
                      >
                        {isExpanded ? <>نمایش کمتر <ChevronUp className="w-3 h-3" /></> : <>مشاهده کامل <ChevronDown className="w-3 h-3" /></>}
                      </button>
                    )}
                  </div>
                </div>

                {/* Card Action Recommendation Section */}
                <div className="px-5 py-3">
                  <div className="bg-indigo-50/70 dark:bg-indigo-950/30 rounded-2xl p-3.5 border border-indigo-100 dark:border-indigo-900/40 space-y-1">
                    <div className="flex items-center gap-1.5 text-indigo-700 dark:text-indigo-300 text-[11px] font-black">
                      <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                      اقدام توصیه‌شده سیستم:
                    </div>
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200 leading-relaxed pr-5">
                      {insight.recommendedAction || 'نیاز به بررسی توسط کارشناس مربوطه.'}
                    </p>
                  </div>
                </div>

                {/* Card Footer (Clean Action Bar) */}
                <div className="p-4 bg-slate-50/60 dark:bg-slate-800/30 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center mt-auto">
                  <span className="text-[10px] text-slate-400 font-mono" dir="ltr">
                    {new Date(insight.createdAt).toLocaleDateString('fa-IR')}
                  </span>

                  <div className="flex items-center gap-2">
                    {isApplied ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 bg-emerald-100 dark:bg-emerald-950/50 px-2.5 py-1 rounded-xl">
                        <Check className="w-3.5 h-3.5" /> انجام شد
                      </span>
                    ) : isDismissed ? (
                      <span className="text-[11px] font-bold text-slate-400 bg-slate-200 dark:bg-slate-800 px-2.5 py-1 rounded-xl">
                        رد شد
                      </span>
                    ) : (
                      <>
                        <button
                          onClick={() => handleStatusChange(insight.id, 'Applied')}
                          className="flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold px-3 py-1.5 rounded-xl shadow-sm transition"
                          title="ثبت به عنوان اقدام انجام‌شده"
                        >
                          <Check className="w-3.5 h-3.5" />
                          انجام شد
                        </button>
                        <button
                          onClick={() => handleStatusChange(insight.id, 'Dismissed')}
                          className="text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 p-1.5 rounded-xl transition"
                          title="رد کردن تحلیل"
                        >
                          <XCircle className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* COMPACT LIST / TABLE VIEW: Zero-Scroll, Maximum Density */
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 font-bold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="p-3.5">نوع و اولویت</th>
                  <th className="p-3.5">عنوان تحلیل</th>
                  <th className="p-3.5">اقدام پیشنهادی سیستم</th>
                  <th className="p-3.5 text-center">امتیاز</th>
                  <th className="p-3.5 text-center">تاریخ</th>
                  <th className="p-3.5 text-left">عملیات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {paginatedInsights.map(insight => {
                  const typeInfo = getTypeBadge(insight.insightType);
                  const priorityInfo = getPriorityBadge(insight.priority);
                  const isApplied = insight.status === 'Applied';
                  const isDismissed = insight.status === 'Dismissed';

                  return (
                    <tr key={insight.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition">
                      <td className="p-3.5 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${typeInfo.color}`}>
                            {typeInfo.label}
                          </span>
                          <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${priorityInfo.color}`}>
                            {priorityInfo.label}
                          </span>
                        </div>
                      </td>
                      <td className="p-3.5 font-bold text-slate-900 dark:text-slate-100 max-w-xs">
                        <div className="line-clamp-1">{insight.insightTitle}</div>
                        <div className="text-[11px] text-slate-400 font-normal line-clamp-1 mt-0.5">{insight.insightDescription}</div>
                      </td>
                      <td className="p-3.5 max-w-sm">
                        <div className="font-bold text-indigo-700 dark:text-indigo-300 line-clamp-1 flex items-center gap-1">
                          <Zap className="w-3 h-3 text-amber-500 flex-shrink-0" />
                          {insight.recommendedAction || '-'}
                        </div>
                      </td>
                      <td className="p-3.5 text-center font-mono font-bold text-slate-700 dark:text-slate-300">
                        {insight.score ?? '-'}
                      </td>
                      <td className="p-3.5 text-center font-mono text-[11px] text-slate-400 whitespace-nowrap" dir="ltr">
                        {new Date(insight.createdAt).toLocaleDateString('fa-IR')}
                      </td>
                      <td className="p-3.5 text-left whitespace-nowrap">
                        {isApplied ? (
                          <span className="text-[11px] font-bold text-emerald-600">انجام شد ✓</span>
                        ) : isDismissed ? (
                          <span className="text-[11px] text-slate-400">رد شد</span>
                        ) : (
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleStatusChange(insight.id, 'Applied')}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-[10px] shadow-sm transition"
                            >
                              انجام شد
                            </button>
                            <button
                              onClick={() => handleStatusChange(insight.id, 'Dismissed')}
                              className="px-2 py-1 text-slate-400 hover:text-rose-600 rounded-lg text-[10px] transition"
                            >
                              رد
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 6. Smart Pagination Bar (Eliminates excessive scrolling) */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row justify-between items-center gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-xs font-medium text-slate-500">
            نمایش <span className="font-bold text-slate-800 dark:text-slate-200 font-mono">{((currentPage - 1) * pageSize) + 1}</span> تا{' '}
            <span className="font-bold text-slate-800 dark:text-slate-200 font-mono">{Math.min(currentPage * pageSize, totalItems)}</span> از{' '}
            <span className="font-bold text-indigo-600 font-mono">{totalItems}</span> تحلیل
          </span>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
              title="صفحه قبل"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter(p => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
              .map((p, idx, arr) => {
                const prev = arr[idx - 1];
                return (
                  <span key={p} className="flex items-center">
                    {prev && p - prev > 1 && <span className="px-1 text-slate-400">...</span>}
                    <button
                      onClick={() => setCurrentPage(p)}
                      className={`w-8 h-8 rounded-xl text-xs font-mono font-bold transition ${
                        currentPage === p
                          ? 'bg-indigo-600 text-white shadow-sm'
                          : 'border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      {p}
                    </button>
                  </span>
                );
              })}

            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
              title="صفحه بعد"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
