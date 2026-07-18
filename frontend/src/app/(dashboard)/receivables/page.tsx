'use client';

import React, { useEffect, useState } from 'react';
import { api } from '@/services/api';
import { TableSkeleton } from '@/components/ui/Skeleton';
import { DataTable } from '@/components/ui/DataTable';
import { Wallet, ShieldAlert, AlertTriangle, ShieldCheck, ChevronLeft } from 'lucide-react';
import Link from 'next/link';

export default function ReceivablesPage() {
  const [loading, setLoading] = useState(true);
  const [customers, setCustomers] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>({});

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [sumRes, custRes] = await Promise.all([
        api.get('/receivables/summary'),
        api.get('/receivables/customers')
      ]);
      setSummary(sumRes);
      setCustomers(custRes);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    { key: 'customer', label: 'مشتری', render: (_: any, row: any) => (
      <div>
        <p className="font-bold text-slate-900">{row.customer.name}</p>
        <p className="text-xs text-slate-500 dark:text-slate-400">{row.customer.phone}</p>
      </div>
    )},
    { key: 'debt', label: 'مانده بدهی', render: (_: any, row: any) => (
      <div>
        <p className="font-bold text-rose-600">{Number(row.totalUncollectedAmount).toLocaleString('fa-IR')} <span className="text-[10px] font-normal">ریال</span></p>
        {row.overdueAmount > 0 && <p className="text-[11px] text-rose-400 font-bold mt-0.5">شامل {Number(row.overdueAmount).toLocaleString('fa-IR')} سررسید گذشته</p>}
      </div>
    )},
    { key: 'cheques', label: 'چک‌های در جریان', render: (_: any, row: any) => (
      <div>
        <p className="text-slate-700 dark:text-slate-200 font-medium">{Number(row.totalRegisteredCheques).toLocaleString('fa-IR')} <span className="text-[10px] font-normal">ریال</span></p>
        {row.totalBouncedCheques > 0 && <p className="text-[11px] text-amber-600 font-bold mt-0.5">+{Number(row.totalBouncedCheques).toLocaleString('fa-IR')} برگشتی</p>}
      </div>
    )},
    { key: 'credit', label: 'اعتبار باقیمانده', render: (_: any, row: any) => (
      <div className="flex flex-col">
        <span className={`font-medium ${row.remainingCredit < 0 ? 'text-rose-600' : 'text-emerald-600'}`}>{Number(row.remainingCredit).toLocaleString('fa-IR')} <span className="text-[10px] font-normal">ریال</span></span>
        <span className="text-[11px] text-slate-400">سقف: {Number(row.creditLimit).toLocaleString('fa-IR')}</span>
      </div>
    )},
    { key: 'riskStatus', label: 'ریسک', render: (val: string) => (
      <span className={`px-2.5 py-1 rounded-md text-xs font-bold border inline-flex items-center ${
        val === 'Normal' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
        val === 'NeedsReview' ? 'bg-amber-50 text-amber-700 border-amber-200' :
        val === 'HighRisk' ? 'bg-rose-50 text-rose-700 border-rose-200' :
        'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700'
      }`}>
        {val === 'Normal' ? <><ShieldCheck className="w-3 h-3 ml-1"/> عادی</> :
         val === 'NeedsReview' ? <><AlertTriangle className="w-3 h-3 ml-1"/> نیازمند بررسی</> :
         val === 'HighRisk' ? <><ShieldAlert className="w-3 h-3 ml-1"/> پرخطر</> : 'مسدود'}
      </span>
    )},
    { key: 'details', label: 'جزئیات مالی', render: (_: any, row: any) => (
      <Link href={`/receivables/${row.customer.id}`} className="px-3 py-1.5 text-xs font-bold text-indigo-600 hover:bg-indigo-50 border border-indigo-100 rounded-lg transition inline-flex items-center bg-white dark:bg-slate-900 shadow-sm">
        پرونده مالی <ChevronLeft className="w-3 h-3 mr-1" />
      </Link>
    )}
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto min-h-screen space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center">
          <Wallet className="w-8 h-8 ml-3 text-indigo-600" />
          مطالبات مشتریان
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">وضعیت بدهی‌ها و پرونده مالی مشتریان</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700">
          <p className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase mb-1">کل مطالبات پرداخت نشده</p>
          <p className="text-2xl font-black text-slate-900">{Number(summary.totalUncollected || 0).toLocaleString('fa-IR')} <span className="text-xs text-slate-400 font-medium">ریال</span></p>
        </div>
        <div className="bg-rose-50 p-5 rounded-2xl shadow-sm border border-rose-200">
          <p className="text-xs text-rose-700 font-bold uppercase mb-1">بدهی سررسید گذشته</p>
          <p className="text-2xl font-black text-rose-900">{Number(summary.totalOverdue || 0).toLocaleString('fa-IR')} <span className="text-xs text-rose-500 font-medium">ریال</span></p>
        </div>
        <div className="bg-amber-50 p-5 rounded-2xl shadow-sm border border-amber-200">
          <p className="text-xs text-amber-700 font-bold uppercase mb-1">چک‌های برگشتی</p>
          <p className="text-2xl font-black text-amber-900">{Number(summary.totalBounced || 0).toLocaleString('fa-IR')} <span className="text-xs text-amber-500 font-medium">ریال</span></p>
        </div>
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 flex justify-between items-center">
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase mb-1">مشتریان پرخطر</p>
            <p className="text-3xl font-black text-slate-900">{summary.highRiskCustomers || 0}</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-rose-50 flex items-center justify-center border border-rose-100">
            <ShieldAlert className="w-6 h-6 text-rose-500" />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-700">
          <TableSkeleton rows={10} cols={6} />
        </div>
      ) : (
        <DataTable 
          entityType="customer"
          columns={columns}
          data={customers}
          totalItems={customers.length}
          currentPage={1}
          onPageChange={() => {}}
          onRefresh={fetchData}
          savedViews={['همه مشتریان', 'مشتریان پرخطر (High Risk)', 'نیازمند بررسی', 'عبور از سقف اعتبار']}
        />
      )}
    </div>
  );
}
