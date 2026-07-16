"use client";

import { useState } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export default function RegisterTruck() {
  const [truckId, setTruckId] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [truckType, setTruckType] = useState('Compactor');
  const [licensePlate, setLicensePlate] = useState('');
  const [status, setStatus] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('Registering Truck to Fleet...');

    const { error } = await supabase.from('trucks').insert([
      {
        truck_id: truckId,
        business_name: businessName,
        truck_type: truckType,
        license_plate: licensePlate,
      },
    ]);

    if (error) {
      setStatus('Error: ' + error.message);
    } else {
      setStatus(`Success! ${truckId} is now active in the Trakbin Ledger.`);
      setTruckId(''); setBusinessName(''); setLicensePlate('');
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8 bg-gray-50">
      <div className="w-full max-w-md bg-white p-8 rounded-xl shadow-lg border border-gray-200">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Trakbin Fleet Registry</h1>
        <p className="text-gray-500 mb-6 text-sm">Add a new vehicle to your waste company's active fleet.</p>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <input 
            type="text" placeholder="Truck ID (e.g., TRK-01)" value={truckId} 
            onChange={(e) => setTruckId(e.target.value)} required
            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
          />

          <input 
            type="text" placeholder="Business Name" value={businessName} 
            onChange={(e) => setBusinessName(e.target.value)} required
            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
          />

          <select 
            value={truckType} onChange={(e) => setTruckType(e.target.value)}
            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-orange-500 outline-none bg-white"
          >
            <option>Compactor</option>
            <option>Open-back Truck</option>
            <option>Mini-truck / Tuk-tuk</option>
            <option>Recycling Van</option>
          </select>

          <input 
            type="text" placeholder="License Plate Number" value={licensePlate} 
            onChange={(e) => setLicensePlate(e.target.value)} required
            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
          />

          <button 
            type="submit"
            className="w-full p-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 font-bold text-lg"
          >
            Register Truck
          </button>
        </form>

        {status && <p className="mt-4 text-center text-sm font-medium text-gray-700">{status}</p>}
      </div>
    </main>
  );
}