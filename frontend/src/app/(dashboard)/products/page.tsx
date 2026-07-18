'use client';

import React, { useEffect, useState } from 'react';
import { api } from '@/services/api';
import { TableSkeleton } from '@/components/ui/Skeleton';
import { DataTable } from '@/components/ui/DataTable';
import { useGlobalEntity } from '@/contexts/GlobalEntityContext';
import { Button } from '@/components/ui/Button';
import { Plus } from 'lucide-react';

export default function ProductsPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { openCreate } = useGlobalEntity();

  const fetchProducts = async () => {
    try {
      const data = await api.get('/products');
      setProducts(data);
    } catch (e) {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const columns = [
    { key: 'sku', label: 'کد (SKU)', render: (val: string) => <span className="font-mono text-slate-500 dark:text-slate-400">{val || '---'}</span> },
    { key: 'name', label: 'نام محصول', render: (val: string) => <span className="font-bold text-slate-900">{val || '---'}</span> },
    { key: 'brand', label: 'برند', render: (val: string) => <span className="text-slate-600 dark:text-slate-300">{val || '---'}</span> },
    { key: 'category', label: 'دسته بندی', render: (val: string) => <span className="text-slate-600 dark:text-slate-300 text-sm">{val || '---'}</span> },
    { key: 'basePrice', label: 'قیمت پایه', render: (val: number) => <span className="font-mono text-slate-800 dark:text-slate-100 font-medium">{(val || 0).toLocaleString('fa-IR')} ریال</span> },
    { key: 'isActive', label: 'وضعیت', render: (val: boolean) => (
      <span className={`px-2.5 py-1 rounded-md text-xs font-bold border ${
        val ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-rose-100 text-rose-700 border-rose-200'
      }`}>
        {val ? 'فعال' : 'غیرفعال'}
      </span>
    )}
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto min-h-screen">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">محصولات</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">مدیریت لیست کالاها و قیمت‌های پایه</p>
        </div>
        <Button variant="primary" onClick={() => openCreate('product')} className="shadow-lg shadow-primary/20">
          <Plus className="w-5 h-5 ml-2" /> افزودن محصول
        </Button>
      </div>

      {loading ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-700">
          <TableSkeleton rows={10} cols={6} />
        </div>
      ) : (
        <DataTable 
          entityType="product"
          columns={columns}
          data={products}
          totalItems={products.length}
          currentPage={1}
          onPageChange={() => {}}
          onRefresh={fetchProducts}
        />
      )}
    </div>
  );
}
