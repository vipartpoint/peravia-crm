'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { api } from '@/services/api';
import { Timeline, TimelineEvent } from '@/components/ui/Timeline';
import { ActivityTimeline } from '@/components/ui/ActivityTimeline';
import { RightActionPanel } from '@/components/ui/RightActionPanel';
import { 
  Building2, Target, Calendar, Edit3, MessageSquare, 
  MapPin, CheckSquare, Clock, AlertTriangle, FileText, ShoppingCart
} from 'lucide-react';
import { Skeleton } from '@/components/ui/Skeleton';
import { useGlobalEntity } from '@/contexts/GlobalEntityContext';

export default function OpportunityDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { openEdit, openCreate } = useGlobalEntity();
  const [loading, setLoading] = useState(true);
  const [opp, setOpp] = useState<any>(null);
  const [activeSection, setActiveSection] = useState('overview');

  useEffect(() => {
    const fetchOpp = async () => {
      try {
        const data = await api.get(`/opportunities/${params.id}`);
        setOpp(data);
      } catch (err) {
        alert('خطا در دریافت اطلاعات فرصت فروش');
        router.push('/opportunities');
      } finally {
        setLoading(false);
      }
    };
    if (params.id) fetchOpp();
  }, [params.id, router]);

  const handleCreateOrder = async () => {
    try {
      // Create preview order payload from backend
      const previewPayload = await api.post(`/opportunities/${params.id}/convert-to-order`, {});
      // Open existing order form with this prefilled payload
      openCreate('order', previewPayload);
    } catch (err: any) {
      alert(err.response?.data?.message || 'خطا در تبدیل فرصت به سفارش');
    }
  };

  const sections = [
    { id: 'overview', label: 'نمای کلی' },
    { id: 'items', label: 'محصولات' },
    { id: 'activity', label: 'تاریخچه مرحله و فعالیت' }
  ];

  const scrollToSection = (id: string) => {
    setActiveSection(id);
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  if (loading) return <div className="p-8"><Skeleton className="h-64 rounded-2xl" /></div>;
  if (!opp) return <div className="p-8 text-center">فرصت یافت نشد</div>;

  const mockTimelineEvents: TimelineEvent[] = [
    { id: '1', type: 'creation', title: 'تغییر مرحله به ' + opp.stage, timestamp: 'اخیرا', description: opp.status === 'Lost' ? `علت شکست: ${opp.lostReason}` : '' },
  ];

  return (
    <div className="flex flex-col lg:flex-row gap-6 p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto min-h-screen items-start">
      
      <div className="flex-1 min-w-0 flex flex-col gap-6 w-full">
        
        {/* Header Card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-sm p-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center border border-indigo-100">
                <Target className="w-8 h-8" />
              </div>
              <div>
                <h1 className="text-2xl font-black text-slate-900">{opp.name}</h1>
                <div className="flex items-center gap-3 mt-1.5 text-sm font-medium">
                  <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded text-xs border border-indigo-200">مرحله: {opp.stage}</span>
                  {opp.customer && <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1"><Building2 className="w-3.5 h-3.5" /> {opp.customer.name}</span>}
                </div>
              </div>
            </div>
            {opp.status === 'Won' && (
              <button onClick={handleCreateOrder} className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg font-bold flex items-center shadow-md">
                <ShoppingCart className="w-4 h-4 ml-2" /> تبدیل به سفارش فروش
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-4 border-t border-slate-100 dark:border-slate-800">
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase mb-1">ارزش کل تخمینی</p>
              <p className="font-medium text-slate-800 dark:text-slate-100">{(Number(opp.totalEstimatedValue) || 0).toLocaleString()} <span className="text-[10px] text-slate-400">ریال</span></p>
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase mb-1">ارزش موزون (Weighted)</p>
              <p className="font-medium text-slate-800 dark:text-slate-100">{(Number(opp.weightedForecastValue) || 0).toLocaleString()} <span className="text-[10px] text-slate-400">ریال</span></p>
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase mb-1">احتمال موفقیت</p>
              <p className="font-medium text-indigo-600 font-mono">{opp.probability}%</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase mb-1">تاریخ پیش‌بینی بستن</p>
              <p className="font-medium text-slate-800 dark:text-slate-100">{opp.expectedCloseDate ? new Date(opp.expectedCloseDate).toLocaleDateString('fa-IR') : '---'}</p>
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
            <h2 className="text-lg font-black text-slate-800 dark:text-slate-100 mb-4 px-1">اطلاعات تکمیلی</h2>
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
              <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-300">
                <AlertTriangle className="w-4 h-4 text-slate-400" /> 
                <span className="font-bold">رقیب تجاری: </span>
                <span>{opp.competitorName || 'ثبت نشده'}</span>
              </div>
              {opp.status === 'Lost' && (
                <div className="flex items-center gap-3 text-sm text-rose-600 bg-rose-50 p-3 rounded-lg border border-rose-100">
                  <span className="font-bold">علت شکست: </span>
                  <span>{opp.lostReason}</span>
                </div>
              )}
              {opp.notes && (
                <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 text-sm text-slate-600 dark:text-slate-300">
                  <span className="font-bold block mb-2">یادداشت‌ها:</span>
                  <p className="whitespace-pre-wrap">{opp.notes}</p>
                </div>
              )}
            </div>
          </div>

          <div id="items" className="scroll-mt-24">
            <h2 className="text-lg font-black text-slate-800 dark:text-slate-100 mb-4 px-1">محصولات (Items)</h2>
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
              <table className="w-full text-sm text-right">
                <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    <th className="px-4 py-3 font-bold text-slate-700 dark:text-slate-300">محصول</th>
                    <th className="px-4 py-3 font-bold text-slate-700 dark:text-slate-300">تعداد</th>
                    <th className="px-4 py-3 font-bold text-slate-700 dark:text-slate-300">قیمت واحد</th>
                    <th className="px-4 py-3 font-bold text-slate-700 dark:text-slate-300">جمع کل</th>
                  </tr>
                </thead>
                <tbody>
                  {opp.items?.map((item: any, idx: number) => (
                    <tr key={idx} className="border-b border-slate-100 dark:border-slate-800 last:border-0">
                      <td className="px-4 py-3 font-medium">{item.product?.name || `محصول ${item.productId}`}</td>
                      <td className="px-4 py-3">{item.quantity}</td>
                      <td className="px-4 py-3 font-mono">{(Number(item.unitPrice)).toLocaleString()}</td>
                      <td className="px-4 py-3 font-mono font-bold">{(Number(item.quantity) * Number(item.unitPrice)).toLocaleString()}</td>
                    </tr>
                  ))}
                  {(!opp.items || opp.items.length === 0) && (
                    <tr>
                      <td colSpan={4} className="px-4 py-8 text-center text-slate-500">هیچ محصولی ثبت نشده است</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div id="activity" className="scroll-mt-24">
            <ActivityTimeline entityType="Opportunity" entityId={params.id as string} />
          </div>
          
        </div>
      </div>

      <RightActionPanel 
        title="عملیات فرصت فروش"
        actions={[
          { label: 'ویرایش اطلاعات', icon: Edit3, onClick: () => { if(typeof params.id === 'string') openEdit('opportunity', params.id); }, variant: 'primary' },
          { label: 'ایجاد تسک پیگیری', icon: CheckSquare, onClick: () => openCreate('task') },
          { label: 'پیوست سند', icon: FileText, onClick: () => alert('این قابلیت به زودی اضافه می‌شود') },
        ]} 
      />

    </div>
  );
}
