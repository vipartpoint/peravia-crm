'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Shield, ShieldAlert, ShieldCheck, KeyRound, Copy, CheckCircle, MonitorSmartphone } from 'lucide-react';
import { api } from '@/services/api';
import Image from 'next/image';

export default function SecuritySettingsPage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // Setup State
  const [isSettingUp, setIsSettingUp] = useState(false);
  const [setupData, setSetupData] = useState<{ secret: string, qrDataUrl: string } | null>(null);
  const [verifyCode, setVerifyCode] = useState('');
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);
  const [setupError, setSetupError] = useState('');
  const [setupSuccess, setSetupSuccess] = useState('');

  // Disable State
  const [isDisabling, setIsDisabling] = useState(false);
  const [disablePassword, setDisablePassword] = useState('');
  const [disableCode, setDisableCode] = useState('');
  const [disableError, setDisableError] = useState('');

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      setLoading(true);
      const res = await api.get('/auth/me');
      setUser(res.user);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const startMfaSetup = async () => {
    try {
      const res = await api.post('/auth/mfa/setup', {});
      setSetupData(res);
      setIsSettingUp(true);
      setRecoveryCodes([]);
      setVerifyCode('');
      setSetupError('');
    } catch (e: any) {
      alert(e.message || 'Error starting setup');
    }
  };

  const submitMfaSetup = async () => {
    setSetupError('');
    try {
      const res = await api.post('/auth/mfa/enable', { code: verifyCode });
      setRecoveryCodes(res.recoveryCodes);
      setSetupSuccess('احراز هویت دو مرحله‌ای با موفقیت فعال شد.');
      loadUser();
    } catch (e: any) {
      setSetupError(e.message || 'کد نامعتبر است');
    }
  };

  const submitDisable = async () => {
    setDisableError('');
    try {
      await api.post('/auth/mfa/disable', { password: disablePassword, code: disableCode });
      setIsDisabling(false);
      setDisablePassword('');
      setDisableCode('');
      loadUser();
      alert('احراز هویت دو مرحله‌ای غیرفعال شد.');
    } catch (e: any) {
      setDisableError(e.message || 'اطلاعات نامعتبر است');
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-500 animate-pulse">در حال بارگذاری...</div>;

  const isMandatory = ['SystemAdmin', 'Finance', 'WarehouseManager', 'FactoryManager'].includes(user?.role?.name || '');

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl mx-auto pb-12">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">تنظیمات امنیتی</h1>
        <p className="text-sm text-gray-500 mt-1">مدیریت احراز هویت و دسترسی‌های حساب کاربری</p>
      </div>

      <Card className="border-gray-200">
        <CardHeader className="bg-gray-50/50 border-b border-gray-100">
          <CardTitle className="text-lg font-medium text-gray-900 flex items-center">
            <Shield className="w-5 h-5 mr-2 text-indigo-500" />
            احراز هویت دو مرحله‌ای (MFA)
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6 space-y-6">
          <div className="flex items-start justify-between">
            <div className="space-y-1 max-w-xl">
              <h3 className="font-medium text-gray-900 flex items-center">
                وضعیت: 
                {user?.mfaEnabled ? (
                  <span className="ml-2 inline-flex items-center text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full text-sm font-semibold">
                    <ShieldCheck className="w-4 h-4 mr-1" /> فعال
                  </span>
                ) : (
                  <span className="ml-2 inline-flex items-center text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full text-sm font-semibold">
                    <ShieldAlert className="w-4 h-4 mr-1" /> غیرفعال
                  </span>
                )}
              </h3>
              <p className="text-sm text-gray-500">
                با فعال‌سازی احراز هویت دو مرحله‌ای، امنیت حساب خود را به شدت افزایش دهید. برای ورود علاوه بر رمز عبور، به کد تولید شده توسط گوشی خود نیاز خواهید داشت.
              </p>
              {isMandatory && !user?.mfaEnabled && (
                <div className="mt-4 p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-sm flex items-center">
                  <ShieldAlert className="w-5 h-5 ml-2 shrink-0" />
                  فعال‌سازی این بخش برای نقش سازمانی شما اجباری است. تا زمان فعال‌سازی، دسترسی شما به سایر بخش‌ها مسدود می‌باشد.
                </div>
              )}
            </div>
            <div>
              {!user?.mfaEnabled && !isSettingUp && (
                <Button onClick={startMfaSetup} className="bg-indigo-600 hover:bg-indigo-700">
                  فعال‌سازی MFA
                </Button>
              )}
              {user?.mfaEnabled && !isDisabling && (
                <Button variant="outline" onClick={() => setIsDisabling(true)} className="text-rose-600 border-rose-200 hover:bg-rose-50">
                  غیرفعال‌سازی
                </Button>
              )}
            </div>
          </div>

          {/* Setup Flow */}
          {isSettingUp && setupData && recoveryCodes.length === 0 && (
            <div className="mt-8 pt-8 border-t border-gray-100 animate-in slide-in-from-bottom-4">
              <h3 className="text-lg font-bold text-gray-900 mb-4">مراحل فعال‌سازی</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <div className="mb-4">
                    <span className="bg-indigo-100 text-indigo-700 font-bold w-6 h-6 inline-flex items-center justify-center rounded-full text-xs ml-2">۱</span>
                    <span className="text-sm font-medium text-gray-700">اسکن بارکد با اپلیکیشن (Google Authenticator)</span>
                  </div>
                  <div className="bg-white p-4 inline-block rounded-xl border border-gray-200 shadow-sm">
                    <img src={setupData.qrDataUrl} alt="QR Code" className="w-40 h-40" />
                  </div>
                  <p className="text-xs text-gray-500 mt-3">یا کد زیر را به صورت دستی وارد کنید:</p>
                  <code className="text-xs bg-gray-100 p-2 rounded block mt-1 tracking-wider text-center">{setupData.secret}</code>
                </div>
                
                <div>
                  <div className="mb-4">
                    <span className="bg-indigo-100 text-indigo-700 font-bold w-6 h-6 inline-flex items-center justify-center rounded-full text-xs ml-2">۲</span>
                    <span className="text-sm font-medium text-gray-700">تایید کد ۶ رقمی</span>
                  </div>
                  <p className="text-sm text-gray-500 mb-4">کد نمایش داده شده در اپلیکیشن را وارد کنید تا همگام‌سازی تایید شود.</p>
                  
                  {setupError && <div className="text-sm text-rose-600 bg-rose-50 p-2 rounded mb-3">{setupError}</div>}
                  
                  <div className="flex space-x-2 space-x-reverse">
                    <Input 
                      value={verifyCode}
                      onChange={e => setVerifyCode(e.target.value)}
                      placeholder="کد ۶ رقمی"
                      className="text-center tracking-widest font-mono text-lg"
                      maxLength={6}
                      dir="ltr"
                    />
                    <Button onClick={submitMfaSetup} className="bg-emerald-600 hover:bg-emerald-700 shrink-0">
                      تایید و فعال‌سازی
                    </Button>
                  </div>
                  <div className="mt-4">
                    <Button variant="ghost" size="sm" onClick={() => setIsSettingUp(false)} className="text-gray-500">انصراف</Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Recovery Codes View */}
          {recoveryCodes.length > 0 && (
            <div className="mt-8 pt-8 border-t border-emerald-100 bg-emerald-50/50 -mx-6 px-6 pb-6 animate-in fade-in">
              <div className="flex items-center text-emerald-700 mb-4">
                <CheckCircle className="w-6 h-6 mr-2" />
                <h3 className="text-lg font-bold">احراز هویت دو مرحله‌ای فعال شد</h3>
              </div>
              
              <div className="bg-white p-6 rounded-xl border border-amber-200 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-amber-500" />
                <h4 className="font-bold text-gray-900 flex items-center mb-2">
                  <KeyRound className="w-4 h-4 ml-2 text-amber-500" /> کدهای بازیابی (بسیار مهم)
                </h4>
                <p className="text-sm text-gray-600 mb-4 leading-relaxed">
                  این کدها تنها همین یک بار نمایش داده می‌شوند. در صورتی که به گوشی خود دسترسی نداشته باشید، تنها راه ورود به سیستم استفاده از این کدها است. لطفاً آن‌ها را در مکانی امن کپی یا یادداشت کنید.
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                  {recoveryCodes.map((code, idx) => (
                    <div key={idx} className="bg-gray-50 border border-gray-200 text-center py-2 font-mono text-sm tracking-wider text-gray-800 rounded">
                      {code}
                    </div>
                  ))}
                </div>
                <div className="mt-6 flex justify-end">
                  <Button onClick={() => {
                    setIsSettingUp(false);
                    setRecoveryCodes([]);
                  }}>
                    ذخیره کردم، متوجه شدم
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Disable Flow */}
          {isDisabling && (
            <div className="mt-8 pt-8 border-t border-rose-100 bg-rose-50/30 -mx-6 px-6 pb-6 animate-in slide-in-from-top-4">
              <h3 className="text-lg font-bold text-gray-900 mb-2 text-rose-700">غیرفعال‌سازی MFA</h3>
              <p className="text-sm text-gray-600 mb-6">برای غیرفعال‌سازی، لطفاً رمز عبور و یک کد معتبر Authenticator (یا کد بازیابی) وارد کنید.</p>
              
              {disableError && <div className="text-sm text-rose-600 bg-rose-100 p-3 rounded mb-4 font-medium">{disableError}</div>}
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl">
                <div>
                  <label className="text-xs font-medium text-gray-700 mb-1 block">رمز عبور</label>
                  <Input 
                    type="password" 
                    value={disablePassword}
                    onChange={e => setDisablePassword(e.target.value)}
                    dir="ltr"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-700 mb-1 block">کد Authenticator</label>
                  <Input 
                    type="text" 
                    value={disableCode}
                    onChange={e => setDisableCode(e.target.value)}
                    dir="ltr"
                    className="tracking-widest font-mono"
                  />
                </div>
              </div>
              <div className="mt-6 flex space-x-2 space-x-reverse">
                <Button onClick={submitDisable} variant="danger">تایید غیرفعال‌سازی</Button>
                <Button variant="ghost" onClick={() => setIsDisabling(false)}>انصراف</Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
