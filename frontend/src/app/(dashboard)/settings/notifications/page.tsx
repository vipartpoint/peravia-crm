'use client';

import { useState, useEffect } from 'react';
import { api } from '@/services/api';
import { Settings, Save, AlertCircle, RefreshCw } from 'lucide-react';

export default function NotificationSettingsPage() {
  const [prefs, setPrefs] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchPrefs();
  }, []);

  const fetchPrefs = async () => {
    try {
      const res = await api.get('/notifications/preferences');
      setPrefs(res);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage('');
    try {
      await api.patch('/notifications/preferences', prefs);
      setMessage('تنظیمات با موفقیت ذخیره شد.');
    } catch (e) {
      setMessage('خطا در ذخیره تنظیمات.');
    } finally {
      setSaving(false);
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const togglePref = (key: string) => {
    setPrefs({ ...prefs, [key]: !prefs[key] });
  };

  if (loading) return <div className="p-10 text-center text-gray-500">در حال بارگذاری...</div>;
  if (!prefs) return <div className="p-10 text-center text-rose-500">تنظیمات یافت نشد</div>;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 flex items-center gap-3">
        <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
          <Settings className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">تنظیمات اطلاع‌رسانی</h1>
          <p className="text-sm text-gray-500">انتخاب کنید در چه مواردی می‌خواهید از سیستم هشدار دریافت کنید.</p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 p-6 space-y-6">
        
        <div className="space-y-4">
          <h3 className="font-bold text-gray-800 dark:text-gray-100 border-b pb-2">کانال‌های ارتباطی</h3>
          <label className="flex items-center justify-between cursor-pointer p-3 hover:bg-gray-50 rounded-xl transition-colors">
            <div>
              <span className="font-medium text-gray-900 block">اعلان‌های درون‌برنامه‌ای (زنگوله)</span>
              <span className="text-xs text-gray-500">دریافت هشدارها در محیط نرم‌افزار CRM</span>
            </div>
            <input type="checkbox" checked={prefs.inAppEnabled} onChange={() => togglePref('inAppEnabled')} className="w-5 h-5 accent-teal-600" />
          </label>
        </div>

        <div className="space-y-4 pt-4">
          <h3 className="font-bold text-gray-800 dark:text-gray-100 border-b pb-2">دسته‌بندی پیام‌ها</h3>
          
          <label className="flex items-center justify-between cursor-pointer p-3 hover:bg-gray-50 rounded-xl transition-colors">
            <div>
              <span className="font-medium text-gray-900 block">هشدارهای انبار (Inventory Alerts)</span>
              <span className="text-xs text-gray-500">موجودی رو به اتمام، ناموجود شدن کالاها</span>
            </div>
            <input type="checkbox" checked={prefs.inventoryAlerts} onChange={() => togglePref('inventoryAlerts')} className="w-5 h-5 accent-teal-600" />
          </label>

          <label className="flex items-center justify-between cursor-pointer p-3 hover:bg-gray-50 rounded-xl transition-colors">
            <div>
              <span className="font-medium text-gray-900 block">هشدارهای مالی (Financial Alerts)</span>
              <span className="text-xs text-gray-500">چک‌های برگشتی، چک‌های نزدیک به موعد</span>
            </div>
            <input type="checkbox" checked={prefs.financialAlerts} onChange={() => togglePref('financialAlerts')} className="w-5 h-5 accent-teal-600" />
          </label>

          <label className="flex items-center justify-between cursor-pointer p-3 hover:bg-gray-50 rounded-xl transition-colors">
            <div>
              <span className="font-medium text-gray-900 block">هشدارهای عملیاتی (CRM Alerts)</span>
              <span className="text-xs text-gray-500">تسک‌های عقب‌افتاده، ویزیت‌های برنامه‌ریزی شده</span>
            </div>
            <input type="checkbox" checked={prefs.crmAlerts} onChange={() => togglePref('crmAlerts')} className="w-5 h-5 accent-teal-600" />
          </label>

          <label className="flex items-center justify-between cursor-pointer p-3 hover:bg-gray-50 rounded-xl transition-colors">
            <div>
              <span className="font-medium text-gray-900 block">هشدارهای هوش مصنوعی (AI Alerts)</span>
              <span className="text-xs text-gray-500">ریزش مشتریان، توصیه‌های هوشمند فروش</span>
            </div>
            <input type="checkbox" checked={prefs.aiAlerts} onChange={() => togglePref('aiAlerts')} className="w-5 h-5 accent-teal-600" />
          </label>
        </div>

        <div className="bg-rose-50 border border-rose-100 p-4 rounded-xl flex gap-3">
          <AlertCircle className="w-5 h-5 text-rose-500 flex-shrink-0" />
          <div>
            <h4 className="text-sm font-bold text-rose-800">هشدارهای امنیتی</h4>
            <p className="text-xs text-rose-600 mt-1">تلاش‌های ناموفق ورود و دسترسی‌های غیرمجاز مستقیماً و به صورت الزامی به مدیران سیستم پیام داده می‌شود و قابل غیرفعال‌سازی نیست.</p>
          </div>
        </div>

        <div className="flex items-center justify-between pt-4 border-t">
          <span className="text-sm font-medium text-emerald-600">{message}</span>
          <button 
            onClick={handleSave} 
            disabled={saving}
            className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-6 py-2.5 rounded-xl font-medium flex items-center gap-2 transition-colors"
          >
            {saving ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
            ذخیره تنظیمات
          </button>
        </div>

      </div>
    </div>
  );
}
