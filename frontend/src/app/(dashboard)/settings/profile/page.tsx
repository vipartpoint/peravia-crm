'use client';

import { useState, useEffect } from 'react';
import { api } from '@/services/api';
import { User, Save, RefreshCw } from 'lucide-react';
import { useToast } from '@/components/ui/Toast';

export default function ProfileSettingsPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await api.get('/auth/me');
      setUser(res.user);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put(`/users/${user.id}`, { email: user.email });
      toast({ type: 'success', title: 'موفقیت', description: 'پروفایل با موفقیت بروزرسانی شد.' });
    } catch (e: any) {
      toast({ type: 'error', title: 'خطا', description: e.response?.data?.message || 'خطا در ذخیره اطلاعات' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-10 text-center text-slate-500">در حال بارگذاری...</div>;
  if (!user) return <div className="p-10 text-center text-red-500">کاربر یافت نشد</div>;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 flex items-center gap-3">
        <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
          <User className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">پروفایل کاربری</h1>
          <p className="text-sm text-slate-500">اطلاعات شخصی و تنظیمات حساب خود را مدیریت کنید.</p>
        </div>
      </div>

      <form onSubmit={handleSave} className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 p-6 space-y-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">نام کاربری</label>
            <input 
              value={user.username} 
              disabled
              className="w-full border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 outline-none bg-slate-100 dark:bg-slate-800 text-slate-500" 
            />
            <p className="text-xs text-slate-400 mt-1">نام کاربری قابل تغییر نیست.</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">ایمیل</label>
            <input 
              value={user.email || ''} 
              onChange={e => setUser({...user, email: e.target.value})}
              dir="ltr"
              className="w-full border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 outline-none focus:border-blue-500 bg-transparent text-slate-800 dark:text-slate-100" 
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">نقش سازمانی</label>
            <input 
              value={user.role?.name || ''} 
              disabled
              className="w-full border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 outline-none bg-slate-100 dark:bg-slate-800 text-slate-500" 
            />
          </div>
        </div>

        <div className="flex justify-end pt-4 border-t border-slate-100 dark:border-slate-800">
          <button 
            type="submit"
            disabled={saving}
            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-6 py-2.5 rounded-xl font-medium flex items-center gap-2 transition-colors"
          >
            {saving ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
            ذخیره تغییرات
          </button>
        </div>
      </form>
    </div>
  );
}
