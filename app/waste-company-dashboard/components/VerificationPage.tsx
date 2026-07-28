'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Camera, MapPin, Clock, CheckCircle2, AlertTriangle } from 'lucide-react';
import { useCompanySession } from '@/lib/store/useCompanySession'; // <-- NEW IMPORT

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

interface Verification {
  id: number | string;
  verification_type: string;
  status: string;
  driver_name?: string | null;
  truck_id?: string | number | null;
  photo_url?: string | null;
  gps_coordinates?: any;
  notes?: string | null;
  created_at: string;
}

export default function VerificationPage() {
  const [verifications, setVerifications] = useState<Verification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');

  // Get tenant context
  const { tenant } = useCompanySession();

  useEffect(() => {
    fetchVerifications();
  }, [filter, tenant.companyId]); // Re-fetch if filter or tenant changes

  async function fetchVerifications() {
    // Guard clause
    if (!tenant.companyId) return;

    setLoading(true);
    
    // FIX: Scoped to tenant.companyId using 'hauler_id' to match DB schema
    let query = supabase
      .from('verifications')
      .select('*')
      .eq('hauler_id', tenant.companyId) 
      .order('created_at', { ascending: false });

    if (filter !== 'all') {
      query = query.eq('status', filter);
    }

    const { data } = await query;
    if (data) setVerifications(data as Verification[]);
    setLoading(false);
  }

  const getStatusBadge = (status: string) => {
    const base = "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold";
    switch (status) {
      case 'verified': return <span className={`${base} bg-green-100 text-green-800`}>Verified</span>;
      case 'rejected': return <span className={`${base} bg-red-100 text-red-800`}>Rejected</span>;
      case 'failed': return <span className={`${base} bg-gray-100 text-gray-800`}>Failed</span>;
      default: return <span className={`${base} bg-yellow-100 text-yellow-800`}>Pending</span>;
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'pickup': return <CheckCircle2 className="h-5 w-5 text-blue-500" />;
      case 'disposal': return <AlertTriangle className="h-5 w-5 text-orange-500" />;
      default: return <Camera className="h-5 w-5 text-gray-500" />;
    }
  };

  if (loading) return <div className="p-6 text-center text-gray-500">Loading verifications...</div>;

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-3xl font-black text-gray-900 uppercase tracking-tight">Service Verifications</h1>
        <div className="flex gap-2 flex-wrap">
          {['all', 'pending', 'verified', 'rejected'].map((f) => (
            <button 
              key={f} 
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-md text-sm font-bold uppercase tracking-wide transition-colors ${
                filter === f ? 'bg-green-600 text-white' : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {verifications.map((v) => {
          const gps = typeof v.gps_coordinates === 'string' ? JSON.parse(v.gps_coordinates) : v.gps_coordinates;
          return (
            <div key={v.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden flex flex-col">
              <div className="flex flex-row items-center justify-between p-4 bg-gray-50 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  {getIcon(v.verification_type)}
                  <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">{v.verification_type}</h3>
                </div>
                {getStatusBadge(v.status)}
              </div>
              
              <div className="p-4 space-y-3 flex-1">
                {v.photo_url ? (
                  <img src={v.photo_url} alt="Proof" className="h-40 w-full object-cover rounded-md border" />
                ) : (
                  <div className="h-40 w-full rounded-md bg-gray-100 flex items-center justify-center text-gray-400 border">
                    <Camera className="h-8 w-8" />
                  </div>
                )}

                <div className="text-sm space-y-1.5">
                  <p><span className="font-semibold text-gray-500 uppercase text-xs">Driver:</span> <span className="font-bold text-gray-900">{v.driver_name || 'Unknown'}</span></p>
                  <p><span className="font-semibold text-gray-500 uppercase text-xs">Truck:</span> <span className="font-bold text-gray-900">{v.truck_id ? String(v.truck_id).substring(0, 8) + '...' : 'N/A'}</span></p>
                  <div className="flex items-center gap-1.5 text-gray-500">
                    <Clock className="h-3.5 w-3.5" />
                    <span className="text-xs font-medium">{new Date(v.created_at).toLocaleString()}</span>
                  </div>
                  {gps?.lat && gps?.lng && (
                    <div className="flex items-center gap-1.5 text-gray-500">
                      <MapPin className="h-3.5 w-3.5" />
                      <span className="text-xs font-medium">{Number(gps.lat).toFixed(4)}, {Number(gps.lng).toFixed(4)}</span>
                    </div>
                  )}
                </div>

                {v.notes && (
                  <p className="text-sm text-gray-600 border-t pt-2 mt-2 italic">"{v.notes}"</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
      
      {verifications.length === 0 && !loading && (
        <div className="text-center text-gray-500 py-12 border rounded-lg bg-gray-50">
          No verifications found for this filter.
        </div>
      )}
    </div>
  );
}