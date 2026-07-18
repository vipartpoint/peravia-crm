'use client';
import { useRouter } from 'next/navigation';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { PriceListForm } from '@/components/forms/PriceListForm';

export default function NewPriceListPage() {
  const router = useRouter();

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center space-x-4 space-x-reverse mb-6">
        <Link href="/price-lists" className="p-2 bg-white dark:bg-slate-900 rounded-full shadow-sm hover:bg-slate-50 dark:bg-slate-800/50 transition border border-slate-200 dark:border-slate-700">
          <ArrowRight className="w-5 h-5 text-slate-600 dark:text-slate-300" />
        </Link>
        <div>
          <h1 className="text-2xl font-black text-slate-900">
            ساخت لیست قیمت جدید
          </h1>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700">
        <PriceListForm 
          onSuccess={() => router.push('/price-lists')}
          onCancel={() => router.push('/price-lists')}
        />
      </div>
    </div>
  );
}
