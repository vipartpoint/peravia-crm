'use client';

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { api } from '@/services/api';
import { Button } from '../ui/Button';

const warehouseSchema = z.object({
  name: z.string().min(2, 'نام انبار الزامی است'),
  code: z.string().min(2, 'کد انبار الزامی است'),
  location: z.string().optional().or(z.literal('')),
  isActive: z.boolean()
});

type WarehouseFormValues = z.infer<typeof warehouseSchema>;

interface WarehouseFormProps {
  onSuccess: () => void;
  onCancel: () => void;
  entityId?: string;
}

export function WarehouseForm({ onSuccess, onCancel, entityId }: WarehouseFormProps) {
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, formState: { errors }, reset } = useForm<WarehouseFormValues>({
    resolver: zodResolver(warehouseSchema),
    defaultValues: {
      isActive: true
    }
  });

  useEffect(() => {
    if (entityId) fetchWarehouse();
  }, [entityId]);

  const fetchWarehouse = async () => {
    try {
      const res = await api.get(`/warehouses/${entityId}`);
      reset({
        name: res.data.name,
        code: res.data.code,
        location: res.data.location || '',
        isActive: res.data.isActive,
      });
    } catch (e) {
      console.error(e);
    }
  };

  const onSubmit = async (data: WarehouseFormValues) => {
    setLoading(true);
    try {
      if (entityId) {
        await api.put(`/warehouses/${entityId}`, data);
      } else {
        await api.post('/warehouses', data);
      }
      onSuccess();
    } catch (e: any) {
      alert(e.response?.data?.message || 'خطا در ذخیره اطلاعات');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 p-4">
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">نام انبار</label>
        <input 
          {...register('name')} 
          className="w-full border border-slate-300 rounded-lg p-2.5 outline-none focus:border-indigo-500" 
          placeholder="مثال: انبار مرکزی"
        />
        {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">کد انبار</label>
        <input 
          {...register('code')} 
          className="w-full border border-slate-300 rounded-lg p-2.5 outline-none focus:border-indigo-500" 
          placeholder="مثال: WH-01"
        />
        {errors.code && <p className="text-red-500 text-xs mt-1">{errors.code.message}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">مکان (آدرس جغرافیایی / لوکیشن)</label>
        <input 
          {...register('location')} 
          className="w-full border border-slate-300 rounded-lg p-2.5 outline-none focus:border-indigo-500" 
          placeholder="مثال: جاده قدیم کرج..."
        />
        {errors.location && <p className="text-red-500 text-xs mt-1">{errors.location.message}</p>}
      </div>

      <div className="flex items-center gap-2 mt-4">
        <input 
          type="checkbox" 
          id="isActive"
          {...register('isActive')} 
          className="w-5 h-5 accent-indigo-600 rounded" 
        />
        <label htmlFor="isActive" className="text-sm font-medium text-slate-700 cursor-pointer">انبار فعال است</label>
      </div>

      <div className="flex gap-3 pt-4 border-t border-slate-100">
        <Button type="button" variant="outline" onClick={onCancel} className="flex-1">انصراف</Button>
        <Button type="submit" variant="primary" isLoading={loading} className="flex-1">
          {entityId ? 'ویرایش انبار' : 'ثبت انبار'}
        </Button>
      </div>
    </form>
  );
}
