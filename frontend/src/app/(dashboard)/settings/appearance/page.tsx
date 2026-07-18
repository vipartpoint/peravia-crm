'use client';

import { useState, useEffect } from 'react';
import { Palette, Sun, Moon, Monitor } from 'lucide-react';
import { useToast } from '@/components/ui/Toast';

export default function AppearanceSettingsPage() {
  const { toast } = useToast();
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('system');

  useEffect(() => {
    const saved = localStorage.getItem('theme') as any;
    if (saved) setTheme(saved);
  }, []);

  const handleSave = (selectedTheme: 'light' | 'dark' | 'system') => {
    setTheme(selectedTheme);
    localStorage.setItem('theme', selectedTheme);
    
    if (selectedTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else if (selectedTheme === 'light') {
      document.documentElement.classList.remove('dark');
    } else {
      if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
    
    toast({ type: 'success', title: 'موفقیت', description: 'پوسته سیستم با موفقیت تغییر یافت.' });
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 flex items-center gap-3">
        <div className="p-3 bg-pink-50 text-pink-600 rounded-xl">
          <Palette className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">ظاهر سیستم</h1>
          <p className="text-sm text-slate-500">تنظیمات پوسته و نحوه نمایش سیستم را مدیریت کنید.</p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 p-6 space-y-6">
        <h3 className="font-bold text-slate-800 dark:text-slate-100 border-b dark:border-slate-800 pb-2">پوسته نمایشی</h3>
        
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <button 
            onClick={() => handleSave('light')}
            className={`flex flex-col items-center justify-center p-6 rounded-2xl border-2 transition-colors ${theme === 'light' ? 'border-pink-500 bg-pink-50 dark:bg-pink-900/20' : 'border-slate-200 dark:border-slate-700 hover:border-pink-300'}`}
          >
            <Sun className={`w-8 h-8 mb-3 ${theme === 'light' ? 'text-pink-600 dark:text-pink-400' : 'text-slate-400'}`} />
            <span className={`font-medium ${theme === 'light' ? 'text-pink-700 dark:text-pink-300' : 'text-slate-600 dark:text-slate-400'}`}>روشن</span>
          </button>

          <button 
            onClick={() => handleSave('dark')}
            className={`flex flex-col items-center justify-center p-6 rounded-2xl border-2 transition-colors ${theme === 'dark' ? 'border-pink-500 bg-pink-50 dark:bg-pink-900/20' : 'border-slate-200 dark:border-slate-700 hover:border-pink-300'}`}
          >
            <Moon className={`w-8 h-8 mb-3 ${theme === 'dark' ? 'text-pink-600 dark:text-pink-400' : 'text-slate-400'}`} />
            <span className={`font-medium ${theme === 'dark' ? 'text-pink-700 dark:text-pink-300' : 'text-slate-600 dark:text-slate-400'}`}>تاریک</span>
          </button>

          <button 
            onClick={() => handleSave('system')}
            className={`flex flex-col items-center justify-center p-6 rounded-2xl border-2 transition-colors ${theme === 'system' ? 'border-pink-500 bg-pink-50 dark:bg-pink-900/20' : 'border-slate-200 dark:border-slate-700 hover:border-pink-300'}`}
          >
            <Monitor className={`w-8 h-8 mb-3 ${theme === 'system' ? 'text-pink-600 dark:text-pink-400' : 'text-slate-400'}`} />
            <span className={`font-medium ${theme === 'system' ? 'text-pink-700 dark:text-pink-300' : 'text-slate-600 dark:text-slate-400'}`}>هماهنگ با سیستم</span>
          </button>
        </div>
      </div>
    </div>
  );
}
