'use client';

import React, { useState } from 'react';
import { Settings } from 'lucide-react';
import CatalogEngine, { CatalogConfig } from '@/components/settings/CatalogEngine';

const lostReasonsConfig: CatalogConfig = {
  type: 'lost-reasons',
  title: 'دلایل شکست',
  columns: [
    { key: 'code', label: 'کد سیستمی' },
    { key: 'nameFa', label: 'عنوان (فارسی)' },
    { key: 'nameEn', label: 'عنوان (انگلیسی)' },
    { key: 'sortOrder', label: 'ترتیب' }
  ],
  formFields: [
    { name: 'code', label: 'کد سیستمی', type: 'text', required: true },
    { name: 'nameFa', label: 'عنوان (فارسی)', type: 'text', required: true },
    { name: 'nameEn', label: 'عنوان (انگلیسی)', type: 'text', required: true },
    { name: 'description', label: 'توضیحات', type: 'textarea' },
    { name: 'sortOrder', label: 'ترتیب نمایش', type: 'number', required: true },
    { name: 'isActive', label: 'وضعیت فعال بودن', type: 'boolean' }
  ]
};

const reopenReasonsConfig: CatalogConfig = {
  type: 'reopen-reasons',
  title: 'دلایل بازگشایی',
  columns: [
    { key: 'code', label: 'کد سیستمی' },
    { key: 'nameFa', label: 'عنوان (فارسی)' },
    { key: 'nameEn', label: 'عنوان (انگلیسی)' },
    { key: 'sortOrder', label: 'ترتیب' }
  ],
  formFields: [
    { name: 'code', label: 'کد سیستمی', type: 'text', required: true },
    { name: 'nameFa', label: 'عنوان (فارسی)', type: 'text', required: true },
    { name: 'nameEn', label: 'عنوان (انگلیسی)', type: 'text', required: true },
    { name: 'description', label: 'توضیحات', type: 'textarea' },
    { name: 'sortOrder', label: 'ترتیب نمایش', type: 'number', required: true },
    { name: 'isActive', label: 'وضعیت فعال بودن', type: 'boolean' }
  ]
};

const competitorsConfig: CatalogConfig = {
  type: 'competitors',
  title: 'رقبا',
  columns: [
    { key: 'name', label: 'نام رقیب' },
    { key: 'website', label: 'وب‌سایت' }
  ],
  formFields: [
    { name: 'name', label: 'نام رقیب', type: 'text', required: true },
    { name: 'website', label: 'وب‌سایت', type: 'text' },
    { name: 'notes', label: 'یادداشت', type: 'textarea' },
    { name: 'isActive', label: 'وضعیت فعال بودن', type: 'boolean' }
  ]
};

const presentationMethodsConfig: CatalogConfig = {
  type: 'presentation-methods',
  title: 'روش‌های پرزنت',
  columns: [
    { key: 'code', label: 'کد سیستمی' },
    { key: 'nameFa', label: 'عنوان (فارسی)' },
    { key: 'nameEn', label: 'عنوان (انگلیسی)' },
    { key: 'sortOrder', label: 'ترتیب' }
  ],
  formFields: [
    { name: 'code', label: 'کد سیستمی', type: 'text', required: true },
    { name: 'nameFa', label: 'عنوان (فارسی)', type: 'text', required: true },
    { name: 'nameEn', label: 'عنوان (انگلیسی)', type: 'text', required: true },
    { name: 'description', label: 'توضیحات', type: 'textarea' },
    { name: 'sortOrder', label: 'ترتیب نمایش', type: 'number', required: true },
    { name: 'isActive', label: 'وضعیت فعال بودن', type: 'boolean' }
  ]
};

const customerReactionsConfig: CatalogConfig = {
  type: 'customer-reactions',
  title: 'واکنش‌های مشتری',
  columns: [
    { key: 'code', label: 'کد سیستمی' },
    { key: 'nameFa', label: 'عنوان (فارسی)' },
    { key: 'nameEn', label: 'عنوان (انگلیسی)' },
    { key: 'sortOrder', label: 'ترتیب' }
  ],
  formFields: [
    { name: 'code', label: 'کد سیستمی', type: 'text', required: true },
    { name: 'nameFa', label: 'عنوان (فارسی)', type: 'text', required: true },
    { name: 'nameEn', label: 'عنوان (انگلیسی)', type: 'text', required: true },
    { name: 'description', label: 'توضیحات', type: 'textarea' },
    { name: 'sortOrder', label: 'ترتیب نمایش', type: 'number', required: true },
    { name: 'isActive', label: 'وضعیت فعال بودن', type: 'boolean' }
  ]
};

export default function CatalogsManagementPage() {
  const [activeTab, setActiveTab] = useState<'lost-reasons' | 'reopen-reasons' | 'competitors' | 'presentation-methods' | 'customer-reactions'>('lost-reasons');

  const configs = {
    'lost-reasons': lostReasonsConfig,
    'reopen-reasons': reopenReasonsConfig,
    'competitors': competitorsConfig,
    'presentation-methods': presentationMethodsConfig,
    'customer-reactions': customerReactionsConfig
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-black text-slate-800 dark:text-white tracking-tight flex items-center gap-3">
          <Settings className="w-8 h-8 text-orange-600 dark:text-orange-400" />
          مدیریت کاتالوگ‌ها
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-2 font-medium">
          مدیریت مقادیر پایه‌ای سیستم جهت استانداردسازی داده‌ها و گزارش‌گیری
        </p>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        <button
          onClick={() => setActiveTab('lost-reasons')}
          className={`px-5 py-2.5 rounded-xl font-bold whitespace-nowrap transition-colors ${
            activeTab === 'lost-reasons'
              ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
          }`}
        >
          دلایل شکست
        </button>
        <button
          onClick={() => setActiveTab('reopen-reasons')}
          className={`px-5 py-2.5 rounded-xl font-bold whitespace-nowrap transition-colors ${
            activeTab === 'reopen-reasons'
              ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
          }`}
        >
          دلایل بازگشایی
        </button>
        <button
          onClick={() => setActiveTab('competitors')}
          className={`px-5 py-2.5 rounded-xl font-bold whitespace-nowrap transition-colors ${
            activeTab === 'competitors'
              ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
          }`}
        >
          رقبا
        </button>
        <button
          onClick={() => setActiveTab('presentation-methods')}
          className={`px-5 py-2.5 rounded-xl font-bold whitespace-nowrap transition-colors ${
            activeTab === 'presentation-methods'
              ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
          }`}
        >
          روش‌های پرزنت
        </button>
        <button
          onClick={() => setActiveTab('customer-reactions')}
          className={`px-5 py-2.5 rounded-xl font-bold whitespace-nowrap transition-colors ${
            activeTab === 'customer-reactions'
              ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
          }`}
        >
          واکنش مشتریان
        </button>
      </div>

      <CatalogEngine key={activeTab} config={configs[activeTab]} />
    </div>
  );
}
