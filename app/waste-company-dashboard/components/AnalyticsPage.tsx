'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { TrendingUp, Route, CheckCircle, BarChart3 } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

interface DailyStats {
  date: string;
  total_routes: number;
  completed_routes: number;
  skipped_routes: number;
}

export default function AnalyticsPage() {
  const [stats, setStats] = useState<DailyStats[]>([]);
  const [kpis, setKpis] = useState({ totalRoutes: 0, completionRate: 0, activeDays: 0, peakVolume: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAnalytics() {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const { data } = await supabase
        .from('analytics_daily_summary')
        .select('*')
        .gte('date', thirtyDaysAgo)
        .order('date', { ascending: true });

      if (data && data.length > 0) {
        const normalizedData: DailyStats[] = data.map((d: any) => ({
          date: d.date,
          total_routes: Number(d.total_routes) || 0,
          completed_routes: Number(d.completed_routes) || 0,
          skipped_routes: Number(d.skipped_routes) || 0,
        }));
        
        setStats(normalizedData);
        const totalRoutes = normalizedData.reduce((sum: number, day: DailyStats) => sum + day.total_routes, 0);
        const completedRoutes = normalizedData.reduce((sum: number, day: DailyStats) => sum + day.completed_routes, 0);
        const peakVolume = Math.max(...normalizedData.map((d: DailyStats) => d.total_routes));

        setKpis({
          totalRoutes,
          completionRate: totalRoutes > 0 ? (completedRoutes / totalRoutes) * 100 : 0,
          activeDays: normalizedData.length,
          peakVolume,
        });
      }
      setLoading(false);
    }
    fetchAnalytics();
  }, []);

  if (loading) return <div className="p-6 text-center text-gray-600">Calculating analytics...</div>;

  const StatCard = ({ title, value, icon: Icon, color }: { title: string; value: string | number; icon: any; color: string }) => (
    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm font-medium text-gray-600">{title}</p>
        <Icon className={`h-5 w-5 ${color}`} />
      </div>
      <p className="text-3xl font-bold text-gray-900">{value}</p>
    </div>
  );

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Fleet Analytics</h1>
        <p className="text-sm text-gray-600 mt-1">Operational performance over the last 30 days.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Routes" value={kpis.totalRoutes} icon={Route} color="text-green-600" />
        <StatCard title="Completion Rate" value={`${kpis.completionRate.toFixed(1)}%`} icon={CheckCircle} color="text-green-600" />
        <StatCard title="Peak Daily Volume" value={kpis.peakVolume} icon={BarChart3} color="text-green-600" />
        <StatCard title="Active Days" value={kpis.activeDays} icon={TrendingUp} color="text-green-600" />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Daily Route Volume</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={stats}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#4b5563' }} stroke="#e5e7eb" />
                <YAxis tick={{ fontSize: 12, fill: '#4b5563' }} stroke="#e5e7eb" />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                  labelStyle={{ color: '#111827', fontWeight: 600 }}
                />
                <Line type="monotone" dataKey="total_routes" stroke="#16a34a" strokeWidth={2} dot={{ r: 4, fill: '#16a34a' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Completed vs Skipped</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#4b5563' }} stroke="#e5e7eb" />
                <YAxis tick={{ fontSize: 12, fill: '#4b5563' }} stroke="#e5e7eb" />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                  labelStyle={{ color: '#111827', fontWeight: 600 }}
                />
                <Legend wrapperStyle={{ color: '#111827' }} />
                <Bar dataKey="completed_routes" fill="#16a34a" name="Completed" radius={[4, 4, 0, 0]} />
                <Bar dataKey="skipped_routes" fill="#ef4444" name="Skipped" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}