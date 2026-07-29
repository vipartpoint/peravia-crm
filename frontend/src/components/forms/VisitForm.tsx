'use client';

import React, { useState, useEffect } from 'react';
import { api } from '@/services/api';
import { Save } from 'lucide-react';
import { Dictionary } from '@/utils/constants/dictionary';

interface VisitFormProps {
  initialData?: any;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function VisitForm({ initialData, onSuccess, onCancel }: VisitFormProps) {
  const [loading, setLoading] = useState(false);
  const [customers, setCustomers] = useState<any[]>([]);
  const [leads, setLeads] = useState<any[]>([]);
  const [territories, setTerritories] = useState<any[]>([]);

  const [targetType, setTargetType] = useState(initialData?.leadId ? 'lead' : 'customer');

  const [formData, setFormData] = useState({
    customerId: initialData?.customerId || '',
    leadId: initialData?.leadId || '',
    territoryId: initialData?.territoryId || '',
    visitType: initialData?.visitType || 'Planned',
    scheduledAt: initialData?.scheduledAt ? new Date(initialData.scheduledAt).toISOString().slice(0, 16) : '',
    notes: initialData?.notes || '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [cData, lData, tData] = await Promise.all([
        api.get('/customers'),
        api.get('/leads'),
        api.get('/territories')
      ]);
      setCustomers(cData);
      setLeads(lData);
      setTerritories(tData);
    } catch (e) {
      console.error(e);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (targetType === 'customer' && !formData.customerId) return alert('انتخاب مشتری الزامی است.');
    if (targetType === 'lead' && !formData.leadId) return alert('انتخاب لید الزامی است.');

    setLoading(true);
    try {
      const payload: any = { ...formData };
      if (targetType === 'customer') delete payload.leadId;
      if (targetType === 'lead') delete payload.customerId;
      if (!payload.territoryId) delete payload.territoryId;
      if (!payload.notes) delete payload.notes;

      if (initialData?.id) {
        await api.patch(`/visits/${initialData.id}`, payload);
      } else {
        await api.post('/visits', payload);
      }
      if (onSuccess) onSuccess();
    } catch (err: any) {
      alert(err.response?.data?.message || 'خطا در ثبت ویزیت');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="mb-6 flex space-x-4 space-x-reverse border-b border-slate-100 dark:border-slate-800 pb-4">
        <label className="flex items-center space-x-2 space-x-reverse cursor-pointer">
          <input type="radio" checked={targetType === 'customer'} onChange={() => setTargetType('customer')} className="text-emerald-600 focus:ring-emerald-500 w-4 h-4" />
          <span className="font-bold text-slate-700 dark:text-slate-300 text-sm">ویزیت مشتری فعلی</span>
        </label>
        <label className="flex items-center space-x-2 space-x-reverse cursor-pointer">
          <input type="radio" checked={targetType === 'lead'} onChange={() => setTargetType('lead')} className="text-emerald-600 focus:ring-emerald-500 w-4 h-4" />
          <span className="font-bold text-slate-700 dark:text-slate-300 text-sm">ویزیت لید (جدید)</span>
        </label>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {targetType === 'customer' ? (
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">انتخاب مشتری <span className="text-rose-500">*</span></label>
              <select required value={formData.customerId} onChange={e => setFormData({...formData, customerId: e.target.value})} className="w-full p-2.5 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none text-sm">
                <option value="">انتخاب کنید...</option>
                {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          ) : (
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">انتخاب لید <span className="text-rose-500">*</span></label>
              <select required value={formData.leadId} onChange={e => setFormData({...formData, leadId: e.target.value})} className="w-full p-2.5 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none text-sm">
                <option value="">انتخاب کنید...</option>
                {leads.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
              </select>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">منطقه جغرافیایی</label>
            <select value={formData.territoryId} onChange={e => setFormData({...formData, territoryId: e.target.value})} className="w-full p-2.5 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none text-sm">
              <option value="">انتخاب کنید...</option>
              {territories.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">تاریخ و ساعت ویزیت <span className="text-rose-500">*</span></label>
            <input required type="datetime-local" value={formData.scheduledAt} onChange={e => setFormData({...formData, scheduledAt: e.target.value})} className="w-full p-2.5 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none text-sm" />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">نوع ویزیت</label>
            <select value={formData.visitType} onChange={e => setFormData({...formData, visitType: e.target.value})} className="w-full p-2.5 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none text-sm">
              <option value="Planned">برنامه‌ریزی شده (Planned)</option>
              <option value="Urgent">فوری (Urgent)</option>
              <option value="FollowUp">پیگیری (FollowUp)</option>
              <option value="ProductIntro">معرفی محصول (ProductIntro)</option>
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">توضیحات و اهداف ویزیت</label>
            <textarea rows={3} value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} className="w-full p-2.5 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none text-sm" placeholder="هدف از این ویزیت چیست؟"></textarea>
          </div>
        </div>

        <div className="pt-6 mt-6 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3">
          {onCancel && (
            <button type="button" onClick={onCancel} className="px-6 py-2.5 rounded-xl text-sm font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:bg-slate-800 transition">
              {Dictionary.general.cancel}
            </button>
          )}
          <button disabled={loading} type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-2.5 rounded-xl flex items-center shadow-lg shadow-emerald-500/30 transition-all font-bold text-sm disabled:opacity-50">
            <Save className="w-4 h-4 ml-2" />
            {loading ? 'در حال ثبت...' : (initialData?.id ? 'ویرایش ویزیت' : 'ثبت ویزیت')}
          </button>
        </div>
      </form>
    </div>
  );
}
