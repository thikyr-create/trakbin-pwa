"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import { Shield, Lock, Eye, EyeOff, AlertCircle, Loader2 } from 'lucide-react';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export default function AdminLoginPage() {
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
      // Check credentials against the secure 'admins' table
      const { data, error } = await supabase
        .from('admins')
        .select('*')
        .eq('email', email)
        .eq('password', password)
        .single();

      if (error || !data) {
        setError('❌ Invalid credentials. Access denied.');
        setLoading(false);
        return;
      }

      // Save session and redirect
      localStorage.setItem('trakbin_super_admin', JSON.stringify(data));
      router.push('/admin-dashboard');
    } catch (err) {
      setError('❌ System error. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo & Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-green-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-2xl shadow-green-900/50">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight">TRAKBIN</h1>
          <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mt-2">Super Admin Portal</p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <div className="bg-red-50 border border-red-100 rounded-xl p-3 mb-6 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-black text-red-900 uppercase">Restricted Access</p>
              <p className="text-xs text-red-700 mt-1">Authorized personnel only. All login attempts are logged.</p>
            </div>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-black text-gray-500 uppercase mb-1.5">Admin Email</label>
              <input 
                type="email" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                required 
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl font-bold text-gray-900 focus:ring-2 focus:ring-green-500 outline-none transition-all"
                placeholder="admin@trakbin.com"
              />
            </div>

            <div>
              <label className="block text-xs font-black text-gray-500 uppercase mb-1.5">Password</label>
              <div className="relative">
                <input 
                  type={showPassword ? "text" : "password"} 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  required 
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl font-bold text-gray-900 focus:ring-2 focus:ring-green-500 outline-none transition-all pr-12"
                  placeholder="••••••••"
                />
                <button 
                  type="button" 
                  onClick={() => setShowPassword(!showPassword)} 
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-100 rounded-xl p-3">
                <p className="text-sm font-bold text-red-700 text-center">{error}</p>
              </div>
            )}

            <button 
              type="submit" 
              disabled={loading} 
              className="w-full py-3.5 bg-green-600 text-white font-black rounded-xl hover:bg-green-700 transition-all uppercase tracking-wide disabled:bg-gray-400 flex items-center justify-center gap-2 shadow-lg shadow-green-200"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Lock size={18} />}
              {loading ? 'Authenticating...' : 'Access Command Center'}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-gray-100 text-center">
            <a href="/" className="text-xs font-bold text-gray-500 hover:text-green-600 transition-all">
              ← Return to Public Site
            </a>
          </div>
        </div>
        
        <p className="text-center text-xs font-bold text-gray-600 mt-6">
          © 2024 Trakbin. All rights reserved.
        </p>
      </div>
    </div>
  );
}