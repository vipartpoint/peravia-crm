'use client';

import React, { useEffect, useState } from 'react';
import { api } from '@/services/api';
import { TableSkeleton } from '@/components/ui/Skeleton';
import { DataTable } from '@/components/ui/DataTable';
import { useGlobalEntity } from '@/contexts/GlobalEntityContext';
import { Button } from '@/components/ui/Button';
import { Plus } from 'lucide-react';

export default function UsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { openCreate } = useGlobalEntity();

  const fetchUsers = async () => {
    try {
      const data = await api.get('/users');
      setUsers(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const toggleStatus = async (id: string, currentStatus: boolean) => {
    try {
      await api.patch(`/users/${id}/status`, { isActive: !currentStatus });
      fetchUsers();
    } catch (e) {
      alert('خطا در تغییر وضعیت');
    }
  };

  const columns = [
    { key: 'username', label: 'نام کاربری', render: (val: string) => <span className="font-bold text-slate-800 dark:text-slate-100">{val}</span> },
    { key: 'email', label: 'ایمیل', render: (val: string) => <span className="text-slate-500">{val || '---'}</span> },
    { key: 'role', label: 'نقش سیستم', render: (val: any) => <span className="px-2 py-1 bg-indigo-50 text-indigo-700 rounded text-xs font-bold">{val?.name || '---'}</span> },
    { key: 'territory', label: 'حوزه (Territory)', render: (val: any) => <span className="text-sm text-slate-600">{val?.name || 'سراسری'}</span> },
    { key: 'isActive', label: 'وضعیت', render: (val: boolean, row: any) => (
      <button 
        onClick={() => toggleStatus(row.id, val)}
        className={`px-3 py-1 rounded-full text-xs font-bold transition-colors ${val ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' : 'bg-rose-100 text-rose-700 hover:bg-rose-200'}`}
      >
        {val ? 'فعال' : 'غیرفعال'}
      </button>
    )},
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto min-h-screen">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">مدیریت کاربران</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">تعریف کاربر، تخصیص نقش و حوزه استحفاظی</p>
        </div>
        <Button variant="primary" onClick={() => openCreate('user')} className="shadow-lg shadow-primary/20">
          <Plus className="w-5 h-5 ml-2" /> ایجاد کاربر جدید
        </Button>
      </div>

      {loading ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-700">
          <TableSkeleton rows={10} cols={5} />
        </div>
      ) : (
        <DataTable 
          entityType="user"
          columns={columns}
          data={users}
          totalItems={users.length}
          currentPage={1}
          onPageChange={() => {}}
          onRefresh={fetchUsers}
        />
      )}
    </div>
  );
}
