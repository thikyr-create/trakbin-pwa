"use client";

import { Wrench } from 'lucide-react';

interface MaintenancePageProps {
  trucks: any[];
}

export default function MaintenancePage({ trucks }: MaintenancePageProps) {
  return (
    <div className="space-y-4">
      <div className="bg-gradient-to-br from-orange-600 to-orange-700 rounded-xl p-6 text-white">
        <h2 className="text-xl font-black uppercase mb-1">Fleet Maintenance</h2>
        <p className="text-orange-100 text-sm font-bold">Track and manage vehicle maintenance schedules</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {trucks.map((truck: any) => (
          <div key={truck.id} className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-lg transition-all">
            <div className="flex items-start justify-between mb-3">
              <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                <Wrench className="w-5 h-5 text-orange-600" />
              </div>
              <span className={`text-xs font-black px-2 py-1 rounded-full uppercase ${
                truck.status === 'maintenance' ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700'
              }`}>
                {truck.status === 'maintenance' ? 'In Maintenance' : 'Healthy'}
              </span>
            </div>
            <h3 className="text-lg font-black text-gray-900 uppercase">{truck.truck_id}</h3>
            <p className="text-xs font-bold text-gray-500 uppercase mt-1">{truck.license_plate}</p>
            <div className="mt-3 pt-3 border-t border-gray-100 space-y-2">
              <div className="flex justify-between">
                <span className="text-xs font-black text-gray-500 uppercase">Driver</span>
                <span className="text-xs font-bold text-gray-900">{truck.driver_name || 'Unassigned'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs font-black text-gray-500 uppercase">Type</span>
                <span className="text-xs font-bold text-gray-900">{truck.truck_type || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs font-black text-gray-500 uppercase">Next Inspection</span>
                <span className="text-xs font-bold text-orange-600">15 days</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}