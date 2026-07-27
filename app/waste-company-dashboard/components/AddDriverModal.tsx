"use client";

import { useState } from 'react';
import { X } from 'lucide-react';

interface AddDriverModalProps {
  isOpen: boolean;
  onClose: () => void;
  companyName: string;
  onSubmit: (formData: any) => Promise<{ success: boolean; message: string; employeeId?: string; password?: string }>;
}

export default function AddDriverModal({ isOpen, onClose, companyName, onSubmit }: AddDriverModalProps) {
  const [form, setForm] = useState({ full_name: '', email: '', phone: '', license_number: '' });
  const [isSaving, setIsSaving] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    
    const result = await onSubmit(form);
    
    if (result.success) {
      setForm({ full_name: '', email: '', phone: '', license_number: '' }); // Reset form
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
          <h3 className="text-xl font-black text-gray-900 uppercase">Register Driver</h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg"><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Full Name</label>
            <input type="text" required value={form.full_name} onChange={(e) => setForm({...form, full_name: e.target.value})} className="w-full px-4 py-3 bg-white border-2 border-gray-300 rounded-xl font-bold text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none" placeholder="John Doe" />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Email</label>
            <input type="email" required value={form.email} onChange={(e) => setForm({...form, email: e.target.value})} className="w-full px-4 py-3 bg-white border-2 border-gray-300 rounded-xl font-bold text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none" placeholder="driver@trakbin.com" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Phone</label>
              <input type="text" value={form.phone} onChange={(e) => setForm({...form, phone: e.target.value})} className="w-full px-4 py-3 bg-white border-2 border-gray-300 rounded-xl font-bold text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none" placeholder="+234..." />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">License</label>
              <input type="text" value={form.license_number} onChange={(e) => setForm({...form, license_number: e.target.value})} className="w-full px-4 py-3 bg-white border-2 border-gray-300 rounded-xl font-bold text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none" placeholder="LIC-123" />
            </div>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-3">
            <p className="text-xs font-bold text-blue-900">ℹ️ Employee ID and Password will be auto-generated after submission.</p>
          </div>
          <button type="submit" disabled={isSaving} className="w-full py-3.5 bg-green-600 text-white font-black rounded-xl hover:bg-green-700 transition-all uppercase tracking-wide disabled:bg-gray-400">
            {isSaving ? 'Creating...' : 'Create Driver'}
          </button>
        </form>
      </div>
    </div>
  );
}