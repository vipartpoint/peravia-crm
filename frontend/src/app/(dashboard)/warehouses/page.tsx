'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Plus, Edit, Archive, Power, MapPin, CheckCircle, XCircle, ArrowRight } from 'lucide-react';
import { api } from '@/services/api';

export default function WarehousesPage() {
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    api.get('/auth/me').then(res => setUser(res.user)).catch(console.error);
    loadWarehouses();
  }, []);

  const loadWarehouses = async () => {
    try {
      const data = await api.get('/warehouses?all=true');
      if (Array.isArray(data)) setWarehouses(data);
    } catch (e) {
      console.error(e);
    }
  };

  const toggleStatus = async (id: string, currentStatus: boolean) => {
    try {
      await api.post(`/warehouses/${id}/${currentStatus ? 'deactivate' : 'activate'}`, {});
      loadWarehouses();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">Warehouses</h1>
          <p className="text-sm text-gray-500 mt-1">Manage network of physical locations and inventory centers.</p>
        </div>
        {['SystemAdmin', 'WarehouseManager', 'FactoryManager'].includes(user?.role?.name || '') && (
          <Button onClick={() => alert('Open Create Modal (Not Implemented for MVP snippet)')} className="bg-indigo-600 hover:bg-indigo-700">
            <Plus className="w-4 h-4 mr-2" /> Add Warehouse
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {warehouses.map(wh => (
          <Card key={wh.id} className="relative overflow-hidden group hover:shadow-lg transition-shadow border-gray-200">
            <div className={`absolute top-0 left-0 w-1 h-full ${wh.isActive ? 'bg-green-500' : 'bg-red-500'}`} />
            <CardHeader className="pb-3 border-b border-gray-100 bg-gray-50/50">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg font-medium text-gray-900">{wh.name}</CardTitle>
                  <span className="text-xs font-mono text-gray-500 bg-gray-100 px-2 py-1 rounded-md mt-2 inline-block">
                    {wh.code}
                  </span>
                </div>
                <div className="flex items-center space-x-1">
                  <span className={`px-2 py-1 text-[10px] font-semibold rounded-full ${wh.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {wh.isActive ? 'ACTIVE' : 'INACTIVE'}
                  </span>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500 text-xs">Type</p>
                  <p className="font-medium text-gray-900 mt-0.5">{wh.type?.replace('Warehouse', '') || 'Central'}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs">Manager</p>
                  <p className="font-medium text-gray-900 mt-0.5">{wh.manager?.name || 'Unassigned'}</p>
                </div>
              </div>

              {wh.location && (
                <div className="flex items-start text-sm text-gray-600 bg-gray-50 p-2 rounded-md">
                  <MapPin className="w-4 h-4 mr-2 mt-0.5 text-gray-400 shrink-0" />
                  <span className="line-clamp-2">{wh.location}</span>
                </div>
              )}

              <div className="pt-4 border-t border-gray-100 flex justify-between items-center">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => router.push(`/warehouses/${wh.id}`)}
                  className="text-indigo-600 border-indigo-200 hover:bg-indigo-50"
                >
                  View Detail <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
                
                {['SystemAdmin', 'WarehouseManager', 'FactoryManager'].includes(user?.role?.name || '') && (
                  <div className="flex space-x-2">
                    <Button variant="ghost" size="icon" onClick={() => toggleStatus(wh.id, wh.isActive)} className={wh.isActive ? 'text-red-500 hover:bg-red-50 hover:text-red-600' : 'text-green-500 hover:bg-green-50 hover:text-green-600'}>
                      <Power className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
