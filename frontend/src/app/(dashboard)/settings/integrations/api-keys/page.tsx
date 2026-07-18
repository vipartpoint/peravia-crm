'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Webhook, Key, Calendar, Clock, User as UserIcon, AlertTriangle, ShieldAlert, CheckCircle2, Trash2, Copy, EyeOff } from 'lucide-react';
import { api } from '@/services/api';
import { useToast } from '@/components/ui/Toast';
import { Button } from '@/components/ui/Button';

interface ApiKey {
  id: string;
  name: string;
  prefix: string;
  status: string;
  scopes: string[];
  expiresAt: string | null;
  lastUsedAt: string | null;
  createdAt: string;
}

export default function ApiKeysPage() {
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [newKeyScopes, setNewKeyScopes] = useState<string[]>([]);
  const [expiresAtDate, setExpiresAtDate] = useState('');
  
  const [newRawKey, setNewRawKey] = useState<string | null>(null);

  const availableScopes = [
    'portal.read', 'portal.write', 
    'orders.read', 'orders.write', 
    'customers.read', 'customers.write', 
    'inventory.read', 'inventory.write', 
    'reports.read', 'future.ai', 
    'future.sms', 'future.voip',
    'integrations.manage'
  ];

  useEffect(() => {
    fetchKeys();
  }, []);

  const fetchKeys = async () => {
    try {
      setLoading(true);
      const res = await api.get('/api-keys');
      setKeys(Array.isArray(res) ? res : (res.data || []));
    } catch (error) {
      toast({ type: 'error', title: 'خطا', description: 'دریافت لیست کلیدها با خطا مواجه شد' });
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyName || newKeyScopes.length === 0) {
      toast({ type: 'error', title: 'خطا', description: 'نام و حداقل یک دسترسی الزامی است' });
      return;
    }

    try {
      const payload: any = { name: newKeyName, scopes: newKeyScopes };
      if (expiresAtDate) payload.expiresAt = new Date(expiresAtDate).toISOString();

      const res = await api.post('/api-keys', payload);
      setNewRawKey(res.data.rawKey);
      setKeys([res.data.apiKey, ...keys]);
    } catch (error: any) {
      toast({ type: 'error', title: 'خطا', description: error.response?.data?.message || 'خطا در ایجاد کلید' });
    }
  };

  const handleRevoke = async (id: string) => {
    if (!confirm('آیا از ابطال این کلید اطمینان دارید؟ این عمل غیرقابل بازگشت است.')) return;
    
    try {
      await api.post(`/api-keys/${id}/revoke`, {});
      toast({ type: 'success', title: 'موفق', description: 'کلید با موفقیت باطل شد' });
      fetchKeys();
    } catch (error: any) {
      toast({ type: 'error', title: 'خطا', description: error.response?.data?.message || 'خطا در ابطال کلید' });
    }
  };

  const copyToClipboard = () => {
    if (newRawKey) {
      navigator.clipboard.writeText(newRawKey);
      toast({ type: 'success', title: 'کپی شد', description: 'کلید در حافظه کپی شد' });
    }
  };

  const closeRawKeyModal = () => {
    setNewRawKey(null);
    setIsModalOpen(false);
    setNewKeyName('');
    setNewKeyScopes([]);
    setExpiresAtDate('');
  };

  const toggleScope = (scope: string) => {
    if (newKeyScopes.includes(scope)) {
      setNewKeyScopes(newKeyScopes.filter(s => s !== scope));
    } else {
      setNewKeyScopes([...newKeyScopes, scope]);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex justify-between items-center bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-3 text-slate-800 dark:text-white">
            <Webhook className="w-7 h-7 text-indigo-500" />
            مدیریت کلیدهای دسترسی (API Keys)
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2 text-sm">
            تنظیمات زیرساختی برای یکپارچه‌سازی سامانه با سرویس‌های خارجی (مانند وب‌سایت پرتال، نرم‌افزارهای حسابداری و هوش مصنوعی).
          </p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2 rounded-xl h-11 px-6 shadow-sm">
          <Plus className="w-4 h-4" />
          ایجاد کلید جدید
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-20 text-slate-500">در حال بارگذاری...</div>
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-right">
              <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-300 font-medium border-b border-slate-100 dark:border-slate-800">
                <tr>
                  <th className="px-6 py-4">نام کلید</th>
                  <th className="px-6 py-4">پیشوند و شناسایی</th>
                  <th className="px-6 py-4">وضعیت</th>
                  <th className="px-6 py-4">دسترسی‌ها (Scopes)</th>
                  <th className="px-6 py-4">تاریخ انقضا</th>
                  <th className="px-6 py-4">آخرین استفاده</th>
                  <th className="px-6 py-4 text-left">عملیات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                {keys.map((key) => (
                  <tr key={key.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="px-6 py-4 font-semibold text-slate-900 dark:text-white">{key.name}</td>
                    <td className="px-6 py-4 font-mono text-xs text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 inline-block mt-3 px-3 py-1 rounded-md border border-indigo-100 dark:border-indigo-800/30">
                      {key.prefix}••••••••
                    </td>
                    <td className="px-6 py-4">
                      {key.status === 'Active' ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/30">
                          <CheckCircle2 className="w-3.5 h-3.5" /> فعال
                        </span>
                      ) : key.status === 'Revoked' ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border border-red-200 dark:border-red-800/30">
                          <ShieldAlert className="w-3.5 h-3.5" /> باطل شده
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border border-amber-200 dark:border-amber-800/30">
                          <Clock className="w-3.5 h-3.5" /> منقضی شده
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1 max-w-[200px]">
                        {key.scopes.map(s => (
                          <span key={s} className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-[10px] rounded border border-slate-200 dark:border-slate-700">{s}</span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-xs">
                      {key.expiresAt ? new Date(key.expiresAt).toLocaleDateString('fa-IR') : 'بدون انقضا'}
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-500">
                      {key.lastUsedAt ? new Date(key.lastUsedAt).toLocaleString('fa-IR') : 'هرگز استفاده نشده'}
                    </td>
                    <td className="px-6 py-4 text-left">
                      {key.status === 'Active' && (
                        <Button onClick={() => handleRevoke(key.id)} variant="ghost" className="text-red-500 hover:bg-red-50 hover:text-red-600 h-8 px-3 rounded-lg text-xs font-medium">
                          ابطال کلید
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
                {keys.length === 0 && (
                  <tr>
                    <td colSpan={7} className="text-center py-12 text-slate-500">هیچ کلیدی یافت نشد.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Creation Modal */}
      {isModalOpen && !newRawKey && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
              <h2 className="text-xl font-bold flex items-center gap-2 text-slate-800 dark:text-white">
                <Key className="w-5 h-5 text-indigo-500" /> ایجاد کلید جدید
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">×</button>
            </div>
            
            <form onSubmit={handleCreate} className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">نام کلید / کاربرد</label>
                <input
                  type="text"
                  required
                  value={newKeyName}
                  onChange={e => setNewKeyName(e.target.value)}
                  placeholder="مثال: اتصال وب‌سایت پرتال اصلی"
                  className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">تاریخ انقضا (اختیاری - پیش‌فرض 90 روز)</label>
                <input
                  type="date"
                  value={expiresAtDate}
                  onChange={e => setExpiresAtDate(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">دسترسی‌های مجاز (Scopes)</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {availableScopes.map(scope => (
                    <label key={scope} className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs cursor-pointer transition-colors ${newKeyScopes.includes(scope) ? 'bg-indigo-50 border-indigo-200 text-indigo-700 dark:bg-indigo-900/20 dark:border-indigo-800 dark:text-indigo-300 font-medium' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-400'}`}>
                      <input type="checkbox" className="hidden" checked={newKeyScopes.includes(scope)} onChange={() => toggleScope(scope)} />
                      <div className={`w-4 h-4 rounded-md flex items-center justify-center border ${newKeyScopes.includes(scope) ? 'bg-indigo-500 border-indigo-500 text-white' : 'border-slate-300 dark:border-slate-600'}`}>
                        {newKeyScopes.includes(scope) && <CheckCircle2 className="w-3 h-3" />}
                      </div>
                      {scope}
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <Button type="button" onClick={() => setIsModalOpen(false)} variant="ghost" className="h-11 px-6 rounded-xl">انصراف</Button>
                <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white h-11 px-8 rounded-xl shadow-sm">تولید کلید امنیتی</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Raw Key Modal (One Time Show) */}
      {newRawKey && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md">
          <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 p-8 text-center space-y-6">
            <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-2">
              <Key className="w-8 h-8" />
            </div>
            
            <div>
              <h2 className="text-2xl font-black text-slate-800 dark:text-white mb-2">کلید با موفقیت ساخته شد</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                لطفاً کلید زیر را کپی کرده و در محل امنی ذخیره کنید.
                <br/>
                <strong className="text-rose-500 mt-2 block">به دلایل امنیتی، این کلید دیگر هرگز به شما نمایش داده نخواهد شد.</strong>
              </p>
            </div>

            <div className="relative group">
              <div className="bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 pr-14 font-mono text-sm text-left break-all text-slate-800 dark:text-slate-300 select-all">
                {newRawKey}
              </div>
              <button onClick={copyToClipboard} className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg flex items-center justify-center text-slate-500 hover:text-indigo-600 hover:border-indigo-300 transition-colors shadow-sm">
                <Copy className="w-4 h-4" />
              </button>
            </div>

            <Button onClick={closeRawKeyModal} className="w-full bg-slate-800 hover:bg-slate-900 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 h-12 rounded-xl text-sm font-bold shadow-sm">
              کپی کردم و متوجه شدم
            </Button>
          </div>
        </div>
      )}

    </div>
  );
}
