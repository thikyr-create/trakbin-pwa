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
  setActivePage?: (page: any) => void; // <-- FIX: Accepts any string/page type safely
}) {
  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Dashboard Overview</h1>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <p className="text-sm font-medium text-gray-500">Total Trucks</p>
          <p className="text-3xl font-bold">{trucks?.length || 0}</p>
        </div>
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <p className="text-sm font-medium text-gray-500">Total Drivers</p>
          <p className="text-3xl font-bold">{drivers?.length || 0}</p>
        </div>
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <p className="text-sm font-medium text-gray-500">Buildings</p>
          <p className="text-3xl font-bold">{buildings?.length || 0}</p>
        </div>
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <p className="text-sm font-medium text-gray-500">Open Issues</p>
          <p className="text-3xl font-bold text-red-600">{issues?.length || 0}</p>
        </div>
      </div>
      
      {/* Example of how setActivePage might be used safely */}
      <div className="mt-6">
        <button 
          onClick={() => setActivePage?.('fleet')} 
          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
        >
          View Fleet Details
        </button>
      </div>
    </div>
  );
}