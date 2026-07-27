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
      <div>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Dashboard Overview</h1>
        <p className="text-sm text-gray-600 mt-1">Executive summary of today's operations</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Total Trucks */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <p className="text-sm font-medium text-gray-600">Total Trucks</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{trucks?.length || 0}</p>
        </div>

        {/* Total Drivers */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <p className="text-sm font-medium text-gray-600">Total Drivers</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{drivers?.length || 0}</p>
        </div>

        {/* Buildings */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <p className="text-sm font-medium text-gray-600">Buildings</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{buildings?.length || 0}</p>
        </div>

        {/* Open Issues */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <p className="text-sm font-medium text-gray-600">Open Issues</p>
          <p className="text-3xl font-bold text-red-600 mt-2">{issues?.length || 0}</p>
        </div>
      </div>

      <div className="mt-6">
        <button 
          onClick={() => setActivePage?.('fleet')} 
          className="bg-green-600 text-white px-5 py-2.5 rounded-lg font-semibold hover:bg-green-700 transition-colors shadow-sm"
        >
          View Fleet Details
        </button>
      </div>
    </div>
  );
}