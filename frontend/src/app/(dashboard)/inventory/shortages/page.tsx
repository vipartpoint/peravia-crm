'use client';
import { useState, useEffect } from 'react';
import axios from 'axios';

export default function ShortageRequestsPage() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      const res = await axios.get('/api/inventory/shortage-requests', { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
      setRequests(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const actionRequest = async (id: string, action: string) => {
    try {
      await axios.post(`/api/inventory/shortage-requests/${id}/${action}`, {}, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
      fetchRequests();
    } catch (e: any) {
      alert(e.response?.data?.message || `Error with ${action}`);
    }
  };

  if (loading) return <div>Loading shortage requests...</div>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Inventory Shortage Requests</h1>
      
      <div className="grid gap-4">
        {requests.map((r: any) => (
          <div key={r.id} className="bg-white p-4 rounded-xl border border-red-100 shadow-sm flex items-center justify-between">
            <div>
              <div className="font-medium text-gray-900">Order: {r.order?.orderNumber}</div>
              <div className="text-sm text-gray-500">Product: {r.product?.name} (SKU: {r.product?.sku})</div>
              <div className="mt-2 text-sm">
                <span className="text-red-600 font-medium">Requested: {r.requestedQuantity}</span> | 
                <span className="text-green-600 font-medium ml-2">Available: {r.availableQuantity}</span>
              </div>
              <div className="mt-1 text-xs text-gray-400">Status: {r.status}</div>
            </div>
            
            <div className="flex gap-2">
              {r.status === 'PendingWarehouseManager' && (
                <button onClick={() => actionRequest(r.id, 'warehouse-approve')} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm">WH Approve</button>
              )}
              {r.status === 'PendingProductionManager' && (
                <button onClick={() => actionRequest(r.id, 'production-approve')} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm">Prod Approve</button>
              )}
              {['PendingWarehouseManager', 'PendingProductionManager'].includes(r.status) && (
                <button onClick={() => actionRequest(r.id, 'reject')} className="px-4 py-2 bg-red-100 text-red-600 rounded-lg text-sm">Reject</button>
              )}
            </div>
          </div>
        ))}
        {requests.length === 0 && <div className="text-gray-500">No active shortage requests.</div>}
      </div>
    </div>
  );
}
