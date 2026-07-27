"use client";

import { Users, Plus, Phone, Mail } from 'lucide-react';

interface DriversPageProps {
  drivers: any[];
  search: string;
  setSearch: (value: string) => void;
  setShowDriverModal: (show: boolean) => void;
  onSelectDriver: (driver: any) => void;
}

export default function DriversPage({ drivers, search, setSearch, setShowDriverModal, onSelectDriver }: DriversPageProps) {
  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input 
            type="text" 
            placeholder="Search drivers by name or ID..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-white border-2 border-gray-300 rounded-lg text-sm font-bold text-black placeholder-gray-500 focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none shadow-sm" 
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-800">
              <X size={14} />
            </button>
          )}
        </div>
        <div className="flex items-center gap-3">
          <p className="text-xs font-black text-gray-500 uppercase">{drivers.length} Drivers Found</p>
          <button 
            onClick={() => setShowDriverModal(true)} 
            className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg font-black text-xs uppercase hover:bg-green-700 transition-all"
          >
            <Plus size={16} /> Add Driver
          </button>
        </div>
      </div>
      
      {drivers.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-sm font-bold text-gray-500">No drivers found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {drivers.map((driver: any) => (
            <div 
              key={driver.id} 
              onClick={() => onSelectDriver(driver)} 
              className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-lg hover:-translate-y-1 transition-all cursor-pointer"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                  <span className="text-purple-700 font-black text-lg">
                    {(driver.full_name || 'D').charAt(0).toUpperCase()}
                  </span>
                </div>
                <span className="text-xs font-black px-2 py-1 rounded-full uppercase bg-green-100 text-green-700">
                  ON SHIFT
                </span>
              </div>
              <h3 className="text-lg font-black text-gray-900 uppercase">{driver.full_name}</h3>
              <p className="text-xs font-bold text-gray-500 uppercase mt-1">ID: {driver.employee_id}</p>
              <div className="mt-3 pt-3 border-t border-gray-100 space-y-2">
                <div className="flex items-center gap-2 text-xs">
                  <Phone size={12} className="text-gray-400" />
                  <span className="font-bold text-gray-700">{driver.phone || 'N/A'}</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <Mail size={12} className="text-gray-400" />
                  <span className="font-bold text-gray-700 truncate">{driver.email || 'N/A'}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

import { Search, X } from 'lucide-react';