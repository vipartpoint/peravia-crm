'use client';

import React, { useState } from 'react';
import { api } from '@/services/api';
import { Dictionary } from '@/utils/constants/dictionary';
import { Tooltip, InfoIcon } from '@/components/ui/Tooltip';
import { Save } from 'lucide-react';

interface CustomerFormProps {
  initialData?: any;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function CustomerForm({ initialData, onSuccess, onCancel }: CustomerFormProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    customerType: initialData?.customerType || 'Direct',
    brandScope: initialData?.brandScope || 'Both',
    loyaltyTier: initialData?.loyaltyTier || 'None',
    nationalId: initialData?.nationalId || '',
    phone: initialData?.phone || '',
    creditLimit: initialData?.creditLimit || 0,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        ...formData,
        creditLimit: Number(formData.creditLimit)
      };
      if (initialData?.id) {
        await api.patch(`/customers/${initialData.id}`, payload);
      } else {
        await api.post('/customers', payload);
      }
      if (onSuccess) onSuccess();
    } catch (err: any) {
      alert('خطا در ثبت: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Name */}
        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">نام مشتری <span className="text-rose-500">*</span></label>
          <input required name="name" value={formData.name} onChange={handleChange} className="w-full p-2.5 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm dark:bg-slate-900 dark:text-slate-100" placeholder="مثال: شرکت نفت پاسارگاد" />
        </div>

        {/* Type */}
        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">نوع مشتری</label>
          <select name="customerType" value={formData.customerType} onChange={handleChange} className="w-full p-2.5 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm dark:bg-slate-900 dark:text-slate-100">
            <option value="Direct">مستقیم (Direct)</option>
            <option value="Agent">نماینده (Agent)</option>
            <option value="Distributor">توزیع‌کننده (Distributor)</option>
          </select>
        </div>

        {/* Phone */}
        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center">
            شماره موبایل / تماس
            <span className="mr-1"><Tooltip content="این شماره به صورت امن و رمزنگاری شده در سیستم ذخیره می‌شود"><InfoIcon /></Tooltip></span>
          </label>
          <input name="phone" value={formData.phone} onChange={handleChange} className="w-full p-2.5 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-left text-sm dark:bg-slate-900 dark:text-slate-100" dir="ltr" placeholder="09123456789" />
        </div>

        {/* National ID */}
        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">کد ملی / شناسه ملی</label>
          <input name="nationalId" value={formData.nationalId} onChange={handleChange} className="w-full p-2.5 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-left text-sm dark:bg-slate-900 dark:text-slate-100" dir="ltr" placeholder="1234567890" />
        </div>

        {/* Credit Limit */}
        <div className="md:col-span-2">
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center">
            سقف اعتبار (ریال)
            <span className="mr-1"><Tooltip content={Dictionary.tooltips?.creditLimit || ''}><InfoIcon /></Tooltip></span>
          </label>
          <input type="number" name="creditLimit" value={formData.creditLimit} onChange={handleChange} className="w-full p-2.5 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm dark:bg-slate-900 dark:text-slate-100" />
        </div>
      </div>

      <div className="pt-6 mt-6 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3">
        {onCancel && (
          <button type="button" onClick={onCancel} className="px-6 py-2.5 rounded-xl text-sm font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:bg-slate-800 transition">
            {Dictionary.general.cancel}
          </button>
        )}
        <button disabled={loading} type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-2.5 rounded-xl flex items-center shadow-lg shadow-indigo-500/30 transition-all font-bold text-sm disabled:opacity-50">
          <Save className="w-4 h-4 ml-2" />
          {loading ? 'در حال ثبت...' : (initialData?.id ? 'ویرایش مشتری' : Dictionary.general.save)}
        </button>
      </div>
    </form>
  );
}
