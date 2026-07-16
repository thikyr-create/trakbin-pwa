"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import { ShieldCheck, Lock, Eye, EyeOff, AlertCircle, Loader2 } from 'lucide-react';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export default function GovernmentLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { data, error } = await supabase
        .from('government_officials')
        .select('*')
        .eq('email', email)
        .eq('password', password)
        .single();

      if (error || !data) {
        setError('❌ Invalid credentials. Access denied.');
        setLoading(false);
        return;
      }

      localStorage.setItem('trakbin_government_official', JSON.stringify(data));
      router.push('/government-portal');
    } catch (err) {
      setError('❌ System error. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-2xl shadow-emerald-900/50">
            <ShieldCheck className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight">TRAKBIN</h1>
          <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mt-2">Government Regulatory Portal</p>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 mb-6 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-black text-amber-900 uppercase">Restricted Government Access</p>
              <p className="text-xs text-amber-700 mt-1">Authorized environmental personnel only. All actions are audited.</p>
            </div>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-black text-gray-500 uppercase mb-1.5">Official Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl font-bold text-gray-900 focus:ring-2 focus:ring-emerald-500 outline-none" placeholder="inspector@env.gov.ng" />
            </div>
            <div>
              <label className="block text-xs font-black text-gray-500 uppercase mb-1.5">Password</label>
              <div className="relative">
                <input type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} required className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl font-bold text-gray-900 focus:ring-2 focus:ring-emerald-500 outline-none pr-12" placeholder="••••••••" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>
            {error && <div className="bg-red-50 border border-red-100 rounded-xl p-3"><p className="text-sm font-bold text-red-700 text-center">{error}</p></div>}
            <button type="submit" disabled={loading} className="w-full py-3.5 bg-emerald-600 text-white font-black rounded-xl hover:bg-emerald-700 transition-all uppercase tracking-wide disabled:bg-gray-400 flex items-center justify-center gap-2 shadow-lg shadow-emerald-200">
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Lock size={18} />}
              {loading ? 'Authenticating...' : 'Access Regulatory Center'}
            </button>
          </form>
          <div className="mt-6 pt-6 border-t border-gray-100 text-center">
            <a href="/" className="text-xs font-bold text-gray-500 hover:text-emerald-600 transition-all">← Return to Public Site</a>
          </div>
        </div>
      </div>
    </div>
  );
}