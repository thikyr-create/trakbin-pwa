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

  if (loading) return <div className="p-6 text-center text-gray-600 font-semibold uppercase tracking-wider">Calculating analytics...</div>;

  const kpiCards = [
    {
      label: 'TOTAL ROUTES',
      value: kpis.totalRoutes,
      subtitle: 'Last 30 Days',
      subtitleColor: 'text-green-600',
      iconBg: 'bg-green-100',
      iconColor: 'text-green-600',
      icon: Route,
    },
    {
      label: 'COMPLETION RATE',
      value: `${kpis.completionRate.toFixed(1)}%`,
      subtitle: 'Success Rate',
      subtitleColor: 'text-blue-600',
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-600',
      icon: CheckCircle,
    },
    {
      label: 'PEAK VOLUME',
      value: kpis.peakVolume,
      subtitle: 'Best Day',
      subtitleColor: 'text-purple-600',
      iconBg: 'bg-purple-100',
      iconColor: 'text-purple-600',
      icon: BarChart3,
    },
    {
      label: 'ACTIVE DAYS',
      value: kpis.activeDays,
      subtitle: 'Days Operated',
      subtitleColor: 'text-orange-600',
      iconBg: 'bg-orange-100',
      iconColor: 'text-orange-600',
      icon: TrendingUp,
    },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-black text-gray-900 uppercase tracking-tight">Fleet Analytics</h1>
        <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider mt-1">Operational performance over the last 30 days</p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {kpiCards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
              <div className={`w-10 h-10 ${card.iconBg} rounded-lg flex items-center justify-center`}>
                <Icon className={`w-5 h-5 ${card.iconColor}`} />
              </div>
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">{card.label}</p>
                <p className="text-3xl font-black text-gray-900 mt-1">{card.value}</p>
                <p className={`text-xs font-bold ${card.subtitleColor} mt-1`}>{card.subtitle}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts */}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">Daily Route Volume</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={stats}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#6b7280' }} stroke="#e5e7eb" />
                <YAxis tick={{ fontSize: 11, fill: '#6b7280' }} stroke="#e5e7eb" />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '12px' }}
                  labelStyle={{ color: '#111827', fontWeight: 700 }}
                />
                <Line type="monotone" dataKey="total_routes" stroke="#16a34a" strokeWidth={3} dot={{ r: 4, fill: '#16a34a' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">Completed vs Skipped</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#6b7280' }} stroke="#e5e7eb" />
                <YAxis tick={{ fontSize: 11, fill: '#6b7280' }} stroke="#e5e7eb" />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '12px' }}
                  labelStyle={{ color: '#111827', fontWeight: 700 }}
                />
                <Legend wrapperStyle={{ fontSize: '12px', fontWeight: 600 }} />
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