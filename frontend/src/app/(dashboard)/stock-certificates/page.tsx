'use client';

import { useState, useEffect } from 'react';
import { api } from '@/services/api';
import { FileText, Plus, Search, Filter, Printer, X, Save } from 'lucide-react';
import moment from 'moment-jalaali';
import { StockCertificatePrintModal } from '@/components/modals/StockCertificatePrintModal';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

const initialForm = {
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
  registeredCapital: '60000000000',
};

export default function StockCertificatesPage() {
  const [certificates, setCertificates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [minAmount, setMinAmount] = useState('');
  const [selectedCert, setSelectedCert] = useState<any>(null);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [formData, setFormData] = useState(initialForm);
  const [formLoading, setFormLoading] = useState(false);

  const fetchCertificates = async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams();
      if (search) query.append('search', search);
      if (minAmount) query.append('minAmount', minAmount);
      const res = await api.get(`/stock-certificates?${query.toString()}`);
      setCertificates(res);
    } catch (error) {
      console.error('Error fetching certificates', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCertificates(); }, [search, minAmount]);

  // Close new modal on Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setIsNewModalOpen(false); };
    if (isNewModalOpen) window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isNewModalOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
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
      setIsNewModalOpen(false);
      setFormData(initialForm);
      fetchCertificates();
    } catch (error: any) {
      toast.error(error.message || 'خطا در صدور گواهی سهام');
    } finally {
      setFormLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <FileText className="w-6 h-6 text-indigo-500" />
          مدیریت گواهی‌های سهام
        </h1>
        <button
          onClick={() => setIsNewModalOpen(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          صدور گواهی جدید
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex gap-4">
        <div className="relative flex-1">
          <Search className="w-5 h-5 absolute right-3 top-2.5 text-gray-400" />
          <input
            type="text"
            placeholder="جستجو بر اساس نام سهامدار..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pr-10 pl-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none"
          />
        </div>
        <div className="relative flex-1">
          <Filter className="w-5 h-5 absolute right-3 top-2.5 text-gray-400" />
          <input
            type="number"
            placeholder="مبلغ بیشتر از (ریال)..."
            value={minAmount}
            onChange={(e) => setMinAmount(e.target.value)}
            className="w-full pr-10 pl-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-right text-gray-500">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50">
              <tr>
                <th className="px-6 py-4">شماره سریال</th>
                <th className="px-6 py-4">نام سهامدار</th>
                <th className="px-6 py-4">کد ملی</th>
                <th className="px-6 py-4">تعداد سهام</th>
                <th className="px-6 py-4">مبلغ کل (ریال)</th>
                <th className="px-6 py-4">تاریخ صدور</th>
                <th className="px-6 py-4 text-center">عملیات</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="px-6 py-10 text-center text-gray-400">درحال بارگذاری...</td></tr>
              ) : certificates.length === 0 ? (
                <tr><td colSpan={7} className="px-6 py-10 text-center text-gray-400">رکوردی یافت نشد.</td></tr>
              ) : (
                certificates.map((cert) => (
                  <tr key={cert.id} className="border-b hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-gray-900">{cert.serialNumber}</td>
                    <td className="px-6 py-4">{cert.shareholderName}</td>
                    <td className="px-6 py-4">{cert.nationalId}</td>
                    <td className="px-6 py-4">{cert.sharesCount.toLocaleString()}</td>
                    <td className="px-6 py-4">{parseFloat(cert.totalAmount).toLocaleString()}</td>
                    <td className="px-6 py-4">{moment(cert.issueDate).format('jYYYY/jMM/jDD')}</td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => { setSelectedCert(cert); setIsPrintModalOpen(true); }}
                        className="text-indigo-600 hover:text-indigo-900 inline-flex items-center gap-1 bg-indigo-50 px-3 py-1.5 rounded-md transition-colors"
                      >
                        <Printer className="w-4 h-4" />
                        چاپ
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Print Modal */}
      <StockCertificatePrintModal
        isOpen={isPrintModalOpen}
        onClose={() => { setIsPrintModalOpen(false); setSelectedCert(null); }}
        certificate={selectedCert}
      />

      {/* ===== New Certificate Modal ===== */}
      <AnimatePresence>
        {isNewModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setIsNewModalOpen(false)}
            />

            {/* Dialog */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto"
            >
              {/* Modal Header */}
              <div className="sticky top-0 bg-white z-10 px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-800">صدور گواهی سهام جدید</h2>
                <button
                  onClick={() => setIsNewModalOpen(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="p-6 space-y-8">
                {/* Registration Details */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 pb-2 border-b">اطلاعات ثبتی شرکت</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">شماره ثبت (اختیاری)</label>
                      <input type="text" name="registrationNumber" value={formData.registrationNumber} onChange={handleChange} className="w-full p-2 border rounded-lg outline-none focus:ring-2 focus:ring-indigo-500" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">تاریخ ثبت (اختیاری)</label>
                      <input type="text" name="registrationDate" value={formData.registrationDate} onChange={handleChange} placeholder="مثال: 1403/05/15" className="w-full p-2 border rounded-lg outline-none focus:ring-2 focus:ring-indigo-500" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">محل ثبت</label>
                      <input type="text" name="registrationLocation" required value={formData.registrationLocation} onChange={handleChange} className="w-full p-2 border rounded-lg outline-none focus:ring-2 focus:ring-indigo-500" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">سرمایه ثبت شده (ریال)</label>
                      <input type="text" name="registeredCapital" required value={formData.registeredCapital} onChange={handleChange} className="w-full p-2 border rounded-lg outline-none focus:ring-2 focus:ring-indigo-500" />
                    </div>
                  </div>
                </div>

                {/* Shareholder Details */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 pb-2 border-b">اطلاعات سهامدار</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">نام و نام خانوادگی</label>
                      <input type="text" name="shareholderName" required value={formData.shareholderName} onChange={handleChange} className="w-full p-2 border rounded-lg outline-none focus:ring-2 focus:ring-indigo-500" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">نام پدر</label>
                      <input type="text" name="fatherName" required value={formData.fatherName} onChange={handleChange} className="w-full p-2 border rounded-lg outline-none focus:ring-2 focus:ring-indigo-500" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">شماره ملی</label>
                      <input type="text" name="nationalId" required value={formData.nationalId} onChange={handleChange} className="w-full p-2 border rounded-lg outline-none focus:ring-2 focus:ring-indigo-500" />
                    </div>
                  </div>
                </div>

                {/* Share Details */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 pb-2 border-b">اطلاعات سهام</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">تعداد سهام به عدد</label>
                      <input type="number" name="sharesCount" required min="1" value={formData.sharesCount} onChange={handleChange} className="w-full p-2 border rounded-lg outline-none focus:ring-2 focus:ring-indigo-500" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">ارزش ریالی هر سهم</label>
                      <input type="number" name="shareValue" required min="1" value={formData.shareValue} onChange={handleChange} className="w-full p-2 border rounded-lg outline-none focus:ring-2 focus:ring-indigo-500" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">سرمایه پرداخت شده (ریال)</label>
                      <input type="number" name="totalAmount" required min="1" value={formData.totalAmount} onChange={handleChange} className="w-full p-2 border rounded-lg outline-none focus:ring-2 focus:ring-indigo-500" />
                    </div>
                    <div className="md:col-span-3">
                      <label className="block text-sm font-medium text-gray-700 mb-1">سرمایه پرداخت شده به حروف</label>
                      <input type="text" name="amountInWords" required value={formData.amountInWords} onChange={handleChange} placeholder="مثال: شصت میلیارد ریال" className="w-full p-2 border rounded-lg outline-none focus:ring-2 focus:ring-indigo-500" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">از شماره سهم</label>
                      <input type="number" name="shareRangeFrom" required value={formData.shareRangeFrom} onChange={handleChange} className="w-full p-2 border rounded-lg outline-none focus:ring-2 focus:ring-indigo-500" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">تا شماره سهم</label>
                      <input type="number" name="shareRangeTo" required value={formData.shareRangeTo} onChange={handleChange} className="w-full p-2 border rounded-lg outline-none focus:ring-2 focus:ring-indigo-500" />
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-3 pt-4 border-t">
                  <button type="button" onClick={() => setIsNewModalOpen(false)} className="px-5 py-2.5 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors font-medium">
                    انصراف
                  </button>
                  <button type="submit" disabled={formLoading} className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-lg font-medium transition-colors flex items-center gap-2 disabled:opacity-50">
                    {formLoading ? 'در حال ثبت...' : (<><Save className="w-5 h-5" />صدور و ذخیره گواهی</>)}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
