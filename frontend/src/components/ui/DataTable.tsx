'use client';

import React, { useState } from 'react';
import { 
  ChevronDown, Filter, LayoutGrid, Search, Eye, Maximize2, 
  Settings2, Download, Trash2, CheckSquare, Settings
} from 'lucide-react';
import { Button } from './Button';
import { Pagination } from './Pagination';
import { ActionMenu } from './ActionMenu';
import { useGlobalEntity, EntityType } from '@/contexts/GlobalEntityContext';

interface Column {
  key: string;
  label: string;
  render?: (val: any, row: any) => React.ReactNode;
  isPinned?: boolean;
}

interface DataTableProps {
  entityType: EntityType;
  columns: Column[];
  data: any[];
  totalItems: number;
  currentPage: number;
  onPageChange: (p: number) => void;
  onRefresh?: () => void;
  savedViews?: string[];
}

export function DataTable({ 
  entityType, columns, data, totalItems, currentPage, onPageChange, onRefresh, savedViews 
}: DataTableProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState('');
  const { openView, openEdit } = useGlobalEntity();
  const views = savedViews || ['همه رکوردها', 'پربازده‌ترین‌ها', 'نیازمند پیگیری'];

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) setSelectedIds(new Set(data.map(d => d.id)));
    else setSelectedIds(new Set());
  };

  const handleSelect = (id: string, checked: boolean) => {
    const newSet = new Set(selectedIds);
    if (checked) newSet.add(id);
    else newSet.delete(id);
    setSelectedIds(newSet);
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-sm overflow-hidden flex flex-col">
      
      {/* Table Toolbar */}
      <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        
        {/* Saved Views (Tabs) */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar w-full sm:w-auto">
          {views.map((view, index) => (
            <button key={view} className={`px-3 py-1.5 text-sm rounded-lg whitespace-nowrap ${index === 0 ? 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold border border-slate-200 dark:border-slate-700' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:bg-slate-800/50 font-medium'}`}>
              {view}
            </button>
          ))}
        </div>

        {/* Filters & Actions */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-48">
            <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              value={search} onChange={e => setSearch(e.target.value)}
              placeholder="جستجو..." 
              className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-sm rounded-lg pr-9 pl-3 py-1.5 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
            />
          </div>
          <Button variant="outline" className="px-2.5 h-[34px]"><Filter className="w-4 h-4 text-slate-500 dark:text-slate-400" /></Button>
          <Button variant="outline" className="px-2.5 h-[34px]"><Settings2 className="w-4 h-4 text-slate-500 dark:text-slate-400" /></Button>
        </div>
      </div>

      {/* Bulk Actions Bar */}
      {selectedIds.size > 0 && (
        <div className="bg-blue-50 border-b border-blue-100 p-3 flex items-center justify-between animate-in fade-in slide-in-from-top-2">
          <span className="text-sm font-bold text-blue-800">{selectedIds.size} رکورد انتخاب شده</span>
          <div className="flex gap-2">
            <Button variant="outline" className="h-8 text-xs bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400">ویرایش گروهی</Button>
            <Button variant="outline" className="h-8 text-xs bg-white dark:bg-slate-900 text-rose-600 hover:bg-rose-50 border-rose-200">
              <Trash2 className="w-3.5 h-3.5 ml-1.5" /> حذف
            </Button>
          </div>
        </div>
      )}

      {/* Table Content */}
      <div className="overflow-x-auto min-h-[400px]">
        <table className="w-full text-right text-sm">
          <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
            <tr>
              <th className="p-4 w-12 text-center">
                <input 
                  type="checkbox" 
                  checked={data.length > 0 && selectedIds.size === data.length}
                  onChange={handleSelectAll}
                  className="rounded border-slate-300 text-primary focus:ring-primary"
                />
              </th>
              {columns.map(col => (
                <th key={col.key} className="p-4 font-bold text-slate-600 dark:text-slate-400 whitespace-nowrap">
                  {col.label}
                </th>
              ))}
              <th className="p-4 w-16 text-center">عملیات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {data.length === 0 ? (
              <tr>
                <td colSpan={columns.length + 2} className="p-12 text-center text-slate-500 dark:text-slate-400">
                  <LayoutGrid className="w-8 h-8 text-slate-300 mx-auto mb-3" />
                  هیچ رکوردی یافت نشد.
                </td>
              </tr>
            ) : (
              data.map(row => {
                const isSelected = selectedIds.has(row.id);
                return (
                  <tr 
                    key={row.id} 
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === ' ') { e.preventDefault(); openView(entityType, row.id); }
                      if (e.key === 'Enter') { e.preventDefault(); openEdit(entityType, row.id); }
                    }}
                    className={`group hover:bg-slate-50 dark:bg-slate-800/50 transition-colors focus:bg-slate-50 dark:bg-slate-800/50 focus:outline-none ${isSelected ? 'bg-blue-50/30' : ''}`}
                  >
                    <td className="p-4 text-center">
                      <input 
                        type="checkbox" 
                        checked={isSelected}
                        onChange={(e) => handleSelect(row.id, e.target.checked)}
                        className="rounded border-slate-300 text-primary focus:ring-primary"
                      />
                    </td>
                    {columns.map(col => (
                      <td key={col.key} className="p-4 text-slate-700 dark:text-slate-300">
                        {col.render ? col.render(row[col.key], row) : row[col.key] || '---'}
                      </td>
                    ))}
                    <td className="p-4 text-center relative">
                      <div className="flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          title="پیش‌نمایش (Space)"
                          onClick={() => openView(entityType, row.id)} 
                          className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <ActionMenu 
                          onView={() => openView(entityType, row.id)}
                          onEdit={() => openEdit(entityType, row.id)}
                        />
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <Pagination 
        currentPage={currentPage}
        totalPages={Math.ceil(totalItems / 50)}
        totalItems={totalItems}
        onPageChange={onPageChange}
        itemsPerPage={50}
      />
    </div>
  );
}
