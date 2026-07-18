'use client';
import { useRouter, useParams } from 'next/navigation';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { OrderForm } from '@/components/forms/OrderForm';

export default function EditOrderPage() {
  const router = useRouter();
  const params = useParams();

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center space-x-4 space-x-reverse mb-6">
        <Link href={`/orders/${params.id}`} className="p-2 bg-white dark:bg-slate-900 rounded-full shadow-sm hover:bg-slate-50 dark:bg-slate-800/50 transition border border-slate-200 dark:border-slate-700">
          <ArrowRight className="w-5 h-5 text-slate-600 dark:text-slate-300" />
        </Link>
        <div>
          <h1 className="text-2xl font-black text-slate-900">
            ویرایش سفارش پیش‌نویس
          </h1>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700">
        <OrderForm 
          initialData={{ id: params.id }}
          onSuccess={() => router.push('/orders')}
          onCancel={() => router.push(`/orders/${params.id}`)}
        />
      </div>
    </div>
  );
}
