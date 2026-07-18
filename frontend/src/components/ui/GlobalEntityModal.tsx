'use client';

import React, { useEffect, useState } from 'react';
import { useGlobalEntity } from '@/contexts/GlobalEntityContext';
import { SlideOver } from './SlideOver';
import { Button } from './Button';
import { Dictionary } from '@/utils/constants/dictionary';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ExternalLink, Calendar, Phone, MapPin, DollarSign } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { api } from '@/services/api';

import { LeadForm } from '../forms/LeadForm';
import { CustomerForm } from '../forms/CustomerForm';
import { OrderForm } from '../forms/OrderForm';
import { VisitForm } from '../forms/VisitForm';
import { ProductForm } from '../forms/ProductForm';
import { UserForm } from '../forms/UserForm';
import { WarehouseForm } from '../forms/WarehouseForm';
import { TerritoryForm } from '../forms/TerritoryForm';
import { PresentationForm } from '../forms/PresentationForm';
import { PriceListForm } from '../forms/PriceListForm';
import { PaymentForm } from '../forms/PaymentForm';
import { ChequeForm } from '../forms/ChequeForm';
import { TaskForm } from '../forms/TaskForm';
import { OpportunityForm } from '../forms/OpportunityForm';

export function GlobalEntityModal() {
  const { isOpen, type, mode, entityId, closeModal, initialData: contextInitialData } = useGlobalEntity() as any;
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && (mode === 'view' || mode === 'edit') && entityId) {
      setLoading(true);
      api.get(`/${type}s/${entityId}`)
        .then(res => setData(res))
        .catch(() => setData(null))
        .finally(() => setLoading(false));
    } else {
      setData(null);
    }
  }, [isOpen, type, mode, entityId]);

  useEffect(() => {
    if (isOpen && mode === 'view') {
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Enter' && type && entityId) {
          e.preventDefault();
          closeModal();
          router.push(`/${type}s/${entityId}`);
        }
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, mode, type, entityId, router, closeModal]);

  if (!isOpen || !type) return null;

  const entityName = Dictionary.entities[type] || type;

  const renderPreviewContent = () => {
    if (loading) return <div className="p-8 text-center text-slate-500">در حال بارگذاری...</div>;
    if (!data) return <div className="p-8 text-center text-slate-500">اطلاعات یافت نشد.</div>;

    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
            <span className="text-xs text-slate-500 dark:text-slate-400 block mb-1">نام / عنوان</span>
            <span className="font-bold text-slate-800 dark:text-slate-200">{data.name || data.title || `سفارش #${data.orderNumber || data.id?.slice(0,8)}`}</span>
          </div>
          {data.phone && (
            <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-100 dark:border-slate-800 flex items-center gap-2">
              <Phone className="w-4 h-4 text-slate-400 dark:text-slate-500" />
              <span className="font-medium text-slate-800 dark:text-slate-200">{data.phone}</span>
            </div>
          )}
          {type === 'lead' && data.source && (
            <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
              <span className="text-xs text-slate-500 dark:text-slate-400 block mb-1">منبع</span>
              <span className="font-medium text-slate-800 dark:text-slate-200">{data.source}</span>
            </div>
          )}
          {type === 'lead' && data.status && (
            <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
              <span className="text-xs text-slate-500 dark:text-slate-400 block mb-1">وضعیت قیف</span>
              <span className="font-medium text-blue-700 dark:text-blue-400">{data.status}</span>
            </div>
          )}
          {type === 'customer' && data.type && (
            <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
              <span className="text-xs text-slate-500 dark:text-slate-400 block mb-1">نوع مشتری</span>
              <span className="font-medium text-slate-800 dark:text-slate-200">{data.type}</span>
            </div>
          )}
          {data.totalAmount && (
            <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-100 dark:border-slate-800 flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-slate-400 dark:text-slate-500" />
              <span className="font-medium text-slate-800 dark:text-slate-200">{data.totalAmount.toLocaleString()} ریال</span>
            </div>
          )}
          {data.date && (
            <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-100 dark:border-slate-800 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-slate-400 dark:text-slate-500" />
              <span className="font-medium text-slate-800 dark:text-slate-200">{new Date(data.date).toLocaleDateString('fa-IR')}</span>
            </div>
          )}
        </div>
        
        <div className="bg-blue-50 dark:bg-blue-500/10 text-blue-800 dark:text-blue-400 text-xs p-3 rounded-lg flex justify-between items-center mt-6">
          <span>برای مشاهده صفحه کامل <strong>Enter</strong> را فشار دهید.</span>
          <ExternalLink className="w-4 h-4" />
        </div>
      </div>
    );
  };

  // View Mode = Quick Preview Modal
  if (mode === 'view') {
    return (
      <AnimatePresence>
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={closeModal} className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" />
          <motion.div initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 10 }} className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-lg z-10 overflow-hidden">
            <div className="flex justify-between items-center p-4 border-b border-slate-100 dark:border-slate-800">
              <h2 className="font-bold text-lg text-slate-800 dark:text-slate-100">پیش‌نمایش {entityName}</h2>
              <button onClick={closeModal} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              {renderPreviewContent()}
            </div>
            <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex justify-end gap-3">
              <Button variant="outline" onClick={closeModal}>بستن</Button>
              <Button variant="primary" onClick={() => { closeModal(); router.push(`/${type}s/${entityId}`); }}>
                <ExternalLink className="w-4 h-4 ml-2" />
                صفحه کامل
              </Button>
            </div>
          </motion.div>
        </div>
      </AnimatePresence>
    );
  }

  const renderForm = () => {
    if (mode === 'edit' && loading) return <div className="p-12 flex justify-center"><div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div></div>;
    if (mode === 'edit' && !data) return <div className="p-12 text-center text-slate-500">اطلاعات برای ویرایش یافت نشد.</div>;

    const props = {
      initialData: mode === 'edit' ? data : (mode === 'create' ? contextInitialData : undefined),
      onSuccess: () => {
        closeModal();
        router.refresh();
      },
      onCancel: closeModal
    };

    switch (type) {
      case 'lead': return <LeadForm {...props} />;
      case 'customer': return <CustomerForm {...props} />;
      case 'order': return <OrderForm {...props} />;
      case 'visit': return <VisitForm {...props} />;
      case 'product': return <ProductForm {...props} />;
      case 'user': return <UserForm {...props} />;
      case 'territory': return <TerritoryForm {...props} />;
      case 'presentation': return <PresentationForm {...props} />;
      case 'price-list': return <PriceListForm {...props} />;
      case 'warehouse': return <WarehouseForm {...props} />;
      case 'payment': return <PaymentForm {...props} />;
      case 'cheque': return <ChequeForm {...props} />;
      case 'task': return <TaskForm {...props} />;
      case 'opportunity': return <OpportunityForm {...props} />;
      default: return <div className="text-center text-slate-500">فرم مربوطه یافت نشد.</div>;
    }
  };

  // Create / Edit Mode = SlideOver
  return (
    <SlideOver
      isOpen={isOpen}
      onClose={closeModal}
      title={mode === 'create' ? `ثبت ${entityName} جدید` : `ویرایش ${entityName}`}
    >
      <div className="py-2">
        {renderForm()}
      </div>
    </SlideOver>
  );
}
