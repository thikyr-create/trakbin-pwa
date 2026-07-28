'use client';

import { useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { useCompanySession } from '@/lib/store/useCompanySession';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export default function SettingsPage({ companyName, companyId }: { companyName: string; companyId: string }) {
  const { tenant } = useCompanySession();
  const [loading, setLoading] = useState(false);

  const handleUpdateCompany = async (formData: any) => {
    setLoading(true);
    
    try {
      // Update the haulers table (tenant table) using tenant.companyId
      const { error } = await supabase
        .from('haulers')
        .update({
          company_name: formData.company_name || companyName,
          // Add any other fields you want to update
        })
        .eq('id', tenant.companyId); // Use tenant.companyId instead of companyId prop

      if (error) throw error;

      alert('Settings updated successfully!');
    } catch (error: any) {
      console.error('Error updating settings:', error);
      alert(`Failed to update settings: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-black text-gray-900 uppercase tracking-tight">Company Settings</h1>
        <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider mt-1">Manage your company profile</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6 max-w-2xl">
        <form onSubmit={(e) => { e.preventDefault(); handleUpdateCompany({ company_name: companyName }); }}>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Company Name</label>
              <input
                type="text"
                defaultValue={companyName}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Company ID</label>
              <input
                type="text"
                value={tenant.companyId || 'N/A'}
                disabled
                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="bg-green-600 text-white px-6 py-3 rounded-lg font-bold uppercase tracking-wide hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}