'use client';
import { useState, useEffect } from 'react';
import { api } from '@/services/api';
import {
  TrendingUp, TrendingDown, Users, ShoppingBag, MapPin, Calendar,
  AlertTriangle, CheckCircle, Clock, Award, DollarSign, Target,
  RefreshCw, UserCheck, Flame, ArrowUpRight, ArrowDownRight, Layers
} from 'lucide-react';

interface Props {
  initialTerritoryId?: string;
}

export default function SalesIntelligenceDashboard({ initialTerritoryId }: Props) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [productTab, setProductTab] = useState<'top' | 'increasing' | 'declining'>('top');
  const [geoTab, setGeoTab] = useState<'territories' | 'customers'>('territories');

  const fetchIntelligence = async () => {
    setLoading(true);
    try {
      const url = initialTerritoryId ? `/reports/intelligence?territoryId=${initialTerritoryId}` : '/reports/intelligence';
      const res = await api.get(url);
      setData(res);
    } catch (err) {
      console.error('Failed to load sales intelligence:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIntelligence();
  }, [initialTerritoryId]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-16 space-y-4">
        <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-slate-500 font-medium text-sm">در حال بارگذاری تحلیل هوشمند و شاخص‌های فروش...</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="bg-white dark:bg-slate-900 p-12 rounded-2xl border border-slate-200 dark:border-slate-800 text-center">
        <p className="text-slate-500 mb-4">اطلاعات تحلیلی یافت نشد یا دسترسی مجاز نیست.</p>
        <button onClick={fetchIntelligence} className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-bold">
          تلاش مجدد
        </button>
      </div>
    );
  }

  const {
    monthlySales,
    topProducts,
    topCustomers,
    topTerritories,
    quarterComparison,
    increasingDemand,
    decliningDemand,
    yoyComparison,
    customerReorderPrediction,
    churnAndRetention,
    leadConversion,
    salesRepsPerformance,
    commissionsSummary
  } = data;

  return (
    <div className="space-y-6">
      {/* 1. Header Toolbar */}
      <div className="flex justify-between items-center bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 text-white p-6 rounded-3xl shadow-lg border border-indigo-700/50">
        <div>
          <span className="text-xs font-black tracking-wider uppercase px-3 py-1 bg-indigo-500/30 text-indigo-200 rounded-full border border-indigo-400/30">
            سیستم تحلیل هوشمند کسب‌وکار
          </span>
          <h2 className="text-2xl font-black mt-2 flex items-center gap-2">
            <Flame className="w-6 h-6 text-amber-400" />
            داشبورد تحلیلی و ۱۳ شاخص کلیدی فروش (KPI & Intelligence)
          </h2>
          <p className="text-indigo-200 text-xs mt-1">
            مشاهده سریع و بدون واسطه روندهای رشد، رفتار خرید مشتریان، عملکرد کالاها و ارزیابی تیم فروش
          </p>
        </div>
        <button
          onClick={fetchIntelligence}
          className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-4 py-2.5 rounded-2xl text-xs font-bold transition border border-white/10 shadow-sm"
        >
          <RefreshCw className="w-4 h-4" />
          به‌روزرسانی شاخص‌ها
        </button>
      </div>

      {/* 2. Top Metric Cards (Key KPI Highlights) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {/* Metric 1: Monthly Sales */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex justify-between items-start mb-2">
            <span className="text-xs font-bold text-slate-500">فروش ماه جاری</span>
            <span className={`flex items-center text-xs font-bold px-2 py-0.5 rounded-full ${monthlySales.growthPercent >= 0 ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30' : 'bg-rose-50 text-rose-600 dark:bg-rose-950/30'}`}>
              {monthlySales.growthPercent >= 0 ? <ArrowUpRight className="w-3 h-3 ml-0.5" /> : <ArrowDownRight className="w-3 h-3 ml-0.5" />}
              {Math.abs(monthlySales.growthPercent)}% ماه قبل
            </span>
          </div>
          <div className="text-xl font-black text-slate-900 dark:text-white">
            {Number(monthlySales.currentMonthSales).toLocaleString('fa-IR')} <span className="text-[10px] text-slate-400">ریال</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1 font-medium">
            تعداد فاکتور: {monthlySales.ordersCount}
          </div>
        </div>

        {/* Metric 4: Quarter-over-Quarter (Q-o-Q) */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex justify-between items-start mb-2">
            <span className="text-xs font-bold text-slate-500">فروش ۳ ماهه (فصلی)</span>
            <span className={`flex items-center text-xs font-bold px-2 py-0.5 rounded-full ${quarterComparison.growthPercent >= 0 ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30' : 'bg-rose-50 text-rose-600 dark:bg-rose-950/30'}`}>
              {quarterComparison.growthPercent >= 0 ? <ArrowUpRight className="w-3 h-3 ml-0.5" /> : <ArrowDownRight className="w-3 h-3 ml-0.5" />}
              {Math.abs(quarterComparison.growthPercent)}% نسبت به ۳ ماه قبل
            </span>
          </div>
          <div className="text-xl font-black text-indigo-600 dark:text-indigo-400">
            {Number(quarterComparison.currentQuarterSales).toLocaleString('fa-IR')} <span className="text-[10px] text-slate-400">ریال</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1 font-medium">
            سفارشات فصل: {quarterComparison.currentQuarterOrders}
          </div>
        </div>

        {/* Metric 7: Year-over-Year (YoY) */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex justify-between items-start mb-2">
            <span className="text-xs font-bold text-slate-500">رشد نسبت به پارسال (YoY)</span>
            <Calendar className="w-4 h-4 text-purple-500" />
          </div>
          <div className={`text-xl font-black ${yoyComparison.growthPercent >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
            {yoyComparison.growthPercent >= 0 ? `+${yoyComparison.growthPercent}%` : `${yoyComparison.growthPercent}%`}
          </div>
          <div className="text-[11px] text-slate-500 mt-1 font-medium">
            ماه مشابه سال قبل: {Number(yoyComparison.lastYearSameMonthSales).toLocaleString('fa-IR')} <span className="text-[9px]">ریال</span>
          </div>
        </div>

        {/* Metric 9 & 10: Churn & Retention */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex justify-between items-start mb-2">
            <span className="text-xs font-bold text-slate-500">نگهداشت و ریزش</span>
            <UserCheck className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-xl font-black text-slate-900 dark:text-white flex items-baseline gap-2">
            <span className="text-emerald-600 font-black">{churnAndRetention.retentionRate}%</span>
            <span className="text-xs text-rose-500 font-bold">ریزش: {churnAndRetention.churnRate}%</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1 font-medium">
            مشتریان مکرر: {churnAndRetention.repeatCustomerCount} نفر ({churnAndRetention.repeatPurchaseRate}%)
          </div>
        </div>

        {/* Metric 11: Lead Conversion */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex justify-between items-start mb-2">
            <span className="text-xs font-bold text-slate-500">تبدیل سرنخ به مشتری</span>
            <Target className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-xl font-black text-indigo-600 dark:text-indigo-400">
            {leadConversion.conversionRate}%
          </div>
          <div className="text-[11px] text-slate-500 mt-1 font-medium">
            {leadConversion.convertedLeads} تبدیل از {leadConversion.totalLeads} لید ثبت‌شده
          </div>
        </div>

        {/* Metric 8: Reorder Cycle */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex justify-between items-start mb-2">
            <span className="text-xs font-bold text-slate-500">میانگین چرخه خرید</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-xl font-black text-amber-600 dark:text-amber-400">
            {customerReorderPrediction.globalAvgReorderDays} <span className="text-xs font-normal text-slate-500">روز</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1 font-medium">
            میانگین فاصله بین سفارشات متوالی
          </div>
        </div>
      </div>

      {/* 3. Products Section: Top Products + Demand Trends (Increasing vs Declining) */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div>
            <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-indigo-600" />
              تحلیل کالایی: بیشترین فروش و تغییرات تقاضای محصولات
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">شناسایی فوری کالاهای پیشران، پرتقاضا و کالاهای نیازمند بازنگری فروش</p>
          </div>
          <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl">
            <button
              onClick={() => setProductTab('top')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${productTab === 'top' ? 'bg-white dark:bg-slate-900 text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
            >
              کالاهای پرفروش (Top)
            </button>
            <button
              onClick={() => setProductTab('increasing')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${productTab === 'increasing' ? 'bg-white dark:bg-slate-900 text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
            >
              رشد تقاضا (+ Demand)
            </button>
            <button
              onClick={() => setProductTab('declining')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${productTab === 'declining' ? 'bg-white dark:bg-slate-900 text-rose-600 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
            >
              افت تقاضا (- Demand)
            </button>
          </div>
        </div>

        {/* Tab 1: Top Products */}
        {productTab === 'top' && (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 font-bold border-b border-slate-100 dark:border-slate-800">
                <tr>
                  <th className="p-3">رتبه</th>
                  <th className="p-3">نام محصول</th>
                  <th className="p-3">برند / شناسه</th>
                  <th className="p-3 text-center">تیراژ فروش</th>
                  <th className="p-3 text-left">مجموع فروش ریالی</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {topProducts.length === 0 ? (
                  <tr><td colSpan={5} className="p-6 text-center text-slate-400">سفارشی در بازه اخیر ثبت نشده است</td></tr>
                ) : (
                  topProducts.map((item: any, idx: number) => (
                    <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition">
                      <td className="p-3 font-mono font-bold text-slate-400">#{idx + 1}</td>
                      <td className="p-3 font-bold text-slate-900 dark:text-white">{item.product.name}</td>
                      <td className="p-3 text-slate-500">{item.product.brand || '-'} / <span className="font-mono text-[10px]">{item.product.sku}</span></td>
                      <td className="p-3 text-center font-bold text-indigo-600">{Number(item.totalQty).toLocaleString('fa-IR')} عدد</td>
                      <td className="p-3 text-left font-bold text-emerald-600 font-mono text-sm">{Number(item.totalRevenue).toLocaleString('fa-IR')} ریال</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Tab 2: Increasing Demand */}
        {productTab === 'increasing' && (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-300 font-bold border-b border-emerald-100 dark:border-emerald-900/30">
                <tr>
                  <th className="p-3">محصول</th>
                  <th className="p-3">برند</th>
                  <th className="p-3 text-center">تیراژ دوره قبل</th>
                  <th className="p-3 text-center">تیراژ دوره جاری</th>
                  <th className="p-3 text-center">افزایش تیراژ</th>
                  <th className="p-3 text-left">نرخ رشد تقاضا</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {increasingDemand.length === 0 ? (
                  <tr><td colSpan={6} className="p-6 text-center text-slate-400">محصولی با افزایش تقاضا یافت نشد</td></tr>
                ) : (
                  increasingDemand.map((item: any, idx: number) => (
                    <tr key={idx} className="hover:bg-emerald-50/20 transition">
                      <td className="p-3 font-bold text-slate-900 dark:text-white">{item.name}</td>
                      <td className="p-3 text-slate-500">{item.brand}</td>
                      <td className="p-3 text-center text-slate-400 font-mono">{item.prevQty}</td>
                      <td className="p-3 text-center font-bold text-slate-800 dark:text-slate-200 font-mono">{item.currQty}</td>
                      <td className="p-3 text-center font-bold text-emerald-600 font-mono">+{item.deltaQty}</td>
                      <td className="p-3 text-left">
                        <span className="inline-flex items-center gap-1 font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 px-2.5 py-1 rounded-full text-xs">
                          <TrendingUp className="w-3.5 h-3.5" /> +{item.growthRate}%
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Tab 3: Declining Demand */}
        {productTab === 'declining' && (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-rose-50/50 dark:bg-rose-950/20 text-rose-800 dark:text-rose-300 font-bold border-b border-rose-100 dark:border-rose-900/30">
                <tr>
                  <th className="p-3">محصول</th>
                  <th className="p-3">برند</th>
                  <th className="p-3 text-center">تیراژ دوره قبل</th>
                  <th className="p-3 text-center">تیراژ دوره جاری</th>
                  <th className="p-3 text-center">کاهش تیراژ</th>
                  <th className="p-3 text-left">نرخ افت تقاضا</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {decliningDemand.length === 0 ? (
                  <tr><td colSpan={6} className="p-6 text-center text-slate-400">محصولی با افت تقاضا ثبت نشده است</td></tr>
                ) : (
                  decliningDemand.map((item: any, idx: number) => (
                    <tr key={idx} className="hover:bg-rose-50/20 transition">
                      <td className="p-3 font-bold text-slate-900 dark:text-white">{item.name}</td>
                      <td className="p-3 text-slate-500">{item.brand}</td>
                      <td className="p-3 text-center text-slate-400 font-mono">{item.prevQty}</td>
                      <td className="p-3 text-center font-bold text-slate-800 dark:text-slate-200 font-mono">{item.currQty}</td>
                      <td className="p-3 text-center font-bold text-rose-600 font-mono">{item.deltaQty}</td>
                      <td className="p-3 text-left">
                        <span className="inline-flex items-center gap-1 font-bold text-rose-600 bg-rose-50 dark:bg-rose-950/30 px-2.5 py-1 rounded-full text-xs">
                          <TrendingDown className="w-3.5 h-3.5" /> {item.growthRate}%
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 4. Geography & Top Customers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Territories (Provinces/Cities) */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
            <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
              <MapPin className="w-5 h-5 text-indigo-600" />
              بیشترین فروش بر اساس استان و مناطق
            </h3>
            <span className="text-xs text-slate-400">۱۰ منطقه برتر</span>
          </div>
          <div className="space-y-2.5">
            {topTerritories.length === 0 ? (
              <p className="text-center text-xs text-slate-400 py-6">اطلاعات منطقه‌ای یافت نشد</p>
            ) : (
              topTerritories.map((t: any, idx: number) => (
                <div key={idx} className="flex justify-between items-center p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 hover:bg-indigo-50/50 transition">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-300 font-bold text-xs flex items-center justify-center">
                      {idx + 1}
                    </span>
                    <div>
                      <div className="font-bold text-slate-800 dark:text-slate-100 text-xs">{t.name}</div>
                      <div className="text-[10px] text-slate-400">نوع: {t.type} | تعداد سفارش: {t.orderCount}</div>
                    </div>
                  </div>
                  <div className="font-bold text-emerald-600 text-xs font-mono">
                    {Number(t.totalSales).toLocaleString('fa-IR')} <span className="text-[9px]">ریال</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Top Customers */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
            <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-emerald-600" />
              بیشترین خرید مشتریان (Top Customers)
            </h3>
            <span className="text-xs text-slate-400">۱۰ مشتری اول</span>
          </div>
          <div className="space-y-2.5">
            {topCustomers.length === 0 ? (
              <p className="text-center text-xs text-slate-400 py-6">مشتری با سفارش قطعی یافت نشد</p>
            ) : (
              topCustomers.map((c: any, idx: number) => (
                <div key={idx} className="flex justify-between items-center p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 hover:bg-emerald-50/50 transition">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-300 font-bold text-xs flex items-center justify-center">
                      {idx + 1}
                    </span>
                    <div>
                      <div className="font-bold text-slate-800 dark:text-slate-100 text-xs">{c.name}</div>
                      <div className="text-[10px] text-slate-400">منطقه: {c.territoryName} | تعداد فاکتور: {c.orderCount}</div>
                    </div>
                  </div>
                  <div className="font-bold text-indigo-600 text-xs font-mono">
                    {Number(c.totalSpent).toLocaleString('fa-IR')} <span className="text-[9px]">ریال</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* 5. Customer Reorder Prediction (تعیین میانگین زمان احتمالی خرید هر مشتری) */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
          <div>
            <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Clock className="w-5 h-5 text-amber-500" />
              تعیین میانگین زمان احتمالی خرید هر مشتری (سیستم پیش‌بینی و هشدار پیگیری)
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              محاسبه هوشمند بر اساس فواصل خریدهای قبلی مشتری برای پیش‌بینی زمان سفارش بعدی و جلوگیری از ریزش
            </p>
          </div>
          <div className="text-xs font-bold text-slate-600 dark:text-slate-300 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 px-3 py-1.5 rounded-xl">
            میانگین دوره تکرار خرید در شرکت: <span className="text-amber-600 font-black">{customerReorderPrediction.globalAvgReorderDays} روز</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 font-bold border-b border-slate-100 dark:border-slate-800">
              <tr>
                <th className="p-3">نام مشتری</th>
                <th className="p-3 text-center">تعداد سفارشات</th>
                <th className="p-3 text-center">چرخه معمول خرید</th>
                <th className="p-3 text-center">روزهای گذشته از آخرین خرید</th>
                <th className="p-3 text-center">تاریخ احتمالی سفارش بعدی</th>
                <th className="p-3 text-left">وضعیت و اولویت تماس</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {customerReorderPrediction.predictions.length === 0 ? (
                <tr><td colSpan={6} className="p-6 text-center text-slate-400">مشتری با سابقه حداقل ۲ سفارش برای تحلیل زمانی ثبت نشده است</td></tr>
              ) : (
                customerReorderPrediction.predictions.map((pred: any, idx: number) => {
                  const isOverdue = pred.status === 'OVERDUE';
                  const isDueSoon = pred.status === 'DUE_SOON';
                  return (
                    <tr key={idx} className={`transition ${isOverdue ? 'bg-rose-50/30 dark:bg-rose-950/10' : (isDueSoon ? 'bg-amber-50/30 dark:bg-amber-950/10' : '')}`}>
                      <td className="p-3 font-bold text-slate-900 dark:text-white">{pred.customerName}</td>
                      <td className="p-3 text-center font-mono font-bold text-slate-600">{pred.orderCount} بار</td>
                      <td className="p-3 text-center font-bold text-indigo-600 font-mono">هر {pred.avgIntervalDays} روز</td>
                      <td className="p-3 text-center font-bold font-mono text-slate-700 dark:text-slate-300">
                        {pred.daysSinceLastOrder} روز قبل
                      </td>
                      <td className="p-3 text-center font-mono text-slate-600" dir="ltr">
                        {new Date(pred.predictedNextDate).toLocaleDateString('fa-IR')}
                      </td>
                      <td className="p-3 text-left">
                        {isOverdue ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 bg-rose-100 dark:bg-rose-950/50 px-2.5 py-1 rounded-full">
                            <AlertTriangle className="w-3.5 h-3.5" /> تاخیر در خرید (تماس فوری)
                          </span>
                        ) : isDueSoon ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-100 dark:bg-amber-950/50 px-2.5 py-1 rounded-full">
                            <Clock className="w-3.5 h-3.5" /> در آستانه خرید مجدد
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-100 dark:bg-emerald-950/50 px-2.5 py-1 rounded-full">
                            <CheckCircle className="w-3.5 h-3.5" /> چرخه عادی
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 6. Sales Reps Performance & Commissions Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales Reps Performance (Metric 12) */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
            <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Award className="w-5 h-5 text-indigo-600" />
              ارزیابی عملکرد کارشناسان فروش
            </h3>
            <span className="text-xs text-slate-400">براساس نمره وزنی KPI و فروش</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 font-bold border-b border-slate-100 dark:border-slate-800">
                <tr>
                  <th className="p-3">کارشناس</th>
                  <th className="p-3">منطقه</th>
                  <th className="p-3 text-center">تعداد سفارشات</th>
                  <th className="p-3 text-center">مبلغ فروش</th>
                  <th className="p-3 text-center">تحقق هدف فروش</th>
                  <th className="p-3 text-left">نمره کل وزنی KPI</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {salesRepsPerformance.length === 0 ? (
                  <tr><td colSpan={6} className="p-6 text-center text-slate-400">کارشناس فعالی ثبت نشده است</td></tr>
                ) : (
                  salesRepsPerformance.map((rep: any, idx: number) => (
                    <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition">
                      <td className="p-3 font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-700 text-[10px] flex items-center justify-center font-mono">
                          {idx + 1}
                        </span>
                        {rep.username}
                      </td>
                      <td className="p-3 text-slate-500">{rep.territory}</td>
                      <td className="p-3 text-center font-mono font-bold text-slate-700 dark:text-slate-300">{rep.ordersCount}</td>
                      <td className="p-3 text-center font-mono font-bold text-emerald-600">{Number(rep.totalSales).toLocaleString('fa-IR')} ریال</td>
                      <td className="p-3 text-center">
                        <span className="font-bold text-indigo-600">{rep.salesAchievementPercent}%</span>
                      </td>
                      <td className="p-3 text-left">
                        <span className="font-black text-xs px-2.5 py-1 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                          {rep.kpiScore} از ۱۰۰
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Commissions Summary (Metric 13) */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">
              <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-emerald-600" />
                خلاصه پورسانت‌ها
              </h3>
              <span className="text-[10px] text-slate-400">محاسبات سیستمی</span>
            </div>
            <div className="space-y-3">
              <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/30">
                <span className="text-[11px] font-bold text-emerald-800 dark:text-emerald-300 block mb-1">پورسانت‌های تایید/پرداخت‌شده</span>
                <span className="text-lg font-black text-emerald-700 dark:text-emerald-200">
                  {Number(commissionsSummary.approvedAmount).toLocaleString('fa-IR')} <span className="text-xs font-normal">ریال</span>
                </span>
              </div>
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                <span className="text-[11px] font-bold text-slate-500 block mb-1">کل پورسانت‌های محاسبه‌شده</span>
                <span className="text-base font-black text-slate-900 dark:text-white">
                  {Number(commissionsSummary.totalAmount).toLocaleString('fa-IR')} <span className="text-xs font-normal">ریال</span>
                </span>
              </div>
              <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-900/30 flex justify-between items-center">
                <span className="text-[11px] font-bold text-amber-800 dark:text-amber-300">در انتظار تایید مالی</span>
                <span className="text-xs font-black text-amber-700 bg-amber-200/50 px-2 py-0.5 rounded-full">
                  {commissionsSummary.pendingCount} مورد
                </span>
              </div>
            </div>
          </div>
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
            <a
              href="/commissions"
              className="w-full block text-center py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300 rounded-xl text-xs font-bold transition"
            >
              مشاهده جدول کامل و جزئیات پورسانت‌ها
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
