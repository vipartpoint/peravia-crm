'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { api } from '@/services/api';
import { Timeline, TimelineEvent } from '@/components/ui/Timeline';
import { ActivityTimeline } from '@/components/ui/ActivityTimeline';
import { RightActionPanel } from '@/components/ui/RightActionPanel';
import { 
  ShoppingCart, Phone, User, Package, Edit3, DollarSign, 
  MapPin, Clock, FileText, CheckCircle2, TrendingUp
} from 'lucide-react';
import { Skeleton } from '@/components/ui/Skeleton';
import { useGlobalEntity } from '@/contexts/GlobalEntityContext';

export default function OrderDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { openEdit, openCreate } = useGlobalEntity();
  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState<any>(null);
  const [activeSection, setActiveSection] = useState('overview');

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const data = await api.get(`/orders/${params.id}`);
        setOrder(data);
      } catch (err) {
        alert('خطا در دریافت اطلاعات سفارش');
        router.push('/orders');
      } finally {
        setLoading(false);
      }
    };
    if (params.id) fetchOrder();
  }, [params.id, router]);

  const mockTimelineEvents: TimelineEvent[] = [
    { id: '1', type: 'creation', title: 'سفارش ثبت شد', timestamp: '۲ روز پیش', user: { name: 'ادمین', avatarInitials: 'A' } },
    { id: '2', type: 'update', title: 'سفارش تایید شد', description: 'توسط مدیر فروش تایید شد.', timestamp: 'دیروز' },
    { id: '3', type: 'payment', title: 'پیش‌پرداخت دریافت شد', description: 'مبلغ ۲۰ میلیون تومان', timestamp: 'امروز' },
  ];

  const sections = [
    { id: 'overview', label: 'نمای کلی' },
    { id: 'items', label: 'اقلام سفارش' },
    { id: 'activity', label: 'تاریخچه فعالیت' },
    { id: 'financial', label: 'وضعیت مالی' },
    { id: 'documents', label: 'اسناد ضمیمه' },
  ];

  const scrollToSection = (id: string) => {
    setActiveSection(id);
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  if (loading) return <div className="p-8"><Skeleton className="h-64 rounded-2xl" /></div>;
  if (!order) return <div className="p-8 text-center">سفارش یافت نشد</div>;

  return (
    <div className="flex flex-col lg:flex-row gap-6 p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto min-h-screen items-start">
      
      <div className="flex-1 min-w-0 flex flex-col gap-6 w-full">
        
        {/* Smart Header Card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-sm p-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center border border-emerald-100">
                <ShoppingCart className="w-8 h-8" />
              </div>
              <div>
                <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
                  سفارش #{order.orderNumber}
                </h1>
                <div className="flex items-center gap-3 mt-1.5 text-sm font-medium">
                  <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded text-xs border border-emerald-200">{order.status || 'تایید شده'}</span>
                  {order.customer && <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1"><User className="w-3.5 h-3.5" /> {order.customer.name}</span>}
                  <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> فروشنده: سیستم</span>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-4 border-t border-slate-100 dark:border-slate-800">
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider mb-1">مبلغ کل</p>
              <p className="font-medium text-emerald-600 flex items-center gap-1.5"><DollarSign className="w-4 h-4" /> {(order.totalAmount || 0).toLocaleString('fa-IR')} ریال</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider mb-1">آخرین فعالیت</p>
              <p className="font-medium text-slate-800 dark:text-slate-100 flex items-center gap-1.5"><Clock className="w-4 h-4 text-slate-400" /> امروز</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider mb-1">تعداد اقلام</p>
              <p className="font-medium text-slate-800 dark:text-slate-100 flex items-center gap-1.5"><Package className="w-4 h-4" /> {order.items?.length || 0} مورد</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider mb-1">وضعیت پرداخت</p>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden"><div className="h-full bg-emerald-500 w-[50%]" /></div>
                <span className="text-sm font-bold text-slate-800 dark:text-slate-100">۵۰٪</span>
              </div>
            </div>
          </div>
        </div>

        {/* Mini KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">حاشیه سود (تخمینی)</p>
            <div className="flex items-end justify-between mt-2">
              <p className="text-xl font-black text-slate-800 dark:text-slate-100">۱۸٪</p>
              <span className="text-xs font-bold text-emerald-600 flex items-center"><TrendingUp className="w-3 h-3 mr-0.5" /> خوب</span>
            </div>
          </div>
        </div>

        {/* Sticky Section Navigation */}
        <div className="sticky top-0 z-30 bg-background/80 backdrop-blur-md py-3 -mx-4 px-4 sm:mx-0 sm:px-0">
          <div className="flex overflow-x-auto no-scrollbar gap-2">
            {sections.map(s => (
              <button
                key={s.id}
                onClick={() => scrollToSection(s.id)}
                className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-colors ${
                  activeSection === s.id 
                    ? 'bg-slate-900 text-white shadow-md' 
                    : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:bg-slate-800/50'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Sections Content */}
        <div className="flex flex-col gap-6">
          <div id="overview" className="scroll-mt-24">
            <h2 className="text-lg font-black text-slate-800 dark:text-slate-100 mb-4 px-1">نمای کلی و ارتباطات</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm md:col-span-1 space-y-4">
                <h3 className="font-bold text-slate-800 dark:text-slate-100 mb-2 border-b pb-2">اطلاعات سفارش</h3>
                <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-300"><Clock className="w-4 h-4 text-slate-400" /> <span className="font-mono">تاریخ ثبت: ۱۴۰۳/۰۲/۱۶</span></div>
                <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-300"><FileText className="w-4 h-4 text-slate-400" /> <span>نوع: فروش مستقیم</span></div>
              </div>
              
              <div className="md:col-span-2 grid grid-cols-2 gap-4">
                <div className="bg-emerald-50/50 p-4 rounded-2xl border border-emerald-100 hover:bg-emerald-50 transition-colors cursor-pointer group">
                  <div className="flex justify-between items-start mb-2">
                    <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg"><DollarSign className="w-5 h-5" /></div>
                    <span className="font-bold text-xl text-emerald-900 group-hover:scale-110 transition-transform">۱</span>
                  </div>
                  <h4 className="font-bold text-sm text-emerald-900">رسید پرداخت</h4>
                  <p className="text-xs text-emerald-600/70 mt-1">مبلغ ۲۰ م.ت</p>
                </div>
              </div>
            </div>
          </div>

          <div id="activity" className="scroll-mt-24">
            <ActivityTimeline entityType="Order" entityId={params.id as string} />
          </div>
          
          <div id="financial" className="scroll-mt-24 h-32"></div>
        </div>

      </div>

      <RightActionPanel 
        title="عملیات سفارش"
        actions={[
          { label: 'ویرایش سفارش', icon: Edit3, onClick: () => { if(typeof params.id === 'string') openEdit('order', params.id); }, variant: 'primary' },
          { label: 'ثبت پرداخت', icon: DollarSign, onClick: () => openCreate('payment') },
          { label: 'دانلود پیش‌فاکتور', icon: FileText, onClick: () => alert('در حال دانلود...') },
        ]} 
      />

    </div>
  );
}
