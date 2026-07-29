"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import { ArrowLeft, Building2, MapPin, Calendar, CreditCard, Truck, LogOut, Globe, Users } from 'lucide-react';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export default function BuildingPage() {
  const router = useRouter();
  const [buildingId, setBuildingId] = useState('');
  const [building, setBuilding] = useState<any>(null);
  const [schedule, setSchedule] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedCaretaker = localStorage.getItem('trakbin_caretaker');
    if (storedCaretaker) {
      const data = JSON.parse(storedCaretaker);
      setBuildingId(data.custom_id);
      fetchBuildingData(data.custom_id);
    } else { router.push('/auth'); }
  }, [router]);

  const fetchBuildingData = async (bId: string) => {
    const { data: buildingData } = await supabase.from('Buildings').select('*').eq('custom_id', bId).single();
    const { data: scheduleData } = await supabase.from('collection_schedules').select('*').eq('building_id', bId).single();
    if (buildingData) setBuilding(buildingData);
    if (scheduleData) setSchedule(scheduleData);
    setLoading(false);
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-white"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div></div>;
  if (!building) return null;

  return (
    <div className="min-h-screen bg-gray-50/50 font-sans">
      <header className="bg-white border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <button onClick={() => router.push('/caretaker-dashboard')} className="p-2 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-lg transition-all"><ArrowLeft size={20} /></button>
              <div className="flex items-center gap-2"><div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center"><span className="text-white font-bold text-xl">T</span></div><span className="text-xl font-bold text-gray-900 tracking-tight">Trakbin</span></div>
            </div>
            <button onClick={() => router.push('/')} className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"><LogOut size={16} /> Logout</button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* FLOATING HEADER */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-8 flex items-center gap-4 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-green-50 to-transparent opacity-50"></div>
          <div className="relative z-10 flex items-center gap-4">
            <div className="bg-green-600 p-3 rounded-xl shadow-lg shadow-green-200"><Building2 className="w-6 h-6 text-white" /></div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Building Profile</h1>
              <p className="text-sm text-gray-500 font-medium">Complete information for {building.custom_id}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 mb-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-green-50 rounded-full blur-3xl opacity-50 -translate-y-1/2 translate-x-1/2"></div>
          <div className="relative z-10">
            <div className="flex items-start justify-between mb-6">
              <div className="bg-green-50 p-4 rounded-2xl"><Building2 className="w-8 h-8 text-green-600" /></div>
              <span className="bg-green-50 text-green-700 text-sm font-medium px-3 py-1 rounded-full flex items-center gap-1.5 border border-green-100"><span className="w-1.5 h-1.5 rounded-full bg-green-500"></span> Active</span>
            </div>
            <p className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-1">Building ID</p>
            <h2 className="text-4xl font-bold tracking-tight text-gray-900 mb-2">{building.custom_id}</h2>
            <p className="text-xl font-bold text-gray-700 mb-6">{building.building_type}</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-gray-100">
              <div><p className="text-xs font-bold text-gray-500 uppercase mb-2 flex items-center gap-2"><MapPin className="w-4 h-4" /> Official Address</p><p className="text-base font-bold text-gray-900">{building.address || 'Address not provided'}</p></div>
              <div><p className="text-xs font-bold text-gray-500 uppercase mb-2 flex items-center gap-2"><Globe className="w-4 h-4" /> GPS Coordinates</p><p className="text-base font-bold text-gray-900 font-mono">{building.latitude?.toFixed(6)}, {building.longitude?.toFixed(6)}</p></div>
              <div><p className="text-xs font-bold text-gray-500 uppercase mb-2 flex items-center gap-2"><Users className="w-4 h-4" /> Units</p><p className="text-base font-bold text-gray-900">{building.number_of_units || 1} {building.unit_type || 'Unit'}(s)</p></div>
              <div><p className="text-xs font-bold text-gray-500 uppercase mb-2 flex items-center gap-2"><Calendar className="w-4 h-4" /> Registered</p><p className="text-base font-bold text-gray-900">{building.created_at ? new Date(building.created_at).toLocaleDateString() : 'Recently'}</p></div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center gap-3 mb-4"><div className="bg-green-50 p-2 rounded-lg"><Truck className="w-5 h-5 text-green-600" /></div><h3 className="text-lg font-bold text-gray-900">Collection Schedule</h3></div>
            <div className="space-y-4">
              <div><p className="text-xs font-bold text-gray-500 uppercase mb-1">Next Pickup</p><p className="text-base font-bold text-gray-900">{schedule?.next_pickup_date ? new Date(schedule.next_pickup_date).toLocaleDateString() : 'Not scheduled'}</p></div>
              <div><p className="text-xs font-bold text-gray-500 uppercase mb-1">Time Window</p><p className="text-base font-bold text-gray-900">{schedule?.time_window || 'TBD'}</p></div>
              <div><p className="text-xs font-bold text-gray-500 uppercase mb-1">Frequency</p><p className="text-base font-bold text-gray-900">{schedule?.frequency || 'Weekly'}</p></div>
            </div>
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center gap-3 mb-4"><div className="bg-green-50 p-2 rounded-lg"><CreditCard className="w-5 h-5 text-green-600" /></div><h3 className="text-lg font-bold text-gray-900">Payment Summary</h3></div>
            <div className="space-y-4">
              <div><p className="text-xs font-bold text-gray-500 uppercase mb-1">Status</p><p className={`text-base font-bold ${building.payment_status === 'paid' ? 'text-green-600' : 'text-red-600'}`}>{building.payment_status === 'paid' ? 'Up to Date' : 'Outstanding Balance'}</p></div>
              <div><p className="text-xs font-bold text-gray-500 uppercase mb-1">Wallet Balance</p><p className="text-base font-bold text-gray-900">₦{building.wallet_balance?.toLocaleString() || 0}</p></div>
              <button onClick={() => router.push('/caretaker/payment')} className="w-full mt-2 py-2 bg-green-50 text-green-600 font-bold rounded-lg hover:bg-green-100 transition-all text-sm">View Invoices & Pay</button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}