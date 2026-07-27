"use client";

import { Truck, Users, Globe } from 'lucide-react';

interface AssignmentsPageProps {
  trucks: any[];
  drivers: any[];
}

export default function AssignmentsPage({ trucks, drivers }: AssignmentsPageProps) {
  return (
    <div className="space-y-4">
      <div className="bg-gradient-to-br from-green-600 to-green-700 rounded-xl p-6 text-white">
        <h2 className="text-xl font-black uppercase mb-1">Dispatch Center</h2>
        <p className="text-green-100 text-sm font-bold">Assign trucks, drivers, and zones</p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <h3 className="text-xs font-black text-gray-900 uppercase mb-3 flex items-center gap-2">
            <Truck className="w-4 h-4 text-green-600" /> Trucks
          </h3>
          <div className="space-y-2">
            {trucks.filter((t: any) => t.status === 'active').map((truck: any) => (
              <div 
                key={truck.id} 
                className="p-3 bg-gray-50 rounded-lg border border-gray-200 hover:border-green-500 cursor-pointer transition-all"
              >
                <p className="text-xs font-black text-gray-900 uppercase">{truck.truck_id}</p>
                <p className="text-xs font-bold text-gray-500">{truck.driver_name || 'No Driver'}</p>
              </div>
            ))}
          </div>
        </div>
        
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <h3 className="text-xs font-black text-gray-900 uppercase mb-3 flex items-center gap-2">
            <Users className="w-4 h-4 text-purple-600" /> Drivers
          </h3>
          <div className="space-y-2">
            {drivers.map((driver: any) => (
              <div 
                key={driver.id} 
                className="p-3 bg-gray-50 rounded-lg border border-gray-200 hover:border-purple-500 cursor-pointer transition-all"
              >
                <p className="text-xs font-black text-gray-900 uppercase">{driver.full_name}</p>
                <p className="text-xs font-bold text-gray-500">{driver.employee_id}</p>
              </div>
            ))}
          </div>
        </div>
        
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <h3 className="text-xs font-black text-gray-900 uppercase mb-3 flex items-center gap-2">
            <Globe className="w-4 h-4 text-blue-600" /> Zones
          </h3>
          <div className="space-y-2">
            {['Zone A - Port Harcourt', 'Zone B - GRA', 'Zone C - Trans Amadi'].map((zone, idx) => (
              <div 
                key={idx} 
                className="p-3 bg-gray-50 rounded-lg border border-gray-200 hover:border-blue-500 cursor-pointer transition-all"
              >
                <p className="text-xs font-black text-gray-900 uppercase">{zone}</p>
                <p className="text-xs font-bold text-gray-500">{12 + idx * 5} Buildings</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}