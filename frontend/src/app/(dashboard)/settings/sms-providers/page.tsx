'use client';

import React, { useState, useEffect } from 'react';
import { Settings, Plus, CheckCircle2, XCircle, AlertCircle, Play, ServerCrash, Key } from 'lucide-react';
import { api } from '@/services/api';
import { useToast } from '@/components/ui/Toast';
import { Button } from '@/components/ui/Button';

export default function SmsProvidersPage() {
  const [providers, setProviders] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProvider, setEditingProvider] = useState<any>(null);
  const [formData, setFormData] = useState<any>({ providerType: 'KAVENEGAR', status: 'Active' });
  const [isSaving, setIsSaving] = useState(false);
  
  const [testModalOpen, setTestModalOpen] = useState(false);
  const [testRecipient, setTestRecipient] = useState('');
  const [isTesting, setIsTesting] = useState(false);
  const [testingProviderId, setTestingProviderId] = useState<string | null>(null);

  const { toast } = useToast();

  const fetchProviders = async () => {
    try {
      const res = await api.get('/notifications/providers');
      setProviders(res || []);
    } catch (error: any) {
      toast({ type: 'error', title: 'خطا', description: 'دریافت درگاه‌ها با خطا مواجه شد.' });
    }
  };

  useEffect(() => {
    fetchProviders();
  }, []);

  const openAddModal = () => {
    setEditingProvider(null);
    setFormData({ providerType: 'KAVENEGAR', status: 'Active' });
    setIsModalOpen(true);
  };

  const openEditModal = (p: any) => {
    setEditingProvider(p);
    setFormData({ ...p });
    setIsModalOpen(true);
  };

  const openTestModal = (id: string) => {
    setTestingProviderId(id);
    setTestRecipient('');
    setTestModalOpen(true);
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      if (editingProvider) {
        await api.patch(`/notifications/providers/${editingProvider.id}`, formData);
        toast({ type: 'success', title: 'موفق', description: 'درگاه به‌روزرسانی شد.' });
      } else {
        await api.post('/notifications/providers', formData);
        toast({ type: 'success', title: 'موفق', description: 'درگاه جدید افزوده شد.' });
      }
      setIsModalOpen(false);
      fetchProviders();
    } catch (error: any) {
      toast({ type: 'error', title: 'خطا', description: error.message || 'خطا در ذخیره‌سازی' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestSms = async () => {
    if (!testRecipient) return toast({ type: 'error', title: 'خطا', description: 'شماره موبایل را وارد کنید.' });
    if (!testingProviderId) return;

    try {
      setIsTesting(true);
      await api.post(`/notifications/providers/${testingProviderId}/test`, { recipient: testRecipient });
      toast({ type: 'success', title: 'تست موفق', description: 'پیامک تست با موفقیت از طریق این درگاه ارسال شد.' });
      setTestModalOpen(false);
      fetchProviders(); // refresh to show last tested status
    } catch (error: any) {
      toast({ type: 'error', title: 'تست ناموفق', description: error.message || 'ارسال پیامک با خطا مواجه شد.' });
      fetchProviders();
    } finally {
      setIsTesting(false);
    }
  };

  const handleSetDefault = async (id: string) => {
    try {
      await api.patch(`/notifications/providers/${id}/default`, {});
      toast({ type: 'success', title: 'موفق', description: 'این درگاه به عنوان پیش‌فرض تنظیم شد.' });
      fetchProviders();
    } catch (error: any) {
      toast({ type: 'error', title: 'خطا', description: error.message });
    }
  };

  const handleToggleStatus = async (id: string, currentStatus: string) => {
    try {
      if (currentStatus === 'Active') {
        await api.patch(`/notifications/providers/${id}/deactivate`, {});
      } else {
        await api.patch(`/notifications/providers/${id}/activate`, {});
      }
      fetchProviders();
    } catch (error: any) {
      toast({ type: 'error', title: 'خطا', description: error.message });
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex justify-between items-center bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800">
        <div>
          <h1 className="text-2xl font-black text-slate-800 dark:text-white flex items-center gap-3">
            <ServerCrash className="w-7 h-7 text-indigo-500" />
            مدیریت درگاه‌های پیامک
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2 text-sm">
            شما می‌توانید درگاه‌های مختلفی را پیکربندی کرده و درگاه فعال سیستم را تغییر دهید.
          </p>
        </div>
        <Button onClick={openAddModal} className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2">
          <Plus className="w-5 h-5" /> افزودن درگاه جدید
        </Button>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400">نام درگاه</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400">نوع</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400">وضعیت</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400">پیش‌فرض</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400">نتیجه تست قبلی</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 text-center">عملیات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {providers.map(p => (
                <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <td className="px-6 py-4 font-bold text-slate-900 dark:text-white">
                    {p.name}
                  </td>
                  <td className="px-6 py-4">
                    <span className="bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 px-2 py-1 rounded text-xs font-bold">
                      {p.providerType}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <button 
                      onClick={() => handleToggleStatus(p.id, p.status)}
                      className={`px-3 py-1 rounded-full text-xs font-bold border transition-colors ${
                        p.status === 'Active' 
                          ? 'border-emerald-200 bg-emerald-50 text-emerald-600 hover:bg-emerald-100' 
                          : 'border-slate-200 bg-slate-50 text-slate-500 hover:bg-slate-100'
                      }`}
                    >
                      {p.status === 'Active' ? 'فعال' : 'غیرفعال'}
                    </button>
                  </td>
                  <td className="px-6 py-4">
                    {p.isDefault ? (
                      <span className="text-emerald-500 font-bold flex items-center gap-1 text-sm"><CheckCircle2 className="w-4 h-4"/> پیش‌فرض سیستم</span>
                    ) : (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleSetDefault(p.id)}
                        disabled={p.status !== 'Active'}
                        className="text-xs h-8"
                      >
                        انتخاب
                      </Button>
                    )}
                  </td>
                  <td className="px-6 py-4 text-xs">
                    {p.lastTestStatus ? (
                      <div className="flex flex-col gap-1">
                        <span className={p.lastTestStatus === 'Success' ? 'text-emerald-500 font-bold' : 'text-red-500 font-bold'}>
                          {p.lastTestStatus === 'Success' ? 'موفق' : 'ناموفق'}
                        </span>
                        <span className="text-slate-400">{new Date(p.lastTestedAt).toLocaleDateString('fa-IR')}</span>
                      </div>
                    ) : (
                      <span className="text-slate-400">تست نشده</span>
                    )}
                  </td>
                  <td className="px-6 py-4 flex justify-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => openEditModal(p)}>
                      <Settings className="w-4 h-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => openTestModal(p.id)} className="text-indigo-500 hover:text-indigo-600 hover:bg-indigo-50">
                      <Play className="w-4 h-4" />
                    </Button>
                  </td>
                </tr>
              ))}
              {providers.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-400 text-sm">
                    هیچ درگاهی در دیتابیس ثبت نشده است. سیستم در حال حاضر از مقادیر ENV استفاده می‌کند.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 max-h-[90vh] flex flex-col">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
              <h3 className="text-lg font-bold">{editingProvider ? 'ویرایش درگاه' : 'افزودن درگاه پیامک'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold mb-2">نام مستعار درگاه</label>
                  <input 
                    type="text" 
                    value={formData.name || ''} 
                    onChange={e => setFormData({...formData, name: e.target.value})}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:border-indigo-500"
                    placeholder="مثال: آی‌پی پنل اصلی"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold mb-2">نوع درگاه</label>
                  <select 
                    value={formData.providerType}
                    onChange={e => setFormData({...formData, providerType: e.target.value})}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:border-indigo-500"
                    dir="ltr"
                  >
                    <option value="KAVENEGAR">Kavenegar (کاوه‌نگار)</option>
                    <option value="IPPANEL">IPPanel (فراز اس ام اس و مکث)</option>
                    <option value="CUSTOM_HTTP">Custom HTTP (سفارشی)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold mb-2">API Key <span className="text-xs text-slate-400 font-normal">(رمزنگاری می‌شود)</span></label>
                  <input 
                    type="text" 
                    value={formData.apiKey || ''} 
                    onChange={e => setFormData({...formData, apiKey: e.target.value})}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:border-indigo-500"
                    placeholder={editingProvider && editingProvider.encryptedApiKey ? '******** (تنظیم شده)' : 'کلید API'}
                    dir="ltr"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold mb-2">شماره فرستنده</label>
                  <input 
                    type="text" 
                    value={formData.senderNumber || ''} 
                    onChange={e => setFormData({...formData, senderNumber: e.target.value})}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:border-indigo-500"
                    placeholder="مثال: 3000505"
                    dir="ltr"
                  />
                </div>
              </div>

              {(formData.providerType === 'IPPANEL' || formData.providerType === 'CUSTOM_HTTP') && (
                <div>
                  <label className="block text-sm font-bold mb-2">Base URL</label>
                  <input 
                    type="text" 
                    value={formData.baseUrl || ''} 
                    onChange={e => setFormData({...formData, baseUrl: e.target.value})}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:border-indigo-500"
                    placeholder="https://api2.ippanel.com/api/v1/sms/send/panel/single"
                    dir="ltr"
                  />
                </div>
              )}

              {formData.providerType === 'CUSTOM_HTTP' && (
                <>
                  <div>
                    <label className="block text-sm font-bold mb-2">هدرهای سفارشی (JSON)</label>
                    <textarea 
                      value={formData.customHeaders || ''} 
                      onChange={e => setFormData({...formData, customHeaders: e.target.value})}
                      className="w-full h-24 p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:border-indigo-500 font-mono text-xs"
                      placeholder={editingProvider && editingProvider.customHeadersEncrypted ? '******** (تنظیم شده)' : '{"X-API-KEY": "secret"}'}
                      dir="ltr"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold mb-2">قالب بادی سفارشی (JSON Template)</label>
                    <textarea 
                      value={formData.customPayloadTemplate || ''} 
                      onChange={e => setFormData({...formData, customPayloadTemplate: e.target.value})}
                      className="w-full h-24 p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:border-indigo-500 font-mono text-xs"
                      placeholder='{"to": "{to}", "text": "{message}", "from": "{from}"}'
                      dir="ltr"
                    />
                    <p className="text-xs text-slate-400 mt-1">متغیرهای مجاز: {`{to}, {message}, {from}`}</p>
                  </div>
                </>
              )}

            </div>
            
            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3 shrink-0">
              <Button variant="outline" onClick={() => setIsModalOpen(false)}>انصراف</Button>
              <Button onClick={handleSave} disabled={isSaving} className="bg-indigo-600 hover:bg-indigo-700 text-white">
                {isSaving ? 'در حال ذخیره...' : 'ذخیره تنظیمات درگاه'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Test Modal */}
      {testModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
              <h3 className="text-lg font-bold">ارسال پیامک تست</h3>
              <button onClick={() => setTestModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-sm text-slate-600 dark:text-slate-300">
                یک پیامک تستی به صورت **مستقیم** از طریق این درگاه ارسال می‌شود. دقت کنید که این ریکوئست وارد صف BullMQ نمی‌شود تا نتیجه را در لحظه مشاهده کنید.
              </p>
              <div>
                <label className="block text-sm font-bold mb-2">شماره موبایل گیرنده</label>
                <input 
                  type="text" 
                  value={testRecipient}
                  onChange={e => setTestRecipient(e.target.value)}
                  placeholder="09123456789"
                  className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 text-center text-lg tracking-widest"
                  dir="ltr"
                />
              </div>
            </div>
            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex gap-3">
              <Button variant="outline" onClick={() => setTestModalOpen(false)} className="flex-1">انصراف</Button>
              <Button onClick={handleTestSms} disabled={isTesting || !testRecipient} className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white gap-2">
                {isTesting ? 'در حال ارسال...' : <><Play className="w-4 h-4" /> ارسال تست</>}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
