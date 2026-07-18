'use client';

import React, { useEffect, useState } from 'react';
import { api } from '@/services/api';
import { TableSkeleton } from '@/components/ui/Skeleton';
import { DataTable } from '@/components/ui/DataTable';
import { useGlobalEntity } from '@/contexts/GlobalEntityContext';
import { Button } from '@/components/ui/Button';
import { Plus } from 'lucide-react';

export default function VisitsPage() {
  const [visits, setVisits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { openCreate } = useGlobalEntity();

  const fetchVisits = async () => {
    try {
      const data = await api.get('/visits');
      setVisits(data);
    } catch (e) {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVisits();
  }, []);

  const columns = [
    { key: 'scheduledAt', label: 'تاریخ و ساعت', render: (val: string) => <span className="font-mono text-slate-600 dark:text-slate-300">{new Date(val).toLocaleString('fa-IR')}</span> },
    { key: 'target', label: 'هدف ویزیت', render: (_: any, row: any) => <span className="font-bold text-slate-900">{row.customer?.name || row.lead?.name || 'نامشخص'}</span> },
    { key: 'visitType', label: 'نوع', render: (val: string) => <span className="text-slate-500 dark:text-slate-400">{val || '---'}</span> },
    { key: 'status', label: 'وضعیت', render: (val: string) => (
      <span className={`px-2.5 py-1 rounded-md text-xs font-bold border ${
        val === 'Completed' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' :
        val === 'Planned' ? 'bg-blue-100 text-blue-700 border-blue-200' :
        'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700'
      }`}>
        {val || '---'}
      </span>
    )},
    { key: 'user', label: 'کارشناس', render: (_: any, row: any) => <span className="font-bold text-slate-600 dark:text-slate-300">{row.user?.username || '---'}</span> },
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto min-h-screen">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">مدیریت ویزیت‌ها</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">برنامه‌ریزی و ثبت ویزیت‌های حضوری</p>
        </div>
        <Button variant="primary" onClick={() => openCreate('visit')} className="shadow-lg shadow-primary/20">
          <Plus className="w-5 h-5 ml-2" /> ثبت ویزیت جدید
        </Button>
      </div>

      {loading ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-700">
          <TableSkeleton rows={10} cols={5} />
        </div>
      ) : (
        <DataTable 
          entityType="visit"
          columns={columns}
          data={visits}
          totalItems={visits.length}
          currentPage={1}
          onPageChange={() => {}}
          onRefresh={fetchVisits}
        />
      )}
    </div>
  );
}
