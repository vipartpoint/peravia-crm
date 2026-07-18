'use client';

import React, { useEffect, useState } from 'react';
import { api } from '@/services/api';
import { useGlobalEntity } from '@/contexts/GlobalEntityContext';
import { Button } from '@/components/ui/Button';
import { Plus, LayoutGrid, List, AlertCircle, Clock, Target } from 'lucide-react';
import { Skeleton } from '@/components/ui/Skeleton';
import Link from 'next/link';
import { SlideOver } from '@/components/ui/SlideOver';
import { DataTable } from '@/components/ui/DataTable'; 
import { useToast } from '@/components/ui/Toast';
import { useCatalog } from '@/hooks/useCatalog';
import { CustomSelect } from '@/components/ui/CustomSelect';

const KANBAN_STAGES = [
  { id: 'Suspect', label: 'مظنون (Suspect)', color: 'border-slate-300', bg: 'bg-slate-100 dark:bg-slate-800' },
  { id: 'Prospect', label: 'محتمل (Prospect)', color: 'border-blue-300', bg: 'bg-blue-50 dark:bg-blue-900/20' },
  { id: 'Analysis', label: 'تحلیل (Analysis)', color: 'border-indigo-300', bg: 'bg-indigo-50 dark:bg-indigo-900/20' },
  { id: 'Negotiate', label: 'مذاکره (Negotiate)', color: 'border-amber-300', bg: 'bg-amber-50 dark:bg-amber-900/20' },
  { id: 'Close', label: 'بستن قرارداد (Close)', color: 'border-orange-300', bg: 'bg-orange-50 dark:bg-orange-900/20' },
  { id: 'Order', label: 'سفارش (Order)', color: 'border-teal-300', bg: 'bg-teal-50 dark:bg-teal-900/20' },
  { id: 'Payment', label: 'پرداخت (Payment)', color: 'border-emerald-300', bg: 'bg-emerald-50 dark:bg-emerald-900/20' }
];

export default function OpportunitiesPage() {
  const [opportunities, setOpportunities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'kanban' | 'table'>('kanban');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Open' | 'Won' | 'Lost'>('Open');
  const { openCreate } = useGlobalEntity();
  const { toast } = useToast();
  
  // Catalog Data
  const { data: lostReasons } = useCatalog('lost-reasons');
  const { data: reopenReasons } = useCatalog('reopen-reasons');
  const { data: competitors } = useCatalog('competitors');

  // Modal States
  const [lostModalOpen, setLostModalOpen] = useState(false);
  const [pendingLostOppId, setPendingLostOppId] = useState<string | null>(null);
  const [lostReason, setLostReason] = useState('');
  const [competitorName, setCompetitorName] = useState('');

  const [reopenModalOpen, setReopenModalOpen] = useState(false);
  const [pendingReopenOppId, setPendingReopenOppId] = useState<string | null>(null);
  const [reopenReason, setReopenReason] = useState('');

  const fetchOpportunities = async () => {
    try {
      const data = await api.get('/opportunities');
      setOpportunities(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOpportunities();
  }, []);

  const handleDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData('opportunityId', id);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault(); // Necessary to allow dropping
  };

  const handleDrop = async (e: React.DragEvent, targetStage: string) => {
    e.preventDefault();
    const id = e.dataTransfer.getData('opportunityId');
    if (!id) return;

    const opp = opportunities.find(o => o.id === id);
    // salesStage or stage depending on API response. API now returns salesStage.
    if (!opp || (opp.salesStage || opp.stage) === targetStage) return;

    if (opp.status === 'Lost' || opp.status === 'Won') {
       toast({ type: 'error', title: 'غیرمجاز', description: 'فرصت بسته شده قابل جابجایی نیست' });
       return;
    }

    // Optimistic UI update
    setOpportunities(prev => prev.map(o => o.id === id ? { ...o, salesStage: targetStage, stage: targetStage } : o));

    try {
      await api.patch(`/opportunities/${id}`, { salesStage: targetStage });
      const stageLabel = KANBAN_STAGES.find(s => s.id === targetStage)?.label || targetStage;
      toast({ type: 'success', title: 'موفقیت', description: `فرصت فروش با موفقیت به مرحله ${stageLabel} منتقل شد` });
      fetchOpportunities(); // refresh
    } catch (err: any) {
      console.error('DnD Error:', err.response?.data || err);
      toast({ type: 'error', title: 'خطا در تغییر مرحله', description: err.response?.data?.message || 'خطای سرور' });
      fetchOpportunities(); // rollback
    }
  };

  const handleLostSubmit = async () => {
    if (!pendingLostOppId || !lostReason) return;
    try {
      await api.patch(`/opportunities/${pendingLostOppId}`, {
        status: 'Lost',
        lostReason,
        competitorName
      });
      setLostModalOpen(false);
      setPendingLostOppId(null);
      setLostReason('');
      setCompetitorName('');
      toast({ type: 'success', title: 'موفقیت', description: 'علت شکست ثبت شد و وضعیت فرصت به Lost تغییر یافت' });
      fetchOpportunities();
    } catch (err: any) {
      toast({ type: 'error', title: 'خطا', description: err.response?.data?.message || 'خطا در ثبت علت شکست' });
    }
  };

  const handleReopenSubmit = async () => {
    if (!pendingReopenOppId || !reopenReason) return;
    try {
      await api.patch(`/opportunities/${pendingReopenOppId}`, {
        status: 'Open',
        reopenReason
      });
      setReopenModalOpen(false);
      setPendingReopenOppId(null);
      setReopenReason('');
      toast({ type: 'success', title: 'موفقیت', description: 'فرصت مجددا باز شد' });
      fetchOpportunities();
    } catch (err: any) {
      toast({ type: 'error', title: 'خطا', description: err.response?.data?.message || 'خطا در باز کردن مجدد' });
    }
  };

  const handleStatusChange = async (id: string, status: string) => {
    try {
      await api.patch(`/opportunities/${id}`, { status });
      toast({ type: 'success', title: 'موفقیت', description: `وضعیت با موفقیت به ${status} تغییر یافت` });
      fetchOpportunities();
    } catch (err: any) {
      toast({ type: 'error', title: 'خطا', description: err.response?.data?.message || 'خطا در تغییر وضعیت' });
    }
  };

  const isOverdue = (dateString: string) => {
    if (!dateString) return false;
    return new Date(dateString).getTime() < new Date().getTime();
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto min-h-screen flex flex-col h-full">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">فرصت‌های فروش</h1>
          <p className="text-slate-500 text-sm mt-1">مدیریت معاملات و پیگیری پیش‌بینی‌ها (SPANCOP)</p>
        </div>
        <div className="flex items-center gap-3">
          <CustomSelect
            value={statusFilter}
            onChange={(val) => setStatusFilter(val as any)}
            options={[
              { value: 'All', label: 'همه موارد' },
              { value: 'Open', label: 'فقط Open' },
              { value: 'Won', label: 'فقط Won' },
              { value: 'Lost', label: 'فقط Lost' }
            ]}
            className="w-40"
          />
          <div className="bg-slate-100 dark:bg-slate-800 p-1 rounded-lg flex items-center">
            <button onClick={() => setViewMode('kanban')} className={`p-1.5 rounded-md transition ${viewMode === 'kanban' ? 'bg-white dark:bg-slate-700 shadow-sm text-indigo-600' : 'text-slate-500'}`}>
              <LayoutGrid className="w-5 h-5" />
            </button>
            <button onClick={() => setViewMode('table')} className={`p-1.5 rounded-md transition ${viewMode === 'table' ? 'bg-white dark:bg-slate-700 shadow-sm text-indigo-600' : 'text-slate-500'}`}>
              <List className="w-5 h-5" />
            </button>
          </div>
          <Button variant="primary" onClick={() => openCreate('opportunity')} className="shadow-lg shadow-indigo-500/20">
            <Plus className="w-5 h-5 ml-2" /> فرصت جدید
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex gap-4 overflow-x-auto">
          {[1,2,3,4].map(i => <Skeleton key={i} className="w-80 h-[600px] flex-shrink-0 rounded-2xl" />)}
        </div>
      ) : viewMode === 'kanban' ? (
        <div className="flex-1 overflow-x-auto overflow-y-hidden pb-4">
          <div className="flex gap-4 h-full min-h-[600px]">
            {KANBAN_STAGES.map(stage => {
              const stageOpps = opportunities.filter(o => {
                const sStage = o.salesStage || o.stage;
                if (sStage !== stage.id) return false;
                if (statusFilter !== 'All' && o.status !== statusFilter) return false;
                return true;
              });
              return (
                <div 
                  key={stage.id} 
                  className={`w-80 flex-shrink-0 rounded-2xl border ${stage.color} ${stage.bg} flex flex-col max-h-[80vh]`}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, stage.id)}
                >
                  <div className="p-4 border-b border-slate-200/50 dark:border-slate-700/50 flex justify-between items-center">
                    <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200">{stage.label}</h3>
                    <span className="bg-white/50 dark:bg-slate-800/50 px-2 py-0.5 rounded-full text-xs font-bold">{stageOpps.length}</span>
                  </div>
                  
                  <div className="p-3 flex-1 overflow-y-auto space-y-3 custom-scrollbar">
                    {stageOpps.length === 0 && (
                      <div className="h-24 flex items-center justify-center text-slate-400 text-xs font-medium border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl">
                        ستون خالی
                      </div>
                    )}
                    {stageOpps.map(opp => (
                      <div 
                        key={opp.id} 
                        draggable 
                        onDragStart={(e) => handleDragStart(e, opp.id)}
                        className="bg-white dark:bg-slate-900 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 cursor-grab active:cursor-grabbing hover:border-indigo-300 transition-colors"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <Link href={`/opportunities/${opp.id}`} className="font-bold text-sm text-slate-800 dark:text-slate-100 hover:text-indigo-600">
                            {opp.name}
                          </Link>
                          {isOverdue(opp.followUpDate) && (
                            <span className="flex items-center text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded text-[10px] font-bold">
                              <AlertCircle className="w-3 h-3 ml-0.5" /> تاخیر
                            </span>
                          )}
                        </div>
                        
                        <div className="text-xs text-slate-500 mb-3 font-medium">
                          {opp.customer?.name || 'بدون مشتری'}
                        </div>
                        
                        <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                          <div className="font-bold text-slate-800 dark:text-slate-200 text-sm">
                            {(Number(opp.totalEstimatedValue) || 0).toLocaleString()} <span className="text-[10px] font-normal text-slate-500">ریال</span>
                          </div>
                          <div className="flex items-center gap-2">
                            {opp.status === 'Won' && <span className="text-xs bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded font-bold">موفق</span>}
                            {opp.status === 'Lost' && <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-500 px-1.5 py-0.5 rounded font-medium">شکست</span>}
                            {opp.status === 'Open' && (
                               <span className="flex items-center text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded text-xs font-bold">
                                 <Target className="w-3 h-3 ml-1" /> {opp.probability}%
                               </span>
                            )}
                          </div>
                        </div>

                        {opp.status === 'Open' && (
                          <div className="flex gap-2 mt-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                            {stage.id === 'Payment' && (
                              <button onClick={() => handleStatusChange(opp.id, 'Won')} className="flex-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 py-1 rounded text-xs font-bold transition">پیروزی</button>
                            )}
                            <button onClick={() => { setPendingLostOppId(opp.id); setLostModalOpen(true); }} className="flex-1 bg-rose-50 hover:bg-rose-100 text-rose-600 py-1 rounded text-xs font-bold transition">شکست</button>
                          </div>
                        )}
                        {opp.status === 'Lost' && (
                          <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                             <button onClick={() => { setPendingReopenOppId(opp.id); setReopenModalOpen(true); }} className="w-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 py-1 rounded text-xs font-bold transition">باز کردن مجدد</button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-4">
          <DataTable 
            entityType="opportunity"
            columns={[
              { key: 'name', label: 'نام فرصت', render: (val: string, row: any) => <Link href={`/opportunities/${row.id}`} className="font-bold text-indigo-600 hover:underline">{val}</Link> },
              { key: 'customer', label: 'مشتری', render: (val: any) => val?.name || '---' },
              { key: 'stage', label: 'مرحله', render: (val: string, row: any) => <span className="px-2 py-1 bg-slate-100 rounded text-xs font-bold">{row.salesStage || val}</span> },
              { key: 'status', label: 'وضعیت', render: (val: string) => {
                if(val === 'Won') return <span className="text-xs bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded font-bold">موفق</span>;
                if(val === 'Lost') return <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-500 px-1.5 py-0.5 rounded font-medium">شکست</span>;
                return <span className="text-xs bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded font-bold">باز</span>;
              }},
              { key: 'probability', label: 'احتمال', render: (val: number) => `${val}%` },
              { key: 'totalEstimatedValue', label: 'ارزش (ریال)', render: (val: number) => (Number(val) || 0).toLocaleString() }
            ]}
            data={opportunities}
            totalItems={opportunities.length}
            currentPage={1}
            onPageChange={() => {}}
            onRefresh={fetchOpportunities}
          />
        </div>
      )}

      {/* Lost Reason Modal */}
      <SlideOver isOpen={lostModalOpen} onClose={() => { setLostModalOpen(false); fetchOpportunities(); }} title="اعلام شکست فرصت فروش">
        <div className="p-4 space-y-4">
          <CustomSelect
            label="دلیل شکست *"
            value={lostReason}
            onChange={setLostReason}
            options={lostReasons.map(r => ({ value: r.code, label: r.nameFa }))}
            placeholder="انتخاب دلیل..."
          />
          <CustomSelect
            label="نام رقیب (اختیاری)"
            value={competitorName}
            onChange={setCompetitorName}
            options={competitors.map(c => ({ value: c.code, label: c.nameFa }))}
            placeholder="انتخاب رقیب..."
          />
          <div className="pt-4 flex justify-end gap-2">
            <Button variant="outline" onClick={() => { setLostModalOpen(false); fetchOpportunities(); }}>انصراف</Button>
            <Button variant="primary" onClick={handleLostSubmit} className="bg-rose-600 hover:bg-rose-700" disabled={!lostReason}>ثبت شکست</Button>
          </div>
        </div>
      </SlideOver>

      {/* Reopen Reason Modal */}
      <SlideOver isOpen={reopenModalOpen} onClose={() => { setReopenModalOpen(false); fetchOpportunities(); }} title="باز کردن مجدد فرصت">
        <div className="p-4 space-y-4">
          <CustomSelect
            label="دلیل باز کردن مجدد *"
            value={reopenReason}
            onChange={setReopenReason}
            options={reopenReasons.map(r => ({ value: r.code, label: r.nameFa }))}
            placeholder="انتخاب دلیل..."
          />
          <div className="pt-4 flex justify-end gap-2">
            <Button variant="outline" onClick={() => { setReopenModalOpen(false); fetchOpportunities(); }}>انصراف</Button>
            <Button variant="primary" onClick={handleReopenSubmit} disabled={!reopenReason}>باز کردن</Button>
          </div>
        </div>
      </SlideOver>
    </div>
  );
}
