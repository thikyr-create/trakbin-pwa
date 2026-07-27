"use client";

import { Building2 } from 'lucide-react';

interface BuildingsPageProps {
  buildings: any[];
}

export default function BuildingsPage({ buildings }: BuildingsPageProps) {
  return (
    <div className="space-y-4">
      <p className="text-sm font-bold text-gray-500 uppercase">{buildings.length} Buildings Registered</p>
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-xs font-black text-gray-500 uppercase">Building ID</th>
                <th className="px-6 py-3 text-xs font-black text-gray-500 uppercase">Address</th>
                <th className="px-6 py-3 text-xs font-black text-gray-500 uppercase">Type</th>
                <th className="px-6 py-3 text-xs font-black text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-xs font-black text-gray-500 uppercase">Payment</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {buildings.map((building: any, idx: number) => (
                <tr key={building.id || idx} className="hover:bg-gray-50 transition-all">
                  <td className="px-6 py-4 text-sm font-black text-gray-900 uppercase">{building.custom_id || 'N/A'}</td>
                  <td className="px-6 py-4 text-sm font-bold text-gray-700 truncate max-w-xs">{building.address || 'No address'}</td>
                  <td className="px-6 py-4 text-sm font-bold text-gray-700">{building.building_type || 'N/A'}</td>
                  <td className="px-6 py-4">
                    <span className={`text-xs font-black px-2 py-1 rounded-full uppercase ${
                      building.status === 'picked_up' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                    }`}>
                      {building.status || 'Pending'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-xs font-black px-2 py-1 rounded-full uppercase ${
                      building.payment_status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {building.payment_status || 'Unpaid'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}