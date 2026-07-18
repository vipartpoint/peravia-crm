'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { CustomerForm } from '@/components/forms/CustomerForm';

export default function NewCustomerPage() {
  const router = useRouter();

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center space-x-4 space-x-reverse mb-6">
        <Link href="/customers" className="p-2 bg-white dark:bg-slate-900 rounded-full shadow-sm hover:bg-slate-50 dark:bg-slate-800/50 transition border border-slate-200 dark:border-slate-700">
          <ArrowRight className="w-5 h-5 text-slate-600 dark:text-slate-300" />
        </Link>
        <div>
          <h1 className="text-2xl font-black text-slate-900">
            ثبت مشتری جدید
          </h1>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700">
        <CustomerForm 
          onSuccess={() => router.push('/customers')}
          onCancel={() => router.push('/customers')}
        />
      </div>
    </div>
  );
}
