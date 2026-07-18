'use client';

import React, { useState, useEffect } from 'react';
import { api } from '@/services/api';
import { Save } from 'lucide-react';
import { Dictionary } from '@/utils/constants/dictionary';

interface TerritoryFormProps {
  initialData?: any;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function TerritoryForm({ initialData, onSuccess, onCancel }: TerritoryFormProps) {
  const [loading, setLoading] = useState(false);
  const [territories, setTerritories] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    code: initialData?.code || '',
    type: initialData?.type || 'Province',
    parentId: initialData?.parentId || '',
    managerId: initialData?.managerId || '',
    isActive: initialData?.isActive ?? true
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [tData, uData] = await Promise.all([
        api.get('/territories'),
        api.get('/users')
      ]);
      
      if (initialData?.id) {
        setTerritories(tData.filter((t: any) => t.id !== initialData.id));
      } else {
        setTerritories(tData);
      }
      setUsers(uData);
    } catch (e) {
      console.error(e);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload: any = {
        name: formData.name,
        code: formData.code,
        type: formData.type,
        isActive: formData.isActive
      };
      if (formData.parentId) payload.parentId = formData.parentId;
      if (formData.managerId) payload.managerId = formData.managerId;

      if (initialData?.id) {
        await api.patch(`/territories/${initialData.id}`, payload);
      } else {
        await api.post('/territories', payload);
      }
      if (onSuccess) onSuccess();
    } catch (err: any) {
      alert(err.response?.data?.message || 'خطا در ثبت منطقه. کد منطقه باید یکتا باشد.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">نام منطقه <span className="text-rose-500">*</span></label>
          <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full p-2.5 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none text-sm" placeholder="مثلا: تهران شمال" />
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">کد منطقه <span className="text-rose-500">*</span></label>
          <input required type="text" value={formData.code} onChange={e => setFormData({...formData, code: e.target.value})} className="w-full p-2.5 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none text-sm font-mono text-left" placeholder="مثلا: THR-N" />
          <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 font-medium">باید در سیستم یکتا باشد.</p>
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">نوع منطقه <span className="text-rose-500">*</span></label>
          <select required value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})} className="w-full p-2.5 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none text-sm">
            <option value="Country">کشور (Country)</option>
            <option value="Province">استان (Province)</option>
            <option value="City">شهر (City)</option>
            <option value="SalesRegion">ناحیه فروش (SalesRegion)</option>
            <option value="VisitRoute">مسیر ویزیت (VisitRoute)</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">منطقه والد</label>
          <select value={formData.parentId} onChange={e => setFormData({...formData, parentId: e.target.value})} className="w-full p-2.5 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none text-sm">
            <option value="">-- بدون والد --</option>
            {territories.map((t: any) => (
              <option key={t.id} value={t.id}>{t.name} ({t.type})</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">مدیر منطقه</label>
          <select value={formData.managerId} onChange={e => setFormData({...formData, managerId: e.target.value})} className="w-full p-2.5 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none text-sm">
            <option value="">-- بدون مدیر --</option>
            {users.map((u: any) => (
              <option key={u.id} value={u.id}>{u.username} ({u.role?.name})</option>
            ))}
          </select>
        </div>
        <div className="flex items-center mt-6 p-2">
          <input type="checkbox" id="isActive" checked={formData.isActive} onChange={e => setFormData({...formData, isActive: e.target.checked})} className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500" />
          <label htmlFor="isActive" className="mr-2 text-sm font-bold text-slate-700 dark:text-slate-300">این منطقه فعال است</label>
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
          {loading ? 'در حال ثبت...' : (initialData?.id ? 'ویرایش منطقه' : 'ثبت منطقه')}
        </button>
      </div>
    </form>
  );
}
