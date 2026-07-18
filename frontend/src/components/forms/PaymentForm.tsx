'use client';

import React, { useState, useEffect } from 'react';
import { api } from '@/services/api';
import { Dictionary } from '@/utils/constants/dictionary';
import { Save } from 'lucide-react';

interface PaymentFormProps {
  initialData?: any;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function PaymentForm({ initialData, onSuccess, onCancel }: PaymentFormProps) {
  const [loading, setLoading] = useState(false);
  const [customers, setCustomers] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  
  const [formData, setFormData] = useState({
    customerId: initialData?.customerId || '',
    orderId: initialData?.orderId || '',
    amount: initialData?.amount || '',
    method: initialData?.method || 'BankTransfer',
    referenceNumber: initialData?.referenceNumber || '',
    notes: initialData?.notes || '',
  });

  useEffect(() => {
    // Fetch customers
    api.get('/customers').then(res => setCustomers(res || [])).catch(() => {});
    // Fetch orders
    api.get('/orders').then(res => setOrders(res || [])).catch(() => {});
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        ...formData,
        amount: Number(formData.amount),
        orderId: formData.orderId || undefined,
      };
      if (initialData?.id) {
        await api.patch(`/payments/${initialData.id}`, payload);
      } else {
        await api.post('/payments', payload);
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
        {/* Customer */}
        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">مشتری <span className="text-rose-500">*</span></label>
          <select required name="customerId" value={formData.customerId} onChange={handleChange} className="w-full p-2.5 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm dark:bg-slate-900 dark:text-slate-100">
            <option value="">انتخاب مشتری...</option>
            {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>

        {/* Order */}
        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">سفارش مرتبط</label>
          <select name="orderId" value={formData.orderId} onChange={handleChange} className="w-full p-2.5 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm dark:bg-slate-900 dark:text-slate-100">
            <option value="">بدون سفارش</option>
            {orders.map(o => <option key={o.id} value={o.id}>سفارش #{o.orderNumber}</option>)}
          </select>
        </div>

        {/* Amount */}
        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">مبلغ (ریال) <span className="text-rose-500">*</span></label>
          <input required type="number" name="amount" value={formData.amount} onChange={handleChange} className="w-full p-2.5 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm dark:bg-slate-900 dark:text-slate-100" />
        </div>

        {/* Method */}
        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">روش پرداخت <span className="text-rose-500">*</span></label>
          <select required name="method" value={formData.method} onChange={handleChange} className="w-full p-2.5 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm dark:bg-slate-900 dark:text-slate-100">
            <option value="Cash">نقدی (Cash)</option>
            <option value="BankTransfer">حواله بانکی (BankTransfer)</option>
            <option value="Cheque">چک (Cheque)</option>
            <option value="POS">کارتخوان (POS)</option>
            <option value="Other">سایر (Other)</option>
          </select>
        </div>

        {/* Reference Number */}
        <div className="md:col-span-2">
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">شماره ارجاع / پیگیری</label>
          <input name="referenceNumber" value={formData.referenceNumber} onChange={handleChange} className="w-full p-2.5 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm dark:bg-slate-900 dark:text-slate-100" />
        </div>

        {/* Notes */}
        <div className="md:col-span-2">
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">توضیحات</label>
          <textarea name="notes" value={formData.notes} onChange={handleChange} rows={3} className="w-full p-2.5 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm resize-none dark:bg-slate-900 dark:text-slate-100"></textarea>
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
          {loading ? 'در حال ثبت...' : (initialData?.id ? 'ویرایش پرداخت' : 'ثبت پرداخت')}
        </button>
      </div>
    </form>
  );
}
