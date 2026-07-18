'use client';

import React from 'react';
import { Settings, Bell, Shield, User, Globe, Key, Palette, Webhook } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/components/ui/Toast';
import { useRouter } from 'next/navigation';

export default function SettingsPage() {
  const { toast } = useToast();
  const router = useRouter();

  const settingModules = [
    {
      title: 'پروفایل کاربری',
      description: 'مدیریت اطلاعات شخصی و تصویر پروفایل',
      icon: User,
      href: '/settings/profile',
      color: 'text-blue-500',
      bg: 'bg-blue-50'
    },
    {
      title: 'اعلان‌ها',
      description: 'تنظیمات دریافت پیامک، ایمیل و نوتیفیکیشن‌ها',
      icon: Bell,
      href: '/settings/notifications',
      color: 'text-amber-500',
      bg: 'bg-amber-50'
    },
    {
      title: 'امنیت و رمز عبور',
      description: 'تغییر رمز عبور و احراز هویت دو مرحله‌ای',
      icon: Shield,
      href: null, // Sandbox per user request
      color: 'text-emerald-500',
      bg: 'bg-emerald-50'
    },
    {
      title: 'دسترسی‌ها',
      description: 'مدیریت نقش‌ها و دسترسی‌های کاربران سیستم',
      icon: Key,
      href: '/permissions',
      color: 'text-purple-500',
      bg: 'bg-purple-50'
    },
    {
      title: 'ظاهر سیستم',
      description: 'تنظیمات پوسته، حالت تاریک و فونت‌ها',
      icon: Palette,
      href: '/settings/appearance',
      color: 'text-pink-500',
      bg: 'bg-pink-50'
    },
    {
      title: 'تنظیمات عمومی',
      description: 'تنظیمات زبان، منطقه زمانی و قالب تاریخ',
      icon: Globe,
      href: null,
      color: 'text-slate-500 dark:text-slate-400',
      bg: 'bg-slate-50 dark:bg-slate-800/50'
    },
    {
      title: 'کلیدهای دسترسی (API)',
      description: 'مدیریت ارتباطات امن برای سرویس‌های خارجی',
      icon: Webhook,
      href: '/settings/integrations/api-keys',
      color: 'text-indigo-500 dark:text-indigo-400',
      bg: 'bg-indigo-50 dark:bg-indigo-900/30'
    },
    {
      title: 'مدیریت درگاه‌های پیامک',
      description: 'افزودن و تنظیم ارائه‌دهندگان سرویس پیامک',
      icon: Bell,
      href: '/settings/sms-providers',
      color: 'text-violet-500 dark:text-violet-400',
      bg: 'bg-violet-50 dark:bg-violet-900/30'
    },
    {
      title: 'مدیریت کاتالوگ‌ها',
      description: 'مدیریت مقادیر پایه‌ای سیستم مانند دلایل شکست و رُقبا',
      icon: Settings,
      href: '/settings/catalogs',
      color: 'text-orange-500 dark:text-orange-400',
      bg: 'bg-orange-50 dark:bg-orange-900/30'
    }
  ];

  const handleModuleClick = (href: string | null) => {
    if (href) {
      router.push(href);
    } else {
      toast({ type: 'info', title: 'در دست توسعه', description: 'این بخش در نسخه بعدی فعال خواهد شد.' });
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-black text-slate-800 dark:text-white tracking-tight flex items-center gap-3">
          <Settings className="w-8 h-8 text-teal-600 dark:text-teal-400" />
          تنظیمات سیستم
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-2 font-medium">پیکربندی و مدیریت تنظیمات کلی سامانه مدیریت ارتباط با مشتری</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {settingModules.map((module, idx) => {
          const Icon = module.icon;
          return (
            <div 
              key={idx} 
              onClick={() => handleModuleClick(module.href)}
              className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 hover:border-teal-200 dark:hover:border-teal-700 hover:shadow-md transition-all group cursor-pointer flex flex-col"
            >
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${module.bg} dark:bg-slate-800 group-hover:scale-110 transition-transform`}>
                <Icon className={`w-6 h-6 ${module.color}`} />
              </div>
              <h3 className="font-bold text-slate-800 dark:text-slate-200 mb-2 group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">{module.title}</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                {module.description}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
