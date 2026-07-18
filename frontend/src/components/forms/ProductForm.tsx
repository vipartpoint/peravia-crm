'use client';

import React, { useState } from 'react';
import { api } from '@/services/api';
import { Save } from 'lucide-react';
import { Dictionary } from '@/utils/constants/dictionary';

interface ProductFormProps {
  initialData?: any;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function ProductForm({ initialData, onSuccess, onCancel }: ProductFormProps) {
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    sku: initialData?.sku || '',
    name: initialData?.name || '',
    brand: initialData?.brand || 'Pravia',
    category: initialData?.category || '',
    viscosityGrade: initialData?.viscosityGrade || '',
    apiStandard: initialData?.apiStandard || '',
    volume: initialData?.volume || '',
    basePrice: initialData?.basePrice || '',
    estimatedCost: initialData?.estimatedCost || '',
    isActive: initialData?.isActive ?? true
  });

  const basePriceNum = Number(formData.basePrice) || 0;
  const estimatedCostNum = Number(formData.estimatedCost) || 0;
  let margin = 0;
  if (basePriceNum > 0) {
    margin = ((basePriceNum - estimatedCostNum) / basePriceNum) * 100;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload: any = {
        ...formData,
        basePrice: basePriceNum,
        estimatedCost: estimatedCostNum
      };

      if (initialData?.id) {
        await api.patch(`/products/${initialData.id}`, payload);
      } else {
        await api.post('/products', payload);
      }
      if (onSuccess) onSuccess();
    } catch (err: any) {
      alert(err.response?.data?.message || 'خطا در ثبت محصول.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">کد محصول (SKU) <span className="text-rose-500">*</span></label>
          <input required type="text" value={formData.sku} onChange={e => setFormData({...formData, sku: e.target.value})} className="w-full p-2.5 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none text-sm font-mono text-left" placeholder="مثلا PR-U-5W30" />
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">نام محصول <span className="text-rose-500">*</span></label>
          <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full p-2.5 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none text-sm" placeholder="مثلا Pravia Ultra 5W-30" />
        </div>
        
        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">برند <span className="text-rose-500">*</span></label>
          <select required value={formData.brand} onChange={e => setFormData({...formData, brand: e.target.value})} className="w-full p-2.5 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none text-sm">
            <option value="Pravia">Pravia</option>
            <option value="Gertex">Gertex</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">دسته‌بندی</label>
          <input type="text" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="w-full p-2.5 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none text-sm text-left" placeholder="Passenger Car Motor Oil" />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">گرید ویسکوزیته</label>
          <input type="text" value={formData.viscosityGrade} onChange={e => setFormData({...formData, viscosityGrade: e.target.value})} className="w-full p-2.5 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none text-sm font-mono text-left" placeholder="5W-30" />
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">استاندارد API</label>
          <input type="text" value={formData.apiStandard} onChange={e => setFormData({...formData, apiStandard: e.target.value})} className="w-full p-2.5 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none text-sm font-mono text-left" placeholder="SN/CF" />
        </div>
        
        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">حجم بسته‌بندی</label>
          <input type="text" value={formData.volume} onChange={e => setFormData({...formData, volume: e.target.value})} className="w-full p-2.5 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none text-sm font-mono text-left" placeholder="4L" />
        </div>
        <div className="flex items-center mt-6 p-2">
          <input type="checkbox" id="isActive" checked={formData.isActive} onChange={e => setFormData({...formData, isActive: e.target.checked})} className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500" />
          <label htmlFor="isActive" className="mr-2 text-sm font-bold text-slate-700 dark:text-slate-300">این محصول فعال است</label>
        </div>
      </div>

      <div className="border-t border-slate-100 dark:border-slate-800 pt-6 mt-6">
        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-4">اطلاعات مالی (محرمانه)</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">قیمت پایه (ریال) <span className="text-rose-500">*</span></label>
            <input required type="number" min="0" value={formData.basePrice} onChange={e => setFormData({...formData, basePrice: e.target.value})} className="w-full p-2.5 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none font-mono text-left text-sm" placeholder="0" />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">هزینه تخمینی (ریال) <span className="text-rose-500">*</span></label>
            <input required type="number" min="0" value={formData.estimatedCost} onChange={e => setFormData({...formData, estimatedCost: e.target.value})} className="w-full p-2.5 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none font-mono text-left text-sm" placeholder="0" />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">حاشیه سود تخمینی (%)</label>
            <div className="w-full p-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg font-mono text-left text-emerald-600 font-bold text-sm h-[42px] flex items-center justify-start">
              {margin.toFixed(2)} %
            </div>
          </div>
        </div>
      </div>

      <div className="pt-6 mt-6 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3">
        {onCancel && (
          <button type="button" onClick={onCancel} className="px-6 py-2.5 rounded-xl text-sm font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:bg-slate-800 transition">
            {Dictionary.general.cancel}
          </button>
        )}
        <button disabled={loading} type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-2.5 rounded-xl shadow-lg shadow-emerald-500/30 flex items-center font-bold text-sm transition disabled:opacity-50">
          <Save className="w-4 h-4 ml-2" />
          {loading ? 'در حال ثبت...' : (initialData?.id ? 'ویرایش محصول' : 'ثبت محصول')}
        </button>
      </div>
    </form>
  );
}
