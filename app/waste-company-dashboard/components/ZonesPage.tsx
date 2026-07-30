"use client";
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Plus, Trash2, Navigation } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';
import { useCompanySession } from '@/lib/store/useCompanySession';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export default function ZonesPage() {
  const { tenant } = useCompanySession();
  const [zones, setZones] = useState<any[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newZoneName, setNewZoneName] = useState('');
  const [newRadius, setNewRadius] = useState(5);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchZones();
  }, [tenant.companyId]);

  const fetchZones = async () => {
    if (!tenant.companyId) return;
    const { data } = await supabase
      .from('company_zones')
      .select('*')
      .eq('company_id', tenant.companyId)
      .order('created_at', { ascending: false });
    if (data) setZones(data);
  };

  const handleAddZone = async () => {
    if (!newZoneName || !tenant.companyId) return;
    setLoading(true);

    // For MVP, we use the company's operating address coordinates as the center
    // In a real app, you'd let them click a map to set the center
    const { data: companyData } = await supabase
      .from('haulers')
      .select('operating_address')
      .eq('id', tenant.companyId)
      .single();

    // Mock coordinates for MVP (You would geocode the address here)
    const centerLat = 6.5244; 
    const centerLng = 3.3792;

    const { error } = await supabase.from('company_zones').insert([{
      company_id: tenant.companyId,
      zone_name: newZoneName,
      center_lat: centerLat,
      center_lng: centerLng,
      radius_km: newRadius
    }]);

    if (!error) {
      setNewZoneName('');
      setShowAddModal(false);
      fetchZones();
    }
    setLoading(false);
  };

  const handleDeleteZone = async (id: string) => {
    await supabase.from('company_zones').delete().eq('id', id);
    fetchZones();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-gray-900">Service Zones</h2>
          <p className="text-sm text-gray-500">Define the areas where you operate. New buildings in these zones will be auto-assigned to you.</p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 transition-all"
        >
          <Plus size={18} /> Add Zone
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <AnimatePresence>
          {zones.map((zone) => (
            <motion.div
              key={zone.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-all"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-green-50 rounded-xl">
                  <MapPin className="w-6 h-6 text-green-600" />
                </div>
                <button onClick={() => handleDeleteZone(zone.id)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all">
                  <Trash2 size={16} />
                </button>
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-1">{zone.zone_name}</h3>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Navigation size={14} />
                <span>{zone.radius_km} km radius</span>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        
        {zones.length === 0 && (
          <div className="col-span-full text-center py-12 text-gray-500 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
            <MapPin className="w-8 h-8 mx-auto mb-2 text-gray-300" />
            <p className="font-bold">No zones configured yet.</p>
            <p className="text-sm">Add a zone to start auto-matching buildings.</p>
          </div>
        )}
      </div>

      {/* Add Zone Modal */}
      {showAddModal && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setShowAddModal(false)}
        >
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-2xl p-6 max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-xl font-bold mb-4">Add Service Zone</h3>
            <input 
              type="text" 
              placeholder="Zone Name (e.g., Lekki Phase 1)" 
              value={newZoneName} 
              onChange={(e) => setNewZoneName(e.target.value)}
              className="w-full p-3 border border-gray-200 rounded-xl mb-4 focus:ring-2 focus:ring-green-500 outline-none"
            />
            <div className="mb-6">
              <label className="block text-sm font-bold text-gray-700 mb-2">Coverage Radius (km)</label>
              <input 
                type="number" 
                value={newRadius} 
                onChange={(e) => setNewRadius(Number(e.target.value))}
                className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none"
              />
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowAddModal(false)} className="flex-1 py-3 bg-gray-100 text-gray-700 font-bold rounded-xl">Cancel</button>
              <button onClick={handleAddZone} disabled={loading} className="flex-1 py-3 bg-green-600 text-white font-bold rounded-xl disabled:bg-gray-400">
                {loading ? 'Saving...' : 'Save Zone'}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}