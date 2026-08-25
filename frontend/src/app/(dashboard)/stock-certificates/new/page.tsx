'use client';

import { useState } from 'react';
import { api } from '@/services/api';
import { useRouter } from 'next/navigation';
import { Save, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';

export default function NewStockCertificatePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    shareholderName: '',
    fatherName: '',
    nationalId: '',
    sharesCount: '',
    shareValue: '',
    totalAmount: '',
    amountInWords: '',
    shareRangeFrom: '',
    shareRangeTo: '',
    registrationNumber: '',
    registrationDate: '',
    registrationLocation: '',
    registeredCapital: '60000000000', // Default based on template
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        ...formData,
        sharesCount: Number(formData.sharesCount),
        shareValue: Number(formData.shareValue),
        totalAmount: Number(formData.totalAmount),
        shareRangeFrom: Number(formData.shareRangeFrom),
        shareRangeTo: Number(formData.shareRangeTo),
      };

      await api.post('/stock-certificates', payload);
      toast.success('گواهی سهام با موفقیت صادر شد');
      router.push('/stock-certificates');
    } catch (error: any) {
      toast.error(error.message || 'خطا در صدور گواهی سهام');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">صدور گواهی سهام جدید</h1>
        <Link href="/stock-certificates" className="text-gray-500 hover:text-gray-700 flex items-center gap-2">
          <ArrowRight className="w-4 h-4" />
          بازگشت به لیست
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-8">
        {/* Registration Details */}
        <div>
          <h2 className="text-lg font-semibold text-gray-800 mb-4 pb-2 border-b">اطلاعات ثبتی شرکت</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">شماره ثبت (اختیاری)</label>
              <input type="text" name="registrationNumber" value={formData.registrationNumber} onChange={handleChange} className="w-full p-2 border border-gray-300 rounded-lg text-gray-900 bg-white placeholder-gray-400 outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">تاریخ ثبت (اختیاری)</label>
              <input type="text" name="registrationDate" value={formData.registrationDate} onChange={handleChange} placeholder="مثال: 1403/05/15" className="w-full p-2 border border-gray-300 rounded-lg text-gray-900 bg-white placeholder-gray-400 outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">محل ثبت</label>
              <input type="text" name="registrationLocation" required value={formData.registrationLocation} onChange={handleChange} className="w-full p-2 border border-gray-300 rounded-lg text-gray-900 bg-white placeholder-gray-400 outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">سرمایه ثبت شده (ریال)</label>
              <input type="text" name="registeredCapital" required value={formData.registeredCapital} onChange={handleChange} className="w-full p-2 border border-gray-300 rounded-lg text-gray-900 bg-white placeholder-gray-400 outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
          </div>
        </div>

        {/* Shareholder Details */}
        <div>
          <h2 className="text-lg font-semibold text-gray-800 mb-4 pb-2 border-b">اطلاعات سهامدار</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">نام و نام خانوادگی</label>
              <input type="text" name="shareholderName" required value={formData.shareholderName} onChange={handleChange} className="w-full p-2 border border-gray-300 rounded-lg text-gray-900 bg-white placeholder-gray-400 outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">نام پدر</label>
              <input type="text" name="fatherName" required value={formData.fatherName} onChange={handleChange} className="w-full p-2 border border-gray-300 rounded-lg text-gray-900 bg-white placeholder-gray-400 outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">شماره ملی</label>
              <input type="text" name="nationalId" required value={formData.nationalId} onChange={handleChange} className="w-full p-2 border border-gray-300 rounded-lg text-gray-900 bg-white placeholder-gray-400 outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
          </div>
        </div>

        {/* Shares Details */}
        <div>
          <h2 className="text-lg font-semibold text-gray-800 mb-4 pb-2 border-b">اطلاعات سهام</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">تعداد سهام به عدد</label>
              <input type="number" name="sharesCount" required min="1" value={formData.sharesCount} onChange={handleChange} className="w-full p-2 border border-gray-300 rounded-lg text-gray-900 bg-white placeholder-gray-400 outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">ارزش ریالی هر سهم</label>
              <input type="number" name="shareValue" required min="1" value={formData.shareValue} onChange={handleChange} className="w-full p-2 border border-gray-300 rounded-lg text-gray-900 bg-white placeholder-gray-400 outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">سرمایه پرداخت شده (مبلغ کل - ریال)</label>
              <input type="number" name="totalAmount" required min="1" value={formData.totalAmount} onChange={handleChange} className="w-full p-2 border border-gray-300 rounded-lg text-gray-900 bg-white placeholder-gray-400 outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div className="md:col-span-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">سرمایه پرداخت شده به حروف</label>
              <input type="text" name="amountInWords" required value={formData.amountInWords} onChange={handleChange} placeholder="مثال: شصت میلیارد ریال" className="w-full p-2 border border-gray-300 rounded-lg text-gray-900 bg-white placeholder-gray-400 outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">از شماره سهم</label>
              <input type="number" name="shareRangeFrom" required value={formData.shareRangeFrom} onChange={handleChange} className="w-full p-2 border border-gray-300 rounded-lg text-gray-900 bg-white placeholder-gray-400 outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">تا شماره سهم</label>
              <input type="number" name="shareRangeTo" required value={formData.shareRangeTo} onChange={handleChange} className="w-full p-2 border border-gray-300 rounded-lg text-gray-900 bg-white placeholder-gray-400 outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-4 border-t">
          <button
            type="submit"
            disabled={loading}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-lg font-medium transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            {loading ? 'در حال ثبت...' : (
              <>
                <Save className="w-5 h-5" />
                صدور و ذخیره گواهی
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
