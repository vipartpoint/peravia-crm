'use client';

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { api } from '@/services/api';
import { Button } from '../ui/Button';

const userSchema = z.object({
  username: z.string().min(3, 'نام کاربری باید حداقل ۳ حرف باشد'),
  email: z.string().email('ایمیل معتبر نیست').optional().or(z.literal('')),
  roleId: z.string().min(1, 'نقش الزامی است'),
  territoryId: z.string().optional(),
});

type UserFormValues = z.infer<typeof userSchema>;

interface UserFormProps {
  onSuccess: () => void;
  onCancel: () => void;
  entityId?: string;
}

export function UserForm({ onSuccess, onCancel, entityId }: UserFormProps) {
  const [loading, setLoading] = useState(false);
  const [roles, setRoles] = useState<any[]>([]);
  const [territories, setTerritories] = useState<any[]>([]);
  const [generatedPassword, setGeneratedPassword] = useState('');

  const { register, handleSubmit, formState: { errors }, reset } = useForm<UserFormValues>({
    resolver: zodResolver(userSchema),
  });

  useEffect(() => {
    fetchOptions();
    if (entityId) {
      fetchUser();
    }
  }, [entityId]);

  const fetchOptions = async () => {
    try {
      const [rolesRes, territoriesRes] = await Promise.all([
        api.get('/users/roles'),
        api.get('/territories')
      ]);
      setRoles(rolesRes.data);
      setTerritories(territoriesRes.data);
    } catch (e) {
      console.error('Failed to fetch options', e);
    }
  };

  const fetchUser = async () => {
    try {
      const res = await api.get(`/users/${entityId}`);
      reset({
        username: res.data.username,
        email: res.data.email || '',
        roleId: res.data.roleId,
        territoryId: res.data.territoryId || '',
      });
    } catch (e) {
      console.error(e);
    }
  };

  const onSubmit = async (data: UserFormValues) => {
    setLoading(true);
    try {
      if (entityId) {
        await api.put(`/users/${entityId}`, data);
      } else {
        const res = await api.post('/users', data);
        setGeneratedPassword(res.data.generatedPassword);
        // Do not close modal immediately so admin can see the password
        return; 
      }
      onSuccess();
    } catch (e: any) {
      alert(e.response?.data?.message || 'خطا در ذخیره اطلاعات');
    } finally {
      setLoading(false);
    }
  };

  if (generatedPassword) {
    return (
      <div className="p-6 space-y-6 text-center">
        <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto text-2xl">✓</div>
        <h3 className="text-xl font-bold text-slate-800">کاربر با موفقیت ایجاد شد</h3>
        <p className="text-slate-600">رمز عبور موقت این کاربر به شرح زیر است. لطفاً آن را در اختیار کاربر قرار دهید. کاربر موظف است در اولین ورود آن را تغییر دهد.</p>
        <div className="bg-slate-100 p-4 rounded-xl font-mono text-xl tracking-widest text-slate-900 border border-slate-200">
          {generatedPassword}
        </div>
        <Button variant="primary" onClick={onSuccess} className="w-full">متوجه شدم</Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 p-4">
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">نام کاربری</label>
        <input 
          {...register('username')} 
          disabled={!!entityId}
          className="w-full border border-slate-300 rounded-lg p-2.5 outline-none focus:border-indigo-500 disabled:bg-slate-100" 
          placeholder="مثال: ali.rezai"
        />
        {errors.username && <p className="text-red-500 text-xs mt-1">{errors.username.message}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">ایمیل (اختیاری)</label>
        <input 
          {...register('email')} 
          className="w-full border border-slate-300 rounded-lg p-2.5 outline-none focus:border-indigo-500" 
          placeholder="example@domain.com"
          dir="ltr"
        />
        {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">نقش سیستم</label>
        <select {...register('roleId')} className="w-full border border-slate-300 rounded-lg p-2.5 outline-none focus:border-indigo-500 bg-white">
          <option value="">انتخاب نقش...</option>
          {roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
        </select>
        {errors.roleId && <p className="text-red-500 text-xs mt-1">{errors.roleId.message}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">حوزه استحفاظی (Territory)</label>
        <select {...register('territoryId')} className="w-full border border-slate-300 rounded-lg p-2.5 outline-none focus:border-indigo-500 bg-white">
          <option value="">هیچکدام (دسترسی سراسری یا محدود به نقش)</option>
          {territories.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
      </div>

      <div className="flex gap-3 pt-4 border-t border-slate-100">
        <Button type="button" variant="outline" onClick={onCancel} className="flex-1">انصراف</Button>
        <Button type="submit" variant="primary" isLoading={loading} className="flex-1">
          {entityId ? 'ویرایش کاربر' : 'ایجاد کاربر'}
        </Button>
      </div>
    </form>
  );
}
