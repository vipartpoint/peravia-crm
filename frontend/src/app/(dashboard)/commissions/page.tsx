'use client';
import { useState, useEffect } from 'react';
import { api } from '@/services/api';
import { Award, CheckCircle, Clock, Banknote, ShieldCheck } from 'lucide-react';

export default function CommissionsPage() {
  const [loading, setLoading] = useState(true);
  const [commissions, setCommissions] = useState<any[]>([]);

  useEffect(() => {
    fetchCommissions();
  }, []);

  const fetchCommissions = async () => {
    try {
      const data = await api.get('/commissions');
      setCommissions(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (id: string, status: string) => {
    if (confirm(`آیا از تغییر وضعیت پورسانت به ${status} مطمئن هستید؟`)) {
      try {
        await api.patch(`/commissions/${id}/status`, { status });
        alert('وضعیت تغییر یافت');
        fetchCommissions();
      } catch (e: any) {
        alert(e.response?.data?.message || 'خطا در تغییر وضعیت (نیاز به دسترسی مدیر یا مالی)');
      }
    }
  };

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'Draft': return <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs font-bold flex items-center w-fit"><Clock className="w-3 h-3 ml-1"/> پیش‌نویس (در انتظار تأیید)</span>;
      case 'Approved': return <span className="px-2 py-1 bg-amber-100 text-amber-700 rounded text-xs font-bold flex items-center w-fit"><ShieldCheck className="w-3 h-3 ml-1"/> تأیید مدیر (در انتظار پرداخت)</span>;
      case 'Paid': return <span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded text-xs font-bold flex items-center w-fit"><CheckCircle className="w-3 h-3 ml-1"/> پرداخت شده</span>;
      default: return null;
    }
  };

  if (loading) return <div className="flex justify-center p-20"><div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div></div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black text-gray-900 tracking-tight flex items-center">
          <Award className="w-8 h-8 ml-3 text-indigo-600" />
          مدیریت پورسانت‌ها
        </h1>
        <p className="text-gray-500 text-sm mt-1 font-medium">مشاهده و پرداخت پاداش‌های عملکرد (بسته به وصولی)</p>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
        <table className="w-full text-right">
          <thead className="bg-gray-50 text-gray-600 text-sm border-b border-gray-100 dark:border-gray-800">
            <tr>
              <th className="p-4 font-medium">کارشناس</th>
              <th className="p-4 font-medium">دوره</th>
              <th className="p-4 font-medium hidden md:table-cell">مبلغ فروش / وصول (تومان)</th>
              <th className="p-4 font-medium">نرخ پورسانت</th>
              <th className="p-4 font-medium text-indigo-700">مبلغ پاداش (تومان)</th>
              <th className="p-4 font-medium">وضعیت</th>
              <th className="p-4 font-medium text-center">عملیات مدیریتی</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50 text-sm">
            {commissions.map((c) => (
              <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                <td className="p-4 font-bold text-gray-900">{c.user?.username}</td>
                <td className="p-4 font-mono text-gray-500">{c.period}</td>
                <td className="p-4 hidden md:table-cell">
                  <div className="flex flex-col gap-1">
                    <span className="text-gray-400 text-xs">فروش: {Number(c.salesAmount).toLocaleString('fa-IR')}</span>
                    <span className="text-gray-700 dark:text-gray-200 font-medium">وصول: {Number(c.collectedAmount).toLocaleString('fa-IR')}</span>
                  </div>
                </td>
                <td className="p-4 font-bold text-indigo-600" dir="ltr">{Number(c.commissionRate)}%</td>
                <td className="p-4 font-black text-emerald-600 text-base">{Number(c.commissionAmount).toLocaleString('fa-IR')}</td>
                <td className="p-4">{getStatusBadge(c.status)}</td>
                <td className="p-4 flex gap-2 justify-center">
                  {c.status === 'Draft' && (
                    <button onClick={() => handleAction(c.id, 'Approved')} className="text-amber-600 hover:bg-amber-50 p-2 rounded-lg transition bg-white dark:bg-slate-900 border border-gray-200 dark:border-gray-700 shadow-sm text-xs font-bold" title="تأیید مدیر فروش">
                      تأیید
                    </button>
                  )}
                  {c.status === 'Approved' && (
                    <button onClick={() => handleAction(c.id, 'Paid')} className="text-emerald-600 hover:bg-emerald-50 p-2 rounded-lg transition bg-white dark:bg-slate-900 border border-gray-200 dark:border-gray-700 shadow-sm text-xs font-bold flex items-center" title="پرداخت مالی">
                      <Banknote className="w-3 h-3 ml-1" />
                      پرداخت
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {commissions.length === 0 && (
              <tr>
                <td colSpan={7} className="p-8 text-center text-gray-500">موردی یافت نشد. ابتدا دکمه 'محاسبه مجدد KPI' را بزنید.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
