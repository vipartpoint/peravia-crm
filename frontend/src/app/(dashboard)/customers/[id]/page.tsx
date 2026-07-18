'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { api } from '@/services/api';
import { Timeline, TimelineEvent } from '@/components/ui/Timeline';
import { ActivityTimeline } from '@/components/ui/ActivityTimeline';
import { RightActionPanel } from '@/components/ui/RightActionPanel';
import { 
  Building2, Phone, Mail, MapPin, Edit3, Target, Calendar, 
  ShoppingCart, AlertTriangle, CheckSquare, Clock, TrendingUp, DollarSign, BrainCircuit, CreditCard, Receipt
} from 'lucide-react';
import { Skeleton } from '@/components/ui/Skeleton';
import { useGlobalEntity } from '@/contexts/GlobalEntityContext';

export default function CustomerDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { openEdit, openCreate } = useGlobalEntity();
  const [loading, setLoading] = useState(true);
  const [customer, setCustomer] = useState<any>(null);
  const [activeSection, setActiveSection] = useState('summary');

  useEffect(() => {
    const fetchCustomer = async () => {
      try {
        const data = await api.get(`/customers/${params.id}`);
        setCustomer(data);
      } catch (err) {
        alert('خطا در دریافت اطلاعات مشتری');
        router.push('/customers');
      } finally {
        setLoading(false);
      }
    };
    if (params.id) fetchCustomer();
  }, [params.id, router]);

  const mockTimelineEvents: TimelineEvent[] = [
    { id: '1', type: 'creation', title: 'مشتری در سیستم ثبت شد', timestamp: '۱۲ اردیبهشت ۱۴۰۳ - ۱۰:۳۰', user: { name: 'ادمین', avatarInitials: 'A' } },
    { id: '2', type: 'visit', title: 'ویزیت حضوری انجام شد', description: 'مذاکره برای فروش روغن موتور سنگین', timestamp: '۱۵ اردیبهشت ۱۴۰۳ - ۱۲:۰۰', user: { name: 'علی رضایی', avatarInitials: 'ع.ر' } },
    { id: '3', type: 'order', title: 'ثبت سفارش جدید', description: 'سفارش #1024 به مبلغ ۵۰ میلیون تومان', timestamp: '۱۶ اردیبهشت ۱۴۰۳', metadata: { status: 'تایید شده', items: 3 } },
  ];

  const sections = [
    { id: 'summary', label: 'خلاصه' },
    { id: 'orders', label: 'سفارشات' },
    { id: 'payments', label: 'دریافتی‌ها' },
    { id: 'cheques', label: 'چک‌ها' },
    { id: 'tasks', label: 'تسک‌ها' },
    { id: 'visits', label: 'ویزیت‌ها' },
    { id: 'timeline', label: 'تایم‌لاین' },
  ];

  const scrollToSection = (id: string) => {
    setActiveSection(id);
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  if (loading) return <div className="p-8"><Skeleton className="h-64 rounded-2xl" /></div>;
  if (!customer) return <div className="p-8 text-center text-slate-500 dark:text-slate-400">مشتری یافت نشد</div>;

  return (
    <div className="flex flex-col lg:flex-row gap-6 p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto min-h-screen items-start dark:bg-slate-900">
      
      {/* Center Content */}
      <div className="flex-1 min-w-0 flex flex-col gap-6 w-full">
        
        {/* Smart Header Card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm p-5 transition-colors">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-5">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-primary/10 text-primary rounded-lg flex items-center justify-center border border-primary/20">
                <Building2 className="w-7 h-7" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">{customer.name}</h1>
                <div className="flex items-center gap-3 mt-1 text-xs font-medium">
                  <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 rounded border border-emerald-200 dark:border-emerald-500/20">فعال</span>
                  <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> منطقه شمال</span>
                  <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1"><Target className="w-3.5 h-3.5" /> ادمین</span>
                </div>
              </div>
            </div>
          </div>

          {/* Smart Indicators - Linear Style */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-3 border-t border-slate-100 dark:border-slate-800">
            <div>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider mb-1">آخرین فعالیت</p>
              <p className="text-sm font-medium text-slate-800 dark:text-slate-200 flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-slate-400" /> ۲ روز پیش</p>
            </div>
            <div>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider mb-1">تسک‌های باز</p>
              <p className="text-sm font-medium text-amber-600 dark:text-amber-500 flex items-center gap-1.5"><CheckSquare className="w-3.5 h-3.5" /> ۳ تسک نیازمند توجه</p>
            </div>
            <div>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider mb-1">مصرف اعتبار</p>
              <div className="flex items-center gap-2 mt-0.5">
                <div className="flex-1 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden"><div className="h-full bg-blue-500 w-[72%]" /></div>
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">۷۲٪</span>
              </div>
            </div>
          </div>
        </div>

        {/* AI Summary Banner (High Priority) */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-slate-800 dark:to-slate-800/80 border border-blue-100 dark:border-slate-700 rounded-xl p-4 flex gap-4 items-start shadow-sm">
          <div className="p-2 bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 rounded-lg shrink-0">
            <BrainCircuit className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-2">
              خلاصه هوش مصنوعی (AI Copilot)
              <span className="px-1.5 py-0.5 bg-blue-200/50 dark:bg-blue-500/30 text-blue-700 dark:text-blue-300 rounded text-[10px] font-mono">BETA</span>
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
              این مشتری روند رو به رشدی در سفارشات ماهانه دارد (افزایش ۱۲٪). با این حال، ۲ چک در شرف سررسید دارد که نیازمند پیگیری است. پیشنهاد می‌شود یک ویزیت حضوری برای معرفی محصول "روغن صنعتی X" در هفته آینده برنامه‌ریزی شود.
            </p>
          </div>
        </div>

        {/* Sticky Section Navigation */}
        <div className="sticky top-0 z-30 bg-background/90 dark:bg-slate-900/90 backdrop-blur-md py-3 -mx-4 px-4 sm:mx-0 sm:px-0 border-b border-slate-200 dark:border-slate-800">
          <div className="flex overflow-x-auto no-scrollbar gap-1">
            {sections.map(s => (
              <button
                key={s.id}
                onClick={() => scrollToSection(s.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors ${
                  activeSection === s.id 
                    ? 'bg-slate-800 dark:bg-white dark:bg-slate-900 text-white dark:text-slate-900 shadow-sm' 
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-800'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Sections Content (Dense & Unified) */}
        <div className="flex flex-col gap-8 pb-32">
          
          {/* Summary */}
          <div id="summary" className="scroll-mt-24 space-y-4">
            <h2 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-wider px-1 border-r-2 border-primary">خلاصه وضعیت</h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">مجموع درآمد</p>
                <div className="flex items-end justify-between mt-2">
                  <p className="text-lg font-black text-slate-800 dark:text-white">۸۵۰<span className="text-xs text-slate-500 dark:text-slate-400 font-medium ml-1">م.ت</span></p>
                  <span className="text-[10px] font-bold text-emerald-600 flex items-center"><TrendingUp className="w-3 h-3 mr-0.5" /> ۱۲٪</span>
                </div>
              </div>
              <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">سفارشات قطعی</p>
                <div className="flex items-end justify-between mt-2">
                  <p className="text-lg font-black text-slate-800 dark:text-white">۲۴</p>
                </div>
              </div>
              <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">شماره تماس</p>
                <div className="flex items-end justify-between mt-2">
                  <p className="text-sm font-mono text-slate-800 dark:text-white mt-1">{customer.phone || 'ندارد'}</p>
                </div>
              </div>
              <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">شناسه ملی</p>
                <div className="flex items-end justify-between mt-2">
                  <p className="text-sm font-mono text-slate-800 dark:text-white mt-1">{customer.nationalId || 'ندارد'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Orders */}
          <div id="orders" className="scroll-mt-24 space-y-4">
            <h2 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-wider px-1 border-r-2 border-primary">سفارشات</h2>
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-8 text-center flex flex-col items-center">
              <ShoppingCart className="w-8 h-8 text-slate-300 dark:text-slate-600 dark:text-slate-300 mb-3" />
              <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">هنوز هیچ سفارشی ثبت نشده است.</p>
              <button onClick={() => openCreate('order')} className="mt-4 text-xs font-bold text-primary hover:text-primary-hover bg-primary/10 px-3 py-1.5 rounded-lg transition-colors">ثبت سفارش جدید</button>
            </div>
          </div>

          {/* Payments */}
          <div id="payments" className="scroll-mt-24 space-y-4">
            <h2 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-wider px-1 border-r-2 border-primary">دریافتی‌ها</h2>
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-8 text-center flex flex-col items-center">
              <Receipt className="w-8 h-8 text-slate-300 dark:text-slate-600 dark:text-slate-300 mb-3" />
              <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">هیچ دریافتی ثبت نشده است.</p>
            </div>
          </div>

          {/* Cheques */}
          <div id="cheques" className="scroll-mt-24 space-y-4">
            <h2 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-wider px-1 border-r-2 border-primary">چک‌ها</h2>
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-8 text-center flex flex-col items-center">
              <CreditCard className="w-8 h-8 text-slate-300 dark:text-slate-600 dark:text-slate-300 mb-3" />
              <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">هیچ چکی ثبت نشده است.</p>
            </div>
          </div>

          {/* Tasks */}
          <div id="tasks" className="scroll-mt-24 space-y-4">
            <h2 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-wider px-1 border-r-2 border-primary">تسک‌ها</h2>
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-8 text-center flex flex-col items-center">
              <CheckSquare className="w-8 h-8 text-slate-300 dark:text-slate-600 dark:text-slate-300 mb-3" />
              <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">هیچ تسکی برای این مشتری ندارید.</p>
            </div>
          </div>

          {/* Visits */}
          <div id="visits" className="scroll-mt-24 space-y-4">
            <h2 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-wider px-1 border-r-2 border-primary">ویزیت‌ها</h2>
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-8 text-center flex flex-col items-center">
              <MapPin className="w-8 h-8 text-slate-300 dark:text-slate-600 dark:text-slate-300 mb-3" />
              <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">هیچ ویزیتی ثبت نشده است.</p>
            </div>
          </div>

          {/* Timeline */}
          <div id="timeline" className="scroll-mt-24 space-y-4">
            <h2 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-wider px-1 border-r-2 border-primary">تایم‌لاین تعاملات</h2>
            <ActivityTimeline entityType="Customer" entityId={params.id as string} />
          </div>
          
        </div>

      </div>

      {/* Right Action Panel */}
      <RightActionPanel 
        title="عملیات سریع"
        actions={[
          { label: 'دستیار هوشمند (AI Copilot)', icon: BrainCircuit, onClick: () => window.dispatchEvent(new CustomEvent('ai-copilot-open', { detail: { context: 'customer', id: params.id } })), variant: 'outline' },
          { label: 'ویرایش مشخصات', icon: Edit3, onClick: () => { if(typeof params.id === 'string') openEdit('customer', params.id); }, variant: 'primary' },
          { label: 'ثبت سفارش جدید', icon: ShoppingCart, onClick: () => openCreate('order') },
          { label: 'برنامه‌ریزی ویزیت', icon: MapPin, onClick: () => openCreate('visit') },
          { label: 'ایجاد تسک', icon: CheckSquare, onClick: () => openCreate('task') },
          { label: 'ثبت رویداد مالی', icon: DollarSign, onClick: () => openCreate('payment') },
        ]} 
      />

    </div>
  );
}
