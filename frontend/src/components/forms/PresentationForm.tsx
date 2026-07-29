'use client';

import React, { useState, useEffect } from 'react';
import { api } from '@/services/api';
import { Save } from 'lucide-react';
import { Dictionary } from '@/utils/constants/dictionary';

interface PresentationFormProps {
  initialData?: any;
  onSuccess?: () => void;
  onCancel?: () => void;
  prefillLeadId?: string;
}

export function PresentationForm({ initialData, onSuccess, onCancel, prefillLeadId }: PresentationFormProps) {
  const [loading, setLoading] = useState(false);
  const [leads, setLeads] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [presentationMethods, setPresentationMethods] = useState<any[]>([]);
  const [customerReactions, setCustomerReactions] = useState<any[]>([]);
  const [lostReasons, setLostReasons] = useState<any[]>([]);

  const [targetType, setTargetType] = useState(initialData?.leadId || prefillLeadId ? 'lead' : 'customer');

  const [formData, setFormData] = useState({
    leadId: initialData?.leadId || prefillLeadId || '',
    customerId: initialData?.customerId || '',
    productId: initialData?.productId || '',
    presentationType: initialData?.presentationType || 'InPerson',
    durationMinutes: initialData?.durationMinutes || '',
    customerReaction: initialData?.customerReaction || 'Cautious',
    competitorName: initialData?.competitorName || '',
    notes: initialData?.notes || '',
    nextFollowUpAt: initialData?.nextFollowUpAt ? new Date(initialData.nextFollowUpAt).toISOString().slice(0, 16) : ''
  });

  const [rejectionReasons, setRejectionReasons] = useState<string[]>(initialData?.rejectionReasons || []);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [lData, cData, pData, pmData, crData, lrData] = await Promise.all([
        api.get('/leads'),
        api.get('/customers'),
        api.get('/products'),
        api.get('/catalogs/presentation-methods?activeOnly=true&pageSize=100'),
        api.get('/catalogs/customer-reactions?activeOnly=true&pageSize=100'),
        api.get('/catalogs/lost-reasons?activeOnly=true&pageSize=100')
      ]);
      setLeads(lData);
      setCustomers(cData);
      setProducts(pData.filter((p: any) => p.isActive));
      setPresentationMethods(pmData.data || []);
      setCustomerReactions(crData.data || []);
      setLostReasons(lrData.data || []);
    } catch (e) {
      console.error(e);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (targetType === 'lead' && !formData.leadId) return alert('انتخاب لید الزامی است.');
    if (targetType === 'customer' && !formData.customerId) return alert('انتخاب مشتری الزامی است.');

    setLoading(true);
    try {
      const payload: any = {
        ...formData,
        rejectionReasons,
        durationMinutes: formData.durationMinutes ? Number(formData.durationMinutes) : undefined
      };
      if (targetType === 'lead') delete payload.customerId;
      if (targetType === 'customer') delete payload.leadId;
      if (!payload.productId) delete payload.productId;
      if (!payload.competitorName) delete payload.competitorName;
      if (!payload.notes) delete payload.notes;
      if (!payload.nextFollowUpAt) delete payload.nextFollowUpAt;

      if (initialData?.id) {
        await api.patch(`/presentations/${initialData.id}`, payload);
      } else {
        await api.post('/presentations', payload);
      }
      if (onSuccess) onSuccess();
    } catch (err: any) {
      alert(err.response?.data?.message || 'خطا در ثبت پرزنت');
    } finally {
      setLoading(false);
    }
  };

  const toggleReason = (r: string) => {
    if (rejectionReasons.includes(r)) {
      setRejectionReasons(rejectionReasons.filter(x => x !== r));
    } else {
      setRejectionReasons([...rejectionReasons, r]);
    }
  };

  return (
    <div className="space-y-6">
      <div className="mb-6 flex space-x-4 space-x-reverse border-b border-slate-100 dark:border-slate-800 pb-4">
        <label className="flex items-center space-x-2 space-x-reverse cursor-pointer">
          <input type="radio" name="target" checked={targetType === 'customer'} onChange={() => setTargetType('customer')} className="text-purple-600 focus:ring-purple-500 w-4 h-4" />
          <span className="font-bold text-slate-700 dark:text-slate-300 text-sm">برای مشتری فعلی</span>
        </label>
        <label className="flex items-center space-x-2 space-x-reverse cursor-pointer">
          <input type="radio" name="target" checked={targetType === 'lead'} onChange={() => setTargetType('lead')} className="text-purple-600 focus:ring-purple-500 w-4 h-4" />
          <span className="font-bold text-slate-700 dark:text-slate-300 text-sm">برای لید (مشتری بالقوه)</span>
        </label>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {targetType === 'lead' ? (
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">انتخاب لید <span className="text-rose-500">*</span></label>
              <select required value={formData.leadId} onChange={e => setFormData({...formData, leadId: e.target.value})} className="w-full p-2.5 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none text-sm">
                <option value="">انتخاب کنید...</option>
                {leads.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
              </select>
            </div>
          ) : (
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">انتخاب مشتری <span className="text-rose-500">*</span></label>
              <select required value={formData.customerId} onChange={e => setFormData({...formData, customerId: e.target.value})} className="w-full p-2.5 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none text-sm">
                <option value="">انتخاب کنید...</option>
                {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">محصول پرزنت شده</label>
            <select value={formData.productId} onChange={e => setFormData({...formData, productId: e.target.value})} className="w-full p-2.5 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none text-sm">
              <option value="">انتخاب کنید...</option>
              {products.map(p => <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>)}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">روش پرزنت</label>
            <select value={formData.presentationType} onChange={e => setFormData({...formData, presentationType: e.target.value})} className="w-full p-2.5 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none text-sm">
              <option value="">انتخاب کنید...</option>
              {presentationMethods.map(pm => (
                <option key={pm.id} value={pm.code}>{pm.nameFa}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">مدت زمان (دقیقه)</label>
            <input type="number" min="1" value={formData.durationMinutes} onChange={e => setFormData({...formData, durationMinutes: e.target.value})} className="w-full p-2.5 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none text-sm" />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">واکنش مشتری</label>
            <select value={formData.customerReaction} onChange={e => setFormData({...formData, customerReaction: e.target.value})} className="w-full p-2.5 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none text-sm">
              <option value="">انتخاب کنید...</option>
              {customerReactions.map(cr => (
                <option key={cr.id} value={cr.code}>{cr.nameFa}</option>
              ))}
            </select>
          </div>

          {formData.customerReaction === 'Negative' && (
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">دلایل عدم پذیرش (چند انتخابی)</label>
              <div className="flex flex-wrap gap-2">
                {lostReasons.map(r => (
                  <button key={r.code} type="button" onClick={() => toggleReason(r.code)} className={`px-3 py-1.5 rounded-lg text-sm border font-medium ${rejectionReasons.includes(r.code) ? 'bg-rose-50 border-rose-500 text-rose-700' : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:bg-slate-800'}`}>
                    {r.nameFa}
                  </button>
                ))}
              </div>
              {rejectionReasons.includes('Competitor') && (
                <input type="text" placeholder="نام رقیب..." value={formData.competitorName} onChange={e => setFormData({...formData, competitorName: e.target.value})} className="mt-3 w-full p-2.5 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none focus:ring-2 focus:ring-purple-500" />
              )}
            </div>
          )}

          <div className="md:col-span-2">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">یادداشت‌ها</label>
            <textarea rows={3} value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} className="w-full p-2.5 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none text-sm" placeholder="نکات مهم جلسه..."></textarea>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">تاریخ پیگیری بعدی</label>
            <input type="datetime-local" value={formData.nextFollowUpAt} onChange={e => setFormData({...formData, nextFollowUpAt: e.target.value})} className="w-full p-2.5 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none text-sm" />
          </div>

        </div>

        <div className="pt-6 mt-6 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3">
          {onCancel && (
            <button type="button" onClick={onCancel} className="px-6 py-2.5 rounded-xl text-sm font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:bg-slate-800 transition">
              {Dictionary.general.cancel}
            </button>
          )}
          <button disabled={loading} type="submit" className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-2.5 rounded-xl flex items-center shadow-lg shadow-purple-500/30 transition-all font-bold text-sm disabled:opacity-50">
            <Save className="w-4 h-4 ml-2" />
            {loading ? 'در حال ذخیره...' : (initialData?.id ? 'ویرایش پرزنت' : 'ذخیره پرزنت')}
          </button>
        </div>
      </form>
    </div>
  );
}
