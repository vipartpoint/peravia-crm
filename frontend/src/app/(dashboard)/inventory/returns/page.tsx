'use client';
import { useState } from 'react';
import axios from 'axios';

export default function ReturnsPage() {
  const [formData, setFormData] = useState({
    warehouseId: '',
    productId: '',
    orderId: '',
    quantity: 1,
    condition: 'Sellable'
  });

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    try {
      await axios.post('/api/inventory/return', formData, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
      alert('Return processed successfully');
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to process return');
    }
  };

  return (
    <div className="p-6 max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">Process Return / QC Inspection</h1>
      
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Order ID</label>
          <input type="text" className="w-full p-2 border rounded-lg" required value={formData.orderId} onChange={e => setFormData({...formData, orderId: e.target.value})} />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Warehouse ID</label>
          <input type="text" className="w-full p-2 border rounded-lg" required value={formData.warehouseId} onChange={e => setFormData({...formData, warehouseId: e.target.value})} />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Product ID</label>
          <input type="text" className="w-full p-2 border rounded-lg" required value={formData.productId} onChange={e => setFormData({...formData, productId: e.target.value})} />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Quantity</label>
          <input type="number" min="1" className="w-full p-2 border rounded-lg" required value={formData.quantity} onChange={e => setFormData({...formData, quantity: Number(e.target.value)})} />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">QC Decision</label>
          <select className="w-full p-2 border rounded-lg" value={formData.condition} onChange={e => setFormData({...formData, condition: e.target.value as any})}>
            <option value="Sellable">Accept (Return to Inventory)</option>
            <option value="Waste">Reject (Move to Waste)</option>
          </select>
        </div>
        
        <button type="submit" className="w-full py-2.5 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700">
          Process Return
        </button>
      </form>
    </div>
  );
}
