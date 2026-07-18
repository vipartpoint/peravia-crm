'use client';

import React, { useState, useEffect } from 'react';
import { FileCheck2 } from 'lucide-react';
import { api } from '@/services/api';
import Link from 'next/link';

export default function ApprovalBadge() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    fetchCount();
    const interval = setInterval(fetchCount, 60000);
    return () => clearInterval(interval);
  }, []);

  const fetchCount = async () => {
    try {
      const res = await api.get('/approvals/dashboard');
      if (res && typeof res.totalPending === 'number') {
        setCount(res.totalPending);
      }
    } catch (e) {
      console.error('Failed to fetch approvals count', e);
    }
  };

  return (
    <Link href="/approvals" className="relative group">
      <button className="p-2 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-xl transition-colors focus:outline-none">
        <FileCheck2 className="w-5 h-5" />
      </button>
      {count > 0 && (
        <span className="absolute top-1.5 right-1.5 min-w-[16px] h-4 px-1 rounded-full bg-indigo-500 text-white text-[10px] font-bold flex items-center justify-center shadow-sm border-2 border-white dark:border-slate-900">
          {count > 99 ? '99+' : count}
        </span>
      )}
    </Link>
  );
}
