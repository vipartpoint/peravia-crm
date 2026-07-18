'use client';

import React, { useState, useEffect } from 'react';
import { api } from '@/services/api';
import { Save, Search, Plus, Trash2 } from 'lucide-react';
import { Dictionary } from '@/utils/constants/dictionary';

interface PriceListFormProps {
  initialData?: any;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function PriceListForm({ initialData, onSuccess, onCancel }: PriceListFormProps) {
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    brand: initialData?.brand || '',
    type: initialData?.type || 'Base',
    startDate: initialData?.startDate ? new Date(initialData.startDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    endDate: initialData?.endDate ? new Date(initialData.endDate).toISOString().split('T')[0] : '',
    isActive: initialData?.isActive ?? true
  });

  const [selectedItems, setSelectedItems] = useState<any[]>([]);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const data = await api.get('/products');
      setProducts(data);
      
      if (initialData?.items) {
        setSelectedItems(initialData.items.map((i: any) => ({
          productId: i.productId,
          product: i.product || data.find((p: any) => p.id === i.productId),
          price: i.price,
          discountPercent: i.discountPercent,
          finalPrice: i.finalPrice
        })));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const addItem = (product: any) => {
    if (selectedItems.find(i => i.productId === product.id)) return;
    
    setSelectedItems([...selectedItems, {
      productId: product.id,
      product: product,
      price: product.basePrice,
      discountPercent: 0,
      finalPrice: product.basePrice
    }]);
  };

  const removeItem = (productId: string) => {
    setSelectedItems(selectedItems.filter(i => i.productId !== productId));
  };

  const updateItem = (productId: string, field: string, value: number) => {
    setSelectedItems(selectedItems.map(item => {
      if (item.productId === productId) {
        const newItem = { ...item, [field]: value };
        if (field === 'price' || field === 'discountPercent') {
          const discount = (newItem.price * newItem.discountPercent) / 100;
          newItem.finalPrice = newItem.price - discount;
        } else if (field === 'finalPrice') {
           newItem.discountPercent = 0;
           newItem.price = newItem.finalPrice;
        }
        return newItem;
      }
      return item;
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedItems.length === 0) {
      alert('لطفاً حداقل یک محصول به لیست اضافه کنید.');
      return;
    }

    setLoading(true);
    try {
      const payload: any = {
        ...formData,
        startDate: new Date(formData.startDate).toISOString(),
        items: selectedItems.map(i => ({
          productId: i.productId,
          price: Number(i.price),
          discountPercent: Number(i.discountPercent),
          finalPrice: Number(i.finalPrice)
        }))
      };
      
      if (formData.endDate) {
        payload.endDate = new Date(formData.endDate).toISOString();
      }

      if (initialData?.id) {
        await api.patch(`/price-lists/${initialData.id}`, payload);
      } else {
        await api.post('/price-lists', payload);
      }
      if (onSuccess) onSuccess();
    } catch (err: any) {
      alert(err.response?.data?.message || 'خطا در ثبت لیست قیمت.');
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.sku.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-1 space-y-6">
        <form id="priceListForm" onSubmit={handleSubmit} className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-xl border border-slate-200 dark:border-slate-700 space-y-4">
          <h3 className="font-bold text-slate-800 dark:text-slate-200 border-b border-slate-200 dark:border-slate-700 pb-2 text-sm">مشخصات لیست</h3>
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">نام لیست <span className="text-rose-500">*</span></label>
            <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full p-2.5 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm" placeholder="مثلا لیست قیمت مصرف کننده" />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">نوع لیست <span className="text-rose-500">*</span></label>
            <select required value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})} className="w-full p-2.5 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm">
              <option value="Base">پایه (Base)</option>
              <option value="Agent">نمایندگی (Agent)</option>
              <option value="Distributor">عاملیت (Distributor)</option>
              <option value="B2B">سازمانی (B2B)</option>
              <option value="Campaign">جشنواره (Campaign)</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">تاریخ شروع <span className="text-rose-500">*</span></label>
            <input required type="date" value={formData.startDate} onChange={e => setFormData({...formData, startDate: e.target.value})} className="w-full p-2.5 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none font-mono text-sm" />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">تاریخ پایان</label>
            <input type="date" value={formData.endDate} onChange={e => setFormData({...formData, endDate: e.target.value})} className="w-full p-2.5 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none font-mono text-sm" />
          </div>
          <div className="flex items-center pt-2 p-2">
            <input type="checkbox" id="isActive" checked={formData.isActive} onChange={e => setFormData({...formData, isActive: e.target.checked})} className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500" />
            <label htmlFor="isActive" className="mr-2 text-sm font-bold text-slate-700 dark:text-slate-300">این لیست قیمت فعال است</label>
          </div>
          
          <div className="pt-6 border-t border-slate-200 dark:border-slate-700 flex flex-col gap-3">
            <button disabled={loading} type="submit" form="priceListForm" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-xl shadow-lg shadow-indigo-500/30 flex justify-center items-center font-bold text-sm transition disabled:opacity-50">
              <Save className="w-4 h-4 ml-2" />
              {loading ? 'در حال ثبت...' : (initialData?.id ? 'ویرایش لیست قیمت' : 'ذخیره لیست قیمت')}
            </button>
            {onCancel && (
              <button type="button" onClick={onCancel} className="w-full bg-white dark:bg-slate-900 border border-slate-300 hover:bg-slate-50 dark:bg-slate-800/50 text-slate-700 dark:text-slate-300 px-6 py-2.5 rounded-xl font-bold text-sm transition">
                {Dictionary.general.cancel}
              </button>
            )}
          </div>
        </form>
      </div>

      <div className="lg:col-span-2 space-y-6">
        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col max-h-[700px]">
          <h3 className="font-bold text-slate-800 dark:text-slate-200 border-b border-slate-100 dark:border-slate-800 p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 text-sm">
            <span>آیتم‌های لیست قیمت ({selectedItems.length})</span>
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 absolute right-3 top-2.5 text-slate-400" />
              <input 
                type="text" 
                placeholder="جستجو و افزودن محصول..." 
                className="w-full py-2 pr-9 pl-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500 dark:text-slate-100"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
              
              {searchTerm && (
                <div className="absolute top-full right-0 w-full mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl z-20 max-h-60 overflow-y-auto">
                  {filteredProducts.slice(0, 10).map(p => (
                    <div key={p.id} onClick={() => { addItem(p); setSearchTerm(''); }} className="p-3 hover:bg-slate-50 dark:bg-slate-800/50 cursor-pointer flex justify-between items-center border-b last:border-b-0">
                      <div>
                        <p className="font-bold text-sm text-slate-900">{p.name}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{p.sku}</p>
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
                  <th className="p-3 font-bold w-28">قیمت مصوب (ریال)</th>
                  <th className="p-3 font-bold w-16">تخفیف (%)</th>
                  <th className="p-3 font-bold w-28">قیمت نهایی (ریال)</th>
                  <th className="p-3 text-center w-10">حذف</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {selectedItems.map(item => (
                  <tr key={item.productId} className="hover:bg-slate-50 dark:bg-slate-800/50/50">
                    <td className="p-3">
                      <p className="font-bold text-sm text-slate-900">{item.product.name}</p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">{item.product.sku}</p>
                    </td>
                    <td className="p-3">
                      <input type="number" min="0" value={item.price} onChange={e => updateItem(item.productId, 'price', Number(e.target.value))} className="w-full p-1.5 border border-slate-200 dark:border-slate-700 rounded bg-white dark:bg-slate-900 text-sm font-mono outline-none focus:border-indigo-500" />
                    </td>
                    <td className="p-3">
                      <input type="number" min="0" max="100" value={item.discountPercent} onChange={e => updateItem(item.productId, 'discountPercent', Number(e.target.value))} className="w-full p-1.5 border border-slate-200 dark:border-slate-700 rounded bg-white dark:bg-slate-900 text-sm font-mono text-center outline-none focus:border-indigo-500" />
                    </td>
                    <td className="p-3">
                      <input type="number" min="0" value={item.finalPrice} onChange={e => updateItem(item.productId, 'finalPrice', Number(e.target.value))} className="w-full p-1.5 border border-slate-200 dark:border-slate-700 rounded font-bold text-emerald-600 bg-emerald-50 text-sm font-mono outline-none focus:border-indigo-500" />
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
                    <td colSpan={5} className="p-8 text-center text-slate-400 text-sm font-medium">
                      از کادر جستجوی بالا، محصولات مورد نظر را اضافه کنید.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

        </div>
      </div>
    </div>
  );
}
