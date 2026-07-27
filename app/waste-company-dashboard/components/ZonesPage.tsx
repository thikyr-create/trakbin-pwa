"use client";

import { Globe, Building2 } from 'lucide-react';

interface ZonesPageProps {
  buildings: any[];
  onSelectZone: (zone: any) => void;
}

export default function ZonesPage({ buildings, onSelectZone }: ZonesPageProps) {
  const zones = [
    { 
      id: 'zone-a', 
      name: 'Zone A', 
      state: 'Rivers State', 
      town: 'Port Harcourt', 
      type: 'Estate', 
      description: 'Mainland residential and commercial estate coverage', 
      buildings: buildings?.filter((b: any) => b.zone === 'A' || b.address?.toLowerCase().includes('port harcourt')).length || 245, 
      trucks: 2, 
      progress: 82 
    },
    { 
      id: 'zone-b', 
      name: 'Zone B', 
      state: 'Rivers State', 
      town: 'GRA', 
      type: 'Community', 
      description: 'Government Reserved Area community coverage', 
      buildings: buildings?.filter((b: any) => b.zone === 'B' || b.address?.toLowerCase().includes('gra')).length || 132, 
      trucks: 1, 
      progress: 61 
    },
    { 
      id: 'zone-c', 
      name: 'Zone C', 
      state: 'Rivers State', 
      town: 'Trans Amadi', 
      type: 'Industrial', 
      description: 'Industrial layout and warehouse coverage', 
      buildings: buildings?.filter((b: any) => b.zone === 'C' || b.address?.toLowerCase().includes('trans amadi')).length || 89, 
      trucks: 1, 
      progress: 45 
    },
  ];

  return (
    <div className="space-y-4">
      <div className="bg-gradient-to-br from-green-600 to-green-700 rounded-xl p-6 text-white">
        <h2 className="text-xl font-black uppercase mb-1">Zone Management</h2>
        <p className="text-green-100 text-sm font-bold">Click any zone to view detailed buildings and coverage information</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {zones.map((zone, idx) => (
          <div 
            key={idx} 
            onClick={() => onSelectZone(zone)} 
            className="bg-white rounded-xl border-2 border-green-200 p-5 hover:shadow-lg hover:border-green-400 transition-all cursor-pointer"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <Globe className="w-6 h-6 text-green-600" />
              </div>
              <span className="text-xs font-black px-2 py-1 rounded-full uppercase bg-green-100 text-green-700">
                {zone.progress}%
              </span>
            </div>
            <h3 className="text-xl font-black text-gray-900 uppercase">{zone.name}</h3>
            <p className="text-xs font-bold text-gray-500 uppercase mt-1">{zone.town}, {zone.state}</p>
            <div className="mt-2">
              <span className={`text-xs font-black px-2 py-1 rounded-full uppercase ${
                zone.type === 'Estate' ? 'bg-purple-100 text-purple-700' : 
                zone.type === 'Community' ? 'bg-blue-100 text-blue-700' : 
                'bg-orange-100 text-orange-700'
              }`}>
                {zone.type}
              </span>
            </div>
            <div className="mt-3 pt-3 border-t border-green-100 space-y-2">
              <div className="flex justify-between">
                <span className="text-xs font-black text-gray-500 uppercase">Buildings</span>
                <span className="text-xs font-black text-green-600">{zone.buildings}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs font-black text-gray-500 uppercase">Trucks</span>
                <span className="text-xs font-black text-green-600">{zone.trucks}</span>
              </div>
              <div className="w-full bg-green-50 rounded-full h-2 mt-2">
                <div className="bg-green-600 h-2 rounded-full" style={{ width: `${zone.progress}%` }} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}