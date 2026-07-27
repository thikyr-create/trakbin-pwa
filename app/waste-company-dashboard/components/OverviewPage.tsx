'use client';

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
  return (
    <div className="p-6 space-y-6">
      {/* Header - Matching the image style */}
      <div>
        <h1 className="text-3xl font-black text-gray-900 uppercase tracking-tight">Dashboard Overview</h1>
        <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider mt-1">Executive summary of today's operations</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Total Trucks - Green accent */}
        <div className="bg-white p-6 rounded-xl border-l-4 border-green-500 shadow-sm">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Trucks</p>
          <p className="text-3xl font-black text-gray-900 mt-2">{trucks?.length || 0}</p>
        </div>

        {/* Total Drivers - Blue accent */}
        <div className="bg-white p-6 rounded-xl border-l-4 border-blue-500 shadow-sm">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Drivers</p>
          <p className="text-3xl font-black text-gray-900 mt-2">{drivers?.length || 0}</p>
        </div>

        {/* Buildings - Purple accent */}
        <div className="bg-white p-6 rounded-xl border-l-4 border-purple-500 shadow-sm">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Buildings</p>
          <p className="text-3xl font-black text-gray-900 mt-2">{buildings?.length || 0}</p>
        </div>

        {/* Open Issues - Red accent */}
        <div className="bg-white p-6 rounded-xl border-l-4 border-red-500 shadow-sm">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Open Issues</p>
          <p className="text-3xl font-black text-red-600 mt-2">{issues?.length || 0}</p>
        </div>
      </div>

      <div className="mt-6">
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