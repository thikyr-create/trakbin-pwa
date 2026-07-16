"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import { ArrowLeft, Calendar, CheckCircle2, AlertCircle, LogOut, MapPin } from 'lucide-react';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export default function CollectionHistoryPage() {
  const router = useRouter();
  const [buildingId, setBuildingId] = useState('');
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedCaretaker = localStorage.getItem('trakbin_caretaker');
    if (storedCaretaker) {
      const data = JSON.parse(storedCaretaker);
      setBuildingId(data.custom_id);
      fetchHistory(data.custom_id);
    } else { router.push('/auth'); }
  }, [router]);

  const fetchHistory = async (bId: string) => {
    const { data: historyData } = await supabase.from('collections').select('*').eq('building_id', bId).order('collection_date', { ascending: false });
    if (historyData) setHistory(historyData);
    setLoading(false);
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-white"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div></div>;

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
            <div className="bg-green-600 p-3 rounded-xl shadow-lg shadow-green-200"><Calendar className="w-6 h-6 text-white" /></div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Collection History</h1>
              <p className="text-sm text-gray-500 font-medium">Chronological record for Building {buildingId}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-8 py-6 border-b border-gray-100 flex items-center justify-between"><h2 className="text-lg font-bold text-gray-900 flex items-center gap-2"><Calendar className="w-5 h-5 text-green-600" /> All Collections</h2><span className="text-sm font-bold text-gray-700">{history.length} Total</span></div>
          <div className="divide-y divide-gray-100">
            {history.length > 0 ? history.map((item, index) => (
              <div key={index} className="px-8 py-6 flex items-center justify-between hover:bg-gray-50/50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className={`p-2 rounded-lg ${item.status === 'completed' ? 'bg-green-50' : 'bg-orange-50'}`}>{item.status === 'completed' ? <CheckCircle2 className="w-5 h-5 text-green-600" /> : <AlertCircle className="w-5 h-5 text-orange-600" />}</div>
                  <div><p className="text-sm font-bold text-gray-900">{new Date(item.collection_date).toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p><p className="text-xs text-gray-700 font-semibold mt-0.5 flex items-center gap-1"><MapPin size={12} /> {item.hauler_name || 'Trakbin Hauler'} • Residential Waste</p></div>
                </div>
                <span className={`text-xs font-bold px-3 py-1 rounded-full uppercase ${item.status === 'completed' ? 'text-green-700 bg-green-100' : 'text-orange-700 bg-orange-100'}`}>{item.status || 'Completed'}</span>
              </div>
            )) : <div className="px-8 py-12 text-center text-gray-700 font-bold">No collection history yet.</div>}
          </div>
        </div>
      </main>
    </div>
  );
}