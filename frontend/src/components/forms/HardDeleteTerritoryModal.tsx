'use client';

import React, { useState } from 'react';
import { api } from '@/services/api';
import { AlertTriangle, Key, MapPin, X, ArrowRightLeft, ShieldCheck, DatabaseZap } from 'lucide-react';

interface Props {
  territory: any;
  territories: any[]; // list of all territories to pick replacement from
  onClose: () => void;
  onSuccess: () => void;
}

export function HardDeleteTerritoryModal({ territory, territories, onClose, onSuccess }: Props) {
  const [mode, setMode] = useState<'merge' | 'detach'>('detach');
  const [adminPin, setAdminPin] = useState('');
  const [replacementTerritoryId, setReplacementTerritoryId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const availableTerritories = territories.filter(t => t.id !== territory.id);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (mode === 'merge' && !replacementTerritoryId) {
      setError('لطفاً منطقه جایگزین را برای ادغام انتخاب کنید.');
      return;
    }

    setLoading(true);
    
    try {
      await api.delete(`/territories/${territory.id}/hard`, {
        data: {
          adminPin,
          mode,
          replacementTerritoryId: mode === 'merge' ? replacementTerritoryId : undefined
        }
      });
      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.message || 'خطا در عملیات حذف منطقه.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-6">
          <div className="flex justify-between items-center mb-5 pb-3 border-b border-slate-100 dark:border-slate-800">
            <h3 className="text-lg font-black text-rose-600 dark:text-rose-400 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" /> حذف منطقه و تعیین وضعیت رکوردها
            </h3>
            <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/40 p-3.5 rounded-xl mb-5 flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div className="text-xs text-amber-900 dark:text-amber-300 leading-relaxed">
              شما در حال حذف منطقه <strong>«{territory.name}»</strong> هستید. 
              سیستم به صورت تضمینی از حذف رکوردهای متصل (مشتریان، فاکتورها، لیدها و ویزیت‌ها) جلوگیری می‌کند.
            </div>
          </div>

          {error && (
            <div className="bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-600 dark:text-rose-400 p-3 rounded-xl text-xs mb-5 font-bold">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Strategy Selection */}
            <div>
              <label className="block text-xs font-black text-slate-800 dark:text-slate-200 mb-2">
                سرنوشت رکوردهای داخل این منطقه چگونه باشد؟
              </label>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setMode('detach')}
                  className={`p-3.5 rounded-xl text-right border-2 transition-all flex flex-col gap-1.5 ${
                    mode === 'detach'
                      ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/30 shadow-sm'
                      : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="text-xs font-black text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                      <DatabaseZap className="w-4 h-4 text-indigo-600" />
                      تبدیل به «بدون منطقه»
                    </span>
                    <span className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center ${
                      mode === 'detach' ? 'border-indigo-600 bg-indigo-600' : 'border-slate-300'
                    }`}>
                      {mode === 'detach' && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
                    تمام مشتریان و سفارش‌ها باقی می‌مانند و وضعیت آن‌ها «بدون منطقه» می‌شود.
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setMode('merge')}
                  className={`p-3.5 rounded-xl text-right border-2 transition-all flex flex-col gap-1.5 ${
                    mode === 'merge'
                      ? 'border-emerald-600 bg-emerald-50/50 dark:bg-emerald-950/30 shadow-sm'
                      : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="text-xs font-black text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                      <ArrowRightLeft className="w-4 h-4 text-emerald-600" />
                      انتقال به منطقه دیگر
                    </span>
                    <span className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center ${
                      mode === 'merge' ? 'border-emerald-600 bg-emerald-600' : 'border-slate-300'
                    }`}>
                      {mode === 'merge' && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
                    تمامی سوابق فوراً به منطقه انتخابی جدید منتقل و با آن ادغام می‌شوند.
                  </span>
                </button>
              </div>
            </div>

            {/* Replacement Territory Select */}
            {mode === 'merge' && (
              <div className="animate-in fade-in slide-in-from-top-1 duration-150">
                <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  <MapPin className="w-3.5 h-3.5 text-emerald-500" /> منطقه جایگزین (مقصد انتقال) <span className="text-rose-500">*</span>
                </label>
                <select 
                  value={replacementTerritoryId}
                  onChange={e => setReplacementTerritoryId(e.target.value)}
                  className="w-full border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 text-xs outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 bg-white dark:bg-slate-800 dark:text-slate-100"
                  required
                >
                  <option value="">-- یک منطقه را انتخاب کنید --</option>
                  {availableTerritories.map(t => (
                    <option key={t.id} value={t.id}>{t.name} ({t.code})</option>
                  ))}
                </select>
              </div>
            )}

            {/* Admin PIN */}
            <div>
              <label className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                <span className="flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5 text-amber-500" /> رمز کلیدی ادمین (PIN) <span className="text-rose-500">*</span>
                </span>
                <span className="text-[11px] font-normal text-slate-400">پیش‌فرض: 123456</span>
              </label>
              <input 
                type="password" 
                value={adminPin}
                onChange={e => setAdminPin(e.target.value)}
                placeholder="رمز دوم / کلیدی را وارد کنید..."
                className="w-full border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 text-xs outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 bg-white dark:bg-slate-800 dark:text-slate-100"
                required
              />
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex gap-3">
              <button 
                type="button" 
                onClick={onClose}
                className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                انصراف
              </button>
              <button 
                type="submit" 
                disabled={loading || !adminPin || (mode === 'merge' && !replacementTerritoryId)}
                className="flex-1 px-4 py-2.5 rounded-xl bg-rose-600 text-white text-xs font-bold hover:bg-rose-700 disabled:opacity-50 transition-colors shadow-lg shadow-rose-600/20"
              >
                {loading ? 'در حال پردازش امن...' : (mode === 'merge' ? 'انتقال داده‌ها و حذف منطقه' : 'حفظ رکوردها و حذف منطقه')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
