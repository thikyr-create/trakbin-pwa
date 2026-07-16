"use client";

import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export default function OperationsDashboard() {
  const [trucks, setTrucks] = useState<any[]>([]);
  const [buildings, setBuildings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const { data: truckData } = await supabase.from('trucks').select('*');
      setTrucks(truckData || []);

      const { data: buildingData } = await supabase.from('Buildings').select('*').order('created_at', { ascending: false });
      setBuildings(buildingData || []);
      setLoading(false);
    };
    fetchData();
  }, []);

  const markAsPickedUp = async (customId: string) => {
    const { error } = await supabase.from('Buildings').update({ status: 'picked_up' }).eq('custom_id', customId);
    if (!error) {
      setBuildings(buildings.map(b => b.custom_id === customId ? { ...b, status: 'picked_up' } : b));
    }
  };

  const markAsPaid = async (customId: string) => {
    const { error } = await supabase.from('Buildings').update({ payment_status: 'paid' }).eq('custom_id', customId);
    if (!error) {
      setBuildings(buildings.map(b => b.custom_id === customId ? { ...b, payment_status: 'paid' } : b));
    }
  };

  if (loading) return <div className="p-8 text-center">Loading Operations Dashboard...</div>;

  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">Trakbin Hauler Operations</h1>

        <section className="mb-10">
          <h2 className="text-xl font-semibold text-gray-700 mb-4 border-b pb-2">Active Fleet Registry</h2>
          {trucks.length === 0 ? (
            <p className="text-gray-500">No trucks registered yet.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {trucks.map((truck) => (
                <div key={truck.truck_id} className="bg-white p-4 rounded-lg shadow border border-gray-200">
                  <h3 className="font-bold text-lg text-orange-600">{truck.truck_id}</h3>
                  <p className="text-sm text-gray-600">{truck.business_name}</p>
                  <p className="text-xs text-gray-400 mt-1">{truck.truck_type} | {truck.license_plate}</p>
                </div>
              ))}
            </div>
          )}
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-700 mb-4 border-b pb-2">Node Collection Ledger</h2>
          {buildings.length === 0 ? (
            <p className="text-gray-500">No nodes registered yet.</p>
          ) : (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Node ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Address</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Payment</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {buildings.map((building) => (
                    <tr key={building.custom_id}>
                      <td className="px-6 py-4 font-medium">{building.custom_id}</td>
                      <td className="px-6 py-4 text-sm text-gray-500">{building.building_type}</td>
                      <td className="px-6 py-4 text-sm text-gray-500">{building.address}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 text-xs rounded-full ${building.status === 'picked_up' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                          {building.status === 'picked_up' ? 'Picked Up' : 'Pending'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {building.payment_status !== 'paid' ? (
                          <button onClick={() => markAsPaid(building.custom_id)} className="text-green-600 hover:text-green-900 font-bold">Mark Paid</button>
                        ) : (
                          <span className="text-green-500 font-bold">PAID</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {building.status !== 'picked_up' ? (
                          <button onClick={() => markAsPickedUp(building.custom_id)} className="text-blue-600 hover:text-blue-900 font-bold">Mark Picked Up</button>
                        ) : (
                          <span className="text-gray-400">Completed</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}