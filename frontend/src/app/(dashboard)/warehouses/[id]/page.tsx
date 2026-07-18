'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ArrowLeft, Package, Clock, RefreshCcw, TrendingDown, Layers, CheckCircle2 } from 'lucide-react';
import { api } from '@/services/api';

export default function WarehouseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const unwrappedParams = use(params);
  const id = unwrappedParams.id;
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  
  const [warehouse, setWarehouse] = useState<any>(null);
  const [summary, setSummary] = useState<any>(null);
  const [transfers, setTransfers] = useState<any[]>([]);

  useEffect(() => {
    api.get('/auth/me').then(res => setUser(res.user)).catch(console.error);
    if (id) {
      loadData();
    }
  }, [id]);

  const loadData = async () => {
    try {
      const whData = await api.get(`/warehouses/${id}`);
      setWarehouse(whData);

      const sumData = await api.get(`/inventory-reports/summary?warehouseId=${id}`);
      setSummary(sumData);

      const transData = await api.get(`/transfers`);
      if (Array.isArray(transData)) {
        setTransfers(transData.filter(t => t.sourceWarehouseId === id || t.destWarehouseId === id));
      }
    } catch (e) {
      console.error(e);
    }
  };

  if (!warehouse) return <div className="p-8 text-center text-gray-500 animate-pulse">Loading warehouse data...</div>;

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()} className="text-gray-500 hover:text-gray-900">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 flex items-center">
            {warehouse.name}
            <span className={`ml-3 px-2 py-0.5 text-xs rounded-full font-medium ${warehouse.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
              {warehouse.isActive ? 'Active' : 'Inactive'}
            </span>
          </h1>
          <p className="text-sm text-gray-500 mt-1">{warehouse.type} • {warehouse.code} • Managed by {warehouse.manager?.name || 'Unassigned'}</p>
        </div>
      </div>

      {/* Metrics Row */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-indigo-50 to-white border-indigo-100">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-indigo-100 rounded-lg text-indigo-600"><Layers className="w-5 h-5" /></div>
                <div>
                  <p className="text-sm text-gray-500 font-medium">Real Stock</p>
                  <p className="text-2xl font-semibold text-indigo-900">{summary.totalReal}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-emerald-50 to-white border-emerald-100">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-emerald-100 rounded-lg text-emerald-600"><CheckCircle2 className="w-5 h-5" /></div>
                <div>
                  <p className="text-sm text-gray-500 font-medium">Available</p>
                  <p className="text-2xl font-semibold text-emerald-900">{summary.totalAvailable}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-amber-50 to-white border-amber-100">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-amber-100 rounded-lg text-amber-600"><Clock className="w-5 h-5" /></div>
                <div>
                  <p className="text-sm text-gray-500 font-medium">Reserved</p>
                  <p className="text-2xl font-semibold text-amber-900">{summary.totalReserved}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-rose-50 to-white border-rose-100">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-rose-100 rounded-lg text-rose-600"><TrendingDown className="w-5 h-5" /></div>
                <div>
                  <p className="text-sm text-gray-500 font-medium">Returns / Waste</p>
                  <p className="text-2xl font-semibold text-rose-900">
                    {summary.returnsAndWaste?.reduce((acc: number, val: any) => acc + Number(val._sum.quantity), 0) || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Breakdown */}
        <Card className="shadow-sm">
          <CardHeader className="bg-gray-50/50 border-b border-gray-100">
            <CardTitle className="text-lg font-medium text-gray-900 flex items-center">
              <Package className="w-5 h-5 mr-2 text-indigo-500" />
              Stock by Category
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {summary?.byCategory?.length > 0 ? (
              <div className="divide-y divide-gray-100">
                {summary.byCategory.map((cat: any, idx: number) => (
                  <div key={idx} className="flex justify-between items-center p-4 hover:bg-gray-50 transition-colors">
                    <div className="font-medium text-gray-700">{cat.category}</div>
                    <div className="text-right">
                      <div className="text-sm font-semibold text-gray-900">{cat.real} Real</div>
                      <div className="text-xs text-gray-500">{cat.available} Avail | {cat.reserved} Res</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-gray-500">No stock data available.</div>
            )}
          </CardContent>
        </Card>

        {/* Transfers */}
        <Card className="shadow-sm">
          <CardHeader className="bg-gray-50/50 border-b border-gray-100">
            <CardTitle className="text-lg font-medium text-gray-900 flex items-center">
              <RefreshCcw className="w-5 h-5 mr-2 text-blue-500" />
              Recent Transfers
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {transfers.length > 0 ? (
              <div className="divide-y divide-gray-100">
                {transfers.map(tr => {
                  const isIncoming = tr.destWarehouseId === id;
                  return (
                    <div key={tr.id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                      <div className="flex items-center space-x-3">
                        <div className={`p-2 rounded-full ${isIncoming ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                          <RefreshCcw className={`w-4 h-4 ${isIncoming ? '' : 'rotate-180'}`} />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{tr.product?.name || 'Product'} (x{tr.quantity})</p>
                          <p className="text-xs text-gray-500 mt-0.5">
                            {isIncoming ? `From ${tr.sourceWarehouse?.name}` : `To ${tr.destWarehouse?.name}`}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-700`}>
                          {tr.status}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-8 text-center text-gray-500 text-sm">No transfer records found.</div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
