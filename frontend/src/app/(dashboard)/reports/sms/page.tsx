'use client';

import React, { useState, useEffect } from 'react';
import { api } from '@/services/api';
import { BarChart3, AlertCircle, CheckCircle2, Clock, Smartphone } from 'lucide-react';
import dayjs from 'dayjs';
import jalaliday from 'jalaliday';

dayjs.extend(jalaliday);

export default function SmsReportsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      const res = await api.get('/notifications/logs');
      setLogs(res);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const stats = {
    total: logs.length,
    sent: logs.filter(l => l.status === 'Sent' || l.status === 'Delivered').length,
    failed: logs.filter(l => l.status === 'Failed').length,
    pending: logs.filter(l => l.status === 'Pending' || l.status === 'Queued').length,
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex justify-between items-center bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-3 text-slate-800 dark:text-white">
            <BarChart3 className="w-7 h-7 text-indigo-500" />
            گزارش پیامک‌ها (SMS Reports)
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2 text-sm">
            نظارت بر ترافیک پیامک‌ها، وضعیت ارسال و خطاهای سیستمی.
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-slate-500 font-medium">کل پیام‌ها</p>
              <h3 className="text-3xl font-bold text-slate-800 dark:text-white mt-2">{stats.total}</h3>
            </div>
            <div className="p-3 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-xl">
              <Smartphone className="w-6 h-6" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-emerald-600 font-medium">ارسال موفق</p>
              <h3 className="text-3xl font-bold text-emerald-700 dark:text-emerald-400 mt-2">{stats.sent}</h3>
            </div>
            <div className="p-3 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-xl">
              <CheckCircle2 className="w-6 h-6" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-rose-600 font-medium">خطا در ارسال</p>
              <h3 className="text-3xl font-bold text-rose-700 dark:text-rose-400 mt-2">{stats.failed}</h3>
            </div>
            <div className="p-3 bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 rounded-xl">
              <AlertCircle className="w-6 h-6" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-amber-600 font-medium">در صف ارسال</p>
              <h3 className="text-3xl font-bold text-amber-700 dark:text-amber-400 mt-2">{stats.pending}</h3>
            </div>
            <div className="p-3 bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-xl">
              <Clock className="w-6 h-6" />
            </div>
          </div>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
          <h2 className="text-lg font-bold text-slate-800 dark:text-white">لاگ پیامک‌های اخیر</h2>
        </div>
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-8 text-center text-slate-500">در حال دریافت داده‌ها...</div>
          ) : (
            <table className="w-full text-sm text-right">
              <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-300 font-medium">
                <tr>
                  <th className="px-6 py-4">گیرنده</th>
                  <th className="px-6 py-4">متن پیام</th>
                  <th className="px-6 py-4">نوع / سرویس</th>
                  <th className="px-6 py-4">وضعیت</th>
                  <th className="px-6 py-4">تاریخ ارسال</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="px-6 py-4 font-mono text-slate-700 dark:text-slate-300" dir="ltr">{log.recipient}</td>
                    <td className="px-6 py-4">
                      <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 max-w-[250px]">
                        {log.message}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-slate-900 dark:text-white text-xs font-bold">{log.type}</div>
                      <div className="text-indigo-500 text-[10px] uppercase tracking-wide mt-1">{log.provider || 'N/A'}</div>
                    </td>
                    <td className="px-6 py-4">
                      {log.status === 'Sent' || log.status === 'Delivered' ? (
                        <span className="px-2.5 py-1 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 text-xs rounded-lg font-medium">ارسال شده</span>
                      ) : log.status === 'Failed' ? (
                        <span className="px-2.5 py-1 bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 text-xs rounded-lg font-medium">خطا</span>
                      ) : (
                        <span className="px-2.5 py-1 bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 text-xs rounded-lg font-medium">در صف</span>
                      )}
                      {log.errorMessage && <div className="text-[10px] text-rose-500 mt-1 max-w-[150px] truncate" title={log.errorMessage}>{log.errorMessage}</div>}
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-500" dir="ltr">
                      {log.sentAt ? dayjs(log.sentAt).calendar('jalali').format('YYYY/MM/DD HH:mm:ss') : '-'}
                    </td>
                  </tr>
                ))}
                {logs.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-slate-500">موردی یافت نشد.</td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
