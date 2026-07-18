'use client';

import React, { useState, useEffect } from 'react';
import { api } from '@/services/api';
import { Dictionary } from '@/utils/constants/dictionary';
import { Save } from 'lucide-react';

interface TaskFormProps {
  initialData?: any;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function TaskForm({ initialData, onSuccess, onCancel }: TaskFormProps) {
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [leads, setLeads] = useState<any[]>([]);
  
  const [formData, setFormData] = useState({
    title: initialData?.title || '',
    description: initialData?.description || '',
    relatedType: initialData?.relatedType || '',
    relatedId: initialData?.relatedId || '',
    assignedTo: initialData?.assignedTo || '',
    dueAt: initialData?.dueAt ? new Date(initialData.dueAt).toISOString().split('T')[0] : '',
    priority: initialData?.priority || 'Normal',
    status: initialData?.status || 'Open',
    notes: initialData?.notes || '',
  });

  useEffect(() => {
    // Fetch users for assignment
    api.get('/users').then(res => setUsers(res || [])).catch(() => {});
    // Fetch customers
    api.get('/customers').then(res => setCustomers(res || [])).catch(() => {});
    // Fetch leads
    api.get('/leads').then(res => setLeads(res || [])).catch(() => {});
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
        dueAt: formData.dueAt ? new Date(formData.dueAt).toISOString() : undefined,
      };
      if (initialData?.id) {
        await api.patch(`/tasks/${initialData.id}`, payload);
      } else {
        await api.post('/tasks', payload);
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
        {/* Title */}
        <div className="md:col-span-2">
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">عنوان وظیفه <span className="text-rose-500">*</span></label>
          <input required type="text" name="title" value={formData.title} onChange={handleChange} className="w-full p-2.5 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm dark:bg-slate-900 dark:text-slate-100" />
        </div>

        {/* Description */}
        <div className="md:col-span-2">
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">شرح وظیفه</label>
          <textarea name="description" value={formData.description} onChange={handleChange} rows={2} className="w-full p-2.5 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm resize-none dark:bg-slate-900 dark:text-slate-100"></textarea>
        </div>

        {/* Assigned To */}
        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">مسئول انجام <span className="text-rose-500">*</span></label>
          <select required name="assignedTo" value={formData.assignedTo} onChange={handleChange} className="w-full p-2.5 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm dark:bg-slate-900 dark:text-slate-100">
            <option value="">انتخاب کاربر...</option>
            {users.map(u => <option key={u.id} value={u.id}>{u.username}</option>)}
          </select>
        </div>

        {/* Due Date */}
        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">مهلت انجام</label>
          <input type="date" name="dueAt" value={formData.dueAt} onChange={handleChange} className="w-full p-2.5 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm dark:bg-slate-900 dark:text-slate-100" />
        </div>

        {/* Priority */}
        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">اولویت <span className="text-rose-500">*</span></label>
          <select required name="priority" value={formData.priority} onChange={handleChange} className="w-full p-2.5 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm dark:bg-slate-900 dark:text-slate-100">
            <option value="Low">کم (Low)</option>
            <option value="Normal">عادی (Normal)</option>
            <option value="High">زیاد (High)</option>
            <option value="Urgent">فوری (Urgent)</option>
          </select>
        </div>

        {/* Status */}
        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">وضعیت <span className="text-rose-500">*</span></label>
          <select required name="status" value={formData.status} onChange={handleChange} className="w-full p-2.5 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm dark:bg-slate-900 dark:text-slate-100">
            <option value="Open">باز (Open)</option>
            <option value="InProgress">در حال انجام (InProgress)</option>
            <option value="Done">انجام شده (Done)</option>
            <option value="Overdue">تاخیر خورده (Overdue)</option>
            <option value="Cancelled">لغو شده (Cancelled)</option>
          </select>
        </div>

        {/* Related Type */}
        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">مرتبط با</label>
          <select name="relatedType" value={formData.relatedType} onChange={handleChange} className="w-full p-2.5 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm dark:bg-slate-900 dark:text-slate-100">
            <option value="">هیچکدام</option>
            <option value="Customer">مشتری</option>
            <option value="Lead">سرنخ (Lead)</option>
          </select>
        </div>

        {/* Related ID */}
        {formData.relatedType && (
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">انتخاب مورد مرتبط</label>
            <select name="relatedId" value={formData.relatedId} onChange={handleChange} className="w-full p-2.5 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm dark:bg-slate-900 dark:text-slate-100">
              <option value="">انتخاب...</option>
              {formData.relatedType === 'Customer' && customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              {formData.relatedType === 'Lead' && leads.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
            </select>
          </div>
        )}

        {/* Notes */}
        <div className="md:col-span-2">
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">توضیحات تکمیلی</label>
          <textarea name="notes" value={formData.notes} onChange={handleChange} rows={2} className="w-full p-2.5 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm resize-none dark:bg-slate-900 dark:text-slate-100"></textarea>
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
          {loading ? 'در حال ثبت...' : (initialData?.id ? 'ویرایش وظیفه' : 'ثبت وظیفه')}
        </button>
      </div>
    </form>
  );
}
