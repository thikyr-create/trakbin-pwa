"use client";

import { useState } from 'react';
import { X } from 'lucide-react';

interface AddTruckModalProps {
  isOpen: boolean;
  onClose: () => void;
  companyName: string;
  onSubmit: (formData: any) => Promise<{ success: boolean; message: string; truckId?: string }>;
}

export default function AddTruckModal({ isOpen, onClose, companyName, onSubmit }: AddTruckModalProps) {
  const [form, setForm] = useState({ license_plate: '', driver_name: '', truck_type: 'Compactor', capacity: '', status: 'active' });
  const [isSaving, setIsSaving] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    
    const result = await onSubmit(form);
    
    if (result.success) {
      setForm({ license_plate: '', driver_name: '', truck_type: 'Compactor', capacity: '', status: 'active' }); // Reset form
      alert(result.message);
      onClose();
    } else {
      alert('Error: ' + result.message);
    }
    
    setIsSaving(false);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1000] p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-black text-gray-900 uppercase">Register Truck</h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg"><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">License Plate</label>
            <input type="text" required value={form.license_plate} onChange={(e) => setForm({...form, license_plate: e.target.value})} className="w-full px-4 py-3 bg-white border-2 border-gray-300 rounded-xl font-bold text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none" placeholder="ABC-123" />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Driver Name</label>
            <input type="text" value={form.driver_name} onChange={(e) => setForm({...form, driver_name: e.target.value})} className="w-full px-4 py-3 bg-white border-2 border-gray-300 rounded-xl font-bold text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none" placeholder="John Doe" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Type</label>
              <select value={form.truck_type} onChange={(e) => setForm({...form, truck_type: e.target.value})} className="w-full px-4 py-3 bg-white border-2 border-gray-300 rounded-xl font-bold text-gray-900 focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none">
                <option>Compactor</option>
                <option>Open Truck</option>
                <option>Skip Loader</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Status</label>
              <select value={form.status} onChange={(e) => setForm({...form, status: e.target.value})} className="w-full px-4 py-3 bg-white border-2 border-gray-300 rounded-xl font-bold text-gray-900 focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none">
                <option value="active">Active</option>
                <option value="idle">Idle</option>
                <option value="maintenance">Maintenance</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Capacity</label>
            <input type="text" value={form.capacity} onChange={(e) => setForm({...form, capacity: e.target.value})} className="w-full px-4 py-3 bg-white border-2 border-gray-300 rounded-xl font-bold text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none" placeholder="10 Tons" />
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-3">
            <p className="text-xs font-bold text-blue-900">ℹ️ Truck ID will be auto-generated after submission.</p>
          </div>
          <button type="submit" disabled={isSaving} className="w-full py-3.5 bg-green-600 text-white font-black rounded-xl hover:bg-green-700 transition-all uppercase tracking-wide disabled:bg-gray-400">
            {isSaving ? 'Saving...' : 'Save Truck'}
          </button>
        </form>
      </div>
    </div>
  );
}