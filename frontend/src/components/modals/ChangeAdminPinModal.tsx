'use client';

import React, { useState, useEffect } from 'react';
import { api } from '@/services/api';
import { Key, ShieldAlert, X, CheckCircle2, Lock, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function ChangeAdminPinModal({ isOpen, onClose, onSuccess }: Props) {
  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [showCurrentPin, setShowCurrentPin] = useState(false);
  const [showNewPin, setShowNewPin] = useState(false);
  const [isCustomized, setIsCustomized] = useState(false);
  const [loading, setLoading] = useState(false);
  const [statusLoading, setStatusLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (isOpen) {
      setCurrentPin('');
      setNewPin('');
      setConfirmPin('');
      setError('');
      setSuccess('');
      fetchStatus();
    }
  }, [isOpen]);

  const fetchStatus = async () => {
    try {
      setStatusLoading(true);
      const res = await api.get('/territories/admin-pin/status');
      setIsCustomized(Boolean(res?.isCustomized));
    } catch (e) {
      console.error(e);
    } finally {
      setStatusLoading(false);
    }
  };

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (newPin.trim().length < 4) {
      setError('رمز کلیدی جدید باید حداقل ۴ رقم یا کاراکتر باشد.');
      return;
    }

    if (newPin !== confirmPin) {
      setError('رمز کلیدی جدید با تکرار آن یکسان نیست.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/territories/admin-pin', {
        currentPin: currentPin.trim(),
        newPin: newPin.trim()
      });
      setSuccess(res?.message || 'رمز کلیدی با موفقیت ذخیره شد.');
      setTimeout(() => {
        if (onSuccess) onSuccess();
        onClose();
      }, 1500);
    } catch (err: any) {
      setError(err.response?.data?.message || 'خطا در ثبت رمز کلیدی جدید.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in zoom-in-95 duration-150">
        <div className="p-6">
          <div className="flex justify-between items-center mb-5 pb-3 border-b border-slate-100 dark:border-slate-800">
            <h3 className="text-lg font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Key className="w-5 h-5 text-amber-500" />
              تعیین / تغییر رمز کلیدی ادمین (PIN)
            </h3>
            <button 
              onClick={onClose} 
              className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Status Badge */}
          <div className="mb-5 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-600 dark:text-slate-400">وضعیت فعلی رمز کلیدی:</span>
            {statusLoading ? (
              <span className="text-xs text-slate-400">در حال بررسی...</span>
            ) : isCustomized ? (
              <span className="text-xs font-black px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> رمز اختصاصی فعال است
              </span>
            ) : (
              <span className="text-xs font-black px-2.5 py-1 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                رمز پیش‌فرض (123456)
              </span>
            )}
          </div>

          <div className="text-xs text-slate-500 dark:text-slate-400 mb-5 leading-relaxed bg-blue-50/50 dark:bg-blue-950/20 p-3 rounded-xl border border-blue-100 dark:border-blue-900/30">
            این رمز جهت تایید عملیات‌های حساس (نظیر حذف فیزیکی و ادغام مناطق فروش) استفاده می‌شود. برای ارتقای امنیت سیستم، پیشنهاد می‌شود یک رمز اختصاصی تعیین کنید.
          </div>

          {error && (
            <div className="bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-600 dark:text-rose-400 p-3 rounded-xl text-xs mb-4 font-bold flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 text-emerald-700 dark:text-emerald-400 p-3 rounded-xl text-xs mb-4 font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{success}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                رمز کلیدی فعلی <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input 
                  type={showCurrentPin ? 'text' : 'password'}
                  value={currentPin}
                  onChange={e => setCurrentPin(e.target.value)}
                  placeholder={isCustomized ? "رمز کلیدی فعلی را وارد کنید..." : "رمز پیش‌فرض (123456) را وارد کنید..."}
                  className="w-full border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 text-xs outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 bg-white dark:bg-slate-800 dark:text-slate-100 pl-9 font-mono"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPin(!showCurrentPin)}
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showCurrentPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                رمز کلیدی جدید <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input 
                  type={showNewPin ? 'text' : 'password'}
                  value={newPin}
                  onChange={e => setNewPin(e.target.value)}
                  placeholder="حداقل ۴ کاراکتر یا رقم..."
                  className="w-full border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 text-xs outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 bg-white dark:bg-slate-800 dark:text-slate-100 pl-9 font-mono"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowNewPin(!showNewPin)}
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showNewPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                تکرار رمز کلیدی جدید <span className="text-rose-500">*</span>
              </label>
              <input 
                type="password"
                value={confirmPin}
                onChange={e => setConfirmPin(e.target.value)}
                placeholder="تکرار رمز کلیدی جدید..."
                className="w-full border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 text-xs outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 bg-white dark:bg-slate-800 dark:text-slate-100 font-mono"
                required
              />
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex gap-3">
              <Button 
                type="button" 
                variant="outline" 
                onClick={onClose}
                className="flex-1 text-xs"
              >
                انصراف
              </Button>
              <Button 
                type="submit" 
                variant="primary"
                isLoading={loading}
                disabled={loading || !currentPin || !newPin || !confirmPin}
                className="flex-1 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-lg shadow-amber-600/20"
              >
                ذخیره رمز جدید
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
