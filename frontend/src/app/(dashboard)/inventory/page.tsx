'use client';

import { useState, useEffect } from 'react';
import { api } from '@/services/api';
import { Archive, AlertTriangle } from 'lucide-react';
import { ContextHelp } from '@/components/ui/ContextHelp';

export default function InventoryPage() {
  const [stocks, setStocks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStocks();
  }, []);

  const fetchStocks = async () => {
    try {
      const res = await api.get('/inventory/stocks');
      // Fix: api.get returns the JSON directly. If it's an array, res is the array.
      setStocks(Array.isArray(res) ? res : (res.data || []));
    } catch (error) {
      console.error('Failed to fetch inventory', error);
      setStocks([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Archive className="w-6 h-6 text-indigo-500" />
          موجودی کالاها
        </h1>
      </div>

      <div data-tour="tour-inventory-list" className="bg-white dark:bg-slate-800/50 backdrop-blur-xl border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="px-6 py-4 text-slate-500 dark:text-slate-400 font-medium text-sm">محصول</th>
                <th className="px-6 py-4 text-slate-500 dark:text-slate-400 font-medium text-sm">انبار</th>
                <th className="px-6 py-4 text-slate-500 dark:text-slate-400 font-medium text-sm" title="موجودی واقعی فیزیکی در انبار">موجودی فیزیکی</th>
                <th className="px-6 py-4 text-slate-500 dark:text-slate-400 font-medium text-sm flex items-center gap-1 justify-end">
                  رزرو شده
                  <ContextHelp title="موجودی رزرو شده" content="مقداری که در سفارش‌های تایید شده قرار دارد ولی هنوز از انبار خارج نشده است." />
                </th>
                <th className="px-6 py-4 text-slate-500 dark:text-slate-400 font-medium text-sm" title="موجودی فیزیکی منهای رزرو شده که قابل فروش است">قابل فروش</th>
                <th className="px-6 py-4 text-slate-500 dark:text-slate-400 font-medium text-sm">وضعیت هشدار</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-500 dark:text-slate-400">در حال بارگذاری...</td>
                </tr>
              ) : stocks.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-500 dark:text-slate-400">رکوردی یافت نشد.</td>
                </tr>
              ) : (
                stocks.map((stock) => {
                  const available = Number(stock.availableQuantity);
                  const minLevel = Number(stock.minStockLevel);
                  const isLow = available > 0 && available <= minLevel;
                  const isOut = available <= 0;

                  return (
                    <tr key={stock.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                      <td className="px-6 py-4">
                        <div className="text-slate-900 dark:text-white font-medium">{stock.product?.name}</div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">{stock.product?.sku}</div>
                      </td>
                      <td className="px-6 py-4 text-slate-600 dark:text-slate-300 text-sm">{stock.warehouse?.name}</td>
                      <td className="px-6 py-4 text-slate-700 dark:text-slate-300 font-mono text-sm">{Number(stock.quantityOnHand).toLocaleString()}</td>
                      <td className="px-6 py-4 text-amber-600 dark:text-amber-400 font-mono text-sm">{Number(stock.reservedQuantity).toLocaleString()}</td>
                      <td className={`px-6 py-4 font-mono font-bold text-sm ${isOut ? 'text-rose-600 dark:text-rose-400' : isLow ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                        {available.toLocaleString()}
                      </td>
                      <td className="px-6 py-4">
                        {isOut ? (
                          <span className="flex items-center gap-1 text-xs bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400 px-2 py-1 rounded-full w-max">
                            <AlertTriangle className="w-3 h-3" /> ناموجود
                          </span>
                        ) : isLow ? (
                          <span className="flex items-center gap-1 text-xs bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400 px-2 py-1 rounded-full w-max">
                            <AlertTriangle className="w-3 h-3" /> رو به اتمام
                          </span>
                        ) : (
                          <span className="text-xs bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400 px-2 py-1 rounded-full">نرمال</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
