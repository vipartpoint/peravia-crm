'use client';
import { useState, useEffect } from 'react';
import { api } from '@/services/api';
import { CheckSquare, CheckCircle, Clock } from 'lucide-react';

export default function TasksPage() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      const data = await api.get('/tasks');
      setTasks(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const markDone = async (id: string) => {
    try {
      await api.patch(`/tasks/${id}`, { status: 'Done' });
      fetchTasks();
    } catch (e) {
      alert('خطا در بروزرسانی');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight flex items-center">
            <CheckSquare className="w-8 h-8 ml-3 text-rose-600" />
            مدیریت تسک‌ها
          </h1>
          <p className="text-gray-500 text-sm mt-1 font-medium">پیگیری کارها و وظایف</p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center p-12"><div className="w-8 h-8 border-4 border-rose-500 border-t-transparent rounded-full animate-spin"></div></div>
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
          <table className="w-full text-right">
            <thead className="bg-gray-50/50 text-gray-500 text-xs border-b border-gray-100 dark:border-gray-800">
              <tr>
                <th className="p-4 font-bold">عنوان کار</th>
                <th className="p-4 font-bold">مرتبط با</th>
                <th className="p-4 font-bold">مهلت انجام</th>
                <th className="p-4 font-bold">وضعیت</th>
                <th className="p-4 font-bold">ارجاع به</th>
                <th className="p-4 font-bold text-center">عملیات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {tasks.map((t: any) => (
                <tr key={t.id} className="hover:bg-gray-50/50 transition">
                  <td className="p-4 font-bold text-gray-900">{t.title}</td>
                  <td className="p-4 text-gray-500">{t.relatedType || '-'}</td>
                  <td className="p-4 font-mono text-gray-600" dir="ltr">{t.dueAt ? new Date(t.dueAt).toLocaleString('fa-IR') : '-'}</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded text-xs font-bold 
                      ${t.status === 'Done' ? 'bg-emerald-100 text-emerald-700' : 
                        t.status === 'Overdue' ? 'bg-red-100 text-red-700 animate-pulse' : 
                        'bg-gray-100 text-gray-700 dark:text-gray-200'}`}>
                      {t.status}
                    </span>
                  </td>
                  <td className="p-4 text-gray-600 font-bold">{t.assignee?.username}</td>
                  <td className="p-4 text-center space-x-2 space-x-reverse">
                    {t.status !== 'Done' && (
                      <button onClick={() => markDone(t.id)} className="inline-block p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition" title="علامت‌گذاری به عنوان انجام شده">
                        <CheckCircle className="w-5 h-5" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {tasks.length === 0 && (
                <tr><td colSpan={6} className="p-8 text-center text-gray-500">هیچ تسکی یافت نشد.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
