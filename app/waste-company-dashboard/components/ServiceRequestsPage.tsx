"use client";
import { useEffect } from 'react';
import { Inbox, Clock, CheckCircle2, XCircle, Search, Filter } from 'lucide-react';
import { useCompanySession } from '@/lib/store/useCompanySession';

export default function ServiceRequestsPage() {
  const { serviceRequests, fetchServiceRequests, setSelectedRequest, setIsDrawerOpen } = useCompanySession();

  useEffect(() => {
    fetchServiceRequests();
  }, []);

  const handleReview = (request: any) => {
    setSelectedRequest(request);
    setIsDrawerOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Stats Header */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-amber-50 rounded-xl"><Inbox className="w-6 h-6 text-amber-600" /></div>
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase">Pending Queue</p>
            <p className="text-2xl font-black text-gray-900">{serviceRequests.length}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-green-50 rounded-xl"><CheckCircle2 className="w-6 h-6 text-green-600" /></div>
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase">Activated Today</p>
            <p className="text-2xl font-black text-gray-900">0</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-blue-50 rounded-xl"><Clock className="w-6 h-6 text-blue-600" /></div>
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase">Avg Response Time</p>
            <p className="text-2xl font-black text-gray-900">--</p>
          </div>
        </div>
      </div>

      {/* Queue Table */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">Service Request Queue</h2>
          <div className="flex gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input type="text" placeholder="Search Building ID..." className="pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-green-500 outline-none" />
            </div>
            <button className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm font-bold text-gray-700 hover:bg-gray-100 flex items-center gap-2">
              <Filter size={14} /> Filter
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-xs font-bold text-gray-500 uppercase">
              <tr>
                <th className="px-6 py-4">Building ID</th>
                <th className="px-6 py-4">Address</th>
                <th className="px-6 py-4">Type</th>
                <th className="px-6 py-4">Submitted</th>
                <th className="px-6 py-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {serviceRequests.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                    <Inbox className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                    No pending service requests.
                  </td>
                </tr>
              ) : (
                serviceRequests.map((req) => (
                  <tr key={req.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-bold text-green-600">{req.building_id}</td>
                    <td className="px-6 py-4 text-sm text-gray-700">{req.buildings?.address || 'Unknown Address'}</td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs font-bold rounded-md uppercase">
                        {req.buildings?.building_type || 'N/A'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {new Date(req.submitted_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => handleReview(req)}
                        className="px-4 py-2 bg-green-600 text-white text-xs font-bold rounded-lg hover:bg-green-700 transition-all"
                      >
                        Review
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}