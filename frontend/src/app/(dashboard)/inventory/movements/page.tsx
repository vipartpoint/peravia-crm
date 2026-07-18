'use client';

import { useState, useEffect } from 'react';
import { api } from '@/services/api';
import { ArrowLeftRight } from 'lucide-react';

export default function StockMovementsPage() {
  const [movements, setMovements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMovements();
  }, []);

  const fetchMovements = async () => {
    try {
      const res = await api.get('/inventory/movements');
      setMovements(Array.isArray(res) ? res : res.data || []);
    } catch (error) {
      console.error('Failed to fetch stock movements', error);
      setMovements([]);
    } finally {
      setLoading(false);
    }
  };

  const getMovementColor = (type: string) => {
    switch (type) {
      case 'Inbound':
      case 'Return':
      case 'ReleaseReservation':
        return 'text-emerald-700 bg-emerald-100 dark:text-emerald-400 dark:bg-emerald-500/20';
      case 'Outbound':
      case 'Reservation':
        return 'text-rose-700 bg-rose-100 dark:text-rose-400 dark:bg-rose-500/20';
      default:
        return 'text-blue-700 bg-blue-100 dark:text-blue-400 dark:bg-blue-500/20';
    }
  };

  const getMovementLabel = (type: string) => {
    switch (type) {
      case 'Inbound': return 'ورود به انبار';
      case 'Outbound': return 'خروج از انبار';
      case 'Reservation': return 'رزرو سفارش';
      case 'ReleaseReservation': return 'لغو رزرو';
      case 'Return': return 'برگشت از فروش';
      case 'Adjustment': return 'تعدیل دستی';
      default: return type;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <ArrowLeftRight className="w-6 h-6 text-indigo-500" />
          گردش و کاردکس کالا
        </h1>
      </div>

      <div className="bg-white dark:bg-slate-800/50 backdrop-blur-xl border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="px-6 py-4 text-slate-500 dark:text-slate-400 font-medium text-sm">تاریخ</th>
                <th className="px-6 py-4 text-slate-500 dark:text-slate-400 font-medium text-sm">نوع تراکنش</th>
                <th className="px-6 py-4 text-slate-500 dark:text-slate-400 font-medium text-sm">محصول</th>
                <th className="px-6 py-4 text-slate-500 dark:text-slate-400 font-medium text-sm">انبار</th>
                <th className="px-6 py-4 text-slate-500 dark:text-slate-400 font-medium text-sm">تعداد</th>
                <th className="px-6 py-4 text-slate-500 dark:text-slate-400 font-medium text-sm">کاربر ایجادکننده</th>
                <th className="px-6 py-4 text-slate-500 dark:text-slate-400 font-medium text-sm">توضیحات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-slate-500 dark:text-slate-400">در حال بارگذاری...</td>
                </tr>
              ) : movements.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-slate-500 dark:text-slate-400">هیچ گردشی یافت نشد.</td>
                </tr>
              ) : (
                movements.map((mov) => (
                  <tr key={mov.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-300 text-sm">{new Date(mov.createdAt).toLocaleString('fa-IR')}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs rounded-full ${getMovementColor(mov.movementType)}`}>
                        {getMovementLabel(mov.movementType)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-900 dark:text-white text-sm font-medium">{mov.product?.name}</td>
                    <td className="px-6 py-4 text-slate-500 dark:text-slate-400 text-sm">{mov.warehouse?.name}</td>
                    <td className={`px-6 py-4 font-mono font-bold text-sm ${['Inbound', 'Return', 'ReleaseReservation'].includes(mov.movementType) ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`} dir="ltr">
                      {['Inbound', 'Return', 'ReleaseReservation'].includes(mov.movementType) ? '+' : '-'}
                      {Number(mov.quantity).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-slate-500 dark:text-slate-400 text-sm">{mov.creator?.username}</td>
                    <td className="px-6 py-4 text-slate-500 dark:text-slate-400 text-xs max-w-xs truncate">{mov.notes || '-'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
