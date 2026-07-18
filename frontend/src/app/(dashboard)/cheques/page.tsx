'use client';

import React, { useEffect, useState } from 'react';
import { api } from '@/services/api';
import { TableSkeleton } from '@/components/ui/Skeleton';
import { DataTable } from '@/components/ui/DataTable';
import { useGlobalEntity } from '@/contexts/GlobalEntityContext';
import { Button } from '@/components/ui/Button';
import { Plus } from 'lucide-react';

export default function ChequesPage() {
  const [cheques, setCheques] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { openCreate } = useGlobalEntity();

  const fetchCheques = async () => {
    try {
      const data = await api.get('/cheques');
      setCheques(data);
    } catch (e) {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCheques();
  }, []);

  const columns = [
    { key: 'customer', label: 'مشتری', render: (_: any, row: any) => <span className="font-bold text-slate-900">{row.customer?.name || '---'}</span> },
    { key: 'chequeNumber', label: 'شماره چک', render: (val: string) => <span className="font-mono text-slate-500 dark:text-slate-400">{val || '---'}</span> },
    { key: 'bankName', label: 'بانک', render: (val: string) => <span className="text-slate-600 dark:text-slate-300 font-medium">{val || '---'}</span> },
    { key: 'amount', label: 'مبلغ (ریال)', render: (val: number) => <span className="font-bold text-slate-800 dark:text-slate-100">{(val || 0).toLocaleString('fa-IR')}</span> },
    { key: 'dueDate', label: 'سررسید', render: (val: string) => <span className="text-slate-600 dark:text-slate-300 font-medium">{new Date(val).toLocaleDateString('fa-IR')}</span> },
    { key: 'status', label: 'وضعیت', render: (val: string) => (
      <span className={`px-2.5 py-1 rounded-md text-xs font-bold border ${
        val === 'Cleared' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' :
        val === 'Bounced' ? 'bg-rose-100 text-rose-700 border-rose-200' :
        val === 'NearDue' ? 'bg-amber-100 text-amber-700 border-amber-200' :
        'bg-blue-100 text-blue-700 border-blue-200'
      }`}>
        {val === 'Registered' ? 'ثبت شده' : val === 'NearDue' ? 'نزدیک سررسید' : val === 'Cleared' ? 'وصول شده' : 'برگشت خورده'}
      </span>
    )}
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto min-h-screen">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">مدیریت چک‌ها</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">مدیریت چک‌های دریافتی و پرداختی</p>
        </div>
        <Button variant="primary" onClick={() => openCreate('cheque')} className="shadow-lg shadow-primary/20">
          <Plus className="w-5 h-5 ml-2" /> ثبت چک جدید
        </Button>
      </div>

      {loading ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-700">
          <TableSkeleton rows={10} cols={6} />
        </div>
      ) : (
        <DataTable 
          entityType="cheque"
          columns={columns}
          data={cheques}
          totalItems={cheques.length}
          currentPage={1}
          onPageChange={() => {}}
          onRefresh={fetchCheques}
          savedViews={['همه چک‌ها', 'نزدیک سررسید', 'سررسید گذشته (Overdue)', 'برگشت خورده (Bounced)']}
        />
      )}
    </div>
  );
}
