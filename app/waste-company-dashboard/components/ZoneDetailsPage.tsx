"use client";

import { Building2, CheckCircle2, Clock, AlertTriangle, Search, ArrowLeft } from 'lucide-react';

interface ZoneDetailsPageProps {
  zone: any;
  buildings: any[];
  onBack: () => void;
}

export default function ZoneDetailsPage({ zone, buildings, onBack }: ZoneDetailsPageProps) {
  const zoneBuildings = buildings?.filter((b: any) => {
    if (zone.id === 'zone-a') return b.zone === 'A' || b.address?.toLowerCase().includes('port harcourt');
    if (zone.id === 'zone-b') return b.zone === 'B' || b.address?.toLowerCase().includes('gra');
    if (zone.id === 'zone-c') return b.zone === 'C' || b.address?.toLowerCase().includes('trans amadi');
    return false;
  }) || [];
  
  const completedBuildings = zoneBuildings.filter((b: any) => b.status === 'picked_up').length;
  const pendingBuildings = zoneBuildings.length - completedBuildings;
  const unpaidBuildings = zoneBuildings.filter((b: any) => b.payment_status === 'unpaid').length;

  return (
    <div className="space-y-4">
      <button onClick={onBack} className="flex items-center gap-2 text-sm font-bold text-gray-600 hover:text-green-600 transition-all">
        <ArrowLeft size={18} /> Back to Zones
      </button>
      
      <div className="bg-gradient-to-r from-green-600 to-green-700 rounded-xl p-6 text-white">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
              <Globe className="w-8 h-8 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-black uppercase">{zone.name}</h2>
              <p className="text-sm font-bold text-green-100">{zone.town}, {zone.state}</p>
              <div className="mt-2">
                <span className={`text-xs font-black px-2 py-1 rounded-full uppercase ${
                  zone.type === 'Estate' ? 'bg-purple-500 text-white' : 
                  zone.type === 'Community' ? 'bg-blue-500 text-white' : 
                  'bg-orange-500 text-white'
                }`}>
                  {zone.type}
                </span>
              </div>
            </div>
          </div>
          <div className="text-right">
            <p className="text-4xl font-black">{zone.progress}%</p>
            <p className="text-xs font-bold text-green-100 uppercase">Coverage</p>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mb-3">
            <Building2 className="w-5 h-5 text-blue-600" />
          </div>
          <p className="text-xs font-black text-gray-500 uppercase">Total Buildings</p>
          <p className="text-3xl font-black text-gray-900 mt-1">{zone.buildings}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mb-3">
            <CheckCircle2 className="w-5 h-5 text-green-600" />
          </div>
          <p className="text-xs font-black text-gray-500 uppercase">Completed</p>
          <p className="text-3xl font-black text-green-600 mt-1">{completedBuildings}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center mb-3">
            <Clock className="w-5 h-5 text-orange-600" />
          </div>
          <p className="text-xs font-black text-gray-500 uppercase">Pending</p>
          <p className="text-3xl font-black text-orange-600 mt-1">{pendingBuildings}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center mb-3">
            <AlertTriangle className="w-5 h-5 text-red-600" />
          </div>
          <p className="text-xs font-black text-gray-500 uppercase">Payment Due</p>
          <p className="text-3xl font-black text-red-600 mt-1">{unpaidBuildings}</p>
        </div>
      </div>
      
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-sm font-black text-gray-900 uppercase">
            Buildings in {zone.name} ({zoneBuildings.length})
          </h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search buildings..." 
              className="pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs font-bold focus:ring-2 focus:ring-green-500 outline-none" 
            />
          </div>
        </div>
        <div className="divide-y divide-gray-100 max-h-[600px] overflow-y-auto">
          {zoneBuildings.length === 0 ? (
            <div className="p-8 text-center">
              <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-sm font-bold text-gray-500">No buildings registered in this zone yet.</p>
            </div>
          ) : (
            zoneBuildings.map((building: any, idx: number) => (
              <div key={building.id || idx} className="px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-all">
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${
                    building.status === 'picked_up' ? 'bg-green-500' : 
                    building.payment_status === 'unpaid' ? 'bg-red-500' : 
                    'bg-blue-500'
                  }`} />
                  <div>
                    <p className="text-sm font-black text-gray-900 uppercase">{building.custom_id}</p>
                    <p className="text-xs font-bold text-gray-500">{building.address || 'No address'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-xs font-black text-gray-500 uppercase">{building.building_type || 'N/A'}</p>
                    <p className={`text-xs font-bold uppercase ${
                      building.payment_status === 'paid' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {building.payment_status || 'Unknown'}
                    </p>
                  </div>
                  <div className={`text-xs font-black px-2 py-1 rounded-full uppercase ${
                    building.status === 'picked_up' ? 'bg-green-100 text-green-700' : 
                    building.status === 'collecting' ? 'bg-blue-100 text-blue-700' : 
                    'bg-orange-100 text-orange-700'
                  }`}>
                    {building.status || 'Unknown'}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

import { Globe } from 'lucide-react';