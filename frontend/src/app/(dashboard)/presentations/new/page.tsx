'use client';
import { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { PresentationForm } from '@/components/forms/PresentationForm';

function NewPresentationForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const prefillLeadId = searchParams?.get('leadId') || '';

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center space-x-4 space-x-reverse mb-6">
        <Link href="/presentations" className="p-2 bg-white dark:bg-slate-900 rounded-full shadow-sm hover:bg-slate-50 dark:bg-slate-800/50 transition border border-slate-200 dark:border-slate-700">
          <ArrowRight className="w-5 h-5 text-slate-600 dark:text-slate-300" />
        </Link>
        <div>
          <h1 className="text-2xl font-black text-slate-900">
            ثبت پرزنت جدید
          </h1>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700">
        <PresentationForm 
          prefillLeadId={prefillLeadId}
          onSuccess={() => router.push('/presentations')}
          onCancel={() => router.push('/presentations')}
        />
      </div>
    </div>
  );
}

export default function NewPresentationPage() {
  return (
    <Suspense fallback={<div className="flex justify-center p-12"><div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div></div>}>
      <NewPresentationForm />
    </Suspense>
  );
}
