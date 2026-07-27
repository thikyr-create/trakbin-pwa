"use client";

import { useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Settings, Save } from 'lucide-react';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

interface SettingsPageProps {
  companyName: string;
  companyId: string;
}

export default function SettingsPage({ companyName, companyId }: SettingsPageProps) {
  const [settingsForm, setSettingsForm] = useState({ 
    email: '', 
    phone: '', 
    password: '' 
  });
  const [saving, setSaving] = useState(false);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    
    try {
      const updateData: any = {
        email: settingsForm.email,
        phone: settingsForm.phone
      };
      if (settingsForm.password) {
        updateData.password = settingsForm.password;
      }
      
      const { error } = await supabase.from('users').update(updateData).eq('id', companyId);
      if (error) throw error;
      
      const storedCompany = localStorage.getItem('trakbin_company');
      if (storedCompany) {
        const userData = JSON.parse(storedCompany);
        userData.email = settingsForm.email;
        userData.phone = settingsForm.phone;
        if (settingsForm.password) userData.password = settingsForm.password;
        localStorage.setItem('trakbin_company', JSON.stringify(userData));
      }
      
      alert('✅ Settings Updated Successfully!');
    } catch (error: any) {
      alert('Error: ' + error.message);
    }
    setSaving(false);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <div className="bg-gradient-to-br from-green-600 to-green-700 rounded-xl p-6 text-white">
        <div className="flex items-center gap-3 mb-2">
          <Settings className="w-6 h-6" />
          <h2 className="text-xl font-black uppercase">Company Settings</h2>
        </div>
        <p className="text-sm font-bold text-green-100">Manage your company information and security</p>
      </div>
      
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <form onSubmit={handleSaveSettings} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Company Name</label>
            <input 
              type="text" 
              value={companyName} 
              disabled 
              className="w-full px-4 py-3 bg-gray-100 border-2 border-gray-200 rounded-xl font-bold text-gray-500 cursor-not-allowed" 
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Email Address</label>
            <input 
              type="email" 
              required 
              value={settingsForm.email} 
              onChange={(e) => setSettingsForm({...settingsForm, email: e.target.value})} 
              className="w-full px-4 py-3 bg-white border-2 border-gray-300 rounded-xl font-bold text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none" 
              placeholder="company@trakbin.com" 
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Phone Number</label>
            <input 
              type="tel" 
              required 
              value={settingsForm.phone} 
              onChange={(e) => setSettingsForm({...settingsForm, phone: e.target.value})} 
              className="w-full px-4 py-3 bg-white border-2 border-gray-300 rounded-xl font-bold text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none" 
              placeholder="+234..." 
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">New Password</label>
            <input 
              type="password" 
              value={settingsForm.password} 
              onChange={(e) => setSettingsForm({...settingsForm, password: e.target.value})} 
              className="w-full px-4 py-3 bg-white border-2 border-gray-300 rounded-xl font-bold text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none" 
              placeholder="Leave blank to keep current" 
            />
          </div>
          <button 
            type="submit" 
            disabled={saving} 
            className="w-full py-3.5 bg-green-600 text-white font-black rounded-xl hover:bg-green-700 transition-all uppercase tracking-wide disabled:bg-gray-400 flex items-center justify-center gap-2"
          >
            <Save size={18} />
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      </div>
    </div>
  );
}