'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { api } from '@/services/api';
import { Timeline, TimelineEvent } from '@/components/ui/Timeline';
import { ActivityTimeline } from '@/components/ui/ActivityTimeline';
import { RightActionPanel } from '@/components/ui/RightActionPanel';
import { 
  Building2, Phone, Target, Calendar, Edit3, MessageSquare, 
  MapPin, CheckSquare, Clock, TrendingUp, AlertTriangle
} from 'lucide-react';
import { Skeleton } from '@/components/ui/Skeleton';
import { useGlobalEntity } from '@/contexts/GlobalEntityContext';

export default function LeadDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { openEdit, openCreate } = useGlobalEntity();
  const [loading, setLoading] = useState(true);
  const [lead, setLead] = useState<any>(null);
  const [activeSection, setActiveSection] = useState('overview');

  useEffect(() => {
    const fetchLead = async () => {
      try {
        const data = await api.get(`/leads/${params.id}`);
        setLead(data);
      } catch (err) {
        alert('خطا در دریافت اطلاعات سرنخ');
        router.push('/leads');
      } finally {
        setLoading(false);
      }
    };
    if (params.id) fetchLead();
  }, [params.id, router]);

  const mockTimelineEvents: TimelineEvent[] = [
    { id: '1', type: 'creation', title: 'سرنخ جدید ثبت شد', timestamp: 'هفته پیش', user: { name: 'ادمین', avatarInitials: 'A' } },
    { id: '2', type: 'presentation', title: 'جلسه معارفه تلفنی انجام شد', description: 'به کاتالوگ محصولات علاقه نشان دادند', timestamp: '۵ روز پیش', user: { name: 'علی رضایی', avatarInitials: 'ع.ر' } },
    { id: '3', type: 'note', title: 'یادداشت جدید', description: 'نیاز به پیگیری برای پیش‌فاکتور روغن صنعتی', timestamp: '۲ روز پیش' },
  ];

  const sections = [
    { id: 'overview', label: 'نمای کلی' },
    { id: 'activity', label: 'تاریخچه فعالیت' },
    { id: 'visits', label: 'ویزیت‌ها' },
    { id: 'tasks', label: 'تسک‌ها' },
  ];

  const scrollToSection = (id: string) => {
    setActiveSection(id);
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  if (loading) return <div className="p-8"><Skeleton className="h-64 rounded-2xl" /></div>;
  if (!lead) return <div className="p-8 text-center">سرنخ یافت نشد</div>;

  return (
    <div className="flex flex-col lg:flex-row gap-6 p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto min-h-screen items-start">
      
      <div className="flex-1 min-w-0 flex flex-col gap-6 w-full">
        
        {/* Smart Header Card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-sm p-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center border border-blue-100">
                <Target className="w-8 h-8" />
              </div>
              <div>
                <h1 className="text-2xl font-black text-slate-900">{lead.name}</h1>
                <div className="flex items-center gap-3 mt-1.5 text-sm font-medium">
                  <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs border border-blue-200">سرنخ (Lead)</span>
                  {lead.companyName && <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1"><Building2 className="w-3.5 h-3.5" /> {lead.companyName}</span>}
                  <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {lead.region || 'نامشخص'}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-4 border-t border-slate-100 dark:border-slate-800">
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider mb-1">وضعیت قیف فروش</p>
              <p className="font-medium text-blue-600 flex items-center gap-1.5"><Target className="w-4 h-4" /> {lead.funnelStage || 'مذاکره اولیه'}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider mb-1">آخرین فعالیت</p>
              <p className="font-medium text-slate-800 dark:text-slate-100 flex items-center gap-1.5"><Clock className="w-4 h-4 text-slate-400" /> ۲ روز پیش</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider mb-1">تسک‌های باز</p>
              <p className="font-medium text-amber-600 flex items-center gap-1.5"><CheckSquare className="w-4 h-4" /> ۱ تسک پیگیری</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider mb-1">امتیاز سرنخ (Lead Score)</p>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden"><div className="h-full bg-emerald-500 w-[65%]" /></div>
                <span className="text-sm font-bold text-slate-800 dark:text-slate-100">۶۵</span>
              </div>
            </div>
          </div>
        </div>

        {/* Mini KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">ارزش احتمالی قرارداد</p>
            <div className="flex items-end justify-between mt-2">
              <p className="text-xl font-black text-slate-800 dark:text-slate-100">۲۰۰<span className="text-sm text-slate-500 dark:text-slate-400 font-medium ml-1">م.ت</span></p>
            </div>
          </div>
          <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">احتمال تبدیل (AI)</p>
            <div className="flex items-end justify-between mt-2">
              <p className="text-xl font-black text-slate-800 dark:text-slate-100">۷۵٪</p>
              <span className="text-xs font-bold text-emerald-600 flex items-center"><TrendingUp className="w-3 h-3 mr-0.5" /> بالا</span>
            </div>
          </div>
          <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">روزهای در قیف</p>
            <div className="flex items-end justify-between mt-2">
              <p className="text-xl font-black text-slate-800 dark:text-slate-100">۱۴<span className="text-sm text-slate-500 dark:text-slate-400 font-medium ml-1">روز</span></p>
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
                <h3 className="font-bold text-slate-800 dark:text-slate-100 mb-2 border-b pb-2">اطلاعات تماس</h3>
                <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-300"><Phone className="w-4 h-4 text-slate-400" /> <span dir="ltr" className="font-mono inline-block">{lead.phone || 'ثبت نشده'}</span></div>
                <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-300"><Building2 className="w-4 h-4 text-slate-400" /> <span>شرکت: {lead.companyName || '---'}</span></div>
                <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-300"><Target className="w-4 h-4 text-slate-400" /> <span>منبع: بازاریابی آنلاین</span></div>
              </div>
              
              <div className="md:col-span-2 grid grid-cols-2 gap-4">
                <div className="bg-teal-50/50 p-4 rounded-2xl border border-teal-100 hover:bg-teal-50 transition-colors cursor-pointer group">
                  <div className="flex justify-between items-start mb-2">
                    <div className="p-2 bg-teal-100 text-teal-600 rounded-lg"><MessageSquare className="w-5 h-5" /></div>
                    <span className="font-bold text-xl text-teal-900 group-hover:scale-110 transition-transform">۲</span>
                  </div>
                  <h4 className="font-bold text-sm text-teal-900">یادداشت‌ها</h4>
                  <p className="text-xs text-teal-600/70 mt-1">نیاز به پیگیری فاکتور</p>
                </div>
                <div className="bg-amber-50/50 p-4 rounded-2xl border border-amber-100 hover:bg-amber-50 transition-colors cursor-pointer group">
                  <div className="flex justify-between items-start mb-2">
                    <div className="p-2 bg-amber-100 text-amber-600 rounded-lg"><Calendar className="w-5 h-5" /></div>
                    <span className="font-bold text-xl text-amber-900 group-hover:scale-110 transition-transform">۱</span>
                  </div>
                  <h4 className="font-bold text-sm text-amber-900">تسک‌های آینده</h4>
                  <p className="text-xs text-amber-600/70 mt-1">فردا ساعت ۱۱:۰۰</p>
                </div>
              </div>
            </div>
          </div>

          <div id="activity" className="scroll-mt-24">
            <ActivityTimeline entityType="Lead" entityId={params.id as string} />
          </div>
          
          <div id="visits" className="scroll-mt-24 h-32"></div>
        </div>

      </div>

      <RightActionPanel 
        title="عملیات سرنخ"
        actions={[
          { label: 'تبدیل به فرصت فروش', icon: TrendingUp, onClick: () => { if(typeof params.id === 'string') openCreate('opportunity', { leadId: lead.id, name: lead.companyName || lead.name, ownerId: lead.assignedTo, territoryId: lead.territoryId }); }, variant: 'primary' },
          { label: 'ویرایش مشخصات', icon: Edit3, onClick: () => { if(typeof params.id === 'string') openEdit('lead', params.id); }, variant: 'outline' },
          { label: 'برنامه‌ریزی ویزیت', icon: MapPin, onClick: () => openCreate('visit') },
          { label: 'ایجاد تسک پیگیری', icon: CheckSquare, onClick: () => openCreate('task') },
        ]} 
      />

    </div>
  );
}
