'use client';

import React, { useState, useEffect } from 'react';
import { Menu, Search, HelpCircle, X } from 'lucide-react';
import { Button } from '../ui/Button';
import NotificationBell from '@/components/NotificationBell';
import ApprovalBadge from '@/components/ApprovalBadge';
import { KeyboardShortcutsModal } from '@/components/ui/KeyboardShortcutsModal';
import { ThemeToggler } from '@/components/ui/ThemeToggler';
interface HeaderProps {
  isSidebarOpen: boolean;
  onToggleSidebar: () => void;
  user?: any;
}

export function Header({ isSidebarOpen, onToggleSidebar, user }: HeaderProps) {
  const [currentDate, setCurrentDate] = useState('');
  const [currentTime, setCurrentTime] = useState('');
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentDate(new Intl.DateTimeFormat('fa-IR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }).format(now));
      setCurrentTime(new Intl.DateTimeFormat('fa-IR', { hour: '2-digit', minute: '2-digit' }).format(now));
    };
    updateTime();
    const interval = setInterval(updateTime, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <>
      <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between px-4 sm:px-6 z-50 shrink-0 relative">
        <div className="flex items-center gap-4">
          <button 
            onClick={onToggleSidebar} 
            className="p-2 -mr-2 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200 rounded-xl transition-colors focus:outline-none"
          >
            {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          
          <div className="hidden lg:flex items-center gap-3">
            <div className="text-[13px] font-medium text-slate-500 dark:text-slate-400">{currentDate}</div>
            <div className="w-1 h-1 bg-slate-200 dark:bg-slate-700 rounded-full" />
            <div className="text-[13px] font-medium text-slate-500 dark:text-slate-400">{currentTime}</div>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-4">

          <button 
            data-tour="tour-command"
            onClick={() => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true }))}
            className="hidden sm:flex items-center gap-2 px-3 py-1.5 text-sm text-slate-500 bg-slate-50 hover:bg-slate-100 border border-transparent rounded-xl transition-colors dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300"
          >
            <Search className="w-4 h-4" />
            <span>جستجو...</span>
            <kbd className="hidden sm:inline-flex items-center gap-1 px-1.5 font-mono text-[10px] font-medium text-slate-400 bg-white border border-slate-100 rounded dark:bg-slate-900 dark:border-slate-700">
              <span className="text-[10px]">⌘</span>K
            </kbd>
          </button>

          <ThemeToggler />

          {/* Help Menu */}
          <div className="relative group">
            <button className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-colors focus:outline-none">
              <HelpCircle className="w-5 h-5" />
            </button>
            <div className="absolute left-0 top-full mt-1 w-48 bg-white dark:bg-slate-900 rounded-xl shadow-lg border border-slate-100 dark:border-slate-800 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 overflow-hidden flex flex-col">
              <button 
                onClick={() => window.dispatchEvent(new CustomEvent('start-page-tour'))}
                className="text-right px-4 py-3 text-[13px] text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 border-b border-slate-100 dark:border-slate-800 transition-colors"
              >
                شروع آموزش صفحه فعلی
              </button>
              <button 
                onClick={() => setIsShortcutsOpen(true)}
                className="text-right px-4 py-3 text-[13px] text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                راهنمای کلیدهای میانبر
              </button>
            </div>
          </div>

          <ApprovalBadge />
          <NotificationBell />

          <div className="h-6 w-px bg-slate-100 dark:bg-slate-800 mx-1 sm:mx-2" />

          <div className="flex items-center gap-3 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 p-1.5 -mr-1.5 rounded-xl transition-colors">
            <div className="hidden sm:flex flex-col items-end">
              <span className="font-semibold text-sm text-slate-700 dark:text-slate-200">ادمین سیستم</span>
              <span className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">SystemAdmin</span>
            </div>
            <div className="w-9 h-9 rounded-xl bg-teal-600 flex items-center justify-center text-white font-bold shadow-sm">
              A
            </div>
          </div>
        </div>
      </header>

      <KeyboardShortcutsModal 
        isOpen={isShortcutsOpen} 
        onClose={() => setIsShortcutsOpen(false)} 
      />
    </>
  );
}
