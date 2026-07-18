'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { getCatalogs, createCatalog, updateCatalog, deleteCatalog } from '@/services/catalog.service';
import { useToast } from '@/components/ui/Toast';
import { Search, Plus, Edit, Trash2, Shield, Loader2, AlertCircle } from 'lucide-react';

export interface CatalogConfig {
  type: string;
  title: string;
  columns: Array<{ key: string, label: string, sortable?: boolean, render?: (val: any, row: any) => React.ReactNode }>;
  formFields: Array<{ name: string, label: string, type: 'text' | 'textarea' | 'boolean' | 'number', required?: boolean }>;
}

export default function CatalogEngine({ config }: { config: CatalogConfig }) {
  const { toast } = useToast();
  const [data, setData] = useState<any[]>([]);
  const [pagination, setPagination] = useState({ page: 1, pageSize: 20, total: 0, totalPages: 0 });
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [formData, setFormData] = useState<any>({});
  const [submitting, setSubmitting] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getCatalogs(config.type, {
        page: pagination.page,
        pageSize: pagination.pageSize,
        search,
      });
      setData(res.data);
      setPagination(res.pagination);
    } catch (err: any) {
      toast({ type: 'error', title: 'خطا', description: err?.response?.data?.message || 'دریافت اطلاعات با خطا مواجه شد' });
    } finally {
      setLoading(false);
    }
  }, [config.type, pagination.page, pagination.pageSize, search, toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleOpenModal = (mode: 'create' | 'edit', item?: any) => {
    setModalMode(mode);
    if (mode === 'edit' && item) {
      setFormData(item);
    } else {
      setFormData({ isActive: true });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setFormData({});
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    const isEdit = modalMode === 'edit';
    const originalData = [...data];

    try {
      if (isEdit) {
        // Optimistic update
        setData(prev => prev.map(item => item.id === formData.id ? { ...item, ...formData } : item));
        await updateCatalog(config.type, formData.id, formData);
        toast({ type: 'success', title: 'موفق', description: 'رکورد با موفقیت بروزرسانی شد' });
      } else {
        await createCatalog(config.type, formData);
        toast({ type: 'success', title: 'موفق', description: 'رکورد با موفقیت ایجاد شد' });
      }
      handleCloseModal();
      fetchData(); // Refetch to ensure correct ordering/pagination
    } catch (err: any) {
      if (isEdit) setData(originalData); // Rollback
      toast({ type: 'error', title: 'خطا', description: err?.response?.data?.message || 'عملیات با خطا مواجه شد' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('آیا از حذف این رکورد اطمینان دارید؟')) return;
    const originalData = [...data];
    try {
      setData(prev => prev.filter(item => item.id !== id));
      await deleteCatalog(config.type, id);
      toast({ type: 'success', title: 'موفق', description: 'رکورد با موفقیت حذف شد' });
      fetchData(); // Refetch for correct pagination
    } catch (err: any) {
      setData(originalData); // Rollback
      toast({ type: 'error', title: 'خطا', description: err?.response?.data?.message || 'حذف رکورد با خطا مواجه شد' });
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="relative w-full max-w-sm">
          <input
            type="text"
            placeholder={`جستجو در ${config.title}...`}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border-none rounded-lg focus:ring-2 focus:ring-teal-500"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchData()}
          />
          <Search className="w-5 h-5 text-slate-400 absolute left-3 top-2.5" />
        </div>
        <button
          onClick={() => handleOpenModal('create')}
          className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 transition-colors"
        >
          <Plus className="w-5 h-5" />
          <span>افزودن {config.title}</span>
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm text-right">
          <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 font-medium border-y border-slate-200 dark:border-slate-800">
            <tr>
              {config.columns.map(col => (
                <th key={col.key} className="px-4 py-3">{col.label}</th>
              ))}
              <th className="px-4 py-3 text-center">وضعیت</th>
              <th className="px-4 py-3 text-center">استفاده</th>
              <th className="px-4 py-3 text-center">عملیات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {loading ? (
              <tr>
                <td colSpan={config.columns.length + 3} className="px-4 py-8 text-center text-slate-500">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                  در حال دریافت اطلاعات...
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={config.columns.length + 3} className="px-4 py-8 text-center text-slate-500">
                  هیچ رکوردی یافت نشد.
                </td>
              </tr>
            ) : (
              data.map(item => (
                <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                  {config.columns.map(col => (
                    <td key={col.key} className="px-4 py-3 text-slate-700 dark:text-slate-300">
                      {col.render ? col.render(item[col.key], item) : item[col.key] || '-'}
                    </td>
                  ))}
                  <td className="px-4 py-3 text-center">
                    {item.isSystem ? (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400">
                        <Shield className="w-3 h-3" /> سیستم
                      </span>
                    ) : item.isActive ? (
                      <span className="px-2 py-1 rounded-md text-xs font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400">فعال</span>
                    ) : (
                      <span className="px-2 py-1 rounded-md text-xs font-medium bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-400">غیرفعال</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="inline-block px-2 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-xs font-bold font-mono">
                      {item.usageCount || 0}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => handleOpenModal('edit', item)}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/30 rounded-md transition-colors"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      
                      {item.isSystem ? (
                        <button disabled className="p-1.5 text-slate-300 dark:text-slate-700 cursor-not-allowed">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      ) : item.usageCount > 0 ? (
                        <span title="در حال استفاده" className="p-1.5 text-amber-500 cursor-not-allowed flex items-center">
                          <AlertCircle className="w-4 h-4" />
                        </span>
                      ) : (
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="p-1.5 text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/30 rounded-md transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl shadow-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
              <h3 className="font-bold text-lg text-slate-800 dark:text-white">
                {modalMode === 'create' ? `افزودن ${config.title}` : `ویرایش ${config.title}`}
              </h3>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {config.formFields.map(field => {
                // If editing a system record, disable the 'code' and 'isActive' fields as they are immutable
                const disabled = modalMode === 'edit' && formData.isSystem && (field.name === 'code' || field.name === 'isActive');
                
                return (
                  <div key={field.name}>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                      {field.label} {field.required && <span className="text-red-500">*</span>}
                    </label>
                    {field.type === 'textarea' ? (
                      <textarea
                        className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-lg focus:ring-2 focus:ring-teal-500 disabled:opacity-50"
                        rows={3}
                        required={field.required}
                        disabled={disabled}
                        value={formData[field.name] || ''}
                        onChange={e => setFormData({ ...formData, [field.name]: e.target.value })}
                      />
                    ) : field.type === 'boolean' ? (
                      <div className="flex items-center gap-2 mt-2">
                        <input
                          type="checkbox"
                          className="w-4 h-4 text-teal-600 focus:ring-teal-500 rounded disabled:opacity-50"
                          checked={formData[field.name] || false}
                          disabled={disabled}
                          onChange={e => setFormData({ ...formData, [field.name]: e.target.checked })}
                        />
                        <span className="text-sm text-slate-600 dark:text-slate-400">فعال</span>
                      </div>
                    ) : (
                      <input
                        type={field.type === 'number' ? 'number' : 'text'}
                        className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-lg focus:ring-2 focus:ring-teal-500 disabled:opacity-50"
                        required={field.required}
                        disabled={disabled}
                        value={formData[field.name] || ''}
                        onChange={e => setFormData({ ...formData, [field.name]: field.type === 'number' ? Number(e.target.value) : e.target.value })}
                      />
                    )}
                  </div>
                );
              })}

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="flex-1 py-2 px-4 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-2 px-4 bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition-colors flex justify-center items-center gap-2"
                >
                  {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  ذخیره
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
