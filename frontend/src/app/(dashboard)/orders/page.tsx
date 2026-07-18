'use client';

import React, { useEffect, useState } from 'react';
import { api } from '@/services/api';
import { TableSkeleton } from '@/components/ui/Skeleton';
import { DataTable } from '@/components/ui/DataTable';
import { useGlobalEntity } from '@/contexts/GlobalEntityContext';
import { Button } from '@/components/ui/Button';
import { Plus } from 'lucide-react';

export default function OrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { openCreate } = useGlobalEntity();

  const fetchOrders = async () => {
    try {
      const data = await api.get('/orders');
      setOrders(data);
    } catch (e) {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const columns = [
    { key: 'orderNumber', label: 'شماره سفارش', render: (val: string) => <span className="font-bold font-mono text-slate-800 dark:text-slate-200">#{val}</span> },
    { key: 'customer', label: 'مشتری', render: (val: any) => <span className="font-bold text-slate-700 dark:text-slate-300">{val?.name || '---'}</span> },
    { key: 'totalAmount', label: 'مبلغ کل', render: (val: number) => <span className="font-medium text-emerald-600 dark:text-emerald-400">{(val || 0).toLocaleString('fa-IR')} ریال</span> },
    { key: 'status', label: 'وضعیت', render: (val: string) => (
      <span className={`px-2.5 py-1 rounded-md text-xs font-bold border ${
        val === 'Draft' ? 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700' :
        val === 'Approved' ? 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20' :
        'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20'
      }`}>
        {val === 'Draft' ? 'پیش‌نویس' : val === 'Approved' ? 'تایید شده' : val}
      </span>
    )},
    { key: 'createdAt', label: 'تاریخ ثبت', render: (val: string) => <span className="text-slate-500 dark:text-slate-400 text-sm">{new Date(val).toLocaleDateString('fa-IR')}</span> }
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto min-h-screen">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">سفارشات</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">مدیریت سفارشات ثبت شده</p>
        </div>
        <Button data-tour="tour-orders-create" variant="primary" onClick={() => openCreate('order')} className="shadow-lg shadow-primary/20">
          <Plus className="w-5 h-5 ml-2" /> ثبت سفارش جدید
        </Button>
      </div>

      {loading ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800">
          <TableSkeleton rows={10} cols={6} />
        </div>
      ) : (
        <div data-tour="tour-orders-list" className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
          <DataTable 
            entityType="order"
            columns={columns}
            data={orders}
            totalItems={orders.length}
            currentPage={1}
            onPageChange={() => {}}
            onRefresh={fetchOrders}
          />
        </div>
      )}
    </div>
  );
}
