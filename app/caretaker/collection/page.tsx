"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import { ArrowLeft, Truck, Calendar, CheckCircle2, AlertCircle, XCircle, LogOut, MapPin } from 'lucide-react';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export default function CollectionPage() {
  const router = useRouter();
  const [buildingId, setBuildingId] = useState('');
  const [schedule, setSchedule] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedCaretaker = localStorage.getItem('trakbin_caretaker');
    if (storedCaretaker) {
      const data = JSON.parse(storedCaretaker);
      setBuildingId(data.custom_id);
      fetchCollectionData(data.custom_id);
    } else { router.push('/auth'); }
  }, [router]);

  const fetchCollectionData = async (bId: string) => {
    const { data: scheduleData } = await supabase.from('collection_schedules').select('*').eq('building_id', bId).single();
    const { data: historyData } = await supabase.from('collections').select('*').eq('building_id', bId).order('collection_date', { ascending: false }).limit(10);
    if (scheduleData) setSchedule(scheduleData);
    if (historyData) setHistory(historyData);
    setLoading(false);
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-white"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div></div>;

  const getStatusIcon = () => {
    if (schedule?.status === 'delayed') return <AlertCircle className="w-5 h-5 text-orange-600" />;
    if (schedule?.status === 'missed') return <XCircle className="w-5 h-5 text-red-600" />;
    return <CheckCircle2 className="w-5 h-5 text-green-600" />;
  };

  const getStatusBadge = () => {
    if (schedule?.status === 'delayed') return { text: 'Delayed', bg: 'bg-orange-50 text-orange-700 border-orange-200' };
    if (schedule?.status === 'missed') return { text: 'Missed', bg: 'bg-red-50 text-red-700 border-red-200' };
    return { text: 'Scheduled', bg: 'bg-green-50 text-green-700 border-green-200' };
  };

  const badge = getStatusBadge();

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
            <div className="bg-green-600 p-3 rounded-xl shadow-lg shadow-green-200"><Truck className="w-6 h-6 text-white" /></div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Collection Details</h1>
              <p className="text-sm text-gray-500 font-medium">Schedule and history for Building {buildingId}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 mb-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-green-50 rounded-full blur-3xl opacity-50 -translate-y-1/2 translate-x-1/2"></div>
          <div className="relative z-10">
            <div className="flex items-start justify-between mb-6">
              <div className="bg-green-50 p-4 rounded-2xl"><Truck className="w-8 h-8 text-green-600" /></div>
              <span className={`text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5 border ${badge.bg}`}>{getStatusIcon()} {badge.text}</span>
            </div>
            <p className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-2">Next Pickup</p>
            <h2 className="text-4xl font-bold tracking-tight text-gray-900 mb-2">{schedule?.next_pickup_date ? new Date(schedule.next_pickup_date).toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long' }) : 'No Date Set'}</h2>
            <p className="text-xl font-bold text-gray-700 mb-6">{schedule?.time_window || 'Time TBD'}</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6 border-t border-gray-100">
              <div><p className="text-xs font-bold text-gray-500 uppercase mb-1">Frequency</p><p className="text-base font-bold text-gray-900">{schedule?.frequency || 'Weekly'}</p></div>
              <div><p className="text-xs font-bold text-gray-500 uppercase mb-1">Waste Type</p><p className="text-base font-bold text-gray-900">{schedule?.waste_type || 'General'}</p></div>
              <div><p className="text-xs font-bold text-gray-500 uppercase mb-1">Service Status</p><p className="text-base font-bold text-green-600">Active</p></div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-8 py-6 border-b border-gray-100 flex items-center justify-between"><h2 className="text-lg font-bold text-gray-900 flex items-center gap-2"><Calendar className="w-5 h-5 text-green-600" /> Collection History</h2><span className="text-sm font-bold text-gray-700">{history.length} Total</span></div>
          <div className="divide-y divide-gray-100">
            {history.length > 0 ? history.map((item, index) => (
              <div key={index} className="px-8 py-5 flex items-center justify-between hover:bg-gray-50/50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-green-50 rounded-lg"><CheckCircle2 className="w-5 h-5 text-green-600" /></div>
                  <div><p className="text-sm font-bold text-gray-900">{new Date(item.collection_date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p><p className="text-xs text-gray-700 font-semibold mt-0.5 flex items-center gap-1"><MapPin size={12} /> {item.hauler_name || 'Trakbin Hauler'}</p></div>
                </div>
                <span className="text-xs font-bold text-green-700 bg-green-100 px-3 py-1 rounded-full uppercase">{item.status || 'Completed'}</span>
              </div>
            )) : <div className="px-8 py-12 text-center text-gray-700 font-bold">No collection history yet.</div>}
          </div>
        </div>
      </main>
    </div>
  );
}