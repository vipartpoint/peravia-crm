'use client';

import React, { useState, useEffect } from 'react';
import { Bell, Send, Settings, ShieldAlert, CheckCircle2, Edit2, X, Save } from 'lucide-react';
import { api } from '@/services/api';
import { useToast } from '@/components/ui/Toast';
import { Button } from '@/components/ui/Button';

export default function NotificationEnginePage() {
  const [templates, setTemplates] = useState<any[]>([]);
  const [testRecipient, setTestRecipient] = useState('');
  const [isTesting, setIsTesting] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const res = await api.get('/notifications/templates');
      setTemplates(res);
    } catch (error) {
      toast({ type: 'error', title: 'خطا', description: 'خطا در دریافت قالب‌ها' });
    }
  };

  const handleTestSms = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testRecipient) return;

    try {
      setIsTesting(true);
      await api.post('/notifications/test-sms', { recipient: testRecipient });
      toast({ type: 'success', title: 'موفق', description: 'پیامک تست با موفقیت در صف ارسال قرار گرفت' });
      setTestRecipient('');
    } catch (error: any) {
      toast({ type: 'error', title: 'خطا', description: error.message || 'خطا در ارسال پیامک' });
    } finally {
      setIsTesting(false);
    }
  };

  const handleSaveTemplate = async () => {
    if (!editingTemplate) return;
    try {
      setIsSaving(true);
      await api.patch(`/notifications/templates/${editingTemplate.id}`, {
        content: editingTemplate.content,
        isActive: editingTemplate.isActive
      });
      toast({ type: 'success', title: 'موفق', description: 'قالب با موفقیت بروزرسانی شد' });
      setEditingTemplate(null);
      fetchTemplates();
    } catch (error: any) {
      toast({ type: 'error', title: 'خطا', description: error.message || 'خطا در ذخیره قالب' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex justify-between items-center bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-3 text-slate-800 dark:text-white">
            <Bell className="w-7 h-7 text-indigo-500" />
            تنظیمات موتور پیام‌رسان (Notification Engine)
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2 text-sm">
            مدیریت درگاه‌های پیامکی، قالب‌های متن، و تنظیمات ارتباط با مشتری.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Provider Status */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800">
          <h2 className="text-lg font-bold flex items-center gap-2 mb-4">
            <Settings className="w-5 h-5 text-slate-400" /> وضعیت ارائه‌دهنده
          </h2>
          <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800/30 rounded-xl flex items-start gap-4">
            <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <p className="font-bold text-emerald-800 dark:text-emerald-300">متصل (Kavenegar)</p>
              <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">
                سرویس کاوه‌نگار از طریق متغیرهای محیطی فعال است.
              </p>
            </div>
          </div>
        </div>

        {/* Test SMS */}
        <div className="md:col-span-2 bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800">
          <h2 className="text-lg font-bold flex items-center gap-2 mb-4">
            <Send className="w-5 h-5 text-indigo-400" /> ارسال پیامک تست
          </h2>
          <form onSubmit={handleTestSms} className="flex gap-4 items-end">
            <div className="flex-1">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">شماره موبایل گیرنده</label>
              <input
                type="text"
                placeholder="0912..."
                value={testRecipient}
                onChange={(e) => setTestRecipient(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-indigo-500/20"
                required
              />
            </div>
            <Button disabled={isTesting} type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white h-[42px] px-8 rounded-xl shadow-sm">
              {isTesting ? 'در حال ارسال...' : 'ارسال تست'}
            </Button>
          </form>
          <p className="text-xs text-slate-400 mt-3">
            <ShieldAlert className="inline w-3 h-3 mr-1" /> این عملیات جهت جلوگیری از سوءاستفاده محدودیت تکرار (Rate Limit) دارد.
          </p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800">
          <h2 className="text-lg font-bold flex items-center gap-2 text-slate-800 dark:text-white">
            قالب‌های پیامک سیستم (Templates)
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-right">
            <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-300 font-medium">
              <tr>
                <th className="px-6 py-4">کد قالب / نام</th>
                <th className="px-6 py-4">دسته‌بندی</th>
                <th className="px-6 py-4 w-[40%]">متن پیام</th>
                <th className="px-6 py-4">وضعیت</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {templates.map(t => (
                <tr key={t.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <td className="px-6 py-4">
                    <div className="font-bold text-slate-900 dark:text-white">{t.name}</div>
                    <div className="text-xs font-mono text-indigo-500 mt-1">{t.code}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-xs rounded-lg font-medium">{t.category}</span>
                  </td>
                  <td className="px-6 py-4 text-xs text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                    {t.content}
                    <div className="mt-2 text-slate-400 flex flex-wrap gap-1">
                      {t.variables.map((v: string) => <span key={v} className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 px-1.5 py-0.5 rounded text-[10px]">{"{"+v+"}"}</span>)}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-between gap-4">
                      {t.isActive ? (
                        <span className="text-emerald-500 text-xs font-bold flex items-center gap-1"><CheckCircle2 className="w-4 h-4"/> فعال</span>
                      ) : (
                        <span className="text-slate-400 text-xs font-bold flex items-center gap-1"><X className="w-4 h-4"/> غیرفعال</span>
                      )}
                      <button 
                        onClick={() => setEditingTemplate({...t})}
                        className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 transition-colors p-2 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-900/30"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Modal */}
      {editingTemplate && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-xl rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
              <h3 className="text-lg font-bold">ویرایش قالب: {editingTemplate.name}</h3>
              <button onClick={() => setEditingTemplate(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">متن پیامک</label>
                <textarea 
                  value={editingTemplate.content}
                  onChange={(e) => setEditingTemplate({...editingTemplate, content: e.target.value})}
                  className="w-full h-32 p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 text-sm"
                  dir="auto"
                />
              </div>
              <div className="flex flex-wrap gap-2">
                <span className="text-xs text-slate-500 w-full mb-1">متغیرهای مجاز:</span>
                {editingTemplate.variables.map((v: string) => (
                  <button 
                    key={v}
                    onClick={() => setEditingTemplate({...editingTemplate, content: editingTemplate.content + ` {${v}}`})}
                    className="text-[10px] bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 px-2 py-1 rounded"
                  >
                    {`{${v}}`}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2 pt-4">
                <input 
                  type="checkbox" 
                  id="isActive"
                  checked={editingTemplate.isActive}
                  onChange={(e) => setEditingTemplate({...editingTemplate, isActive: e.target.checked})}
                  className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                />
                <label htmlFor="isActive" className="text-sm font-medium">فعال بودن این قالب (در صورت غیرفعال بودن پیامکی با این کد ارسال نمی‌شود)</label>
              </div>
            </div>
            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3">
              <Button variant="outline" onClick={() => setEditingTemplate(null)}>انصراف</Button>
              <Button onClick={handleSaveTemplate} disabled={isSaving} className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2">
                {isSaving ? 'در حال ذخیره...' : <><Save className="w-4 h-4" /> ذخیره قالب</>}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
