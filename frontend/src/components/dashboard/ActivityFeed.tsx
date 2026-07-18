'use client';

import React from 'react';
import { ShoppingCart, Target, Wallet, MapPin } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { formatRelativeTime, formatAbsoluteDate } from '@/utils/date';

const mockActivities = [
  { id: 1, type: 'order', entityId: 'ORD-123', title: 'سفارش ۱۲۳ تایید و به انبار ارسال شد.', timestamp: Date.now() - 600000, color: 'text-emerald-600', bg: 'bg-emerald-100', icon: ShoppingCart },
  { id: 2, type: 'lead', entityId: 'LD-456', title: 'سرنخ تجاری «شرکت آلفا» به مشتری تبدیل شد.', timestamp: Date.now() - 3600000, color: 'text-blue-600', bg: 'bg-blue-100', icon: Target },
  { id: 3, type: 'payment', entityId: 'PAY-789', title: 'پرداخت ۵۰ میلیون تومانی با موفقیت ثبت شد.', timestamp: Date.now() - 7200000, color: 'text-teal-600', bg: 'bg-teal-100', icon: Wallet },
  { id: 4, type: 'visit', entityId: 'VST-012', title: 'گزارش ویزیت دوره ای «فروشگاه پارس» تکمیل شد.', timestamp: Date.now() - 86400000, color: 'text-purple-600', bg: 'bg-purple-100', icon: MapPin },
];

export function ActivityFeed() {
  const router = useRouter();

  const handleAction = (type: string, id: string) => {
    if (type === 'order') router.push(`/orders/${id}`);
    if (type === 'lead') router.push(`/leads/${id}`);
    if (type === 'payment') router.push(`/payments`);
    if (type === 'visit') router.push(`/visits`);
  };

  return (
    <div className="bg-card p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col h-full">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-semibold text-slate-800 text-lg">
          فعالیت‌های اخیر
        </h3>
      </div>
      
      <div className="flex-1 overflow-y-auto pr-2">
        <div className="relative border-r-2 border-slate-100 mr-3 pr-5 space-y-6">
          {mockActivities.map((act) => {
            const Icon = act.icon;
            return (
              <div key={act.id} className="relative group">
                <div className={`absolute -right-[29px] top-0.5 w-7 h-7 rounded-full flex items-center justify-center ${act.bg} border-4 border-white`}>
                  <Icon className={`w-3.5 h-3.5 ${act.color}`} />
                </div>
                <div 
                  onClick={() => handleAction(act.type, act.entityId)}
                  className="bg-transparent hover:bg-slate-50 transition-colors p-3 -mt-2 rounded-xl cursor-pointer border border-transparent hover:border-slate-100"
                >
                  <p className="text-sm font-medium text-slate-700 leading-relaxed">{act.title}</p>
                  <div className="relative inline-block mt-1.5">
                    <p className="text-xs text-slate-400 group-hover:text-slate-500 transition-colors" title={formatAbsoluteDate(act.timestamp)}>
                      {formatRelativeTime(act.timestamp)}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
