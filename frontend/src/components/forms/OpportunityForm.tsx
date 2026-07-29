'use client';

import React, { useState, useEffect } from 'react';
import { api } from '@/services/api';
import { Save, Plus, Trash2 } from 'lucide-react';

interface OpportunityFormProps {
  initialData?: any;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function OpportunityForm({ initialData, onSuccess, onCancel }: OpportunityFormProps) {
  const [loading, setLoading] = useState(false);
  const [customers, setCustomers] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [territories, setTerritories] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    customerId: initialData?.customerId || '',
    leadId: initialData?.leadId || '',
    territoryId: initialData?.territoryId || '',
    ownerId: initialData?.ownerId || '',
    probability: initialData?.probability || 10,
    expectedCloseDate: initialData?.expectedCloseDate ? new Date(initialData.expectedCloseDate).toISOString().slice(0, 16) : '',
    notes: initialData?.notes || '',
    competitorName: initialData?.competitorName || '',
    nextAction: initialData?.nextAction || '',
    followUpDate: initialData?.followUpDate ? new Date(initialData.followUpDate).toISOString().slice(0, 16) : '',
    items: initialData?.items ? initialData.items.map((i: any) => ({
      productId: i.productId,
      quantity: i.quantity,
      unitPrice: i.unitPrice,
      potentialVolume: i.potentialVolume
    })) : []
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [cData, uData, tData, pData] = await Promise.all([
        api.get('/customers'),
        api.get('/users'),
        api.get('/territories'),
        api.get('/products')
      ]);
      setCustomers(cData);
      setUsers(uData.filter((u: any) => u.role?.name === 'SalesRep' || u.role?.name === 'RegionalManager' || u.role?.name === 'SystemAdmin'));
      setTerritories(tData);
      setProducts(pData);
    } catch (e) {
      console.error(e);
    }
  };

  const addItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { productId: '', quantity: 1, unitPrice: 0, potentialVolume: 0 }]
    });
  };

  const updateItem = (index: number, field: string, value: any) => {
    const newItems = [...formData.items];
    newItems[index][field] = value;
    
    // Auto-fill price if product selected
    if (field === 'productId') {
      const prod = products.find(p => p.id === value);
      if (prod) {
        newItems[index].unitPrice = prod.basePrice || 0;
      }
    }
    setFormData({ ...formData, items: newItems });
  };

  const removeItem = (index: number) => {
    const newItems = [...formData.items];
    newItems.splice(index, 1);
    setFormData({ ...formData, items: newItems });
  };

  const calculateTotal = () => {
    return formData.items.reduce((sum: number, item: any) => sum + (Number(item.quantity) * Number(item.unitPrice)), 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload: any = {
        ...formData,
        probability: Number(formData.probability),
        items: formData.items.map((i: any) => ({
          ...i,
          quantity: Number(i.quantity),
          unitPrice: Number(i.unitPrice),
          potentialVolume: Number(i.potentialVolume)
        }))
      };

      if (!payload.leadId) delete payload.leadId;
      if (!payload.territoryId) delete payload.territoryId;
      if (!payload.ownerId) delete payload.ownerId;
      if (!payload.expectedCloseDate) delete payload.expectedCloseDate;
      if (!payload.notes) delete payload.notes;
      if (!payload.competitorName) delete payload.competitorName;
      if (!payload.nextAction) delete payload.nextAction;
      if (!payload.followUpDate) delete payload.followUpDate;

      if (initialData?.id) {
        await api.patch(`/opportunities/${initialData.id}`, payload);
      } else {
        await api.post('/opportunities', payload);
      }
      if (onSuccess) onSuccess();
    } catch (err: any) {
      alert(err.response?.data?.message || err.message || 'خطا در ثبت فرصت فروش');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">نام فرصت (پروژه) <span className="text-rose-500">*</span></label>
          <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full p-2.5 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm" placeholder="مثال: تامین روغن کارخانه مپنا" />
        </div>
        
        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">مشتری <span className="text-rose-500">*</span></label>
          <select required value={formData.customerId} onChange={e => setFormData({...formData, customerId: e.target.value})} className="w-full p-2.5 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm">
            <option value="">انتخاب مشتری...</option>
            {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">مسئول (Owner)</label>
          <select value={formData.ownerId} onChange={e => setFormData({...formData, ownerId: e.target.value})} className="w-full p-2.5 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm">
            <option value="">خودم</option>
            {users.map(u => <option key={u.id} value={u.id}>{u.username}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">منطقه (Territory)</label>
          <select value={formData.territoryId} onChange={e => setFormData({...formData, territoryId: e.target.value})} className="w-full p-2.5 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm">
            <option value="">نامشخص</option>
            {territories.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">احتمال موفقیت (%)</label>
          <input type="number" min="0" max="100" value={formData.probability} onChange={e => setFormData({...formData, probability: Number(e.target.value)})} className="w-full p-2.5 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm" />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">تاریخ پیش‌بینی بستن قرارداد</label>
          <input type="datetime-local" value={formData.expectedCloseDate} onChange={e => setFormData({...formData, expectedCloseDate: e.target.value})} className="w-full p-2.5 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm" />
        </div>
      </div>

      <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200">محصولات (Opportunity Items)</h3>
          <button type="button" onClick={addItem} className="text-xs bg-indigo-100 text-indigo-700 px-3 py-1.5 rounded-lg font-bold flex items-center hover:bg-indigo-200 transition">
            <Plus className="w-3.5 h-3.5 mr-1" /> افزودن محصول
          </button>
        </div>
        
        {formData.items.length === 0 ? (
          <div className="text-center py-4 text-xs text-slate-500">هیچ محصولی اضافه نشده است.</div>
        ) : (
          <div className="space-y-3">
            {formData.items.map((item: any, idx: number) => (
              <div key={idx} className="flex gap-2 items-start bg-white dark:bg-slate-900 p-3 rounded-lg border border-slate-200 dark:border-slate-700">
                <div className="flex-1">
                  <label className="block text-[10px] font-bold text-slate-500 mb-1">محصول</label>
                  <select required value={item.productId} onChange={e => updateItem(idx, 'productId', e.target.value)} className="w-full p-2 border border-slate-200 dark:border-slate-700 rounded-lg text-xs">
                    <option value="">انتخاب...</option>
                    {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
                <div className="w-20">
                  <label className="block text-[10px] font-bold text-slate-500 mb-1">تعداد</label>
                  <input type="number" min="1" required value={item.quantity} onChange={e => updateItem(idx, 'quantity', e.target.value)} className="w-full p-2 border border-slate-200 dark:border-slate-700 rounded-lg text-xs" />
                </div>
                <div className="w-24">
                  <label className="block text-[10px] font-bold text-slate-500 mb-1">قیمت واحد</label>
                  <input type="number" min="0" required value={item.unitPrice} onChange={e => updateItem(idx, 'unitPrice', e.target.value)} className="w-full p-2 border border-slate-200 dark:border-slate-700 rounded-lg text-xs" />
                </div>
                <div className="w-24">
                  <label className="block text-[10px] font-bold text-slate-500 mb-1">حجم پتانسیل</label>
                  <input type="number" min="0" value={item.potentialVolume} onChange={e => updateItem(idx, 'potentialVolume', e.target.value)} className="w-full p-2 border border-slate-200 dark:border-slate-700 rounded-lg text-xs" />
                </div>
                <div className="pt-5">
                  <button type="button" onClick={() => removeItem(idx)} className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
            <div className="text-left font-bold text-sm text-slate-800 dark:text-slate-200 pt-2 border-t border-slate-200 dark:border-slate-700">
              ارزش کل تخمینی: {calculateTotal().toLocaleString()} ریال
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">رقیب تجاری در این فرصت</label>
          <input type="text" value={formData.competitorName} onChange={e => setFormData({...formData, competitorName: e.target.value})} className="w-full p-2.5 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm" placeholder="مثلا: بهران" />
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">اقدام بعدی (Next Action)</label>
          <input type="text" value={formData.nextAction} onChange={e => setFormData({...formData, nextAction: e.target.value})} className="w-full p-2.5 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm" placeholder="مثلا: ارسال پروپوزال فنی" />
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">تاریخ پیگیری بعدی</label>
          <input type="datetime-local" value={formData.followUpDate} onChange={e => setFormData({...formData, followUpDate: e.target.value})} className="w-full p-2.5 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm" />
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
          {loading ? 'در حال ذخیره...' : (initialData?.id ? 'ویرایش فرصت' : 'ثبت فرصت فروش')}
        </button>
      </div>
    </form>
  );
}
