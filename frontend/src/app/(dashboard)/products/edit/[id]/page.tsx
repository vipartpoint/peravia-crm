'use client';
import { useRouter, useParams } from 'next/navigation';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { ProductForm } from '@/components/forms/ProductForm';
import { useEffect, useState } from 'react';
import { api } from '@/services/api';

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams();
  const [initialData, setInitialData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/products/${params.id}`)
      .then(res => setInitialData(res))
      .catch(() => router.push('/products'))
      .finally(() => setLoading(false));
  }, [params.id]);

  if (loading) return <div className="flex justify-center p-12"><div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div></div>;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center space-x-4 space-x-reverse mb-6">
        <Link href="/products" className="p-2 bg-white dark:bg-slate-900 rounded-full shadow-sm hover:bg-slate-50 dark:bg-slate-800/50 transition border border-slate-200 dark:border-slate-700">
          <ArrowRight className="w-5 h-5 text-slate-600 dark:text-slate-300" />
        </Link>
        <div>
          <h1 className="text-2xl font-black text-slate-900">
            ویرایش محصول
          </h1>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700">
        <ProductForm 
          initialData={initialData}
          onSuccess={() => router.push('/products')}
          onCancel={() => router.push('/products')}
        />
      </div>
    </div>
  );
}
