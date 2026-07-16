"use client";

import { useState } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export default function ResidentPortal() {
  const [buildingId, setBuildingId] = useState('');
  const [passcode, setPasscode] = useState('');
  const [buildingData, setBuildingData] = useState<any>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const { data, error } = await supabase
      .from('Buildings')
      .select('*')
      .eq('custom_id', buildingId)
      .eq('passcode', passcode)
      .single();

    if (error || !data) {
      setError('Invalid Building ID or Passcode.');
      setBuildingData(null);
    } else {
      setBuildingData(data);
    }
    setLoading(false);
  };

  if (buildingData) {
    return (
      <main className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-md mx-auto">
          <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-xl font-bold text-gray-800">Trakbin Audit Portal</h1>
              <button onClick={() => setBuildingData(null)} className="text-sm text-blue-600 hover:underline">Logout</button>
            </div>
            <div className="bg-blue-50 p-4 rounded-lg mb-6 border border-blue-100">
              <h2 className="text-2xl font-bold text-blue-900">Building {buildingData.custom_id}</h2>
              <p className="text-sm text-blue-700">{buildingData.building_type}</p>
            </div>
            <div className="space-y-4">
              <div className="flex justify-between border-b pb-2">
                <span className="text-gray-500">Address</span>
                <span className="font-medium text-gray-800 text-right">{buildingData.address}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-gray-500">Payment</span>
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${buildingData.payment_status === 'paid' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                  {buildingData.payment_status === 'paid' ? 'PAID' : 'UNPAID'}
                </span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-gray-500">Collection Status</span>
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${buildingData.status === 'picked_up' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                  {buildingData.status === 'picked_up' ? 'COLLECTED' : 'PENDING'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8 bg-gray-50">
      <div className="w-full max-w-md bg-white p-8 rounded-xl shadow-lg border border-gray-200">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Resident Transparency Portal</h1>
        <p className="text-gray-500 mb-6 text-sm">Enter your Building ID and Passcode to view audit logs.</p>
        <form onSubmit={handleLogin} className="space-y-4">
          <input type="text" placeholder="Building ID (e.g., 12b)" value={buildingId} onChange={(e) => setBuildingId(e.target.value)} required className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-purple-500 outline-none" />
          <input type="password" placeholder="Passcode" value={passcode} onChange={(e) => setPasscode(e.target.value)} required className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-purple-500 outline-none" />
          <button type="submit" disabled={loading} className="w-full p-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-bold text-lg">
            {loading ? 'Verifying...' : 'View Building Audit'}
          </button>
        </form>
        {error && <p className="mt-4 text-center text-sm font-medium text-red-600">{error}</p>}
      </div>
    </main>
  );
}