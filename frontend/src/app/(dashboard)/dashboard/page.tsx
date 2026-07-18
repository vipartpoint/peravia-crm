'use client';

import React, { useState, useEffect } from 'react';
import { api } from '@/services/api';
import { 
  Calendar, BrainCircuit, Settings2, GripVertical, Eye, EyeOff, RotateCcw, X, 
  Banknote, Users, ShoppingCart, Percent, Box, CheckCircle
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useRouter } from 'next/navigation';
import { RecentActivitiesWidget } from '@/components/widgets/RecentActivitiesWidget';
import { motion, AnimatePresence, Reorder } from 'framer-motion';

// Executive Components
import { ExecutiveSummaryRow, SummaryMetric } from '@/components/dashboard/ExecutiveSummaryRow';
import { SalesAnalytics } from '@/components/dashboard/SalesAnalytics';
import { RevenueIntelligence } from '@/components/dashboard/RevenueIntelligence';
import { CustomerIntelligence } from '@/components/dashboard/CustomerIntelligence';
import { InventoryIntelligence } from '@/components/dashboard/InventoryIntelligence';
import { AiInsightsCenter } from '@/components/dashboard/AiInsightsCenter';
import { TeamPerformance } from '@/components/dashboard/TeamPerformance';
import { ExecutiveAlerts } from '@/components/dashboard/ExecutiveAlerts';
import { AiAdoptionCoach } from '@/components/ui/AiAdoptionCoach';

const DEFAULT_LAYOUT = [
  { id: 'greeting', title: 'خوش‌آمدگویی', visible: true, span: 'col-span-full' },
  { id: 'summary', title: 'خلاصه وضعیت (KPI)', visible: true, span: 'col-span-full' },
  { id: 'ai_insights', title: 'مرکز هوش مصنوعی', visible: true, span: 'col-span-full' },
  { id: 'sales_analytics', title: 'تحلیل فروش و سفارشات', visible: true, span: 'col-span-full' },
  { id: 'revenue', title: 'هوش درآمدی', visible: true, span: 'col-span-full' },
  { id: 'customer', title: 'هوش مشتری (ارزش و ریزش)', visible: true, span: 'col-span-full xl:col-span-2' },
  { id: 'inventory', title: 'موجودی و انبار', visible: true, span: 'col-span-full md:col-span-1 xl:col-span-1' },
  { id: 'team', title: 'عملکرد تیم فروش', visible: true, span: 'col-span-full md:col-span-1 xl:col-span-1' },
  { id: 'alerts', title: 'هشدارهای فوری', visible: true, span: 'col-span-full md:col-span-1 xl:col-span-1' },
  { id: 'activity', title: 'فید مدیران', visible: true, span: 'col-span-full md:col-span-1 xl:col-span-1' },
];

const TIME_FILTERS = [
  { id: 'today', label: 'امروز' },
  { id: '7days', label: '۷ روز اخیر' },
  { id: '30days', label: '۳۰ روز اخیر' },
  { id: '3months', label: '۳ ماه اخیر' },
  { id: '6months', label: '۶ ماه اخیر' },
  { id: 'year', label: 'امسال' }
];

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [timeFilter, setTimeFilter] = useState('30days');
  const [layout, setLayout] = useState(DEFAULT_LAYOUT);
  const [isSettingsOpen, setSettingsOpen] = useState(false);
  const router = useRouter();

  // Data States
  const [overview, setOverview] = useState<any>({});
  const [funnelData, setFunnelData] = useState<any[]>([]);
  const [salesData, setSalesData] = useState<any>(null);
  const [insights, setInsights] = useState<any>(null);

  useEffect(() => {
    const savedLayout = localStorage.getItem('dashboardExecutiveLayoutV1');
    if (savedLayout) {
      try { setLayout(JSON.parse(savedLayout)); } catch (e) {}
    }
    const savedTime = localStorage.getItem('dashboardTimeFilter');
    if (savedTime) setTimeFilter(savedTime);
    
    fetchDashboardData();
  }, [timeFilter]); // Re-fetch if time filter changes

  const saveLayout = (newLayout: typeof DEFAULT_LAYOUT) => {
    setLayout(newLayout);
    localStorage.setItem('dashboardExecutiveLayoutV1', JSON.stringify(newLayout));
  };

  const handleTimeChange = (id: string) => {
    setTimeFilter(id);
    localStorage.setItem('dashboardTimeFilter', id);
  };

  const toggleVisible = (id: string) => {
    saveLayout(layout.map(w => w.id === id ? { ...w, visible: !w.visible } : w));
  };

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [ovRes, funRes, salesRes, insRes] = await Promise.all([
        api.get('/dashboard/overview').catch(() => ({})),
        api.get('/dashboard/funnel').catch(() => []),
        api.get('/dashboard/sales').catch(() => ({})),
        api.get('/dashboard/insights').catch(() => ({}))
      ]);
      setOverview(ovRes || {});
      setFunnelData(Array.isArray(funRes) ? funRes : []);
      setSalesData(salesRes || {});
      setInsights(insRes || {});
    } catch (e: any) {
    } finally {
      setLoading(false);
    }
  };

  const currentHour = new Date().getHours();
  const greeting = currentHour < 12 ? 'صبح بخیر' : currentHour < 18 ? 'عصر بخیر' : 'شب بخیر';
  const persianDate = new Intl.DateTimeFormat('fa-IR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }).format(new Date());

  // --- Mocks / Derived Data to populate charts since APIs might lack full executive granularity ---
  
  const summaryMetrics: SummaryMetric[] = [
    { title: 'فروش کل', value: (overview.salesThisMonth || 0).toLocaleString('fa-IR'), percentageChange: 12.5, trend: 'up', icon: Banknote, chartData: [{value:10}, {value:15}, {value:12}, {value:20}] },
    { title: 'مشتریان جدید', value: overview.activeCustomers || 0, percentageChange: 4.2, trend: 'up', icon: Users, chartData: [{value:5}, {value:8}, {value:12}, {value:10}] },
    { title: 'نرخ تبدیل سرنخ', value: '۱۸.۵٪', percentageChange: -2.1, trend: 'down', icon: Percent },
    { title: 'سفارشات', value: overview.ordersThisMonth || 0, trend: 'neutral', statusLabel: 'در مسیر رشد', icon: ShoppingCart },
    { title: 'وصول مطالبات', value: '۸۵٪', percentageChange: 5.0, trend: 'up', icon: CheckCircle },
    { title: 'کالای رو به اتمام', value: 2, trend: 'down', statusLabel: 'نیازمند توجه', icon: Box }
  ];

  const mockSalesTrend = [
    { name: 'فروردین', sales: 120000000, orders: 12 },
    { name: 'اردیبهشت', sales: 150000000, orders: 15 },
    { name: 'خرداد', sales: 210000000, orders: 22 },
    { name: 'تیر', sales: 180000000, orders: 18 },
    { name: 'مرداد', sales: 250000000, orders: 25 },
    { name: 'شهریور', sales: 290000000, orders: 28 },
  ];

  const mockFunnel = funnelData.length > 0 ? funnelData : [
    { name: 'مظنون', value: 120, fill: '#94A3B8' },
    { name: 'محتمل', value: 100, fill: '#93C5FD' },
    { name: 'تحلیل', value: 80, fill: '#818CF8' },
    { name: 'مذاکره', value: 60, fill: '#FBBF24' },
    { name: 'بستن', value: 45, fill: '#FDBA74' },
    { name: 'سفارش', value: 30, fill: '#5EEAD4' },
    { name: 'پرداخت', value: 18, fill: '#34D399' }
  ];

  const mockRevByProduct = [
    { name: 'روغن هیدرولیک', value: 150000000 },
    { name: 'روغن موتور سنگین', value: 95000000 },
    { name: 'گریس نسوز', value: 45000000 },
    { name: 'روغن دنده', value: 30000000 }
  ];

  const mockRevByTerritory = [
    { name: 'تهران', value: 200000000 },
    { name: 'اصفهان', value: 85000000 },
    { name: 'خراسان', value: 60000000 }
  ];

  const mockLeadSources = [
    { name: 'جستجوی گوگل', value: 45 },
    { name: 'شبکه‌های اجتماعی', value: 25 },
    { name: 'ارجاع همکاران', value: 20 },
    { name: 'تماس مستقیم', value: 10 }
  ];

  const mockTopCustomers = [
    { id: '1', name: 'شرکت فولاد مبارکه', value: '۲.۵ میلیارد' },
    { id: '2', name: 'پتروشیمی جم', value: '۱.۸ میلیارد' },
    { id: '3', name: 'گروه صنعتی مپنا', value: '۱.۲ میلیارد' }
  ];

  const mockChurnRisks = [
    { id: '4', name: 'کارخانه سیمان آبیک', value: 'عدم خرید ۶۰ روز' },
    { id: '5', name: 'شرکت لبنیات میهن', value: 'افت سفارش ۴۰٪' }
  ];

  const mockLowStock = [
    { id: '1', name: 'روغن هیدرولیک X-100', stock: 5, minStock: 20, status: 'critical' as const },
    { id: '2', name: 'گریس نسوز صنعتی', stock: 12, minStock: 15, status: 'low' as const }
  ];

  const mockAiInsights = [
    { id: '1', type: 'opportunity', title: 'احتمال بالای فروش مجدد', explanation: '۵ مشتری در هفته گذشته پیش‌فاکتور دریافت کرده‌اند اما هنوز پیگیری نشده‌اند.', priority: 'high', suggestedAction: 'ارسال به تیم پیگیری' },
    { id: '2', type: 'risk', title: 'خطر ریزش مشتری کلیدی', explanation: 'خرید شرکت فولاد خوزستان در ماه جاری ۴۰٪ نسبت به میانگین کاهش یافته است.', priority: 'high', suggestedAction: 'بررسی با مدیر حساب' },
    { id: '3', type: 'prediction', title: 'پیش‌بینی اتمام موجودی', explanation: 'موجودی روغن هیدرولیک با نرخ مصرف فعلی، ظرف ۷ روز آینده به پایان می‌رسد.', priority: 'medium', suggestedAction: 'ثبت سفارش تولید' },
    { id: '4', type: 'action', title: 'بهینه‌سازی قیف فروش', explanation: 'بیشترین ریزش سرنخ‌ها در مرحله "مذاکره" اتفاق افتاده است.', priority: 'low', suggestedAction: 'بررسی دلایل رد مذاکره' }
  ];

  const mockTeam = [
    { id: '1', name: 'علی رضایی', sales: 450000000, target: 500000000, conversionRate: 22 },
    { id: '2', name: 'مریم احمدی', sales: 320000000, target: 300000000, conversionRate: 18 },
    { id: '3', name: 'سارا کریمی', sales: 180000000, target: 250000000, conversionRate: 15 }
  ];

  const mockAlerts = [
    { id: '1', type: 'bounced_cheque', title: 'چک برگشتی', description: 'چک شماره ۱۴۵۲۶ شرکت آلفا به مبلغ ۵۰ میلیون برگشت خورد.', time: '۲ ساعت پیش' },
    { id: '2', type: 'overdue_receivable', title: 'سررسید فاکتور', description: 'فاکتور شماره ۱۰۰۴ به مدت ۱۵ روز تأخیر در پرداخت دارد.', time: '۵ ساعت پیش' },
    { id: '3', type: 'pending_approval', title: 'سفارش در انتظار', description: 'سفارش جدید گروه مپنا نیازمند تأیید مدیریت است.', time: 'امروز ۰۹:۰۰' }
  ];

  // --- Render Widgets ---

  const renderWidget = (id: string) => {
    switch (id) {
      case 'greeting':
        return (
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-2xl shadow-sm dark:shadow-lg border border-slate-100 dark:border-slate-800">
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-800 dark:text-white tracking-tight flex items-center gap-3">
                {greeting}، ادمین عزیز! 👋
              </h1>
              <p className="text-slate-500 dark:text-slate-400 text-sm font-medium mt-2 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-emerald-500" /> گزارش زنده وضعیت کسب‌وکار تا {persianDate}
              </p>
            </div>
            <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800/50 p-1.5 rounded-xl border border-slate-100 dark:border-slate-700/50 overflow-x-auto custom-scrollbar">
              {TIME_FILTERS.map(f => (
                <button 
                  key={f.id} 
                  onClick={() => handleTimeChange(f.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors ${timeFilter === f.id ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500 dark:text-white shadow-sm border border-emerald-100 dark:border-transparent' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 hover:bg-white dark:hover:text-white dark:hover:bg-slate-700/50'}`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>
        );
      case 'summary':
        return <ExecutiveSummaryRow metrics={summaryMetrics} loading={loading} />;
      case 'ai_insights':
        return <AiInsightsCenter insights={mockAiInsights as any} loading={loading} />;
      case 'sales_analytics':
        return <SalesAnalytics salesData={mockSalesTrend} ordersData={mockSalesTrend} funnelData={mockFunnel} loading={loading} />;
      case 'revenue':
        return <RevenueIntelligence revenueByProduct={mockRevByProduct} revenueByTerritory={mockRevByTerritory} leadSources={mockLeadSources} loading={loading} />;
      case 'customer':
        return <CustomerIntelligence topCustomers={mockTopCustomers} churnRisks={mockChurnRisks} loading={loading} />;
      case 'inventory':
        return <InventoryIntelligence lowStockItems={mockLowStock as any} loading={loading} />;
      case 'team':
        return <TeamPerformance members={mockTeam} loading={loading} />;
      case 'alerts':
        return <ExecutiveAlerts alerts={mockAlerts as any} loading={loading} />;
      case 'activity':
        return <RecentActivitiesWidget />;
      default: return null;
    }
  };

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto pb-10">
      <div className="flex justify-between items-center mb-2">
        <h1 className="text-xl font-black text-slate-800 dark:text-white">پنل مدیریت اجرایی (Executive Dashboard)</h1>
        <div className="flex items-center gap-2">
          <Button data-tour="tour-ai-copilot" variant="outline" size="sm" onClick={() => window.dispatchEvent(new CustomEvent('ai-copilot-open', { detail: { context: 'dashboard' } }))}>
            <BrainCircuit className="w-4 h-4 ml-2 text-primary" /> دستیار هوشمند
          </Button>
          <Button variant="outline" size="sm" onClick={() => setSettingsOpen(true)}>
            <Settings2 className="w-4 h-4 ml-2" /> شخصی‌سازی
          </Button>
        </div>
      </div>

      <AiAdoptionCoach />

      <Reorder.Group axis="y" values={layout} onReorder={saveLayout} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 auto-rows-max">
        {layout.filter(w => w.visible).map(w => (
          <Reorder.Item key={w.id} value={w} className={`${w.span} cursor-grab active:cursor-grabbing relative group`} style={{ gridColumn: w.span.includes('col-span-full') ? '1 / -1' : 'auto' }}>
            {renderWidget(w.id)}
            {w.id !== 'greeting' && (
              <div className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 bg-white dark:bg-slate-900/80 backdrop-blur-sm rounded-lg p-1 shadow-sm border border-slate-200 dark:border-slate-700">
                <div className="p-1 cursor-grab active:cursor-grabbing text-slate-500 dark:text-slate-400 hover:text-primary transition-colors"><GripVertical className="w-3.5 h-3.5" /></div>
              </div>
            )}
          </Reorder.Item>
        ))}
      </Reorder.Group>

      <AnimatePresence>
        {isSettingsOpen && (
          <>
            <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50" onClick={() => setSettingsOpen(false)} />
            <motion.div initial={{opacity:0, scale:0.95}} animate={{opacity:1, scale:1}} exit={{opacity:0, scale:0.95}} className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-slate-900 rounded-xl shadow-2xl w-[90%] max-w-md z-50 p-6 border border-slate-100 dark:border-slate-800">
              <div className="flex justify-between items-center mb-6 border-b dark:border-slate-800 pb-4">
                <h2 className="text-lg font-bold text-slate-800 dark:text-white">مدیریت چیدمان داشبورد</h2>
                <button onClick={() => setSettingsOpen(false)} className="p-1 rounded hover:bg-slate-100 dark:bg-slate-800"><X className="w-5 h-5 text-slate-400" /></button>
              </div>
              
              <div className="space-y-2 mb-6 max-h-96 overflow-y-auto pr-2 custom-scrollbar">
                {layout.filter(w => w.id !== 'greeting').map((w) => (
                  <div key={w.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg">
                    <span className={`text-sm font-bold ${w.visible ? 'text-slate-800 dark:text-slate-200' : 'text-slate-400 dark:text-slate-500'}`}>{w.title}</span>
                    <button onClick={() => toggleVisible(w.id)} className={`p-1.5 rounded-md transition-colors ${w.visible ? 'bg-primary/10 text-primary hover:bg-primary/20' : 'bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-300 dark:hover:bg-slate-600'}`}>
                      {w.visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    </button>
                  </div>
                ))}
              </div>

              <div className="flex gap-3 justify-between pt-4 border-t dark:border-slate-800">
                <Button variant="outline" size="sm" onClick={() => { saveLayout(DEFAULT_LAYOUT); setSettingsOpen(false); }} className="text-slate-500 dark:text-slate-400"><RotateCcw className="w-3.5 h-3.5 ml-1.5" /> بازگردانی چیدمان</Button>
                <Button variant="primary" size="sm" onClick={() => setSettingsOpen(false)}>ذخیره تغییرات</Button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
