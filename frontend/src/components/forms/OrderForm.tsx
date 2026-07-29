'use client';

import React, { useState, useEffect } from 'react';
import { api } from '@/services/api';
import { Save, Search, Plus, Trash2, Send } from 'lucide-react';

interface OrderFormProps {
  initialData?: any;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function OrderForm({ initialData, onSuccess, onCancel }: OrderFormProps) {
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(!!initialData?.id);
  const [customers, setCustomers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  
  const [formData, setFormData] = useState({
    customerId: initialData?.customerId || '',
    brand: initialData?.brand || 'Pravia',
  });

  const [selectedItems, setSelectedItems] = useState<any[]>([]);
  const [status, setStatus] = useState(initialData?.status || '');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [cData, pData] = await Promise.all([
        api.get('/customers'),
        api.get('/products')
      ]);
      setCustomers(cData);
      setProducts(pData);
      
      if (initialData?.id) {
        if (initialData.status !== 'Draft') {
          alert('فقط سفارشات پیش‌نویس قابل ویرایش هستند.');
          if (onCancel) onCancel();
          return;
        }

        setFormData({
          customerId: initialData.customerId,
          brand: initialData.brand || 'Pravia',
        });
        setStatus(initialData.status);

        setSelectedItems((initialData.items || []).map((i: any) => ({
          productId: i.productId,
          product: i.product || pData.find((p: any) => p.id === i.productId),
          quantity: i.quantity,
          unitPrice: i.unitPrice,
          discountPercent: i.discountPercent,
          finalUnitPrice: i.finalUnitPrice || (i.unitPrice - (i.unitPrice * i.discountPercent / 100)),
          totalPrice: i.totalPrice || ((i.unitPrice - (i.unitPrice * i.discountPercent / 100)) * i.quantity)
        })));
      }
    } catch (e) {
      console.error(e);
      alert('خطا در دریافت اطلاعات');
      if (onCancel) onCancel();
    } finally {
      setInitialLoading(false);
    }
  };

  const addItem = (product: any) => {
    if (selectedItems.find(i => i.productId === product.id)) return;
    
    setSelectedItems([...selectedItems, {
      productId: product.id,
      product: product,
      quantity: 1,
      unitPrice: product.basePrice,
      discountPercent: 0,
      finalUnitPrice: product.basePrice,
      totalPrice: product.basePrice
    }]);
  };

  const removeItem = (productId: string) => {
    setSelectedItems(selectedItems.filter(i => i.productId !== productId));
  };

  const updateItem = (productId: string, field: string, value: number) => {
    setSelectedItems(selectedItems.map(item => {
      if (item.productId === productId) {
        const newItem = { ...item, [field]: value };
        const discountAmount = (newItem.unitPrice * newItem.discountPercent) / 100;
        newItem.finalUnitPrice = newItem.unitPrice - discountAmount;
        newItem.totalPrice = newItem.finalUnitPrice * newItem.quantity;
        return newItem;
      }
      return item;
    }));
  };

  const handleSubmit = async (e: React.FormEvent, isDraft: boolean) => {
    e.preventDefault();
    if (!formData.customerId) return alert('مشتری را انتخاب کنید.');
    if (selectedItems.length === 0) return alert('حداقل یک محصول اضافه کنید.');

    setLoading(true);
    try {
      const newStatus = isDraft ? 'Draft' : 'PendingApproval';

      const payload = {
        ...formData,
        status: newStatus,
        items: selectedItems.map(i => ({
          productId: i.productId,
          quantity: Number(i.quantity),
          unitPrice: Number(i.unitPrice),
          discountPercent: Number(i.discountPercent)
        }))
      };

      if (initialData?.id) {
        await api.patch(`/orders/${initialData.id}`, payload);
      } else {
        await api.post('/orders', payload);
      }
      if (onSuccess) onSuccess();
    } catch (err: any) {
      alert(err.response?.data?.message || 'خطا در ثبت سفارش.');
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter(p => p.isActive && (p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.sku.toLowerCase().includes(searchTerm.toLowerCase())));

  const totalAmount = selectedItems.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0);
  const netAmount = selectedItems.reduce((sum, item) => sum + item.totalPrice, 0);
  const discountAmount = totalAmount - netAmount;

  if (initialLoading) return <div className="flex justify-center p-12"><div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div></div>;

  return (
    <div className="space-y-6">
      <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700 space-y-4">
        <h3 className="font-bold text-slate-800 dark:text-slate-200 border-b border-slate-200 dark:border-slate-700 pb-2 text-sm">مشخصات اصلی</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">مشتری <span className="text-rose-500">*</span></label>
            <select required value={formData.customerId} onChange={e => setFormData({...formData, customerId: e.target.value})} className="w-full p-2.5 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm">
              <option value="">انتخاب کنید...</option>
              {customers.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">برند <span className="text-rose-500">*</span></label>
            <select required value={formData.brand} onChange={e => setFormData({...formData, brand: e.target.value})} className="w-full p-2.5 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm">
              <option value="Pravia">Pravia</option>
              <option value="Gertex">Gertex</option>
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col max-h-[500px]">
        <h3 className="font-bold text-slate-800 dark:text-slate-200 border-b border-slate-100 dark:border-slate-800 p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-3 text-sm">
          <span>آیتم‌های فاکتور ({selectedItems.length})</span>
          <div className="relative w-full md:w-64">
            <Search className="w-4 h-4 absolute right-3 top-2.5 text-slate-400" />
            <input 
              type="text" 
              placeholder="جستجوی محصول..." 
              className="w-full py-2 pr-9 pl-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500 dark:text-slate-100"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
            />
            
            {(searchTerm || isSearchFocused) && (
              <div className="absolute top-full right-0 w-full mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl z-20 max-h-60 overflow-y-auto">
                {filteredProducts.slice(0, 10).map(p => (
                  <div key={p.id} onClick={() => { addItem(p); setSearchTerm(''); }} className="p-3 hover:bg-slate-50 dark:bg-slate-800/50 cursor-pointer flex justify-between items-center border-b last:border-b-0">
                    <div>
                      <p className="font-bold text-sm text-slate-900">{p.name}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{p.sku} | {Number(p.basePrice).toLocaleString('fa-IR')} ریال</p>
                    </div>
                    <Plus className="w-4 h-4 text-indigo-600" />
                  </div>
                ))}
                {filteredProducts.length === 0 && <div className="p-3 text-sm text-slate-500 dark:text-slate-400 text-center">موردی یافت نشد.</div>}
              </div>
            )}
          </div>
        </h3>

        <div className="flex-1 overflow-y-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800 sticky top-0 z-10">
              <tr>
                <th className="p-3 font-bold">محصول</th>
                <th className="p-3 font-bold w-20">تعداد</th>
                <th className="p-3 font-bold w-24">قیمت واحد</th>
                <th className="p-3 font-bold w-16">تخفیف %</th>
                <th className="p-3 font-bold w-28">مبلغ کل (ریال)</th>
                <th className="p-3 text-center w-10">حذف</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {selectedItems.map(item => (
                <tr key={item.productId} className="hover:bg-slate-50 dark:bg-slate-800/50/50">
                  <td className="p-3">
                    <p className="font-bold text-slate-900">{item.product.name}</p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">{item.product.sku}</p>
                  </td>
                  <td className="p-3">
                    <input type="number" min="1" value={item.quantity} onChange={e => updateItem(item.productId, 'quantity', Number(e.target.value))} className="w-full p-1.5 border border-slate-200 dark:border-slate-700 rounded bg-white dark:bg-slate-900 font-mono text-center outline-none focus:border-indigo-500" />
                  </td>
                  <td className="p-3 font-mono text-slate-600 dark:text-slate-400">
                    {Number(item.unitPrice).toLocaleString('fa-IR')}
                  </td>
                  <td className="p-3">
                    <input type="number" min="0" max="100" value={item.discountPercent} onChange={e => updateItem(item.productId, 'discountPercent', Number(e.target.value))} className={`w-full p-1.5 border rounded font-mono text-center outline-none ${item.discountPercent > 5 ? 'border-amber-500 bg-amber-50 text-amber-700' : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:border-indigo-500'}`} title={item.discountPercent > 5 ? "تخفیف بالای 5 درصد نیازمند تأیید مدیر است" : ""} />
                  </td>
                  <td className="p-3 font-mono font-bold text-slate-900">
                    {Number(item.totalPrice).toLocaleString('fa-IR')}
                  </td>
                  <td className="p-3 text-center">
                    <button type="button" onClick={() => removeItem(item.productId)} className="text-rose-500 hover:text-rose-700 p-1 bg-white dark:bg-slate-900 rounded-md border border-slate-200 dark:border-slate-700 shadow-sm">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {selectedItems.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400 text-sm font-medium">
                    از کادر جستجوی بالا، محصولات مورد نظر را به سفارش اضافه کنید.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 p-4 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="space-y-1 text-xs text-slate-600 dark:text-slate-400 w-full md:w-auto">
            <div className="flex justify-between md:justify-start md:gap-4"><span className="w-24">مجموع اقلام:</span><span className="font-mono font-bold text-slate-900">{selectedItems.length}</span></div>
            <div className="flex justify-between md:justify-start md:gap-4"><span className="w-24">بدون تخفیف:</span><span className="font-mono">{totalAmount.toLocaleString('fa-IR')} ریال</span></div>
            <div className="flex justify-between md:justify-start md:gap-4 text-rose-500"><span className="w-24">مجموع تخفیف:</span><span className="font-mono">{discountAmount.toLocaleString('fa-IR')} ریال</span></div>
          </div>
          <div className="text-left w-full md:w-auto flex md:block justify-between items-end">
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">مبلغ قابل پرداخت</p>
            <p className="text-xl font-black text-indigo-600 font-mono tracking-tight">{netAmount.toLocaleString('fa-IR')} <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400">ریال</span></p>
          </div>
        </div>
      </div>

      <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-col-reverse sm:flex-row justify-end gap-3">
        {onCancel && (
          <button type="button" onClick={onCancel} className="px-6 py-2.5 rounded-xl text-sm font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:bg-slate-800 transition border border-transparent">
            انصراف
          </button>
        )}
        <button disabled={loading} type="button" onClick={(e) => handleSubmit(e, true)} className="bg-white dark:bg-slate-900 border border-slate-300 hover:bg-slate-50 dark:bg-slate-800/50 text-slate-700 dark:text-slate-300 px-6 py-2.5 rounded-xl flex justify-center items-center font-bold text-sm transition disabled:opacity-50">
          <Save className="w-4 h-4 ml-2" /> ذخیره پیش‌نویس
        </button>
        <button disabled={loading} type="button" onClick={(e) => handleSubmit(e, false)} className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-xl flex justify-center items-center shadow-lg shadow-indigo-500/30 font-bold text-sm transition disabled:opacity-50">
          <Send className="w-4 h-4 ml-2" /> ارسال برای تأیید
        </button>
      </div>
    </div>
  );
}
