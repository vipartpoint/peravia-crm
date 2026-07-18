'use client';

import React, { useEffect, useState } from 'react';
import { api } from '@/services/api';
import { TableSkeleton } from '@/components/ui/Skeleton';
import { DataTable } from '@/components/ui/DataTable';
import { useGlobalEntity } from '@/contexts/GlobalEntityContext';
import { Button } from '@/components/ui/Button';
import { Plus } from 'lucide-react';
import { Dictionary } from '@/utils/constants/dictionary';

export default function TerritoriesPage() {
  const [territories, setTerritories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { openCreate } = useGlobalEntity();

  const fetchTerritories = async () => {
    try {
      const data = await api.get('/territories');
      setTerritories(data);
    } catch (e) {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTerritories();
  }, []);

  const columns = [
    { key: 'code', label: 'کد', render: (val: string) => <span className="font-mono text-slate-500 dark:text-slate-400">{val || '---'}</span> },
    { key: 'name', label: 'نام منطقه', render: (val: string) => <span className="font-bold text-slate-900">{val || '---'}</span> },
    { key: 'type', label: 'نوع', render: (val: string) => <span className="text-slate-500 dark:text-slate-400 text-sm">{val || '---'}</span> },
    { key: 'parent', label: 'منطقه والد', render: (_: any, row: any) => <span className="text-slate-600 dark:text-slate-300 font-medium">{row.parent?.name || '---'}</span> },
    { key: 'manager', label: 'مدیر فروش', render: (_: any, row: any) => <span className="text-slate-600 dark:text-slate-300 font-bold">{row.manager?.username || '---'}</span> },
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto min-h-screen">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">{Dictionary.menu.territories}</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">مدیریت مناطق فروش و سلسله مراتب آن‌ها</p>
        </div>
        <Button variant="primary" onClick={() => openCreate('territory')} className="shadow-lg shadow-primary/20">
          <Plus className="w-5 h-5 ml-2" /> افزودن منطقه
        </Button>
      </div>

      {loading ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-700">
          <TableSkeleton rows={10} cols={5} />
        </div>
      ) : (
        <DataTable 
          entityType="territory"
          columns={columns}
          data={territories}
          totalItems={territories.length}
          currentPage={1}
          onPageChange={() => {}}
          onRefresh={fetchTerritories}
        />
      )}
    </div>
  );
}
