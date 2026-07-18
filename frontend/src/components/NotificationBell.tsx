'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Bell, Check, X, Archive, Filter } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '@/services/api';
import Link from 'next/link';

type FilterType = 'all' | 'unread' | 'system' | 'financial';

export default function NotificationBell() {
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchUnreadCount = async () => {
    try {
      const res = await api.get('/notifications/unread-count');
      setUnreadCount(res.data.unreadCount || 0);
    } catch (e) {}
  };

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/notifications');
      setNotifications(res.data.data || []);
    } catch (e) {}
  };

  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const markAllAsRead = async () => {
    try {
      await api.patch('/notifications/read-all', {});
      setUnreadCount(0);
      setNotifications(notifications.map(n => ({ ...n, status: 'Read' })));
    } catch (e) {}
  };

  const markAsRead = async (id: string) => {
    try {
      await api.patch(`/notifications/${id}/read`, {});
      setUnreadCount(prev => Math.max(0, prev - 1));
      setNotifications(notifications.map(n => n.id === id ? { ...n, status: 'Read' } : n));
    } catch (e) {}
  };

  const archiveNotification = async (id: string) => {
    try {
      await api.patch(`/notifications/${id}/archive`, {});
      setNotifications(notifications.filter(n => n.id !== id));
      const notif = notifications.find(n => n.id === id);
      if (notif && notif.status === 'Unread') {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (e) {}
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Critical': return 'bg-rose-500 text-white';
      case 'Warning': return 'bg-amber-500 text-white';
      case 'Success': return 'bg-emerald-500 text-white';
      default: return 'bg-blue-500 text-white';
    }
  };

  const filteredNotifications = notifications.filter(n => {
    if (activeFilter === 'unread') return n.status === 'Unread';
    if (activeFilter === 'system') return n.type === 'System' || n.type === 'Alert';
    if (activeFilter === 'financial') return n.type === 'Financial' || n.entityType === 'Cheque';
    return true;
  });

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-slate-500 dark:text-slate-400 hover:text-primary transition bg-slate-100 dark:bg-slate-800 rounded-full hover:bg-primary/10"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 w-4 h-4 bg-rose-500 text-white text-[9px] font-bold flex items-center justify-center rounded-full border-2 border-white shadow-sm">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute top-full left-0 right-auto mt-3 w-[320px] sm:w-[380px] bg-white dark:bg-slate-900 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-slate-100 dark:border-slate-800 overflow-hidden z-[100] origin-top-left"
          >
            <div className="p-5 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
              <h3 className="font-bold text-foreground">اعلان‌ها</h3>
              <div className="flex gap-2">
                <button onClick={markAllAsRead} className="text-xs text-primary hover:text-primary-hover font-medium bg-primary/10 px-2 py-1 rounded">
                  خواندن همه
                </button>
              </div>
            </div>

            {/* Filters */}
            <div className="flex px-4 py-3 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 gap-2 overflow-x-auto no-scrollbar">
              <button onClick={() => setActiveFilter('all')} className={`text-xs px-3 py-1.5 rounded-full font-medium whitespace-nowrap transition-colors ${activeFilter === 'all' ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>همه</button>
              <button onClick={() => setActiveFilter('unread')} className={`text-xs px-3 py-1.5 rounded-full font-medium whitespace-nowrap transition-colors ${activeFilter === 'unread' ? 'bg-primary text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>خوانده نشده</button>
              <button onClick={() => setActiveFilter('system')} className={`text-xs px-3 py-1.5 rounded-full font-medium whitespace-nowrap transition-colors ${activeFilter === 'system' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>سیستمی</button>
              <button onClick={() => setActiveFilter('financial')} className={`text-xs px-3 py-1.5 rounded-full font-medium whitespace-nowrap transition-colors ${activeFilter === 'financial' ? 'bg-rose-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>مالی</button>
            </div>
            
            <div className="max-h-[350px] overflow-y-auto">
              {filteredNotifications.length === 0 ? (
                <div className="p-8 text-center text-slate-400">
                  <Bell className="w-8 h-8 mx-auto mb-2 opacity-20" />
                  اعلانی در این بخش ندارید
                </div>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredNotifications.slice(0, 15).map((notif) => (
                    <div key={notif.id} className={`group p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors relative ${notif.status === 'Unread' ? 'bg-primary/5 dark:bg-primary/10' : ''}`}>
                      <div className="flex gap-3 pr-2">
                        <div className={`mt-1.5 flex-shrink-0 w-2 h-2 rounded-full ${notif.status === 'Read' ? 'bg-slate-300' : getPriorityColor(notif.priority)}`} />
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-bold ${notif.status === 'Unread' ? 'text-foreground' : 'text-slate-600'}`}>
                            {notif.title}
                          </p>
                          <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                            {notif.message}
                          </p>
                          {notif.actionUrl && (
                            <Link href={notif.actionUrl} onClick={() => setIsOpen(false)} className="inline-block mt-2 text-xs text-primary font-medium hover:underline">
                              مشاهده جزئیات
                            </Link>
                          )}
                          <div className="mt-2 flex items-center justify-between">
                            <span className="text-[10px] text-slate-400 font-medium">
                              {new Date(notif.createdAt).toLocaleString('fa-IR')}
                            </span>
                            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              {notif.status === 'Unread' && (
                                <button 
                                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); markAsRead(notif.id); }}
                                  className="text-xs text-primary hover:text-primary-hover flex items-center gap-1"
                                  title="علامت به عنوان خوانده شده"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                </button>
                              )}
                              <button 
                                onClick={(e) => { e.preventDefault(); e.stopPropagation(); archiveNotification(notif.id); }}
                                className="text-xs text-slate-400 hover:text-rose-500 flex items-center gap-1"
                                title="آرشیو کردن"
                              >
                                <Archive className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <div className="p-4 bg-slate-50/50 dark:bg-slate-800/20 border-t border-slate-100 dark:border-slate-800 text-center">
              <Link href="/notifications" onClick={() => setIsOpen(false)} className="text-xs text-primary hover:text-primary-hover font-bold flex justify-center items-center gap-1">
                مشاهده تمام اعلان‌ها
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
