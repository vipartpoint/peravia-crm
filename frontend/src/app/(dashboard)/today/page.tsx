'use client';
import { useState, useEffect } from 'react';
import { api } from '@/services/api';
import { CalendarDays, AlertCircle, CheckSquare, MapPin, CheckCircle } from 'lucide-react';
import Link from 'next/link';

export default function TodayDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [todayTasks, setTodayTasks] = useState([]);
  const [overdueTasks, setOverdueTasks] = useState([]);
  const [todayVisits, setTodayVisits] = useState([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [tTasks, oTasks, tVisits] = await Promise.all([
        api.get('/tasks/today'),
        api.get('/tasks/overdue'),
        api.get('/visits/today'),
      ]);
      setTodayTasks(tTasks);
      setOverdueTasks(oTasks);
      setTodayVisits(tVisits);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const markTaskDone = async (id: string) => {
    try {
      await api.patch(`/tasks/${id}`, { status: 'Done' });
      fetchDashboardData();
    } catch (e) {
      alert('خطا');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black text-gray-900 tracking-tight flex items-center">
          <CalendarDays className="w-8 h-8 ml-3 text-blue-600" />
          کارهای امروز (Today)
        </h1>
        <p className="text-gray-500 text-sm mt-1 font-medium">برنامه روزانه، ویزیت‌ها و پیگیری‌ها</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* Overdue Tasks */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-red-100 overflow-hidden">
          <div className="bg-red-50 p-4 border-b border-red-100 flex items-center">
            <AlertCircle className="w-5 h-5 text-red-600 ml-2 animate-pulse" />
            <h3 className="font-bold text-red-900">عقب‌افتاده‌ها ({overdueTasks.length})</h3>
          </div>
          <div className="p-4 space-y-3">
            {loading ? <div className="animate-pulse h-10 bg-gray-100 rounded"></div> : overdueTasks.map((t: any) => (
              <div key={t.id} className="p-3 border border-red-100 rounded-xl bg-red-50/50 flex justify-between items-center">
                <div>
                  <p className="font-bold text-sm text-gray-900">{t.title}</p>
                  <p className="text-xs text-red-500 mt-1" dir="ltr">{new Date(t.dueAt).toLocaleDateString('fa-IR')}</p>
                </div>
                <button onClick={() => markTaskDone(t.id)} className="text-emerald-600 p-1 hover:bg-emerald-100 rounded"><CheckCircle className="w-5 h-5"/></button>
              </div>
            ))}
            {!loading && overdueTasks.length === 0 && <p className="text-sm text-gray-500 text-center">عالی! کار عقب‌افتاده‌ای ندارید.</p>}
          </div>
        </div>

        {/* Today Tasks */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-blue-100 overflow-hidden">
          <div className="bg-blue-50 p-4 border-b border-blue-100 flex items-center justify-between">
            <div className="flex items-center">
              <CheckSquare className="w-5 h-5 text-blue-600 ml-2" />
              <h3 className="font-bold text-blue-900">کارهای امروز ({todayTasks.length})</h3>
            </div>
            <Link href="/tasks" className="text-xs text-blue-600 hover:underline">مشاهده همه</Link>
          </div>
          <div className="p-4 space-y-3">
            {loading ? <div className="animate-pulse h-10 bg-gray-100 rounded"></div> : todayTasks.map((t: any) => (
              <div key={t.id} className="p-3 border border-gray-100 dark:border-gray-800 rounded-xl bg-gray-50 flex justify-between items-center">
                <div>
                  <p className={`font-bold text-sm ${t.status === 'Done' ? 'text-gray-400 line-through' : 'text-gray-900'}`}>{t.title}</p>
                  <p className="text-xs text-gray-500 mt-1">{t.relatedType}</p>
                </div>
                {t.status !== 'Done' && (
                  <button onClick={() => markTaskDone(t.id)} className="text-emerald-600 p-1 hover:bg-emerald-100 rounded"><CheckCircle className="w-5 h-5"/></button>
                )}
              </div>
            ))}
            {!loading && todayTasks.length === 0 && <p className="text-sm text-gray-500 text-center">برای امروز تسکی ثبت نشده است.</p>}
          </div>
        </div>

        {/* Today Visits */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-emerald-100 overflow-hidden">
          <div className="bg-emerald-50 p-4 border-b border-emerald-100 flex items-center justify-between">
            <div className="flex items-center">
              <MapPin className="w-5 h-5 text-emerald-600 ml-2" />
              <h3 className="font-bold text-emerald-900">ویزیت‌های امروز ({todayVisits.length})</h3>
            </div>
            <Link href="/visits/new" className="text-xs text-emerald-600 hover:underline">افزودن</Link>
          </div>
          <div className="p-4 space-y-3">
            {loading ? <div className="animate-pulse h-10 bg-gray-100 rounded"></div> : todayVisits.map((v: any) => (
              <div key={v.id} className="p-3 border border-gray-100 dark:border-gray-800 rounded-xl bg-gray-50">
                <p className="font-bold text-sm text-gray-900">{v.customer?.name || v.lead?.name}</p>
                <div className="flex justify-between items-center mt-2">
                  <p className="text-xs text-gray-500" dir="ltr">{new Date(v.scheduledAt).toLocaleTimeString('fa-IR', {hour: '2-digit', minute:'2-digit'})}</p>
                  <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded">{v.status}</span>
                </div>
              </div>
            ))}
            {!loading && todayVisits.length === 0 && <p className="text-sm text-gray-500 text-center">ویزیت برای امروز تنظیم نشده است.</p>}
          </div>
        </div>

      </div>
    </div>
  );
}
