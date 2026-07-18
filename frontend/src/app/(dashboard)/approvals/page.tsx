'use client';
import { useState, useEffect } from 'react';
import { api } from '@/services/api';
import { FileCheck2, Check, X, Clock, AlertCircle, Eye, Calendar, Filter, FileText } from 'lucide-react';
import Link from 'next/link';

export default function ApprovalsPage() {
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState<any[]>([]);
  const [metrics, setMetrics] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('pending'); // pending, approved, rejected, my-requests
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [actionComment, setActionComment] = useState('');

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      const metricsRes = await api.get('/approvals/dashboard');
      setMetrics(metricsRes);

      let url = '/approvals';
      if (activeTab === 'pending') url += '?status=Pending';
      if (activeTab === 'approved') url += '?status=Approved';
      if (activeTab === 'rejected') url += '?status=Rejected';
      if (activeTab === 'my-requests') url += '?type=my-requests'; // Optional if implemented

      const dataRes = await api.get(url);
      setRequests(dataRes.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (id: string, action: 'approve' | 'reject') => {
    if (action === 'reject' && !actionComment.trim()) {
      alert('وارد کردن توضیحات برای رد درخواست الزامی است.');
      return;
    }
    
    try {
      await api.patch(`/approvals/${id}/${action}`, { comments: actionComment });
      alert(`درخواست با موفقیت ${action === 'approve' ? 'تأیید' : 'رد'} شد`);
      setIsModalOpen(false);
      setActionComment('');
      fetchData();
    } catch (e: any) {
      alert(e.response?.data?.message || 'خطا در انجام عملیات');
    }
  };

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'Pending': return <span className="px-2 py-1 bg-amber-100 text-amber-700 rounded text-xs font-bold">در انتظار</span>;
      case 'Approved': return <span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded text-xs font-bold">تأیید شده</span>;
      case 'Rejected': return <span className="px-2 py-1 bg-rose-100 text-rose-700 rounded text-xs font-bold">رد شده</span>;
      default: return null;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch(priority) {
      case 'Critical': return <span className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs font-bold border border-red-200">بحرانی</span>;
      case 'High': return <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded text-xs font-bold">زیاد</span>;
      case 'Medium': return <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-bold">متوسط</span>;
      case 'Low': return <span className="px-2 py-1 bg-slate-100 text-slate-700 rounded text-xs font-bold">کم</span>;
      default: return <span className="px-2 py-1 bg-slate-100 text-slate-700 rounded text-xs font-bold">{priority}</span>;
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight flex items-center">
            <FileCheck2 className="w-8 h-8 ml-3 text-indigo-600" />
            مرکز تأییدیه‌ها
          </h1>
          <p className="text-gray-500 text-sm mt-1 font-medium">گردش کار و تصمیم‌گیری برای فرم‌ها، سفارشات، و انبار</p>
        </div>
      </div>

      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-amber-100 dark:border-amber-900/30 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 w-1 h-full bg-amber-400"></div>
            <div className="text-amber-600 mb-1"><Clock className="w-5 h-5" /></div>
            <div className="text-2xl font-black text-gray-900 dark:text-white">{metrics.totalPending}</div>
            <div className="text-xs text-gray-500 font-medium">در انتظار بررسی</div>
          </div>
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-emerald-100 dark:border-emerald-900/30 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 w-1 h-full bg-emerald-500"></div>
            <div className="text-emerald-500 mb-1"><Check className="w-5 h-5" /></div>
            <div className="text-2xl font-black text-gray-900 dark:text-white">{metrics.totalApproved}</div>
            <div className="text-xs text-gray-500 font-medium">تأیید شده</div>
          </div>
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-rose-100 dark:border-rose-900/30 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 w-1 h-full bg-rose-500"></div>
            <div className="text-rose-500 mb-1"><X className="w-5 h-5" /></div>
            <div className="text-2xl font-black text-gray-900 dark:text-white">{metrics.totalRejected}</div>
            <div className="text-xs text-gray-500 font-medium">رد شده</div>
          </div>
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-red-100 dark:border-red-900/30 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 w-1 h-full bg-red-500"></div>
            <div className="text-red-500 mb-1"><AlertCircle className="w-5 h-5" /></div>
            <div className="text-2xl font-black text-gray-900 dark:text-white">{metrics.overdueApprovals || 0}</div>
            <div className="text-xs text-gray-500 font-medium">سررسید گذشته</div>
          </div>
        </div>
      )}

      <div className="flex space-x-2 space-x-reverse border-b border-gray-200 dark:border-gray-800">
        {[
          { id: 'pending', label: 'در انتظار' },
          { id: 'approved', label: 'تأیید شده' },
          { id: 'rejected', label: 'رد شده' },
        ].map(tab => (
          <button
            key={tab.id}
            className={`px-4 py-3 text-sm font-bold border-b-2 transition ${activeTab === tab.id ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center p-20"><div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div></div>
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
          <table className="w-full text-right">
            <thead className="bg-gray-50 dark:bg-slate-800/50 text-gray-600 dark:text-gray-400 text-sm border-b border-gray-100 dark:border-gray-800">
              <tr>
                <th className="p-4 font-medium">عنوان درخواست</th>
                <th className="p-4 font-medium">نوع و شناسه</th>
                <th className="p-4 font-medium">درخواست‌دهنده</th>
                <th className="p-4 font-medium">اولویت</th>
                <th className="p-4 font-medium">وضعیت</th>
                <th className="p-4 font-medium text-center">جزئیات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-gray-800/50 text-sm">
              {requests.map((r) => (
                <tr key={r.id} className="hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors">
                  <td className="p-4">
                    <p className="font-bold text-gray-900 dark:text-white">{r.title}</p>
                    <p className="text-xs text-gray-500 mt-1 truncate max-w-xs">{r.description || 'بدون توضیحات'}</p>
                  </td>
                  <td className="p-4">
                    <span className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2 py-1 rounded text-xs">{r.approvalType}</span>
                    <p className="font-mono text-xs text-gray-400 mt-1">{r.entityId.slice(0,8)}...</p>
                  </td>
                  <td className="p-4">
                    <p className="font-medium text-gray-800 dark:text-gray-200">{r.requesterUsername || 'نامشخص'}</p>
                    <p className="text-xs text-gray-400 mt-1">{new Date(r.requestedAt).toLocaleDateString('fa-IR')}</p>
                  </td>
                  <td className="p-4">{getPriorityBadge(r.priority)}</td>
                  <td className="p-4">{getStatusBadge(r.status)}</td>
                  <td className="p-4 flex justify-center gap-2">
                    <button 
                      onClick={() => { setSelectedRequest(r); setIsModalOpen(true); }} 
                      className="text-indigo-600 hover:bg-indigo-50 p-2 rounded-lg transition bg-white dark:bg-slate-900 border border-gray-200 dark:border-gray-700" 
                      title="مشاهده"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {requests.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-gray-500">موردی یافت نشد.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Approval Details Modal */}
      {isModalOpen && selectedRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-start">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">{selectedRequest.title}</h2>
                  {getStatusBadge(selectedRequest.status)}
                  {getPriorityBadge(selectedRequest.priority)}
                </div>
                <div className="flex items-center gap-4 text-xs text-slate-500">
                  <span className="flex items-center gap-1"><FileText className="w-3 h-3" /> {selectedRequest.approvalType}</span>
                  <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {new Date(selectedRequest.requestedAt).toLocaleString('fa-IR')}</span>
                </div>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-2 text-slate-400 hover:text-slate-600 bg-slate-50 rounded-xl">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1 space-y-6">
              <div>
                <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">توضیحات درخواست</h3>
                <p className="text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl text-sm leading-relaxed">
                  {selectedRequest.description || 'توضیحاتی ثبت نشده است.'}
                </p>
              </div>

              {selectedRequest.comments && (
                <div>
                  <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">کامنت تصمیم‌گیری</h3>
                  <p className="text-slate-600 dark:text-slate-400 bg-amber-50 dark:bg-amber-900/10 p-4 rounded-xl text-sm border border-amber-100 dark:border-amber-900/30">
                    {selectedRequest.comments}
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                  <span className="block text-xs text-slate-400 mb-1">درخواست دهنده</span>
                  <span className="font-bold text-slate-700 dark:text-slate-300">{selectedRequest.requesterUsername}</span>
                </div>
                <div className="p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                  <span className="block text-xs text-slate-400 mb-1">سطح فعلی</span>
                  <span className="font-bold text-slate-700 dark:text-slate-300">{selectedRequest.currentLevel} از {selectedRequest.requiredLevels}</span>
                </div>
              </div>
              
              {selectedRequest.status === 'Pending' && (
                <div>
                  <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">ثبت نظر (برای رد کردن الزامی است)</h3>
                  <textarea
                    value={actionComment}
                    onChange={(e) => setActionComment(e.target.value)}
                    className="w-full p-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-indigo-500 transition-colors text-sm"
                    rows={3}
                    placeholder="دلیل تایید یا رد را بنویسید..."
                  />
                </div>
              )}
            </div>

            {selectedRequest.status === 'Pending' && (
              <div className="p-6 border-t border-slate-100 dark:border-slate-800 flex gap-3 bg-slate-50 dark:bg-slate-900/50">
                <button
                  onClick={() => handleAction(selectedRequest.id, 'approve')}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-4 rounded-xl transition shadow-sm shadow-emerald-200 flex justify-center items-center gap-2"
                >
                  <Check className="w-5 h-5" /> تأیید درخواست
                </button>
                <button
                  onClick={() => handleAction(selectedRequest.id, 'reject')}
                  className="flex-1 bg-rose-100 text-rose-700 hover:bg-rose-200 font-bold py-3 px-4 rounded-xl transition flex justify-center items-center gap-2"
                >
                  <X className="w-5 h-5" /> رد درخواست
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
