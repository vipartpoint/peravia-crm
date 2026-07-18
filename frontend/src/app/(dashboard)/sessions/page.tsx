'use client';

import React, { useEffect, useState } from 'react';
import { api } from '@/services/api';
import { TableSkeleton } from '@/components/ui/Skeleton';
import { DataTable } from '@/components/ui/DataTable';
import { LogOut } from 'lucide-react';

export default function SessionsPage() {
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSessions = async () => {
    try {
      const data = await api.get('/sessions');
      setSessions(data);
    } catch (e) {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  const handleRevoke = async (id: string) => {
    if (!confirm('آیا از پایان دادن به این نشست اطمینان دارید؟')) return;
    try {
      await api.delete(`/sessions/${id}/revoke`);
      alert('نشست پایان یافت');
      fetchSessions();
    } catch (e) {
      alert('خطا در انجام عملیات');
    }
  };

  const columns = [
    { key: 'user', label: 'کاربر', render: (_: any, row: any) => <span className="font-bold text-slate-900">{row.user?.username || '---'}</span> },
    { key: 'userAgent', label: 'دستگاه / مرورگر', render: (val: string) => <span className="text-slate-600 dark:text-slate-300 truncate max-w-xs block" title={val}>{val || 'Unknown'}</span> },
    { key: 'ipAddress', label: 'IP Address', render: (val: string) => <span className="font-mono text-slate-500 dark:text-slate-400">{val || '---'}</span> },
    { key: 'loginTime', label: 'زمان لاگین', render: (val: string) => <span className="text-slate-500 dark:text-slate-400">{new Date(val).toLocaleString('fa-IR')}</span> },
    { key: 'lastActivity', label: 'آخرین فعالیت', render: (val: string) => <span className="font-bold text-indigo-600">{new Date(val).toLocaleString('fa-IR')}</span> },
    { key: 'revoke', label: 'عملیات', render: (_: any, row: any) => (
      <button onClick={() => handleRevoke(row.id)} className="text-rose-600 hover:bg-rose-50 px-3 py-1.5 rounded-lg transition border border-rose-200 flex items-center text-xs font-bold bg-white dark:bg-slate-900">
        <LogOut className="w-3 h-3 ml-1" /> خروج
      </button>
    )}
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto min-h-screen">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">نشست‌های فعال (Active Sessions)</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">مدیریت دستگاه‌های متصل و اکانت‌های لاگین شده</p>
        </div>
      </div>

      {loading ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-700">
          <TableSkeleton rows={10} cols={6} />
        </div>
      ) : (
        <DataTable 
          entityType="session"
          columns={columns}
          data={sessions}
          totalItems={sessions.length}
          currentPage={1}
          onPageChange={() => {}}
          onRefresh={fetchSessions}
        />
      )}
    </div>
  );
}
