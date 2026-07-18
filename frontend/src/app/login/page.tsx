'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/services/api';
import { Lock, User, Eye, EyeOff, ShieldCheck, ArrowRight } from 'lucide-react';

const toEnglishDigits = (str: string) => {
  const persianNumbers = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  const arabicNumbers  = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
  return str
    .replace(/[۰-۹]/g, w => persianNumbers.indexOf(w).toString())
    .replace(/[٠-٩]/g, w => arabicNumbers.indexOf(w).toString());
};

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isForceChange, setIsForceChange] = useState(false);
  const [mfaRequired, setMfaRequired] = useState(false);
  const [mfaToken, setMfaToken] = useState('');
  const [mfaCode, setMfaCode] = useState('');
  const [rememberDevice, setRememberDevice] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isForceChange) {
        if (newPassword.length < 8) {
          setError('رمز عبور جدید باید حداقل ۸ کاراکتر باشد.');
          setLoading(false);
          return;
        }
        await api.post('/auth/change-temporary-password', { username, oldPassword: password, newPassword });
        setIsForceChange(false);
        setPassword('');
        setNewPassword('');
        setError('رمز عبور با موفقیت تغییر کرد. لطفاً مجدداً وارد شوید.');
      } else {
        const res = await api.post('/auth/login', { username, password });
        if (res.message === 'MFA_REQUIRED') {
          setMfaRequired(true);
          setMfaToken(res.mfaToken);
        } else {
          router.push('/dashboard');
        }
      }
    } catch (err: any) {
      let errorMessage = 'خطا در ارتباط با سرور';
      try {
        const parsed = JSON.parse(err.message);
        errorMessage = parsed.message || errorMessage;
      } catch (e) {
        // err.message is not JSON
        errorMessage = err.message || errorMessage;
      }
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleMfaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await api.post('/auth/mfa/verify-login', { mfaToken, code: mfaCode, rememberDevice });
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'MFA verification failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 relative overflow-hidden" dir="rtl">
      {/* Background Decor */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-indigo-600/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[-5%] w-[600px] h-[600px] bg-sky-600/20 rounded-full blur-[150px]" />
      </div>

      <div className="w-full max-w-md p-8 relative z-10">
        <div className="mb-10 text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-sky-500 rounded-2xl mx-auto mb-6 flex items-center justify-center shadow-lg shadow-indigo-500/30">
            <ShieldCheck className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-black text-white mb-2 tracking-tight">سیستم مدیریت یکپارچه</h1>
          <p className="text-slate-400">برای ورود اطلاعات خود را وارد کنید</p>
        </div>

        {!mfaRequired ? (
          <form onSubmit={handleLogin} className="space-y-5">
            {error && (
              <div className={`p-4 rounded-xl text-sm font-medium ${error.includes('موفقیت') ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'}`}>
                {error}
              </div>
            )}

            {isForceChange && (
              <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-xl mb-4">
                <h3 className="text-amber-400 font-bold mb-1">تغییر رمز عبور الزامی است</h3>
                <p className="text-amber-200/70 text-sm">به دلایل امنیتی، در اولین ورود باید رمز عبور موقت خود را تغییر دهید.</p>
              </div>
            )}

            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-300">نام کاربری</label>
              <div className="relative">
                <User className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <input 
                  type="text" 
                  value={username}
                  onChange={e => setUsername(toEnglishDigits(e.target.value))}
                  disabled={isForceChange}
                  className="w-full bg-slate-800/50 border border-slate-700 text-white rounded-xl py-3 pr-12 pl-4 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all disabled:opacity-50"
                  placeholder="نام کاربری خود را وارد کنید"
                  dir="ltr"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-300">{isForceChange ? 'رمز عبور فعلی' : 'رمز عبور'}</label>
              <div className="relative">
                <Lock className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <input 
                  type={showPassword ? 'text' : 'password'} 
                  value={password}
                  onChange={e => setPassword(toEnglishDigits(e.target.value))}
                  className="w-full bg-slate-800/50 border border-slate-700 text-white rounded-xl py-3 pr-12 pl-12 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                  placeholder="••••••••"
                  dir="ltr"
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {isForceChange && (
              <div className="space-y-1 animate-in fade-in slide-in-from-top-4">
                <label className="text-sm font-medium text-slate-300">رمز عبور جدید</label>
                <div className="relative">
                  <Lock className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-indigo-400" />
                  <input 
                    type="password"
                    value={newPassword}
                    onChange={e => setNewPassword(toEnglishDigits(e.target.value))}
                    className="w-full bg-slate-800/50 border border-indigo-500/50 text-white rounded-xl py-3 pr-12 pl-4 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                    placeholder="رمز عبور جدید (حداقل ۸ حرف)"
                    dir="ltr"
                  />
                </div>
              </div>
            )}

            <button 
              type="submit" 
              disabled={loading || !username || !password || (isForceChange && !newPassword)}
              className="w-full bg-gradient-to-r from-indigo-600 to-sky-600 hover:from-indigo-500 hover:to-sky-500 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-indigo-500/25 transition-all flex justify-center items-center gap-2 disabled:opacity-70 mt-6"
            >
              {loading ? 'در حال پردازش...' : (isForceChange ? 'تغییر رمز و ورود' : 'ورود به سیستم')}
              {!loading && !isForceChange && <ArrowRight className="w-5 h-5" />}
            </button>
          </form>
        ) : (
          <form onSubmit={handleMfaSubmit} className="space-y-5 animate-in slide-in-from-right-4 fade-in">
            <div className="text-center mb-6">
              <h2 className="text-xl font-bold text-white mb-2">احراز هویت دو مرحله‌ای</h2>
              <p className="text-slate-400 text-sm">کد ۶ رقمی Authenticator یا کد بازیابی را وارد کنید.</p>
            </div>

            {error && (
              <div className="p-4 rounded-xl text-sm font-medium bg-rose-500/10 text-rose-400 border border-rose-500/20">
                {error}
              </div>
            )}

            <div className="space-y-1">
              <div className="relative">
                <ShieldCheck className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-indigo-400" />
                <input 
                  type="text" 
                  value={mfaCode}
                  onChange={e => setMfaCode(toEnglishDigits(e.target.value))}
                  className="w-full bg-slate-800/50 border border-indigo-500/50 text-white rounded-xl py-4 pr-12 pl-4 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all text-center tracking-[0.5em] text-xl font-mono"
                  placeholder="------"
                  maxLength={10}
                  dir="ltr"
                  autoFocus
                />
              </div>
            </div>

            <div className="flex items-center space-x-2 space-x-reverse mt-4">
              <input 
                type="checkbox" 
                id="rememberDevice"
                checked={rememberDevice}
                onChange={e => setRememberDevice(e.target.checked)}
                className="w-4 h-4 rounded text-indigo-600 bg-slate-800 border-slate-600 focus:ring-indigo-500"
              />
              <label htmlFor="rememberDevice" className="text-sm text-slate-300">
                به خاطر سپردن این دستگاه (۳۰ روز)
              </label>
            </div>

            <button 
              type="submit" 
              disabled={loading || !mfaCode}
              className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-emerald-500/25 transition-all flex justify-center items-center gap-2 disabled:opacity-70 mt-6"
            >
              {loading ? 'در حال تایید...' : 'تایید و ورود'}
              {!loading && <ShieldCheck className="w-5 h-5" />}
            </button>
            
            <button 
              type="button" 
              onClick={() => {
                setMfaRequired(false);
                setMfaToken('');
                setMfaCode('');
              }}
              className="w-full text-slate-400 text-sm hover:text-white transition-colors mt-4"
            >
              بازگشت به صفحه ورود
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
