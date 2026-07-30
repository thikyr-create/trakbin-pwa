"use client";
import { Phone, MessageCircle, Mail, MapPin, CheckCircle2 } from 'lucide-react';
import { useCaretakerSession } from '@/lib/store/useCaretakerSession';

export default function MyWasteProviderCard() {
  const { activeAssignment, companyProfile } = useCaretakerSession();

  if (!activeAssignment || !companyProfile) return null;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-green-100 p-6 mb-8">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold text-gray-900 uppercase flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-green-600" /> Your Waste Service Provider
        </h3>
        <span className="bg-green-50 text-green-700 text-xs font-bold px-3 py-1 rounded-full">Active</span>
      </div>

      <div className="flex items-center gap-4 mb-6">
        <div className="w-12 h-12 bg-green-600 rounded-xl flex items-center justify-center text-white font-black text-xl">
          {companyProfile.business_name?.charAt(0) || 'C'}
        </div>
        <div>
          <p className="text-xl font-black text-gray-900">{companyProfile.business_name}</p>
          <p className="text-sm text-gray-500 font-medium">Zone: {activeAssignment.zone_id || 'Standard'}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="bg-gray-50 rounded-xl p-4">
          <p className="text-xs font-bold text-gray-500 uppercase mb-1">Collection Days</p>
          <p className="text-sm font-bold text-gray-900">{activeAssignment.pickup_days?.join(', ') || 'Not set'}</p>
        </div>
        <div className="bg-gray-50 rounded-xl p-4">
          <p className="text-xs font-bold text-gray-500 uppercase mb-1">Time Window</p>
          <p className="text-sm font-bold text-gray-900">{activeAssignment.time_window || 'Not set'}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <button className="flex items-center justify-center gap-2 py-2.5 bg-green-50 text-green-700 font-bold rounded-xl hover:bg-green-100 text-sm">
          <Phone size={16} /> Call
        </button>
        <button className="flex items-center justify-center gap-2 py-2.5 bg-green-50 text-green-700 font-bold rounded-xl hover:bg-green-100 text-sm">
          <MessageCircle size={16} /> WhatsApp
        </button>
        <button className="flex items-center justify-center gap-2 py-2.5 bg-gray-50 text-gray-700 font-bold rounded-xl hover:bg-gray-100 text-sm">
          <Mail size={16} /> Email
        </button>
        <button className="flex items-center justify-center gap-2 py-2.5 bg-gray-50 text-gray-700 font-bold rounded-xl hover:bg-gray-100 text-sm">
          <MapPin size={16} /> Office
        </button>
      </div>
    </div>
  );
}