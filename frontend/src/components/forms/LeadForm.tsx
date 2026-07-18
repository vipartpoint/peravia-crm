'use client';

import React, { useState, useEffect } from 'react';
import { api } from '@/services/api';
import { Save } from 'lucide-react';

interface LeadFormProps {
  initialData?: any;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function LeadForm({ initialData, onSuccess, onCancel }: LeadFormProps) {
  const [loading, setLoading] = useState(false);
  const [territories, setTerritories] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [stages, setStages] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    phone: initialData?.phone || '',
    source: initialData?.source || 'Manual',
    brandInterest: initialData?.brandInterest || 'Pravia',
    territoryId: initialData?.territoryId || '',
    assignedTo: initialData?.assignedTo || '',
    currentStageId: initialData?.currentStageId || '',
    nextFollowUpAt: initialData?.nextFollowUpAt ? new Date(initialData.nextFollowUpAt).toISOString().slice(0, 16) : ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [tData, uData, sData] = await Promise.all([
        api.get('/territories'),
        api.get('/users'),
        api.get('/leads/stages')
      ]);
      setTerritories(tData);
      setUsers(uData.filter((u: any) => u.role?.name === 'SalesRep' || u.role?.name === 'RegionalManager'));
      setStages(sData);
      
      if (!initialData?.currentStageId && sData.length > 0) {
        setFormData(f => ({ ...f, currentStageId: sData[0].id }));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (initialData?.id) {
        await api.patch(`/leads/${initialData.id}`, formData);
      } else {
        await api.post('/leads', formData);
      }
      if (onSuccess) onSuccess();
    } catch (err: any) {
      alert(err.response?.data?.message || 'خطا در ثبت لید');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">نام لید / فروشگاه <span className="text-rose-500">*</span></label>
          <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full p-2.5 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm" placeholder="مثال: اتوسرویس عباسی" />
        </div>
        
        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">شماره موبایل <span className="text-rose-500">*</span></label>
          <input required type="tel" dir="ltr" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full p-2.5 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-left text-sm" placeholder="0912..." />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">منبع آشنایی</label>
          <select value={formData.source} onChange={e => setFormData({...formData, source: e.target.value})} className="w-full p-2.5 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm">
            <option value="Manual">ثبت دستی</option>
            <option value="ColdCall">تماس سرد</option>
            <option value="Exhibition">نمایشگاه</option>
            <option value="Referral">معرفی</option>
            <option value="Chatbot">چت‌بات وب‌سایت</option>
            <option value="Other">سایر</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">برند مورد علاقه</label>
          <select value={formData.brandInterest} onChange={e => setFormData({...formData, brandInterest: e.target.value})} className="w-full p-2.5 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm">
            <option value="Pravia">Pravia</option>
            <option value="Gertex">Gertex</option>
            <option value="Both">هردو</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">منطقه (استان/شهر)</label>
          <select value={formData.territoryId} onChange={e => setFormData({...formData, territoryId: e.target.value})} className="w-full p-2.5 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm">
            <option value="">نامشخص</option>
            {territories.map(t => (
              <option key={t.id} value={t.id}>{t.name} ({t.type})</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">کارشناس مسئول</label>
          <select value={formData.assignedTo} onChange={e => setFormData({...formData, assignedTo: e.target.value})} className="w-full p-2.5 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm">
            <option value="">نامشخص (در انتظار تخصیص)</option>
            {users.map(u => (
              <option key={u.id} value={u.id}>{u.username} ({u.role.name})</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">مرحله قیف فروش</label>
          <select value={formData.currentStageId} onChange={e => setFormData({...formData, currentStageId: e.target.value})} className="w-full p-2.5 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm">
            {stages.map(s => (
              <option key={s.id} value={s.id}>{s.order} - {s.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">تاریخ پیگیری بعدی</label>
          <input type="datetime-local" value={formData.nextFollowUpAt} onChange={e => setFormData({...formData, nextFollowUpAt: e.target.value})} className="w-full p-2.5 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm" />
        </div>
      </div>

      <div className="pt-6 mt-6 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3">
        {onCancel && (
          <button type="button" onClick={onCancel} className="px-6 py-2.5 rounded-xl text-sm font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:bg-slate-800 transition">
            انصراف
          </button>
        )}
        <button disabled={loading} type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-2.5 rounded-xl flex items-center shadow-lg shadow-indigo-500/30 transition-all font-bold text-sm disabled:opacity-50">
          <Save className="w-4 h-4 ml-2" />
          {loading ? 'در حال ذخیره...' : (initialData?.id ? 'ویرایش لید' : 'ثبت لید')}
        </button>
      </div>
    </form>
  );
}
