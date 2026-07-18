'use client';

import React, { useState } from 'react';
import { api } from '@/services/api';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line
} from 'recharts';
import { 
  Filter, Download, Printer, Settings2, BarChart2, PieChart as PieChartIcon, 
  TrendingUp, Table as TableIcon, FileSpreadsheet, Loader2 
} from 'lucide-react';

const COLORS = ['#4f46e5', '#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6'];

export function CustomSalesReportBuilder() {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>(null);
  
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    stage: '',
    status: '',
    salespersonId: '',
    territoryId: '',
    customerId: '',
    productId: '',
    lostReason: '',
    competitor: '',
    probabilityPreset: '',
  });

  const [groupBy, setGroupBy] = useState('Stage');
  const [chartType, setChartType] = useState<'Bar' | 'Line' | 'Pie'>('Bar');

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  const fetchReport = async () => {
    setLoading(true);
    try {
      const payload: any = { groupBy };
      
      if (filters.startDate && filters.endDate) {
        payload.dateRange = { start: filters.startDate, end: filters.endDate };
      }
      if (filters.stage) payload.stage = filters.stage;
      if (filters.status) payload.status = filters.status;
      if (filters.lostReason) payload.lostReason = filters.lostReason;
      if (filters.competitor) payload.competitor = filters.competitor;
      
      if (filters.probabilityPreset) {
        const [min, max] = filters.probabilityPreset.split('-').map(Number);
        payload.probabilityRange = [min, max];
      }

      const res = await api.post('/opportunities/reports/custom', payload);
      setData(res);
    } catch (e) {
      console.error(e);
      alert('خطا در دریافت گزارش اختصاصی');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    if (!data || !data.rawData) return;
    const headers = ['ID', 'Name', 'Stage', 'Status', 'Probability', 'Value', 'Volume', 'Customer', 'Owner', 'Territory', 'Created At'];
    const rows = data.rawData.map((row: any) => [
      row.id,
      `"${row.name}"`,
      row.stage,
      row.status,
      row.probability,
      row.value,
      row.volume,
      `"${row.customer || ''}"`,
      `"${row.owner || ''}"`,
      `"${row.territory || ''}"`,
      new Date(row.createdAt).toLocaleDateString('fa-IR')
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map((r: any) => r.join(','))
    ].join('\n');

    const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `sales_report_${Date.now()}.csv`;
    link.click();
  };

  return (
    <div className="mt-12 border-t border-slate-200 dark:border-slate-700 pt-12" id="custom-report-builder">
      <div className="mb-8 flex items-center justify-between print:hidden">
        <div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Settings2 className="w-6 h-6 text-indigo-600" /> گزارش‌ساز اختصاصی
          </h2>
          <p className="text-slate-500 text-sm mt-1">ساخت گزارش‌های پویا با فیلترهای ترکیبی (Live Data)</p>
        </div>
      </div>

      {/* Filters Form - Hidden in Print */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm mb-8 print:hidden">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1">از تاریخ</label>
            <input type="date" name="startDate" value={filters.startDate} onChange={handleFilterChange} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-primary" />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1">تا تاریخ</label>
            <input type="date" name="endDate" value={filters.endDate} onChange={handleFilterChange} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-primary" />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1">مرحله (Stage)</label>
            <select name="stage" value={filters.stage} onChange={handleFilterChange} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-primary">
              <option value="">همه</option>
              <option value="Lead">Lead</option>
              <option value="Qualified">Qualified</option>
              <option value="Proposal">Proposal</option>
              <option value="Negotiation">Negotiation</option>
              <option value="Won">Won</option>
              <option value="Lost">Lost</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1">وضعیت (Status)</label>
            <select name="status" value={filters.status} onChange={handleFilterChange} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-primary">
              <option value="">همه</option>
              <option value="Open">Open</option>
              <option value="Won">Won</option>
              <option value="Lost">Lost</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1">احتمال (Probability)</label>
            <select name="probabilityPreset" value={filters.probabilityPreset} onChange={handleFilterChange} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-primary">
              <option value="">همه</option>
              <option value="0-25">0% تا 25%</option>
              <option value="25-50">25% تا 50%</option>
              <option value="50-75">50% تا 75%</option>
              <option value="75-100">75% تا 100%</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1">دلیل شکست</label>
            <input type="text" name="lostReason" value={filters.lostReason} onChange={handleFilterChange} placeholder="مثال: Price" className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-primary" />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1">رقیب</label>
            <input type="text" name="competitor" value={filters.competitor} onChange={handleFilterChange} placeholder="نام رقیب" className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-primary" />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1">گروه‌بندی براساس</label>
            <select value={groupBy} onChange={(e) => setGroupBy(e.target.value)} className="w-full bg-indigo-50 border border-indigo-200 text-indigo-700 font-bold rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-500">
              <option value="Stage">مرحله فروش</option>
              <option value="Product">محصول</option>
              <option value="Month">ماه</option>
              <option value="Salesperson">کارشناس فروش</option>
              <option value="Territory">منطقه</option>
              <option value="Customer">مشتری</option>
              <option value="Competitor">رقیب</option>
              <option value="LostReason">دلیل شکست</option>
            </select>
          </div>
        </div>

        <div className="flex justify-between items-center border-t border-slate-100 pt-4">
          <div className="flex gap-2">
            <button onClick={() => setChartType('Bar')} className={`px-3 py-1.5 rounded-md text-sm flex items-center gap-1 ${chartType === 'Bar' ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600'}`}>
              <BarChart2 className="w-4 h-4" /> میله‌ای
            </button>
            <button onClick={() => setChartType('Line')} className={`px-3 py-1.5 rounded-md text-sm flex items-center gap-1 ${chartType === 'Line' ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600'}`}>
              <TrendingUp className="w-4 h-4" /> خطی
            </button>
            <button onClick={() => setChartType('Pie')} className={`px-3 py-1.5 rounded-md text-sm flex items-center gap-1 ${chartType === 'Pie' ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600'}`}>
              <PieChartIcon className="w-4 h-4" /> دایره‌ای
            </button>
          </div>
          <button onClick={fetchReport} disabled={loading} className="bg-primary text-white px-6 py-2 rounded-lg font-bold flex items-center gap-2 hover:bg-primary/90 transition-all">
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Filter className="w-5 h-5" />}
            تولید گزارش
          </button>
        </div>
      </div>

      {data && (
        <div className="report-results bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 print:border-none print:shadow-none print:p-0">
          <div className="flex justify-between items-center mb-6 print:hidden">
            <h3 className="text-xl font-bold text-slate-800">نتایج گزارش</h3>
            <div className="flex gap-3">
              <button onClick={handlePrint} className="text-slate-600 hover:text-slate-900 border border-slate-200 bg-white px-4 py-2 rounded-lg font-medium flex items-center gap-2">
                <Printer className="w-4 h-4" /> چاپ
              </button>
              <button onClick={handleExportCSV} className="bg-emerald-50 text-emerald-600 border border-emerald-200 hover:bg-emerald-100 px-4 py-2 rounded-lg font-medium flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4" /> خروجی CSV
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4 mb-8">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
              <p className="text-[10px] text-slate-500 font-bold mb-1">ارزش کل (Pipeline)</p>
              <p className="text-sm font-black">{(data.kpis.totalPipelineValue / 1000000).toLocaleString()} <span className="text-[10px] font-normal">M</span></p>
            </div>
            <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100">
              <p className="text-[10px] text-indigo-500 font-bold mb-1">ارزش موزون</p>
              <p className="text-sm font-black text-indigo-700">{(data.kpis.weightedForecast / 1000000).toLocaleString()} <span className="text-[10px] font-normal">M</span></p>
            </div>
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
              <p className="text-[10px] text-slate-500 font-bold mb-1">حجم پتانسیل</p>
              <p className="text-sm font-black">{(data.kpis.potentialVolume).toLocaleString()}</p>
            </div>
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
              <p className="text-[10px] text-slate-500 font-bold mb-1">تعداد فرصت‌ها</p>
              <p className="text-sm font-black">{data.kpis.opportunityCount}</p>
            </div>
            <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100">
              <p className="text-[10px] text-emerald-600 font-bold mb-1">Win Rate</p>
              <p className="text-sm font-black text-emerald-700">{data.kpis.winRate}%</p>
            </div>
            <div className="bg-rose-50 p-4 rounded-xl border border-rose-100">
              <p className="text-[10px] text-rose-600 font-bold mb-1">Lost Rate</p>
              <p className="text-sm font-black text-rose-700">{data.kpis.lossRate}%</p>
            </div>
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
              <p className="text-[10px] text-slate-500 font-bold mb-1">سایز میانگین</p>
              <p className="text-sm font-black">{(data.kpis.avgDealSize / 1000000).toLocaleString()} <span className="text-[10px] font-normal">M</span></p>
            </div>
            <div className="bg-amber-50 p-4 rounded-xl border border-amber-100">
              <p className="text-[10px] text-amber-600 font-bold mb-1">چرخه فروش (روز)</p>
              <p className="text-sm font-black text-amber-700">{data.kpis.avgSalesCycle}</p>
            </div>
          </div>

          <div className="h-[400px] w-full mb-8 border border-slate-100 rounded-xl p-4 bg-white" dir="ltr">
            <ResponsiveContainer>
              {chartType === 'Bar' ? (
                <BarChart data={data.chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tickFormatter={v => (v/1000000) + 'M'} tick={{ fontSize: 12 }} />
                  <RechartsTooltip cursor={{ fill: '#f8fafc' }} formatter={(val: any) => [val.toLocaleString('fa-IR') + ' ریال', 'مبلغ']}/>
                  <Legend />
                  <Bar dataKey="value" name="ارزش (ریال)" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                </BarChart>
              ) : chartType === 'Line' ? (
                <LineChart data={data.chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tickFormatter={v => (v/1000000) + 'M'} tick={{ fontSize: 12 }} />
                  <RechartsTooltip formatter={(val: any) => val ? val.toLocaleString() : ''} />
                  <Legend />
                  <Line type="monotone" dataKey="value" name="ارزش (ریال)" stroke="#4f46e5" strokeWidth={3} />
                </LineChart>
              ) : (
                <PieChart>
                  <Pie data={data.chartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={150} label>
                    {data.chartData.map((_: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip formatter={(val: any) => val ? val.toLocaleString() : ''} />
                  <Legend />
                </PieChart>
              )}
            </ResponsiveContainer>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-200 print:border-none print:shadow-none">
            <table className="w-full text-sm text-right">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 font-bold text-slate-500">مشتری</th>
                  <th className="px-4 py-3 font-bold text-slate-500">عنوان فرصت</th>
                  <th className="px-4 py-3 font-bold text-slate-500">مرحله</th>
                  <th className="px-4 py-3 font-bold text-slate-500">ارزش (ریال)</th>
                  <th className="px-4 py-3 font-bold text-slate-500">احتمال</th>
                  <th className="px-4 py-3 font-bold text-slate-500">کارشناس</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.rawData.map((row: any) => (
                  <tr key={row.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium text-slate-800">{row.customer || '-'}</td>
                    <td className="px-4 py-3 text-slate-600">{row.name}</td>
                    <td className="px-4 py-3">
                      <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded text-xs font-medium">{row.stage}</span>
                    </td>
                    <td className="px-4 py-3 font-medium">{row.value.toLocaleString()}</td>
                    <td className="px-4 py-3 text-slate-600">{row.probability}%</td>
                    <td className="px-4 py-3 text-slate-600">{row.owner || '-'}</td>
                  </tr>
                ))}
                {data.rawData.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-slate-400">بدون رکورد</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #custom-report-builder, #custom-report-builder * {
            visibility: visible;
          }
          #custom-report-builder {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
}
