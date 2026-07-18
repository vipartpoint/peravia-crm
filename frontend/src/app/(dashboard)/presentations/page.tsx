'use client';

import React, { useEffect, useState } from 'react';
import { api } from '@/services/api';
import { TableSkeleton } from '@/components/ui/Skeleton';
import { DataTable } from '@/components/ui/DataTable';
import { useGlobalEntity } from '@/contexts/GlobalEntityContext';
import { Button } from '@/components/ui/Button';
import { Plus } from 'lucide-react';

export default function PresentationsPage() {
  const [presentations, setPresentations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { openCreate } = useGlobalEntity();

  const fetchPresentations = async () => {
    try {
      const data = await api.get('/presentations');
      setPresentations(data);
    } catch (e) {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPresentations();
  }, []);

  const columns = [
    { key: 'contact', label: 'مخاطب', render: (_: any, row: any) => (
      row.leadId ? (
        <span className="font-bold text-indigo-700">لید: {row.lead?.name}</span>
      ) : (
        <span className="font-bold text-emerald-700">مشتری: {row.customer?.name}</span>
      )
    )},
    { key: 'product', label: 'نوع / محصول', render: (_: any, row: any) => (
      <div>
        <div className="font-bold text-slate-900">{row.product?.name || '---'}</div>
        <div className="text-xs text-slate-500 dark:text-slate-400">{row.presentationType}</div>
      </div>
    )},
    { key: 'customerReaction', label: 'واکنش', render: (val: string) => (
      <span className={`px-2.5 py-1 rounded-md text-xs font-bold border ${
        val === 'Positive' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' :
        val === 'Negative' ? 'bg-rose-100 text-rose-700 border-rose-200' :
        'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700'
      }`}>
        {val || '---'}
      </span>
    )},
    { key: 'user', label: 'کارشناس', render: (_: any, row: any) => <span className="font-bold text-slate-600 dark:text-slate-300">{row.user?.username || '---'}</span> },
    { key: 'createdAt', label: 'تاریخ ثبت', render: (val: string) => <span className="font-mono text-slate-500 dark:text-slate-400">{new Date(val).toLocaleDateString('fa-IR')}</span> }
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto min-h-screen">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">تاریخچه پرزنت‌ها</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">ردگیری نتایج ارائه محصولات به مشتریان و لیدها</p>
        </div>
        <Button variant="primary" onClick={() => openCreate('presentation')} className="shadow-lg shadow-primary/20">
          <Plus className="w-5 h-5 ml-2" /> ثبت پرزنت جدید
        </Button>
      </div>

      {loading ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-700">
          <TableSkeleton rows={10} cols={5} />
        </div>
      ) : (
        <DataTable 
          entityType="presentation"
          columns={columns}
          data={presentations}
          totalItems={presentations.length}
          currentPage={1}
          onPageChange={() => {}}
          onRefresh={fetchPresentations}
        />
      )}
    </div>
  );
}
