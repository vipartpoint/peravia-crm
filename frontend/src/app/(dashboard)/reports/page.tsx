'use client';
import { useState, useEffect } from 'react';
import { api } from '@/services/api';
import { PieChart, Download, Filter, CalendarDays, BarChart, Users, DollarSign, BrainCircuit, FileText } from 'lucide-react';

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState('sales');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>(null);
  
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    userId: '',
    territoryId: ''
  });

  const fetchReport = async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams(Object.entries(filters).filter(([_, v]) => v !== '')).toString();
      const res = await api.get(`/reports/${activeTab}${query ? '?' + query : ''}`);
      setData(res);
    } catch (e: any) {
      alert(e.response?.data?.message || 'خطا در دریافت گزارش (ممکن است دسترسی نداشته باشید)');
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [activeTab]);

  const handleExport = async (format: 'excel' | 'csv') => {
    try {
      const token = document.cookie.split('; ').find(row => row.startsWith('access_token='))?.split('=')[1];
      const baseUrl = process.env.NEXT_PUBLIC_API_URL;
      if (!baseUrl) throw new Error('NEXT_PUBLIC_API_URL environment variable is missing');
      const fetchRes = await fetch(`${baseUrl}/reports/export`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ type: activeTab, format, filters })
      });
      if (!fetchRes.ok) throw new Error('Export failed');
      const blob = await fetchRes.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `report_${activeTab}.${format === 'excel' ? 'xlsx' : 'csv'}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (e: any) {
      alert('خطا در دانلود خروجی (عدم دسترسی)');
    }
  };

  const handlePrintPdf = () => {
    window.print();
  };

  const tabs = [
    { id: 'sales', label: 'گزارش فروش', icon: BarChart },
    { id: 'financial', label: 'گزارش مالی', icon: DollarSign },
    { id: 'crm', label: 'گزارش CRM', icon: Users },
    { id: 'performance', label: 'عملکرد (KPI)', icon: PieChart },
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto min-h-screen space-y-6 print-container">
      <div className="flex justify-between items-center no-print mb-8">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center">
            <PieChart className="w-8 h-8 ml-3 text-indigo-600" />
            مرکز گزارشات و خروجی‌ها
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">گزارش‌گیری جامع فروش، مالی، ارزیابی عملکرد و رفتار مشتریان</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => handleExport('excel')} className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-sm transition flex items-center">
            <Download className="w-4 h-4 ml-2" /> دانلود Excel
          </button>
          <button onClick={() => handleExport('csv')} className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-sm transition flex items-center">
            <Download className="w-4 h-4 ml-2" /> دانلود CSV
          </button>
          <button onClick={handlePrintPdf} className="bg-rose-600 hover:bg-rose-700 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-sm transition flex items-center">
            <FileText className="w-4 h-4 ml-2" /> چاپ PDF
          </button>
        </div>
      </div>

      <div className="flex gap-2 border-b border-slate-200 dark:border-slate-700 no-print overflow-x-auto">
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`px-4 py-3 text-sm font-bold border-b-2 transition flex items-center whitespace-nowrap ${activeTab === tab.id ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:bg-slate-800/50'}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <tab.icon className="w-4 h-4 ml-2" />
            {tab.label}
          </button>
        ))}
      </div>

      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 no-print">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center text-slate-500 dark:text-slate-400 text-sm font-bold bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 px-3 py-2 rounded-lg">
            <Filter className="w-4 h-4 ml-2" /> فیلترها
          </div>
          <input type="date" value={filters.startDate} onChange={e => setFilters({...filters, startDate: e.target.value})} className="border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-sm text-slate-700 dark:text-slate-200 outline-none focus:ring-2 focus:ring-indigo-500" title="از تاریخ" />
          <input type="date" value={filters.endDate} onChange={e => setFilters({...filters, endDate: e.target.value})} className="border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-sm text-slate-700 dark:text-slate-200 outline-none focus:ring-2 focus:ring-indigo-500" title="تا تاریخ" />
          <button onClick={fetchReport} className="bg-slate-900 text-white px-6 py-2 rounded-lg text-sm font-bold hover:bg-slate-800 transition shadow-sm">
            اعمال فیلتر
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center p-20"><div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div></div>
      ) : data ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700">
              <p className="text-slate-500 dark:text-slate-400 text-sm font-bold uppercase mb-1">تعداد کل رکوردها</p>
              <p className="text-3xl font-black text-slate-900">{data.data?.length || 0}</p>
            </div>
            {data.summary?.totalAmount && (
              <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700">
                <p className="text-slate-500 dark:text-slate-400 text-sm font-bold uppercase mb-1">مبلغ کل</p>
                <p className="text-3xl font-black text-emerald-600">{Number(data.summary.totalAmount).toLocaleString('fa-IR')} <span className="text-xs text-emerald-500 font-medium">ریال</span></p>
              </div>
            )}
            {data.summary?.totalSales && (
              <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700">
                <p className="text-slate-500 dark:text-slate-400 text-sm font-bold uppercase mb-1">مبلغ کل فروش</p>
                <p className="text-3xl font-black text-indigo-600">{Number(data.summary.totalSales).toLocaleString('fa-IR')} <span className="text-xs text-indigo-500 font-medium">ریال</span></p>
              </div>
            )}
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700 font-bold text-slate-800 dark:text-slate-100">پیش‌نمایش داده‌ها</div>
            <div className="overflow-x-auto">
              <table className="w-full text-right text-sm">
                <thead className="bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 text-xs border-b border-slate-100 dark:border-slate-800">
                  <tr>
                    <th className="p-4 font-bold">شناسه / شماره</th>
                    <th className="p-4 font-bold">مشتری / ذینفع</th>
                    <th className="p-4 font-bold">وضعیت</th>
                    <th className="p-4 font-bold">تاریخ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.data?.slice(0, 10).map((row: any, idx: number) => (
                    <tr key={idx} className="hover:bg-slate-50 dark:bg-slate-800/50 transition-colors">
                      <td className="p-4 font-mono text-slate-500 dark:text-slate-400">{row.orderNumber || row.chequeNumber || row.id?.slice(0,8)}</td>
                      <td className="p-4 font-bold text-slate-900">{row.customer?.name || row.user?.username || row.assignedUser?.username || 'ناشناس'}</td>
                      <td className="p-4">
                        <span className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-md text-xs font-bold border border-slate-200 dark:border-slate-700">{row.status || 'ثبت شده'}</span>
                      </td>
                      <td className="p-4 text-slate-600 dark:text-slate-300 font-mono" dir="ltr">{new Date(row.createdAt || row.dueDate || row.periodStart).toLocaleDateString('fa-IR')}</td>
                    </tr>
                  ))}
                  {!data.data?.length && <tr><td colSpan={4} className="p-12 text-center text-slate-500 dark:text-slate-400">داده‌ای برای نمایش وجود ندارد</td></tr>}
                </tbody>
              </table>
              {data.data?.length > 10 && (
                <div className="p-4 text-center text-xs font-bold text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800">
                  فقط ۱۰ رکورد اول نمایش داده شده است. برای مشاهده کامل، خروجی دریافت کنید.
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 p-16 text-center rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 flex flex-col items-center">
          <Filter className="w-12 h-12 text-slate-300 mb-4" />
          <p className="font-medium">برای مشاهده گزارش، دسته‌بندی را انتخاب کنید و در صورت نیاز فیلتر اعمال کنید.</p>
        </div>
      )}

      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          .no-print { display: none !important; }
          .print-container { padding: 0 !important; margin: 0 !important; }
          body { background: white; }
          * { box-shadow: none !important; }
        }
      `}} />
    </div>
  );
}
