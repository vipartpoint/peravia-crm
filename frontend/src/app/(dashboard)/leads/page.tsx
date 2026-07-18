'use client';

import React, { useEffect, useState } from 'react';
import { api } from '@/services/api';
import { TableSkeleton } from '@/components/ui/Skeleton';
import { DataTable } from '@/components/ui/DataTable';
import { useGlobalEntity } from '@/contexts/GlobalEntityContext';
import { Button } from '@/components/ui/Button';
import { Plus } from 'lucide-react';

export default function LeadsPage() {
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { openCreate } = useGlobalEntity();

  const fetchLeads = async () => {
    try {
      const data = await api.get('/leads');
      setLeads(data);
    } catch (e) {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, []);

  const columns = [
    { key: 'name', label: 'نام سرنخ', render: (val: string) => <span className="font-bold text-slate-800 dark:text-slate-100">{val}</span> },
    { key: 'phone', label: 'تلفن', render: (val: string) => <span dir="ltr" className="font-mono text-slate-500 dark:text-slate-400 inline-block">{val || '---'}</span> },
    { key: 'source', label: 'منبع', render: (val: string) => <span className="text-slate-600 dark:text-slate-300">{val || '---'}</span> },
    { key: 'status', label: 'وضعیت قیف', render: (val: string) => (
      <span className="px-2.5 py-1 bg-blue-100 text-blue-700 rounded-md text-xs font-bold border border-blue-200">
        {val || 'جدید'}
      </span>
    )},
    { key: 'nextFollowUpAt', label: 'پیگیری بعدی', render: (val: string) => (
      <span className="text-amber-600 font-medium">
        {val ? new Date(val).toLocaleDateString('fa-IR') : '---'}
      </span>
    )}
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto min-h-screen">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">سرنخ‌های فروش (Leads)</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">مدیریت و پیگیری مشتریان بالقوه</p>
        </div>
        <Button data-tour="tour-leads-create" variant="primary" onClick={() => openCreate('lead')} className="shadow-lg shadow-primary/20">
          <Plus className="w-5 h-5 ml-2" /> ثبت سرنخ جدید
        </Button>
      </div>

      {loading ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-700">
          <TableSkeleton rows={10} cols={6} />
        </div>
      ) : (
        <div data-tour="tour-leads-list">
          <DataTable 
            entityType="lead"
            columns={columns}
            data={leads}
            totalItems={leads.length}
            currentPage={1}
            onPageChange={() => {}}
            onRefresh={fetchLeads}
          />
        </div>
      )}
    </div>
  );
}
