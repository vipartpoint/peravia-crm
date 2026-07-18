'use client';

import React, { useEffect, useState } from 'react';
import { api } from '@/services/api';
import { TableSkeleton } from '@/components/ui/Skeleton';
import { DataTable } from '@/components/ui/DataTable';
import { useGlobalEntity } from '@/contexts/GlobalEntityContext';
import { Button } from '@/components/ui/Button';
import { Plus } from 'lucide-react';

import { FilterBuilder, FilterRule } from '@/components/ui/FilterBuilder';

export default function CustomersPage() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<FilterRule[]>([]);
  const { openCreate } = useGlobalEntity();

  const fetchCustomers = async () => {
    try {
      const data = await api.get('/customers');
      setCustomers(data);
      setFilteredCustomers(data);
    } catch (error: any) {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  useEffect(() => {
    if (filters.length === 0) {
      setFilteredCustomers(customers);
      return;
    }
    const result = customers.filter(c => {
      return filters.every(f => {
        const val = String(c[f.field] || '').toLowerCase();
        const search = f.value.toLowerCase();
        switch (f.operator) {
          case 'contains': return val.includes(search);
          case 'equals': return val === search;
          case 'startsWith': return val.startsWith(search);
          default: return true;
        }
      });
    });
    setFilteredCustomers(result);
  }, [filters, customers]);

  const columns = [
    { key: 'name', label: 'نام مشتری', render: (val: string) => <span className="font-bold text-slate-800 dark:text-white">{val}</span> },
    { key: 'customerType', label: 'نوع مشتری', render: (val: string) => <span className="text-slate-600 dark:text-slate-300">{val}</span> },
    { key: 'phone', label: 'تلفن', render: (val: string) => <span className="font-mono text-slate-500 dark:text-slate-400">{val || '---'}</span> },
    { key: 'creditLimit', label: 'سقف اعتبار', render: (val: number) => <span className="text-slate-600 dark:text-slate-300 font-medium">{(val || 0).toLocaleString('fa-IR')} ریال</span> },
    { key: 'status', label: 'وضعیت', render: (val: string) => (
      <span className={`px-2.5 py-1 rounded-md text-xs font-bold ${val === 'Active' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400' : 'bg-rose-100 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400'}`}>
        {val === 'Active' ? 'فعال' : 'غیرفعال'}
      </span>
    )}
  ];

  const filterFields = [
    { key: 'name', label: 'نام مشتری' },
    { key: 'customerType', label: 'نوع مشتری' },
    { key: 'phone', label: 'تلفن' },
    { key: 'status', label: 'وضعیت' }
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto min-h-screen">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">مشتریان</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">مدیریت لیست مشتریان و سرنخ‌های فروش</p>
        </div>
        <Button data-tour="tour-customers-create" variant="primary" onClick={() => openCreate('customer')} className="shadow-lg shadow-primary/20">
          <Plus className="w-5 h-5 ml-2" /> ثبت مشتری جدید
        </Button>
      </div>

      <div className="mb-6">
        <FilterBuilder 
          fields={filterFields} 
          onApply={setFilters} 
          storageKey="customers" 
        />
      </div>

      {loading ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800">
          <TableSkeleton rows={10} cols={6} />
        </div>
      ) : (
        <div data-tour="tour-customers-list">
          <DataTable 
            entityType="customer"
            columns={columns}
            data={filteredCustomers}
            totalItems={filteredCustomers.length}
            currentPage={1}
            onPageChange={() => {}}
            onRefresh={fetchCustomers}
          />
        </div>
      )}
    </div>
  );
}
