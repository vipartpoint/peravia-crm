'use client';

import React, { useEffect, useState } from 'react';
import { api } from '@/services/api';
import { ShieldAlert, AlertTriangle, Fingerprint, Lock, ShieldCheck } from 'lucide-react';
import { DataTable } from '@/components/ui/DataTable';

export default function SecurityDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const res = await api.get('/sessions/dashboard');
      setData(res);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const unlockUser = async (id: string) => {
    alert('این قابلیت در پنل مدیریت کاربران فعال خواهد شد.');
  };

  const auditColumns = [
    { key: 'action', label: 'عملیات', render: (val: string) => <span className="font-bold text-slate-800 dark:text-slate-100" dir="ltr">{val}</span> },
    { key: 'user', label: 'کاربر', render: (_: any, row: any) => <span className="text-slate-600 dark:text-slate-300 font-medium">{row.user?.username || '---'}</span> },
    { key: 'entityType', label: 'موجودیت', render: (val: string) => <span className="text-slate-500 dark:text-slate-400 font-mono">{val}</span> },
    { key: 'createdAt', label: 'تاریخ و زمان', render: (val: string) => <span className="text-slate-500 dark:text-slate-400 font-mono" dir="ltr">{new Date(val).toLocaleString('fa-IR')}</span> }
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto min-h-screen space-y-6">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center">
            <ShieldAlert className="w-8 h-8 ml-3 text-indigo-600" />
            داشبورد امنیتی
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">پایش نشست‌ها، رویدادهای حساس و کاربران قفل شده</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Active Sessions Widget */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <div>
            <p className="text-slate-500 dark:text-slate-400 text-sm font-bold uppercase mb-1">نشست‌های فعال</p>
            <p className="text-3xl font-black text-indigo-600">{data?.activeSessionsCount || 0}</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center border border-indigo-100">
            <Fingerprint className="w-6 h-6 text-indigo-500" />
          </div>
        </div>

        {/* Failed Logins Widget */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <div>
            <p className="text-slate-500 dark:text-slate-400 text-sm font-bold uppercase mb-1">تلاش‌های ورود ناموفق</p>
            <p className="text-3xl font-black text-amber-500">{data?.failedLogins?.length || 0}</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center border border-amber-100">
            <AlertTriangle className="w-6 h-6 text-amber-500" />
          </div>
        </div>

        {/* Locked Users Widget */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <div>
            <p className="text-slate-500 dark:text-slate-400 text-sm font-bold uppercase mb-1">کاربران مسدود شده</p>
            <p className="text-3xl font-black text-rose-500">{data?.failedLogins?.filter((u: any) => u.isLocked).length || 0}</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-rose-50 flex items-center justify-center border border-rose-100">
            <Lock className="w-6 h-6 text-rose-500" />
          </div>
        </div>
      </div>

      {/* Failed Logins List */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
        <h2 className="font-bold text-slate-900 mb-4 flex items-center">
          <AlertTriangle className="w-5 h-5 ml-2 text-amber-500" /> کاربران با لاگین ناموفق
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {data?.failedLogins?.map((u: any) => (
            <div key={u.id} className="flex justify-between items-center p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
              <div>
                <p className="font-bold text-slate-900">{u.username}</p>
                <p className="text-xs text-rose-500 font-bold mt-1">{u.failedLogins} تلاش ناموفق</p>
              </div>
              {u.isLocked ? (
                <button onClick={() => unlockUser(u.id)} className="text-xs font-bold bg-white dark:bg-slate-900 text-rose-600 px-3 py-1.5 border border-rose-200 rounded-lg hover:bg-rose-50 shadow-sm transition">باز کردن قفل</button>
              ) : (
                <span className="text-xs text-amber-600 bg-amber-50 px-2.5 py-1 rounded-md font-bold border border-amber-200">در معرض خطر</span>
              )}
            </div>
          ))}
          {(!data?.failedLogins || data.failedLogins.length === 0) && (
            <p className="text-sm text-slate-500 dark:text-slate-400 col-span-full">هیچ کاربر در معرض خطری یافت نشد.</p>
          )}
        </div>
      </div>

      {/* Audit Logs DataTable */}
      <div className="pt-4">
        <h2 className="font-bold text-slate-900 mb-4 flex items-center px-1">
          <ShieldCheck className="w-5 h-5 ml-2 text-indigo-500" /> لاگ‌های ممیزی (Audit Logs)
        </h2>
        {loading ? (
          <div className="p-8 text-center text-slate-500 dark:text-slate-400">در حال بارگذاری...</div>
        ) : (
          <DataTable 
            entityType="audit"
            columns={auditColumns}
            data={data?.recentAudits || []}
            totalItems={data?.recentAudits?.length || 0}
            currentPage={1}
            onPageChange={() => {}}
            savedViews={['همه لاگ‌ها', 'لاگ‌های حساس', 'لاگ‌های ناموفق']}
          />
        )}
      </div>

    </div>
  );
}
