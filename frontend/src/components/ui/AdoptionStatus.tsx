'use client';

import React from 'react';
import { useAdoption } from '@/providers/AdoptionProvider';
import { ShieldCheck, Target, TrendingUp, AlertTriangle } from 'lucide-react';

export function AdoptionStatus() {
  const { onboardingLevel, progressPercentage, healthScore } = useAdoption();

  let healthLabel = 'نیازمند توجه';
  let healthColor = 'text-rose-500 bg-rose-50 dark:bg-rose-500/10 border-rose-100 dark:border-rose-500/20';
  let HealthIcon = AlertTriangle;

  if (healthScore >= 75) {
    healthLabel = 'عالی';
    healthColor = 'text-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 border-emerald-100 dark:border-emerald-500/20';
    HealthIcon = ShieldCheck;
  } else if (healthScore >= 40) {
    healthLabel = 'خوب';
    healthColor = 'text-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 border-indigo-100 dark:border-indigo-500/20';
    HealthIcon = TrendingUp;
  }

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 mb-4 shadow-sm mx-4">
      {/* Onboarding Progress */}
      <div className="mb-4">
        <div className="flex justify-between items-center mb-1.5">
          <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">پیشرفت یادگیری سیستم</span>
          <span className="text-[11px] font-black text-primary">{progressPercentage}٪</span>
        </div>
        <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex">
          <div 
            className="h-full bg-primary transition-all duration-1000" 
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
        <p className="text-[10px] text-slate-400 mt-1.5 font-medium">سطح {onboardingLevel}: {
          onboardingLevel === 1 ? 'آشنایی اولیه' : 
          onboardingLevel === 2 ? 'عملیات پایه' : 
          onboardingLevel === 3 ? 'مدیریت پیشرفته' : 'استاد سیستم'
        }</p>
      </div>

      {/* Health Score */}
      <div className={`p-2 rounded-lg border flex items-center gap-3 ${healthColor}`}>
        <HealthIcon className="w-5 h-5" />
        <div>
          <p className="text-[10px] font-bold opacity-80 mb-0.5">وضعیت سلامت کاربری</p>
          <div className="flex items-center gap-2">
            <span className="text-sm font-black">{healthScore} / 100</span>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-white/50 dark:bg-black/20">{healthLabel}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
