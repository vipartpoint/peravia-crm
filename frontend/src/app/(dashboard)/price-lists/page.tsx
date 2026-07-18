'use client';
import { useState, useEffect } from 'react';
import { api } from '@/services/api';
import { BadgeDollarSign, Plus, Eye, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';

export default function PriceListsPage() {
  const [priceLists, setPriceLists] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPriceLists();
  }, []);

  const fetchPriceLists = async () => {
    try {
      const data = await api.get('/price-lists');
      setPriceLists(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('آیا از حذف این لیست قیمت اطمینان دارید؟ (این عملیات غیر قابل بازگشت است)')) {
      try {
        await api.delete(`/price-lists/${id}`);
        fetchPriceLists();
      } catch(e: any) {
        alert(e.response?.data?.message || 'خطا در حذف لیست قیمت');
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight flex items-center">
            <BadgeDollarSign className="w-8 h-8 ml-3 text-teal-600" />
            لیست‌های قیمت
          </h1>
          <p className="text-gray-500 text-sm mt-1 font-medium">مدیریت لیست‌های قیمت پایه، نمایندگان و عاملیت‌ها</p>
        </div>
        <Link href="/price-lists/new" className="bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 text-white px-5 py-2.5 rounded-xl flex items-center shadow-lg shadow-teal-500/30 transition-all font-bold">
          <Plus className="w-5 h-5 ml-2" />
          ساخت لیست قیمت جدید
        </Link>
      </div>

      {loading ? (
        <div className="flex justify-center p-12"><div className="w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin"></div></div>
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
          <table className="w-full text-right">
            <thead className="bg-gray-50/50 text-gray-500 text-sm border-b border-gray-100 dark:border-gray-800">
              <tr>
                <th className="p-4 font-bold">نام لیست</th>
                <th className="p-4 font-bold">نوع</th>
                <th className="p-4 font-bold">برند</th>
                <th className="p-4 font-bold">تاریخ شروع</th>
                <th className="p-4 font-bold text-center">تعداد محصولات</th>
                <th className="p-4 font-bold">وضعیت</th>
                <th className="p-4 font-bold text-center">عملیات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {priceLists.map((pl: any) => (
                <motion.tr initial={{ opacity: 0 }} animate={{ opacity: 1 }} key={pl.id} className="hover:bg-gray-50/50 transition">
                  <td className="p-4 font-bold text-gray-900">{pl.name}</td>
                  <td className="p-4 text-gray-500 text-sm">{pl.type}</td>
                  <td className="p-4 text-gray-500 text-sm">{pl.brand || 'همه برندها'}</td>
                  <td className="p-4 text-gray-500 font-mono">{new Date(pl.startDate).toLocaleDateString('fa-IR')}</td>
                  <td className="p-4 text-center font-bold text-gray-700 dark:text-gray-200">{pl._count.items}</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${pl.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {pl.isActive ? 'فعال' : 'غیرفعال'}
                    </span>
                  </td>
                  <td className="p-4 text-center space-x-2 space-x-reverse">
                    <button disabled className="p-2 text-blue-600/50 cursor-not-allowed rounded-lg" title="به‌زودی">
                      <Eye className="w-5 h-5" />
                    </button>
                    <button onClick={() => handleDelete(pl.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition">
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </td>
                </motion.tr>
              ))}
              {priceLists.length === 0 && (
                <tr><td colSpan={7} className="p-8 text-center text-gray-500">هیچ لیست قیمتی یافت نشد.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
