"use client";

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import { motion, AnimatePresence, animate, useMotionValue, useTransform, type Variants } from 'framer-motion';
import { Sora, Plus_Jakarta_Sans } from 'next/font/google';
import {
  LayoutDashboard, Truck, Users, MapPin, ClipboardList, CheckCircle2,
  AlertTriangle, BarChart3, Wrench, Globe, Settings, LogOut, Plus,
  TrendingUp, Clock, Navigation, Phone, Activity, Menu, X, Map, Building2,
  ArrowLeft, Mail, Hash, Save, Search, Inbox, Wallet, Radio, ShieldCheck,
  Radar,
} from 'lucide-react';

import { useCompanySession } from '@/lib/store/useCompanySession';
import AuthGate from './components/AuthGate';
import DispatchTimeline from './components/DispatchTimeline';
import NotificationsPanel from './components/NotificationsPanel';
import AddDriverModal from './components/AddDriverModal';
import AddTruckModal from './components/AddTruckModal';
import OverviewPage from './components/OverviewPage';
import FleetPage from './components/FleetPage';
import DriversPage from './components/DriversPage';
import BuildingsPage from './components/BuildingsPage';
import AssignmentsPage from './components/AssignmentsPage';
import MissionMapPage from './components/MissionMapPage';
import VerificationPage from './components/VerificationPage';
import IssuesPage from './components/IssuesPage';
import AnalyticsPage from './components/AnalyticsPage';
import MaintenancePage from './components/MaintenancePage';
import ZonesPage from './components/ZonesPage';
import ZoneDetailsPage from './components/ZoneDetailsPage';
import SettingsPage from './components/SettingsPage';
import ServiceRequestsPage from './components/ServiceRequestsPage';
import ReviewDrawer from './components/ReviewDrawer';
import FinancePage from './components/FinancePage';
import { formatNaira } from '@/lib/utils/money';
import { canOperate } from '@/lib/auth/companyVerification';
import CompanyVerificationCard from './components/CompanyVerificationCard';

const display = Sora({ subsets: ['latin'], display: 'swap', variable: '--font-display' });
const body = Plus_Jakarta_Sans({ subsets: ['latin'], display: 'swap', variable: '--font-body' });
const EASE = [0.22, 1, 0.36, 1] as [number, number, number, number];

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

type PageView =
  | 'overview' | 'fleet' | 'drivers' | 'buildings' | 'assignments' | 'mission'
  | 'verification' | 'issues' | 'analytics' | 'maintenance' | 'zones'
  | 'settings' | 'service-requests' | 'earnings';

function Counter({ value, prefix = '', duration = 1.1 }: { value: number; prefix?: string; duration?: number }) {
  const mv = useMotionValue(0);
  const rounded = useTransform(mv, (v) => prefix + Math.round(v).toLocaleString('en-NG'));
  useEffect(() => { const c = animate(mv, value, { duration, ease: EASE }); return () => c.stop(); }, [value, duration]);
  return <motion.span>{rounded}</motion.span>;
}

const deckCell: Variants = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: EASE } },
};

export default function WasteCompanyDashboard() {
  const router = useRouter();
  const [companyName, setCompanyName] = useState('Waste Company');
  const [companyId, setCompanyId] = useState<string>('');
  const [activePage, setActivePage] = useState<PageView>('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState<any>(null);
  const [selectedTruck, setSelectedTruck] = useState<any>(null);
  const [selectedZone, setSelectedZone] = useState<any>(null);

  const [trucks, setTrucks] = useState<any[]>([]);
  const [drivers, setDrivers] = useState<any[]>([]);
  const [buildings, setBuildings] = useState<any[]>([]);
  const [collections, setCollections] = useState<any[]>([]);
  const [issues, setIssues] = useState<any[]>([]);

  const [loading, setLoading] = useState(true);
  const [showDriverModal, setShowDriverModal] = useState(false);
  const [showTruckModal, setShowTruckModal] = useState(false);

  const [searchFleet, setSearchFleet] = useState('');
  const [searchDrivers, setSearchDrivers] = useState('');

  const {
    tenant, loadTenantContext,
    addDispatchEvent, addNotification, subscribeToRealtime, unsubscribeFromRealtime,
    trucks: liveFleet, serviceRequests, earnings,
  } = useCompanySession();

  useEffect(() => {
    const storedCompany = localStorage.getItem('trakbin_company');
    if (!storedCompany) { router.push('/auth'); return; }

    const userData = JSON.parse(storedCompany);
    setCompanyName(userData.company_name || 'Waste Company');
    setCompanyId(userData.id || '');

    loadTenantContext();

    if (tenant.role === 'driver') { router.push('/driver-dashboard'); return; }

    const t = setTimeout(() => { fetchData(); }, 400);
    const cleanup = subscribeToRealtime();
    return () => { clearTimeout(t); if (typeof cleanup === 'function') cleanup(); else unsubscribeFromRealtime(); };
  }, [router]);

  const fetchData = async () => {
    let currentCompanyId = tenant.companyId;
    if (!currentCompanyId) {
      const stored = localStorage.getItem('trakbin_company');
      if (stored) { const p = JSON.parse(stored); currentCompanyId = p.company_id ? Number(p.company_id) : null; }
    }
    if (!currentCompanyId) { console.error('CRITICAL: no company_id in store or localStorage.'); setLoading(false); return; }

    setLoading(true);
    try {
      const [trucksData, driversData, buildingsData, collectionsData, issuesData] = await Promise.all([
        supabase.from('trucks').select('*').eq('company_id', currentCompanyId).order('truck_id', { ascending: true }),
        supabase.from('users').select('*').eq('account_type', 'Driver').eq('company_id', currentCompanyId).order('employee_id', { ascending: true }),
        supabase.from('Buildings').select('*').eq('company_id', currentCompanyId).order('custom_id', { ascending: true }),
        supabase.from('collections').select('*').eq('company_id', currentCompanyId).order('collection_date', { ascending: false }),
        supabase.from('environmental_issues').select('*').eq('company_id', currentCompanyId).order('created_at', { ascending: false }),
      ]);
      if (trucksData.data) setTrucks(trucksData.data);
      if (driversData.data) setDrivers(driversData.data);
      if (buildingsData.data) setBuildings(buildingsData.data);
      if (collectionsData.data) setCollections(collectionsData.data);
      if (issuesData.data) setIssues(issuesData.data);
    } catch (error) { console.error('Error fetching data:', error); }
    finally { setLoading(false); }
  };

  const generateEmployeeId = () => `DRV-${Math.floor(1000 + Math.random() * 9000)}`;
  const generateTruckId = () => `TRK-${Math.floor(1000 + Math.random() * 9000)}`;

  const handleSaveDriver = async (formData: any) => {
    let currentCompanyId = tenant.companyId;
    if (!currentCompanyId) { const s = localStorage.getItem('trakbin_company'); if (s) currentCompanyId = JSON.parse(s).company_id ? Number(JSON.parse(s).company_id) : null; }
    // verification gate — email + profile certify; documents do NOT gate.
    const { data: haulerRow } = await supabase.from('haulers').select('*').eq('id', currentCompanyId).maybeSingle();
    if (haulerRow && !canOperate(haulerRow)) { addNotification('Confirm your email and complete your profile before adding drivers.', 'warning'); return { success: false, message: 'Verification required' }; }
    const employeeId = generateEmployeeId();
    const generatedPassword = `Trakbin${Math.floor(1000 + Math.random() * 9000)}!`;
    try {
      const { error: userError } = await supabase.from('users').insert([{ email: formData.email, employee_id: employeeId, password: generatedPassword, account_type: 'Driver', company_name: companyName, full_name: formData.full_name, phone: formData.phone, company_id: currentCompanyId }]);
      if (userError) throw userError;
      const { error: driverError } = await supabase.from('drivers').insert([{ employee_id: employeeId, full_name: formData.full_name, email: formData.email, phone: formData.phone, license_number: formData.license_number, company_name: companyName, company_id: currentCompanyId }]);
      if (driverError) throw driverError;
      addDispatchEvent({ type: 'driver_added', truck_id: 'N/A', driver_name: formData.full_name, message: `New driver registered: ${formData.full_name} (${employeeId})` });
      addNotification(`Driver ${formData.full_name} created successfully!`, 'success');
      fetchData();
      return { success: true, message: `✅ Driver Created Successfully!\n\n Employee ID: ${employeeId}\n Email: ${formData.email}\n Password: ${generatedPassword}\n\nPlease save these credentials!`, employeeId, password: generatedPassword };
    } catch (error: any) { addNotification(`Failed to create driver: ${error.message}`, 'error'); return { success: false, message: error.message }; }
  };

  const handleSaveTruck = async (formData: any) => {
    let currentCompanyId = tenant.companyId;
    if (!currentCompanyId) { const s = localStorage.getItem('trakbin_company'); if (s) currentCompanyId = JSON.parse(s).company_id ? Number(JSON.parse(s).company_id) : null; }
    const truckId = generateTruckId();
    try {
      const { error } = await supabase.from('trucks').insert([{ truck_id: truckId, license_plate: formData.license_plate, driver_name: formData.driver_name, truck_type: formData.truck_type, capacity: formData.capacity, status: formData.status, company_name: companyName, company_id: currentCompanyId }]);
      if (error) throw error;
      addDispatchEvent({ type: 'truck_added', truck_id: truckId, driver_name: formData.driver_name || 'Unassigned', message: `New truck registered: ${truckId} (${formData.license_plate})` });
      addNotification(`Truck ${truckId} registered successfully!`, 'success');
      fetchData();
      return { success: true, message: `✅ Truck Registered Successfully!\n\n Truck ID: ${truckId}`, truckId };
    } catch (error: any) { addNotification(`Failed to register truck: ${error.message}`, 'error'); return { success: false, message: error.message }; }
  };

  // ── command-strip metrics, all real, all live ─────────────────────────
  const onRoad = useMemo(() => liveFleet.filter((t) => t.status === 'on_route' || t.status === 'active').length, [liveFleet]);
  const pendingRequests = serviceRequests.length;
  const served = buildings.length;
  const treasury = earnings?.available ?? null;

  const allNavItems = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard, roles: ['company', 'admin', 'government'] },
    { id: 'service-requests', label: 'Service Requests', icon: Inbox, roles: ['company', 'admin'] },
    { id: 'earnings', label: 'Finance', icon: Wallet, roles: ['company', 'admin'] },
    { id: 'fleet', label: 'Fleet', icon: Truck, roles: ['company', 'admin'] },
    { id: 'drivers', label: 'Drivers', icon: Users, roles: ['company', 'admin'] },
    { id: 'buildings', label: 'Buildings', icon: Building2, roles: ['company', 'admin'] },
    { id: 'assignments', label: 'Assignments', icon: ClipboardList, roles: ['company', 'admin'] },
    { id: 'mission', label: 'Mission Map', icon: Map, roles: ['company', 'admin'] },
    { id: 'verification', label: 'Verification', icon: CheckCircle2, roles: ['company', 'admin', 'government'] },
    { id: 'issues', label: 'Issues', icon: AlertTriangle, roles: ['company', 'admin', 'government', 'caretaker'] },
    { id: 'analytics', label: 'Analytics', icon: BarChart3, roles: ['company', 'admin', 'government'] },
    { id: 'maintenance', label: 'Maintenance', icon: Wrench, roles: ['company', 'admin'] },
    { id: 'zones', label: 'Zones', icon: Globe, roles: ['company', 'admin'] },
    { id: 'settings', label: 'Settings', icon: Settings, roles: ['company', 'admin', 'government', 'caretaker'] },
  ];

  const navItems = allNavItems.filter((item) => tenant.role === 'admin' || item.roles.includes(tenant.role || 'company'));

  const filterText = (text: string) => text?.toLowerCase() || '';
  const filteredTrucks = trucks.filter((t) => filterText(t.truck_id).includes(searchFleet.toLowerCase()) || filterText(t.license_plate).includes(searchFleet.toLowerCase()) || filterText(t.driver_name).includes(searchFleet.toLowerCase()));
  const filteredDrivers = drivers.filter((d) => filterText(d.full_name).includes(searchDrivers.toLowerCase()) || filterText(d.employee_id).includes(searchDrivers.toLowerCase()));

  const subtitle: Record<PageView, string> = {
    overview: 'Command deck',
    'service-requests': 'Onboarding queue',
    earnings: 'Treasury & settlements',
    fleet: selectedTruck ? 'Vehicle record' : 'Fleet management',
    drivers: selectedDriver ? 'Driver record' : 'Crew management',
    buildings: 'Building registry',
    assignments: 'Dispatch center',
    mission: 'Live operations map',
    verification: 'Collection verification',
    issues: 'Issue management',
    analytics: 'Performance analytics',
    maintenance: 'Fleet maintenance',
    zones: selectedZone ? 'Zone detail' : 'Zone management',
    settings: 'Company settings',
  };

  const deckStats = [
    { Icon: Truck, label: 'On the road', value: onRoad, accent: 'text-emerald-300', live: onRoad > 0 },
    { Icon: Users, label: 'Crew', value: drivers.length, accent: 'text-emerald-100' },
    { Icon: Building2, label: 'Buildings served', value: served, accent: 'text-emerald-100' },
    { Icon: Inbox, label: 'Pending requests', value: pendingRequests, accent: pendingRequests > 0 ? 'text-amber-300' : 'text-emerald-100', pulse: pendingRequests > 0 },
  ];

  return (
    <AuthGate>
      <div className={`${body.className} relative min-h-screen bg-[#f6f7f6] text-gray-900`}>
        {/* ambient field */}
        <div aria-hidden className="pointer-events-none fixed inset-0 overflow-hidden">
          <div className="absolute inset-0 opacity-[0.5]" style={{ backgroundImage: 'radial-gradient(circle, rgba(16,185,129,0.09) 1px, transparent 1px)', backgroundSize: '26px 26px' }} />
          <div className="absolute inset-x-0 top-0 h-80 bg-gradient-to-b from-emerald-50/70 via-emerald-50/20 to-transparent" />
          <div className="absolute right-0 top-0 h-full w-px bg-gradient-to-b from-transparent via-emerald-200/40 to-transparent" />
        </div>

        <NotificationsPanel />

        {sidebarOpen && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />}

        {/* sidebar */}
        <aside className={`fixed inset-y-0 left-0 z-50 w-64 transform border-r border-gray-200 bg-white transition-transform duration-300 ease-in-out ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}>
          <div className="flex items-center justify-between border-b border-gray-100 p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 shadow-lg shadow-emerald-200"><span className={`${display.className} text-xl font-black text-white`}>T</span></div>
              <div className="min-w-0">
                <p className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400">Operations</p>
                <p className="truncate text-sm font-bold text-gray-900">{companyName}</p>
              </div>
            </div>
            <button onClick={() => setSidebarOpen(false)} className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 lg:hidden"><X size={20} /></button>
          </div>

          <nav className="max-h-[calc(100vh-150px)] space-y-1 overflow-y-auto p-3">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activePage === item.id;
              const badge = item.id === 'service-requests' ? pendingRequests : 0;
              return (
                <button
                  key={item.id}
                  onClick={() => { setActivePage(item.id as PageView); setSelectedDriver(null); setSelectedTruck(null); setSelectedZone(null); setSidebarOpen(false); }}
                  className={`group relative flex w-full items-center gap-3 overflow-hidden rounded-xl px-4 py-2.5 text-xs font-bold uppercase tracking-wide transition-all ${isActive ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-200' : 'text-gray-600 hover:bg-gray-100'}`}
                >
                  {isActive && <motion.span layoutId="navglow" className="absolute inset-0 -z-0 rounded-xl bg-emerald-600" transition={{ type: 'spring', stiffness: 380, damping: 30 }} />}
                  <Icon size={18} className="relative z-10" />
                  <span className="relative z-10 flex-1 text-left">{item.label}</span>
                  {badge > 0 && <span className={`relative z-10 rounded-full px-2 py-0.5 font-mono text-[10px] font-bold ${isActive ? 'bg-white/20 text-white' : 'bg-amber-100 text-amber-700'}`}>{badge}</span>}
                </button>
              );
            })}
          </nav>

          <div className="absolute bottom-0 left-0 right-0 border-t border-gray-100 bg-white p-3">
            <button onClick={() => { localStorage.removeItem('trakbin_company'); router.push('/'); }} className="flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-xs font-bold uppercase tracking-wide text-red-600 transition-all hover:bg-red-50"><LogOut size={18} /> Logout</button>
          </div>
        </aside>

        <main className="relative z-10 flex min-w-0 flex-col lg:pl-64">
          {/* header */}
          <motion.header initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: EASE }} className="sticky top-0 z-30 border-b border-gray-200/70 bg-[#f6f7f6]/85 px-4 py-3 backdrop-blur-md">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button onClick={() => setSidebarOpen(true)} className="rounded-lg p-2 text-gray-700 hover:bg-gray-100 lg:hidden"><Menu size={22} /></button>
                <div>
                  <h1 className={`${display.className} text-xl font-black uppercase tracking-tight text-gray-900`}>
                    {selectedDriver && activePage === 'drivers' ? 'Driver Profile' : selectedTruck && activePage === 'fleet' ? 'Truck Profile' : selectedZone && activePage === 'zones' ? 'Zone Detail' : navItems.find((n) => n.id === activePage)?.label}
                  </h1>
                  <p className="mt-0.5 font-mono text-[11px] font-bold uppercase tracking-[0.2em] text-gray-400">{subtitle[activePage]}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 border-l border-gray-200 pl-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100"><span className={`${display.className} text-sm font-black text-emerald-700`}>{companyName.charAt(0).toUpperCase()}</span></div>
                <div className="hidden sm:block">
                  <p className="text-sm font-bold text-gray-900">{companyName}</p>
                  <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-gray-400">{tenant.role || 'User'}</p>
                </div>
              </div>
            </div>
          </motion.header>

          {/* ── COMMAND STRIP — the company's live posture, on every screen ── */}
          <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: EASE }}
            className="relative mx-4 mt-4 overflow-hidden rounded-[22px] border border-emerald-200/70 bg-emerald-950 p-5 text-white shadow-xl shadow-emerald-950/20 sm:mx-6 sm:p-6 lg:mx-8"
          >
            <div aria-hidden className="pointer-events-none absolute inset-0 opacity-[0.16]" style={{ backgroundImage: 'repeating-radial-gradient(circle at 100% 0%, rgba(255,255,255,0.5) 0 1px, transparent 1px 28px)' }} />
            <div aria-hidden className="pointer-events-none absolute -left-24 top-1/2 h-72 w-72 -translate-y-1/2 rounded-full bg-emerald-500/20 blur-3xl" />
            {/* slow radar sweep */}
            <div aria-hidden className="pointer-events-none absolute right-6 top-1/2 hidden h-24 w-24 -translate-y-1/2 sm:block">
              <motion.div className="absolute inset-0 rounded-full" animate={{ rotate: 360 }} transition={{ duration: 6, repeat: Infinity, ease: 'linear' }} style={{ background: 'conic-gradient(from 0deg, rgba(110,231,183,0.35), transparent 35%)' }} />
              <div className="absolute inset-2 rounded-full border border-emerald-300/20" />
              <div className="absolute inset-5 rounded-full border border-emerald-300/15" />
              <div className="absolute left-1/2 top-1/2 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-emerald-300" />
            </div>
            <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-300/60 to-transparent" />

            <div className="relative z-10 flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              {/* mission status block */}
              <div className="flex items-center gap-4">
                <div className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/15">
                  <Radar className="h-6 w-6 text-emerald-200" />
                  <span className="absolute -right-0.5 -top-0.5 flex h-3 w-3">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex h-3 w-3 rounded-full bg-emerald-400 ring-2 ring-emerald-950" />
                  </span>
                </div>
                <div>
                  <p className="flex items-center gap-2 font-mono text-[11px] font-bold uppercase tracking-[0.22em] text-emerald-200/70">
                    <Radio className="h-3.5 w-3.5" /> Mission control
                  </p>
                  <h2 className={`${display.className} text-lg font-black leading-tight tracking-tight sm:text-xl`}>
                    {onRoad > 0 ? `${onRoad} unit${onRoad === 1 ? '' : 's'} in the field` : 'Fleet standing by'}
                  </h2>
                </div>
              </div>

              {/* live metrics */}
              <motion.div variants={{ hidden: {}, show: { transition: { staggerChildren: 0.06 } } }} initial="hidden" animate="show" className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:flex lg:items-stretch lg:gap-2">
                {deckStats.map((s) => {
                  const Icon = s.Icon;
                  return (
                    <motion.div key={s.label} variants={deckCell} className="relative min-w-[88px] rounded-2xl bg-white/5 px-3.5 py-2.5 ring-1 ring-white/10">
                      <div className="mb-1 flex items-center gap-1.5">
                        <Icon className={`h-3.5 w-3.5 ${s.accent}`} />
                        {s.live && <motion.span className="h-1.5 w-1.5 rounded-full bg-emerald-300" animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 1.4, repeat: Infinity }} />}
                        {s.pulse && <motion.span className="h-1.5 w-1.5 rounded-full bg-amber-300" animate={{ scale: [1, 1.5, 1], opacity: [1, 0.4, 1] }} transition={{ duration: 1.6, repeat: Infinity }} />}
                      </div>
                      <p className={`${display.className} text-2xl font-extrabold leading-none tabular-nums ${s.accent}`}><Counter value={s.value} /></p>
                      <p className="mt-1 font-mono text-[9px] font-bold uppercase tracking-[0.16em] text-emerald-200/55">{s.label}</p>
                    </motion.div>
                  );
                })}
                {/* treasury — distinct, the money posture */}
                <motion.div variants={deckCell} className="col-span-2 flex items-center justify-between rounded-2xl bg-emerald-400/15 px-3.5 py-2.5 ring-1 ring-emerald-300/30 sm:col-span-4 lg:col-span-1">
                  <div>
                    <p className="flex items-center gap-1.5 font-mono text-[9px] font-bold uppercase tracking-[0.16em] text-emerald-200/70"><Wallet className="h-3 w-3" /> Treasury</p>
                    <p className={`${display.className} mt-0.5 text-2xl font-extrabold leading-none tabular-nums text-white`}>
                      {treasury === null ? <span className="inline-block w-20 animate-pulse text-emerald-200/40">—</span> : <Counter value={treasury} prefix="₦" />}
                    </p>
                  </div>
                  <button onClick={() => { setActivePage('earnings'); setSidebarOpen(false); }} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/10 text-emerald-100 ring-1 ring-white/15 transition-colors hover:bg-white/20" title="Open treasury"><ArrowLeft className="h-4 w-4 rotate-180" /></button>
                </motion.div>
              </motion.div>
            </div>
          </motion.section>

          {/* content */}
          <div className="flex-1 p-4 sm:p-6 lg:p-8">
            <motion.div key={activePage + (selectedDriver ? '-drv' : '') + (selectedTruck ? '-trk' : '') + (selectedZone ? '-zn' : '')} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, ease: EASE }}>
              {activePage === 'overview' && (<div className="space-y-4"><CompanyVerificationCard companyId={companyId} /><OverviewPage trucks={trucks} drivers={drivers} buildings={buildings} collections={collections} issues={issues} setActivePage={setActivePage} /></div>)}
              {activePage === 'service-requests' && <ServiceRequestsPage />}
              {activePage === 'earnings' && <FinancePage />}
              {activePage === 'fleet' && !selectedTruck && <FleetPage trucks={filteredTrucks} search={searchFleet} setSearch={setSearchFleet} setShowTruckModal={setShowTruckModal} onSelectTruck={setSelectedTruck} />}
              {activePage === 'fleet' && selectedTruck && <TruckProfile truck={selectedTruck} onBack={() => setSelectedTruck(null)} />}
              {activePage === 'drivers' && !selectedDriver && <DriversPage drivers={filteredDrivers} search={searchDrivers} setSearch={setSearchDrivers} setShowDriverModal={setShowDriverModal} onSelectDriver={setSelectedDriver} />}
              {activePage === 'drivers' && selectedDriver && <DriverProfile driver={selectedDriver} trucks={trucks} onBack={() => setSelectedDriver(null)} />}
              {activePage === 'buildings' && <BuildingsPage buildings={buildings} />}
              {activePage === 'assignments' && <AssignmentsPage trucks={trucks} drivers={drivers} />}
              {activePage === 'mission' && <MissionMapPage buildings={buildings} />}
              {activePage === 'verification' && <VerificationPage />}
              {activePage === 'issues' && <IssuesPage issues={issues} />}
              {activePage === 'analytics' && <AnalyticsPage />}
              {activePage === 'maintenance' && <MaintenancePage trucks={trucks} />}
              {activePage === 'zones' && !selectedZone && <ZonesPage />}
              {activePage === 'zones' && selectedZone && <ZoneDetailsPage zone={selectedZone} buildings={buildings} onBack={() => setSelectedZone(null)} />}
              {activePage === 'settings' && <SettingsPage companyName={companyName} companyId={companyId} />}
            </motion.div>

            <motion.footer initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6, delay: 0.3 }} className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-gray-200/70 pt-6">
              <span className="inline-flex items-center gap-2 text-xs font-semibold text-gray-500">
                <motion.span className="h-2 w-2 rounded-full bg-emerald-500" animate={{ scale: [1, 1.4, 1], opacity: [1, 0.5, 1] }} transition={{ duration: 2, repeat: Infinity }} />
                Operations synced <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-gray-400">· realtime on</span>
              </span>
              <span className="flex items-center gap-2 font-mono text-[11px] font-bold uppercase tracking-[0.2em] text-gray-400"><Activity className="h-3.5 w-3.5 text-emerald-500" /> Trakbin Dispatch</span>
            </motion.footer>
          </div>
        </main>

        <AddDriverModal isOpen={showDriverModal} onClose={() => setShowDriverModal(false)} companyName={companyName} onSubmit={handleSaveDriver} />
        <AddTruckModal isOpen={showTruckModal} onClose={() => setShowTruckModal(false)} companyName={companyName} onSubmit={handleSaveTruck} />

        <ReviewDrawer />
      </div>
    </AuthGate>
  );
}

function TruckProfile({ truck, onBack }: any) {
  return (
    <div className="space-y-4">
      <button onClick={onBack} className="flex items-center gap-2 text-sm font-bold text-gray-600 transition-all hover:text-emerald-600"><ArrowLeft size={18} /> Back to Fleet</button>
      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: EASE }} className="overflow-hidden rounded-[24px] border border-gray-200/80 bg-white shadow-sm">
        <div className="relative overflow-hidden bg-gradient-to-r from-emerald-700 to-emerald-800 p-6 text-white">
          <div aria-hidden className="pointer-events-none absolute inset-0 opacity-[0.16]" style={{ backgroundImage: 'repeating-radial-gradient(circle at 100% 0%, rgba(255,255,255,0.5) 0 1px, transparent 1px 26px)' }} />
          <div className="relative z-10 flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-sm"><Truck className="h-8 w-8 text-white" /></div>
            <div>
              <h2 className={`${display.className} text-2xl font-black uppercase tracking-tight`}>{truck.truck_id || 'Unknown Truck'}</h2>
              <p className="flex items-center gap-2 text-sm font-bold text-emerald-100"><Hash size={14} /> {truck.license_plate || 'No Plate'}</p>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-6 p-6 md:grid-cols-2">
          <div className="space-y-4">
            <h3 className="font-mono text-[11px] font-black uppercase tracking-[0.2em] text-gray-400">Vehicle Details</h3>
            <div className="space-y-3">
              <ProfileRow Icon={Users} tone="bg-emerald-50 text-emerald-600" label="Assigned Driver" value={truck.driver_name || 'Unassigned'} />
              <ProfileRow Icon={Truck} tone="bg-violet-50 text-violet-600" label="Truck Type" value={truck.truck_type || 'N/A'} />
              <ProfileRow Icon={TrendingUp} tone="bg-orange-50 text-orange-600" label="Capacity" value={truck.capacity || 'N/A'} />
              <ProfileRow Icon={CheckCircle2} tone="bg-emerald-50 text-emerald-600" label="Status" value={(truck.status || 'Idle').toUpperCase()} />
            </div>
          </div>
          <div className="space-y-4">
            <h3 className="font-mono text-[11px] font-black uppercase tracking-[0.2em] text-gray-400">Performance</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4"><p className="font-mono text-[10px] font-black uppercase tracking-wider text-emerald-600">Collections</p><p className={`${display.className} mt-1 text-3xl font-black text-emerald-700`}>{truck.collections_today || 0}</p></div>
              <div className="rounded-2xl border border-sky-100 bg-sky-50 p-4"><p className="font-mono text-[10px] font-black uppercase tracking-wider text-sky-600">Efficiency</p><p className={`${display.className} mt-1 text-3xl font-black text-sky-700`}>98<span className="text-sm">%</span></p></div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function DriverProfile({ driver, trucks, onBack }: any) {
  const assignedTruck = trucks.find((t: any) => t.driver_name === driver.full_name);
  return (
    <div className="space-y-4">
      <button onClick={onBack} className="flex items-center gap-2 text-sm font-bold text-gray-600 transition-all hover:text-emerald-600"><ArrowLeft size={18} /> Back to Drivers</button>
      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: EASE }} className="overflow-hidden rounded-[24px] border border-gray-200/80 bg-white shadow-sm">
        <div className="relative overflow-hidden bg-gradient-to-r from-emerald-700 to-emerald-800 p-6 text-white">
          <div aria-hidden className="pointer-events-none absolute inset-0 opacity-[0.16]" style={{ backgroundImage: 'repeating-radial-gradient(circle at 100% 0%, rgba(255,255,255,0.5) 0 1px, transparent 1px 26px)' }} />
          <div className="relative z-10 flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-sm"><span className={`${display.className} text-2xl font-black`}>{(driver.full_name || 'D').charAt(0).toUpperCase()}</span></div>
            <div>
              <h2 className={`${display.className} text-2xl font-black uppercase tracking-tight`}>{driver.full_name || 'Unknown Driver'}</h2>
              <p className="flex items-center gap-2 text-sm font-bold text-emerald-100"><Hash size={14} /> {driver.employee_id}</p>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-6 p-6 md:grid-cols-2">
          <div className="space-y-4">
            <h3 className="font-mono text-[11px] font-black uppercase tracking-[0.2em] text-gray-400">Personal Information</h3>
            <div className="space-y-3">
              <ProfileRow Icon={Users} tone="bg-emerald-50 text-emerald-600" label="Full Name" value={driver.full_name || 'Not provided'} />
              <ProfileRow Icon={Mail} tone="bg-sky-50 text-sky-600" label="Email" value={driver.email || 'Not provided'} />
              <ProfileRow Icon={Phone} tone="bg-emerald-50 text-emerald-600" label="Phone" value={driver.phone || 'Not provided'} />
              <ProfileRow Icon={Hash} tone="bg-orange-50 text-orange-600" label="License Number" value={driver.license_number || 'Not provided'} />
            </div>
          </div>
          <div className="space-y-4">
            <h3 className="font-mono text-[11px] font-black uppercase tracking-[0.2em] text-gray-400">Assigned Vehicle</h3>
            {assignedTruck ? (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                <div className="mb-3 flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100"><Truck className="h-5 w-5 text-emerald-600" /></div><div><p className={`${display.className} text-sm font-black uppercase text-gray-900`}>{assignedTruck.truck_id}</p><p className="text-xs font-bold text-gray-500">{assignedTruck.license_plate}</p></div></div>
                <div className="space-y-2 text-xs"><div className="flex justify-between"><span className="font-black uppercase text-gray-500">Type</span><span className="font-bold text-gray-900">{assignedTruck.truck_type}</span></div><div className="flex justify-between"><span className="font-black uppercase text-gray-500">Status</span><span className="font-bold text-emerald-600">{assignedTruck.status}</span></div></div>
              </div>
            ) : (
              <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4 text-center"><Truck className="mx-auto mb-2 h-8 w-8 text-gray-400" /><p className="text-sm font-bold text-gray-500">No truck assigned</p></div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function ProfileRow({ Icon, tone, label, value }: { Icon: typeof Users; tone: string; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${tone}`}><Icon className="h-4 w-4" /></div>
      <div><p className="font-mono text-[10px] font-black uppercase tracking-wider text-gray-400">{label}</p><p className="text-sm font-bold text-gray-900">{value}</p></div>
    </div>
  );
}