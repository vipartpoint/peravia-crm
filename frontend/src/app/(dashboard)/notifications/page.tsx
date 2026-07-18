'use client';

import { useState, useEffect } from 'react';
import { api } from '@/services/api';
import { Bell, Check, Trash2, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/notifications');
      setNotifications(res.data.data || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.patch('/notifications/read-all', {});
      setNotifications(notifications.map(n => ({ ...n, status: 'Read' })));
    } catch (e) {}
  };

  const markAsRead = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await api.patch(`/notifications/${id}/read`, {});
      setNotifications(notifications.map(n => n.id === id ? { ...n, status: 'Read' } : n));
    } catch (e) {}
  };

  const handleNotifClick = async (notif: any) => {
    if (notif.status === 'Unread') {
      await markAsRead(notif.id, { stopPropagation: () => {} } as any);
    }
    if (notif.actionUrl) {
      router.push(notif.actionUrl);
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'Critical': return <span className="bg-rose-100 text-rose-700 px-2 py-0.5 rounded text-xs">بحرانی</span>;
      case 'Warning': return <span className="bg-amber-100 text-amber-700 px-2 py-0.5 rounded text-xs">هشدار</span>;
      case 'Success': return <span className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded text-xs">موفق</span>;
      default: return <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-xs">اطلاع‌رسانی</span>;
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex justify-between items-center bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800">
        <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <Bell className="w-6 h-6 text-indigo-500" />
          مرکز نوتیفیکیشن‌ها
        </h1>
        <div className="flex gap-2">
          <button 
            onClick={markAllAsRead}
            className="text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 dark:text-gray-200 px-4 py-2 rounded-xl transition-colors font-medium flex items-center gap-2"
          >
            <Check className="w-4 h-4" />
            خواندن همه
          </button>
          <Link href="/settings/notifications" className="text-sm bg-indigo-50 hover:bg-indigo-100 text-indigo-700 px-4 py-2 rounded-xl transition-colors font-medium">
            تنظیمات
          </Link>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-400">در حال بارگذاری...</div>
        ) : notifications.length === 0 ? (
          <div className="p-12 text-center text-gray-400 flex flex-col items-center">
            <Bell className="w-12 h-12 mb-4 opacity-20" />
            <p>هیچ اعلانی یافت نشد</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {notifications.map((notif) => (
              <div 
                key={notif.id} 
                onClick={() => handleNotifClick(notif)}
                className={`p-5 flex gap-4 transition-colors cursor-pointer ${notif.status === 'Read' ? 'bg-white dark:bg-slate-900 hover:bg-gray-50' : 'bg-blue-50/40 hover:bg-blue-50/60'}`}
              >
                <div className="flex-shrink-0 mt-1">
                  <div className={`w-3 h-3 rounded-full ${notif.status === 'Read' ? 'bg-gray-300' : 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]'}`} />
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start mb-1">
                    <div className="flex items-center gap-2">
                      <h3 className={`font-bold ${notif.status === 'Read' ? 'text-gray-700 dark:text-gray-200' : 'text-gray-900'}`}>
                        {notif.title}
                      </h3>
                      {getPriorityBadge(notif.priority)}
                    </div>
                    <span className="text-xs text-gray-400">
                      {new Date(notif.createdAt).toLocaleString('fa-IR')}
                    </span>
                  </div>
                  <p className={`text-sm ${notif.status === 'Read' ? 'text-gray-500' : 'text-gray-700 dark:text-gray-200'} leading-relaxed`}>
                    {notif.message}
                  </p>
                  
                  {notif.actionUrl && (
                    <div className="mt-3 flex items-center text-xs font-medium text-indigo-600">
                      مشاهده جزئیات
                      <ArrowRight className="w-3 h-3 ml-1 rotate-180" />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
