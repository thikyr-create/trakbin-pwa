"use client";
import { X, MapPin, Building2, Clock, CheckCircle2, AlertCircle, XCircle } from 'lucide-react';
import { useCompanySession } from '@/lib/store/useCompanySession';

export default function ReviewDrawer() {
  const { isDrawerOpen, setIsDrawerOpen, selectedRequest } = useCompanySession();

  if (!isDrawerOpen || !selectedRequest) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 transition-opacity" 
        onClick={() => setIsDrawerOpen(false)}
      />
      
      {/* Drawer */}
      <div className="fixed inset-y-0 right-0 w-full max-w-md bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-black text-gray-900">Review Request</h2>
            <p className="text-sm font-bold text-gray-500">{selectedRequest.building_id}</p>
          </div>
          <button onClick={() => setIsDrawerOpen(false)} className="p-2 hover:bg-gray-100 rounded-full">
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Status Banner */}
          <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 flex items-center gap-3">
            <Clock className="w-5 h-5 text-amber-600" />
            <div>
              <p className="text-xs font-bold text-amber-800 uppercase">Status</p>
              <p className="text-sm font-bold text-amber-900">Pending Review • Submitted {new Date(selectedRequest.submitted_at).toLocaleDateString()}</p>
            </div>
          </div>

          {/* Building Details */}
          <div>
            <h3 className="text-xs font-black text-gray-500 uppercase mb-3">Building Details</h3>
            <div className="bg-gray-50 rounded-xl p-4 space-y-3">
              <div className="flex items-start gap-3">
                <Building2 className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-xs font-bold text-gray-500 uppercase">Address</p>
                  <p className="text-sm font-bold text-gray-900">{selectedRequest.buildings?.address || 'Not provided'}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-xs font-bold text-gray-500 uppercase">GPS Coordinates</p>
                  <p className="text-sm font-bold text-gray-900">
                    {selectedRequest.buildings?.latitude?.toFixed(4)}, {selectedRequest.buildings?.longitude?.toFixed(4)}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5" />
                <div>
                  <p className="text-xs font-bold text-gray-500 uppercase">Building Type</p>
                  <p className="text-sm font-bold text-gray-900">{selectedRequest.buildings?.building_type || 'Unknown'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Estimated Activation */}
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
            <p className="text-xs font-bold text-blue-800 mb-1">Estimated Activation Time</p>
            <p className="text-sm font-bold text-blue-900">Within 24 hours of approval</p>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-gray-100 bg-gray-50 space-y-3">
          <button className="w-full py-3 bg-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-300 transition-all flex items-center justify-center gap-2">
            <XCircle size={18} /> Reject Request
          </button>
          <button className="w-full py-3 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 transition-all shadow-lg shadow-green-200">
            Begin Assignment Wizard →
          </button>
        </div>
      </div>
    </>
  );
}