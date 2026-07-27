'use client';

import { Truck, Users, Building2, AlertTriangle } from 'lucide-react';

export default function OverviewPage({ 
  trucks, 
  drivers, 
  buildings, 
  collections, 
  issues, 
  setActivePage 
}: { 
  trucks?: any[]; 
  drivers?: any[]; 
  buildings?: any[]; 
  collections?: any[]; 
  issues?: any[]; 
  setActivePage?: (page: any) => void;
}) {
  const cards = [
    {
      label: 'TRUCKS',
      value: trucks?.length || 0,
      subtitle: 'Active Fleet',
      subtitleColor: 'text-green-600',
      iconBg: 'bg-green-100',
      iconColor: 'text-green-600',
      icon: Truck,
    },
    {
      label: 'DRIVERS',
      value: drivers?.length || 0,
      subtitle: 'Field Workers',
      subtitleColor: 'text-blue-600',
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-600',
      icon: Users,
    },
    {
      label: 'BUILDINGS',
      value: buildings?.length || 0,
      subtitle: 'Active Nodes',
      subtitleColor: 'text-purple-600',
      iconBg: 'bg-purple-100',
      iconColor: 'text-purple-600',
      icon: Building2,
    },
    {
      label: 'OPEN ISSUES',
      value: issues?.length || 0,
      subtitle: 'Needs Action',
      subtitleColor: 'text-red-600',
      iconBg: 'bg-red-100',
      iconColor: 'text-red-600',
      icon: AlertTriangle,
    },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-black text-gray-900 uppercase tracking-tight">Dashboard Overview</h1>
        <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider mt-1">Executive summary of today's operations</p>
      </div>

      {/* Cards Grid */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
              <div className={`w-10 h-10 ${card.iconBg} rounded-lg flex items-center justify-center`}>
                <Icon className={`w-5 h-5 ${card.iconColor}`} />
              </div>
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">{card.label}</p>
                <p className="text-3xl font-black text-gray-900 mt-1">{card.value}</p>
                <p className={`text-xs font-bold ${card.subtitleColor} mt-1`}>{card.subtitle}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* System Health Banner */}
      <div className="bg-green-600 rounded-xl p-6 text-white">
        <div className="flex items-center gap-2 mb-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          <p className="text-sm font-bold uppercase tracking-wider">System Health</p>
        </div>
        <p className="text-4xl font-black">98.4%</p>
        <p className="text-sm font-semibold mt-1 text-green-100">All systems operational</p>
      </div>

      {/* Action Button */}
      <div>
        <button 
          onClick={() => setActivePage?.('fleet')} 
          className="bg-green-600 text-white px-6 py-3 rounded-lg font-bold uppercase tracking-wide hover:bg-green-700 transition-colors shadow-md"
        >
          View Fleet Details
        </button>
      </div>
    </div>
  );
}