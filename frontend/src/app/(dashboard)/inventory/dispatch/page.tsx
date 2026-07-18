'use client';
import { useState, useEffect } from 'react';
import axios from 'axios';

export default function DispatchWorkflowPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const res = await axios.get('/api/dispatch', { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
      setOrders(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const advanceDispatch = async (id: string) => {
    try {
      await axios.post(`/api/dispatch/${id}/advance`, { notes: 'Advanced' }, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
      fetchOrders();
    } catch (e: any) {
      alert(e.response?.data?.message || 'Error advancing');
    }
  };

  const rejectDispatch = async (id: string) => {
    const notes = prompt('Enter rejection reason:');
    if (!notes) return;
    try {
      await axios.post(`/api/dispatch/${id}/reject`, { notes }, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
      fetchOrders();
    } catch (e: any) {
      alert(e.response?.data?.message || 'Error rejecting');
    }
  };

  if (loading) return <div>Loading dispatch queue...</div>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Warehouse Dispatch Workflow</h1>
      
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-50 text-gray-600">
            <tr>
              <th className="px-6 py-4 font-medium">Order #</th>
              <th className="px-6 py-4 font-medium">Customer</th>
              <th className="px-6 py-4 font-medium">Current Stage</th>
              <th className="px-6 py-4 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {orders.map((o: any) => (
              <tr key={o.id} className="hover:bg-gray-50/50">
                <td className="px-6 py-4 font-medium text-gray-900">{o.orderNumber}</td>
                <td className="px-6 py-4">{o.customer?.name}</td>
                <td className="px-6 py-4">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {o.dispatchStatus}
                  </span>
                </td>
                <td className="px-6 py-4 space-x-2">
                  <button onClick={() => advanceDispatch(o.id)} className="text-white bg-indigo-600 hover:bg-indigo-700 px-3 py-1.5 rounded-lg text-xs transition-colors">
                    Approve & Advance
                  </button>
                  <button onClick={() => rejectDispatch(o.id)} className="text-red-600 hover:text-red-700 hover:bg-red-50 px-3 py-1.5 rounded-lg text-xs transition-colors">
                    Reject / Return
                  </button>
                </td>
              </tr>
            ))}
            {orders.length === 0 && (
              <tr>
                <td colSpan={4} className="px-6 py-8 text-center text-gray-500">No orders in dispatch queue</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
