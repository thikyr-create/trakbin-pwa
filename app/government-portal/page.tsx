"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import { 
  LayoutDashboard, Building2, ClipboardList, Truck, Home, AlertTriangle, 
  Trash2, SearchCheck, BarChart3, Leaf, Megaphone, ScrollText, Settings, LogOut, 
  Menu, X, TrendingUp, TrendingDown, Activity, ShieldCheck, Eye, Filter, Plus, ChevronRight, Zap, Phone, Users, DollarSign, MapPin, ArrowLeft, Mail, Hash, Calendar, Briefcase
} from 'lucide-react';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

type PageView = 'overview' | 'companies' | 'compliance' | 'fleet' | 'drivers' | 'buildings' | 'incidents' | 'dumping' | 'inspections' | 'analytics' | 'sustainability' | 'notices' | 'audit' | 'settings';

export default function GovernmentPortal() {
  const router = useRouter();
  const [activePage, setActivePage] = useState<PageView>('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<any>(null);
  const [selectedDriver, setSelectedDriver] = useState<any>(null);
  const [selectedTruck, setSelectedTruck] = useState<any>(null); // NEW: Truck State
  const [dumpingReports, setDumpingReports] = useState<any[]>([]);
  const [companies, setCompanies] = useState<any[]>([]);
  const [drivers, setDrivers] = useState<any[]>([]);
  const [trucks, setTrucks] = useState<any[]>([]);
  const [buildings, setBuildings] = useState<any[]>([]);
  const [collections, setCollections] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [issues, setIssues] = useState<any[]>([]);
  const [govStats, setGovStats] = useState({ companies: 0, collections: 0, issues: 0 });

  const [searchCompanies, setSearchCompanies] = useState('');
  const [searchDrivers, setSearchDrivers] = useState('');
  const [searchTrucks, setSearchTrucks] = useState('');
  const [searchBuildings, setSearchBuildings] = useState('');
  const [searchCollections, setSearchCollections] = useState('');
  const [searchIssues, setSearchIssues] = useState('');

  useEffect(() => {
    const storedOfficial = localStorage.getItem('trakbin_government_official');
    if (!storedOfficial) { router.push('/government'); return; }
  }, [router]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { count: compCount } = await supabase.from('users').select('*', { count: 'exact', head: true }).eq('account_type', 'WasteCompany');
        const { count: collCount } = await supabase.from('collections').select('*', { count: 'exact', head: true });
        const { count: issueCount } = await supabase.from('issues').select('*', { count: 'exact', head: true }).eq('status', 'Open');
        const { data: dumpData } = await supabase.from('issues').select('*').ilike('type', '%dumping%').order('created_at', { ascending: false }).limit(10);
        const { data: companiesData } = await supabase.from('users').select('*').eq('account_type', 'WasteCompany').order('id', { ascending: false });
        const { data: driversData } = await supabase.from('users').select('*').eq('account_type', 'Driver').order('id', { ascending: false });
        const { data: trucksData } = await supabase.from('trucks').select('*').order('id', { ascending: false });
        const { data: buildingsData } = await supabase.from('Buildings').select('*').order('created_at', { ascending: false }).limit(100);
        const { data: collectionsData } = await supabase.from('collections').select('*').order('collection_date', { ascending: false }).limit(100);
        const { data: paymentsData } = await supabase.from('payments').select('*').order('payment_date', { ascending: false }).limit(100);
        const { data: issuesData } = await supabase.from('issues').select('*').order('created_at', { ascending: false }).limit(100);

        setGovStats({ companies: compCount || 0, collections: collCount || 0, issues: issueCount || 0 });
        if (dumpData) setDumpingReports(dumpData);
        if (companiesData) setCompanies(companiesData);
        if (driversData) setDrivers(driversData);
        if (trucksData) setTrucks(trucksData);
        if (buildingsData) setBuildings(buildingsData);
        if (collectionsData) setCollections(collectionsData);
        if (paymentsData) setPayments(paymentsData);
        if (issuesData) setIssues(issuesData);
      } catch (error) { console.error("Error fetching government data:", error); }
    };
    fetchData();
  }, []);

  const navItems = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'companies', label: 'Companies', icon: Building2 },
    { id: 'compliance', label: 'Compliance', icon: ClipboardList },
    { id: 'fleet', label: 'Fleet', icon: Truck },
    { id: 'drivers', label: 'Drivers', icon: Users },
    { id: 'buildings', label: 'Buildings', icon: Home },
    { id: 'incidents', label: 'Incidents', icon: AlertTriangle },
    { id: 'dumping', label: 'Illegal Dumping', icon: Trash2 },
    { id: 'inspections', label: 'Inspections', icon: SearchCheck },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'sustainability', label: 'Sustainability', icon: Leaf },
    { id: 'notices', label: 'Notices', icon: Megaphone },
    { id: 'audit', label: 'Audit Log', icon: ScrollText },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const filterText = (text: string) => text?.toLowerCase() || '';
  const filteredCompanies = companies.filter(c => 
    filterText(c.company_name).includes(searchCompanies.toLowerCase()) || 
    filterText(c.email).includes(searchCompanies.toLowerCase()) ||
    filterText(c.license_number).includes(searchCompanies.toLowerCase())
  );
  const filteredDrivers = drivers.filter(d => 
    filterText(d.full_name).includes(searchDrivers.toLowerCase()) || 
    filterText(d.employee_id).includes(searchDrivers.toLowerCase())
  );
  const filteredTrucks = trucks.filter(t => 
    filterText(t.truck_id).includes(searchTrucks.toLowerCase()) || 
    filterText(t.license_plate).includes(searchTrucks.toLowerCase())
  );
  const filteredBuildings = buildings.filter(b => 
    filterText(b.custom_id).includes(searchBuildings.toLowerCase()) || 
    filterText(b.address).includes(searchBuildings.toLowerCase())
  );
  const filteredCollections = collections.filter(c => 
    filterText(c.building_id).includes(searchCollections.toLowerCase()) || 
    filterText(c.truck_id).includes(searchCollections.toLowerCase())
  );
  const filteredIssues = issues.filter(i => 
    filterText(i.type).includes(searchIssues.toLowerCase()) || 
    filterText(i.location).includes(searchIssues.toLowerCase())
  );

  const getPageTitle = () => {
    if (selectedCompany && activePage === 'companies') return 'Company Profile';
    if (selectedDriver && activePage === 'drivers') return 'Driver Profile';
    if (selectedTruck && activePage === 'fleet') return 'Truck Profile'; // NEW
    return navItems.find(n => n.id === activePage)?.label || '';
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {sidebarOpen && <div className="fixed inset-0 z-40 bg-black/50" onClick={() => setSidebarOpen(false)}></div>}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-slate-200 transform transition-transform duration-300 ease-in-out ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3"><div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-200"><ShieldCheck className="w-6 h-6 text-white" /></div><div><p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Regulatory</p><p className="text-sm font-black text-slate-900">Gov Portal</p></div></div>
          <button onClick={() => setSidebarOpen(false)} className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg"><X size={20} /></button>
        </div>
        <nav className="p-3 space-y-1 overflow-y-auto max-h-[calc(100vh-150px)]">
          {navItems.map((item) => { const Icon = item.icon; const isActive = activePage === item.id; return ( <button key={item.id} onClick={() => { setActivePage(item.id as PageView); setSelectedCompany(null); setSelectedDriver(null); setSelectedTruck(null); setSidebarOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${isActive ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-200' : 'text-slate-600 hover:bg-slate-100'}`}><Icon size={18} /><span className="uppercase tracking-wide text-xs">{item.label}</span></button> ); })}
        </nav>
        <div className="absolute bottom-0 left-0 right-0 p-3 border-t border-slate-100 bg-white"><button onClick={() => { localStorage.removeItem('trakbin_government_official'); router.push('/government'); }} className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-bold text-red-600 hover:bg-red-50 transition-all"><LogOut size={18} /><span className="uppercase tracking-wide text-xs">Logout</span></button></div>
      </aside>

      <main className="min-w-0 flex flex-col">
        <header className="bg-white border-b border-slate-200 sticky top-0 z-30 px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3"><button onClick={() => setSidebarOpen(true)} className="p-2 rounded-lg hover:bg-slate-100 text-slate-700"><Menu size={22} /></button><div><h1 className="text-xl font-black text-slate-900 uppercase tracking-tight">{getPageTitle()}</h1><p className="text-xs font-bold text-slate-500 uppercase tracking-wider mt-0.5">Environmental Command Center</p></div></div>
            <div className="flex items-center gap-3"><button className="p-2 rounded-lg hover:bg-slate-100 text-slate-700 relative"><Megaphone size={20} /><span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full"></span></button><div className="flex items-center gap-3 pl-3 border-l border-slate-200"><div className="w-9 h-9 bg-emerald-100 rounded-xl flex items-center justify-center"><span className="text-emerald-700 font-black text-sm">G</span></div><div className="hidden sm:block"><p className="text-sm font-bold text-slate-900">Inspector</p><p className="text-xs font-bold text-slate-500 uppercase">Ministry of Env</p></div></div></div>
          </div>
        </header>

        <div className="p-4 lg:p-6 flex-1">
          {activePage === 'overview' && <OverviewPage setActivePage={setActivePage} stats={govStats} />}
          {activePage === 'dumping' && <DumpingPage reports={dumpingReports} />}
          {activePage === 'companies' && !selectedCompany && <CompaniesPage companies={filteredCompanies} search={searchCompanies} setSearch={setSearchCompanies} onSelect={setSelectedCompany} />}
          {activePage === 'companies' && selectedCompany && <CompanyProfile company={selectedCompany} onBack={() => setSelectedCompany(null)} />}
          {activePage === 'drivers' && !selectedDriver && <DriversPage drivers={filteredDrivers} search={searchDrivers} setSearch={setSearchDrivers} onSelect={setSelectedDriver} />}
          {activePage === 'drivers' && selectedDriver && <DriverProfile driver={selectedDriver} onBack={() => setSelectedDriver(null)} />}
          {activePage === 'fleet' && !selectedTruck && <FleetPage trucks={filteredTrucks} search={searchTrucks} setSearch={setSearchTrucks} onSelectTruck={setSelectedTruck} />}
          {activePage === 'fleet' && selectedTruck && <TruckProfile truck={selectedTruck} onBack={() => setSelectedTruck(null)} />}
          {activePage === 'buildings' && <BuildingsPage buildings={filteredBuildings} search={searchBuildings} setSearch={setSearchBuildings} />}
          {activePage === 'compliance' && <CollectionsPage collections={filteredCollections} search={searchCollections} setSearch={setSearchCollections} />}
          {activePage === 'incidents' && <IssuesPage issues={filteredIssues} search={searchIssues} setSearch={setSearchIssues} />}
          {activePage === 'analytics' && <AnalyticsPage />}
          {activePage === 'inspections' && <PlaceholderPage title="Inspections" icon={SearchCheck} />}
          {activePage === 'sustainability' && <PlaceholderPage title="Sustainability" icon={Leaf} />}
          {activePage === 'notices' && <PlaceholderPage title="Notices" icon={Megaphone} />}
          {activePage === 'audit' && <PlaceholderPage title="Audit Log" icon={ScrollText} />}
          {activePage === 'settings' && <PlaceholderPage title="Settings" icon={Settings} />}
        </div>
      </main>
    </div>
  );
}

// ============ SEARCH BAR COMPONENT ============
function SearchBar({ placeholder, value, onChange, icon: Icon = SearchCheck }: any) {
  return (
    <div className="relative flex-1 max-w-md w-full">
      <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
      <input 
        type="text" 
        placeholder={placeholder} 
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full pl-9 pr-4 py-2.5 bg-white border-2 border-slate-300 rounded-lg text-sm font-bold text-black placeholder-slate-500 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none shadow-sm" 
        style={{ color: '#000000' }}
      />
      {value && (
        <button onClick={() => onChange('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-600 hover:text-slate-900">
          <X size={14} />
        </button>
      )}
    </div>
  );
}

// ============ PLACEHOLDER PAGE ============
function PlaceholderPage({ title, icon: Icon }: any) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
      <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-4"><Icon className="w-8 h-8 text-emerald-600" /></div>
      <h2 className="text-xl font-black text-slate-900 uppercase mb-2">{title} Module</h2>
      <p className="text-sm font-bold text-slate-500 max-w-md mx-auto">Connected to Supabase. Ready for UI expansion.</p>
    </div>
  );
}

// ============ COMPANY PROFILE PAGE ============
function CompanyProfile({ company, onBack }: any) {
  return (
    <div className="space-y-4">
      <button onClick={onBack} className="flex items-center gap-2 text-sm font-bold text-slate-600 hover:text-emerald-600 transition-all">
        <ArrowLeft size={18} /> Back to Companies
      </button>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 p-6 text-white">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                <Building2 className="w-8 h-8 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-black uppercase">{company.company_name || 'Unknown Company'}</h2>
                <p className="text-sm font-bold text-emerald-100 flex items-center gap-2"><Mail size={14} /> {company.email}</p>
              </div>
            </div>
            <span className="text-xs font-black px-3 py-1.5 rounded-full uppercase bg-white/20 backdrop-blur-sm">Licensed</span>
          </div>
        </div>

        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h3 className="text-xs font-black text-slate-500 uppercase tracking-wider">Business Information</h3>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center shrink-0"><Hash className="w-4 h-4 text-emerald-600" /></div>
                <div><p className="text-xs font-black text-slate-500 uppercase">License Number</p><p className="text-sm font-bold text-slate-900">{company.license_number || 'Not provided'}</p></div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center shrink-0"><Mail className="w-4 h-4 text-blue-600" /></div>
                <div><p className="text-xs font-black text-slate-500 uppercase">Email Address</p><p className="text-sm font-bold text-slate-900">{company.email || 'Not provided'}</p></div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-purple-50 rounded-lg flex items-center justify-center shrink-0"><Phone className="w-4 h-4 text-purple-600" /></div>
                <div><p className="text-xs font-black text-slate-500 uppercase">Phone</p><p className="text-sm font-bold text-slate-900">{company.phone || company.contact_number || 'Not provided'}</p></div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-orange-50 rounded-lg flex items-center justify-center shrink-0"><MapPin className="w-4 h-4 text-orange-600" /></div>
                <div><p className="text-xs font-black text-slate-500 uppercase">Operating Address</p><p className="text-sm font-bold text-slate-900">{company.operating_address || company.address || 'Not provided'}</p></div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center shrink-0"><Calendar className="w-4 h-4 text-slate-600" /></div>
                <div><p className="text-xs font-black text-slate-500 uppercase">Registered On</p><p className="text-sm font-bold text-slate-900">{new Date(company.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p></div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-xs font-black text-slate-500 uppercase tracking-wider">Environmental Compliance</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-100">
                <p className="text-xs font-black text-emerald-600 uppercase">Env. Score</p>
                <p className="text-3xl font-black text-emerald-700 mt-1">95<span className="text-sm">/100</span></p>
              </div>
              <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                <p className="text-xs font-black text-blue-600 uppercase">Compliance</p>
                <p className="text-3xl font-black text-blue-700 mt-1">98<span className="text-sm">%</span></p>
              </div>
              <div className="bg-purple-50 rounded-xl p-4 border border-purple-100">
                <p className="text-xs font-black text-purple-600 uppercase">Active Trucks</p>
                <p className="text-3xl font-black text-purple-700 mt-1">—</p>
              </div>
              <div className="bg-orange-50 rounded-xl p-4 border border-orange-100">
                <p className="text-xs font-black text-orange-600 uppercase">Total Drivers</p>
                <p className="text-3xl font-black text-orange-700 mt-1">—</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============ DRIVER PROFILE PAGE ============
function DriverProfile({ driver, onBack }: any) {
  return (
    <div className="space-y-4">
      <button onClick={onBack} className="flex items-center gap-2 text-sm font-bold text-slate-600 hover:text-emerald-600 transition-all">
        <ArrowLeft size={18} /> Back to Drivers
      </button>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="bg-gradient-to-r from-purple-600 to-purple-700 p-6 text-white">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                <span className="text-white font-black text-2xl">{(driver.full_name || driver.email).charAt(0).toUpperCase()}</span>
              </div>
              <div>
                <h2 className="text-2xl font-black uppercase">{driver.full_name || 'Unknown Driver'}</h2>
                <p className="text-sm font-bold text-purple-100 flex items-center gap-2"><Hash size={14} /> Employee ID: {driver.employee_id || 'N/A'}</p>
              </div>
            </div>
            <span className="text-xs font-black px-3 py-1.5 rounded-full uppercase bg-white/20 backdrop-blur-sm">Active</span>
          </div>
        </div>

        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h3 className="text-xs font-black text-slate-500 uppercase tracking-wider">Personal Information</h3>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-purple-50 rounded-lg flex items-center justify-center shrink-0"><Users className="w-4 h-4 text-purple-600" /></div>
                <div><p className="text-xs font-black text-slate-500 uppercase">Full Name</p><p className="text-sm font-bold text-slate-900">{driver.full_name || 'Not provided'}</p></div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center shrink-0"><Mail className="w-4 h-4 text-blue-600" /></div>
                <div><p className="text-xs font-black text-slate-500 uppercase">Email Address</p><p className="text-sm font-bold text-slate-900">{driver.email || 'Not provided'}</p></div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-green-50 rounded-lg flex items-center justify-center shrink-0"><Phone className="w-4 h-4 text-green-600" /></div>
                <div><p className="text-xs font-black text-slate-500 uppercase">Phone Number</p><p className="text-sm font-bold text-slate-900">{driver.phone || 'Not provided'}</p></div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-orange-50 rounded-lg flex items-center justify-center shrink-0"><MapPin className="w-4 h-4 text-orange-600" /></div>
                <div><p className="text-xs font-black text-slate-500 uppercase">Address</p><p className="text-sm font-bold text-slate-900">{driver.address || 'Not provided'}</p></div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-xs font-black text-slate-500 uppercase tracking-wider">Professional Details</h3>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-indigo-50 rounded-lg flex items-center justify-center shrink-0"><Briefcase className="w-4 h-4 text-indigo-600" /></div>
                <div><p className="text-xs font-black text-slate-500 uppercase">Driving License</p><p className="text-sm font-bold text-slate-900">{driver.license_number || 'Not provided'}</p></div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-teal-50 rounded-lg flex items-center justify-center shrink-0"><Truck className="w-4 h-4 text-teal-600" /></div>
                <div><p className="text-xs font-black text-slate-500 uppercase">Assigned Company</p><p className="text-sm font-bold text-slate-900">{driver.company_name || 'Unassigned'}</p></div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center shrink-0"><Calendar className="w-4 h-4 text-slate-600" /></div>
                <div><p className="text-xs font-black text-slate-500 uppercase">Registered On</p><p className="text-sm font-bold text-slate-900">{new Date(driver.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p></div>
              </div>
            </div>

            <h3 className="text-xs font-black text-slate-500 uppercase tracking-wider pt-4">Performance Metrics</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-100">
                <p className="text-xs font-black text-emerald-600 uppercase">Performance</p>
                <p className="text-3xl font-black text-emerald-700 mt-1">98<span className="text-sm">%</span></p>
              </div>
              <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                <p className="text-xs font-black text-blue-600 uppercase">Collections</p>
                <p className="text-3xl font-black text-blue-700 mt-1">—</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============ TRUCK PROFILE PAGE (NEW!) ============
function TruckProfile({ truck, onBack }: any) {
  const getStatusColor = (status: string) => { 
    if (status === 'active') return 'bg-green-100 text-green-700'; 
    if (status === 'maintenance') return 'bg-orange-100 text-orange-700'; 
    return 'bg-slate-100 text-slate-700'; 
  };

  return (
    <div className="space-y-4">
      <button onClick={onBack} className="flex items-center gap-2 text-sm font-bold text-slate-600 hover:text-emerald-600 transition-all">
        <ArrowLeft size={18} /> Back to Fleet
      </button>
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6 text-white">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                <Truck className="w-8 h-8 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-black uppercase">{truck.truck_id || 'Unknown Truck'}</h2>
                <p className="text-sm font-bold text-blue-100 flex items-center gap-2"><Hash size={14} /> {truck.license_plate || 'No Plate'}</p>
              </div>
            </div>
            <span className={`text-xs font-black px-3 py-1.5 rounded-full uppercase ${truck.status === 'active' ? 'bg-green-500 text-white' : truck.status === 'maintenance' ? 'bg-orange-500 text-white' : 'bg-slate-500 text-white'}`}>
              {truck.status || 'IDLE'}
            </span>
          </div>
        </div>
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h3 className="text-xs font-black text-slate-500 uppercase tracking-wider">Vehicle Details</h3>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center shrink-0"><Users className="w-4 h-4 text-blue-600" /></div>
                <div><p className="text-xs font-black text-slate-500 uppercase">Assigned Driver</p><p className="text-sm font-bold text-slate-900">{truck.driver_name || 'Unassigned'}</p></div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-purple-50 rounded-lg flex items-center justify-center shrink-0"><Truck className="w-4 h-4 text-purple-600" /></div>
                <div><p className="text-xs font-black text-slate-500 uppercase">Truck Type</p><p className="text-sm font-bold text-slate-900">{truck.truck_type || 'N/A'}</p></div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-orange-50 rounded-lg flex items-center justify-center shrink-0"><TrendingUp className="w-4 h-4 text-orange-600" /></div>
                <div><p className="text-xs font-black text-slate-500 uppercase">Capacity</p><p className="text-sm font-bold text-slate-900">{truck.capacity || 'N/A'}</p></div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center shrink-0"><Calendar className="w-4 h-4 text-slate-600" /></div>
                <div><p className="text-xs font-black text-slate-500 uppercase">Operating Company</p><p className="text-sm font-bold text-slate-900">{truck.company_name || 'Platform Fleet'}</p></div>
              </div>
            </div>
          </div>
          <div className="space-y-4">
            <h3 className="text-xs font-black text-slate-500 uppercase tracking-wider">Performance Metrics</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-100">
                <p className="text-xs font-black text-emerald-600 uppercase">Collections</p>
                <p className="text-3xl font-black text-emerald-700 mt-1">{truck.collections_today || 0}</p>
              </div>
              <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                <p className="text-xs font-black text-blue-600 uppercase">Efficiency</p>
                <p className="text-3xl font-black text-blue-700 mt-1">98<span className="text-sm">%</span></p>
              </div>
            </div>
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
              <p className="text-xs font-black text-slate-500 uppercase mb-2">Maintenance Status</p>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${truck.status === 'maintenance' ? 'bg-orange-500' : 'bg-emerald-500'}`}></div>
                <p className="text-sm font-bold text-slate-900">{truck.status === 'maintenance' ? 'In Maintenance' : 'Healthy - No issues'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============ OVERVIEW PAGE ============
function OverviewPage({ setActivePage, stats }: any) {
  const kpis = [ { label: 'Licensed Companies', value: stats.companies, sub: 'Registered', icon: Building2, color: 'emerald', page: 'companies' }, { label: 'Total Collections', value: stats.collections, sub: 'Platform Wide', icon: ClipboardList, color: 'blue', page: 'compliance' }, { label: 'Open Issues', value: stats.issues, sub: 'Needs Action', icon: AlertTriangle, color: 'red', page: 'incidents' } ];
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">{kpis.map((kpi, idx) => { const Icon = kpi.icon; return ( <button key={idx} onClick={() => setActivePage(kpi.page)} className="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-lg hover:-translate-y-1 transition-all text-left group"><div className={`w-12 h-12 bg-${kpi.color}-100 rounded-xl flex items-center justify-center mb-3`}><Icon className={`w-6 h-6 text-${kpi.color}-600`} /></div><p className="text-xs font-black text-slate-500 uppercase mb-1">{kpi.label}</p><p className="text-3xl font-black text-slate-900">{kpi.value}</p><p className={`text-xs font-bold text-${kpi.color}-600 mt-1`}>{kpi.sub}</p></button> ); })}</div>
      <div className="bg-gradient-to-br from-emerald-600 to-emerald-800 rounded-xl p-6 text-white"><div className="flex items-center gap-2 mb-2"><Zap className="w-5 h-5" /><h2 className="text-sm font-black uppercase">Early Warning System</h2></div><p className="text-2xl font-black mb-2">System Active</p><p className="text-sm font-bold text-emerald-100">Monitoring {stats.companies} companies for compliance drops.</p></div>
    </div>
  );
}

// ============ ILLEGAL DUMPING PAGE ============
function DumpingPage({ reports }: any) {
  const getStatusColor = (status: string) => { if (status === 'Verified') return 'bg-blue-100 text-blue-700'; if (status === 'Assigned') return 'bg-purple-100 text-purple-700'; if (status === 'Resolved') return 'bg-emerald-100 text-emerald-700'; return 'bg-orange-100 text-orange-700'; };
  return (
    <div className="space-y-4">
      <div className="bg-gradient-to-br from-red-600 to-red-800 rounded-xl p-6 text-white flex items-center gap-4"><div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-sm"><Trash2 className="w-8 h-8 text-white" /></div><div><h2 className="text-xl font-black uppercase mb-1">Illegal Dumping Command</h2><p className="text-sm font-bold text-red-100">{reports.length} Recent Reports Loaded from Database</p></div></div>
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden"><div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between"><h2 className="text-xs font-black text-slate-900 uppercase">Recent Reports</h2></div><div className="divide-y divide-slate-100">{reports.length === 0 ? ( <div className="p-8 text-center text-sm font-bold text-slate-500">No illegal dumping reports recorded yet.</div> ) : ( reports.map((r: any, idx: number) => ( <div key={idx} className="px-4 py-4 flex items-center justify-between hover:bg-slate-50 transition-all cursor-pointer"><div className="flex items-center gap-4"><div className={`w-10 h-10 rounded-lg flex items-center justify-center ${r.severity === 'Critical' ? 'bg-red-100' : r.severity === 'High' ? 'bg-orange-100' : 'bg-yellow-100'}`}><AlertTriangle className={`w-5 h-5 ${r.severity === 'Critical' ? 'text-red-600' : r.severity === 'High' ? 'text-orange-600' : 'text-yellow-600'}`} /></div><div><p className="text-sm font-black text-slate-900 uppercase">{r.location}</p><p className="text-xs font-bold text-slate-500">ID: {r.id} • Reported by {r.reported_by} • {new Date(r.created_at).toLocaleDateString()}</p></div></div><div className="flex items-center gap-3"><span className={`text-xs font-black px-2 py-1 rounded-full uppercase ${getStatusColor(r.status)}`}>{r.status}</span><button className="p-2 hover:bg-slate-100 rounded-lg"><Eye size={16} className="text-slate-500" /></button></div></div> )) )}</div></div>
    </div>
  );
}

// ============ COMPANIES PAGE ============
function CompaniesPage({ companies, search, setSearch, onSelect }: any) {
  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <SearchBar placeholder="Search companies by name, email, or license..." value={search} onChange={setSearch} />
        <p className="text-xs font-black text-slate-500 uppercase">{companies.length} Companies Found</p>
      </div>
      {companies.length === 0 ? ( <div className="bg-white rounded-xl border border-slate-200 p-12 text-center"><Building2 className="w-12 h-12 text-slate-300 mx-auto mb-4" /><p className="text-sm font-bold text-slate-500">No companies found.</p></div> ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">{companies.map((c: any, idx: number) => ( <div key={c.id || idx} onClick={() => onSelect(c)} className="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-lg transition-all cursor-pointer group"><div className="flex items-start justify-between mb-4"><div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center"><Building2 className="w-6 h-6 text-emerald-600" /></div><span className="text-xs font-black px-2 py-1 rounded-full uppercase bg-emerald-100 text-emerald-700">Licensed</span></div><h3 className="text-lg font-black text-slate-900 uppercase mb-1 truncate">{c.company_name || 'Unknown Company'}</h3><p className="text-xs font-bold text-slate-500 truncate mb-4">{c.email}</p><div className="mt-4 pt-4 border-t border-slate-100 space-y-2"><div className="flex justify-between text-xs"><span className="font-black text-slate-500 uppercase">License</span><span className="font-bold truncate ml-2">{c.license_number || 'N/A'}</span></div></div><div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between"><div><p className="text-xs font-black text-slate-500 uppercase">Env. Score</p><p className="text-lg font-black text-emerald-600">95/100</p></div><ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-emerald-600 transition-all" /></div></div> ))}</div>
      )}
    </div>
  );
}

// ============ DRIVERS PAGE ============
function DriversPage({ drivers, search, setSearch, onSelect }: any) {
  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"><SearchBar placeholder="Search drivers by name or ID..." value={search} onChange={setSearch} /><p className="text-xs font-black text-slate-500 uppercase">{drivers.length} Drivers Found</p></div>
      {drivers.length === 0 ? ( <div className="bg-white rounded-xl border border-slate-200 p-12 text-center"><Users className="w-12 h-12 text-slate-300 mx-auto mb-4" /><p className="text-sm font-bold text-slate-500">No drivers found.</p></div> ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">{drivers.map((d: any, idx: number) => ( <div key={d.id || idx} onClick={() => onSelect(d)} className="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-lg transition-all cursor-pointer group"><div className="flex items-start justify-between mb-4"><div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center"><span className="text-purple-700 font-black text-lg">{(d.full_name || d.email).charAt(0).toUpperCase()}</span></div><span className="text-xs font-black px-2 py-1 rounded-full uppercase bg-emerald-100 text-emerald-700">Active</span></div><h3 className="text-lg font-black text-slate-900 uppercase mb-1 truncate">{d.full_name || 'Unknown Driver'}</h3><p className="text-xs font-bold text-slate-500 truncate mb-4">ID: {d.employee_id || 'N/A'}</p><div className="mt-4 pt-4 border-t border-slate-100 space-y-2"><div className="flex items-center gap-2 text-xs"><Phone className="w-3 h-3 text-slate-400" /><span className="font-bold text-slate-700 truncate">{d.phone || 'No phone'}</span></div></div><div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between"><div><p className="text-xs font-black text-slate-500 uppercase">Performance</p><p className="text-lg font-black text-emerald-600">98%</p></div><ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-emerald-600 transition-all" /></div></div> ))}</div>
      )}
    </div>
  );
}

// ============ FLEET PAGE (UPDATED!) ============
function FleetPage({ trucks, search, setSearch, onSelectTruck }: any) {
  const getStatusColor = (status: string) => { if (status === 'active') return 'bg-emerald-100 text-emerald-700'; if (status === 'maintenance') return 'bg-orange-100 text-orange-700'; return 'bg-slate-100 text-slate-700'; };
  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <SearchBar placeholder="Search trucks by ID, plate, or driver..." value={search} onChange={setSearch} />
        <p className="text-xs font-black text-slate-500 uppercase">{trucks.length} Trucks Found</p>
      </div>
      {trucks.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center"><Truck className="w-12 h-12 text-slate-300 mx-auto mb-4" /><p className="text-sm font-bold text-slate-500">No trucks found.</p></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {trucks.map((t: any, idx: number) => (
            <div key={t.id || idx} onClick={() => onSelectTruck(t)} className="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-lg hover:-translate-y-1 transition-all cursor-pointer group">
              <div className="flex items-start justify-between mb-4"><div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center"><Truck className="w-6 h-6 text-blue-600" /></div><span className={`text-xs font-black px-2 py-1 rounded-full uppercase ${getStatusColor(t.status)}`}>{t.status || 'IDLE'}</span></div>
              <h3 className="text-lg font-black text-slate-900 uppercase mb-1 truncate">{t.truck_id || 'Unknown Truck'}</h3>
              <p className="text-xs font-bold text-slate-500 truncate mb-4">{t.license_plate || 'No Plate'}</p>
              <div className="mt-4 pt-4 border-t border-slate-100 space-y-2"><div className="flex justify-between text-xs"><span className="font-black text-slate-500 uppercase">Driver</span><span className="font-bold truncate ml-2 text-black">{t.driver_name || 'Unassigned'}</span></div></div>
              <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between"><div><p className="text-xs font-black text-slate-500 uppercase">Capacity</p><p className="text-lg font-black text-blue-600">{t.capacity || 'N/A'}</p></div><ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-blue-600 transition-all" /></div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ============ BUILDINGS PAGE ============
function BuildingsPage({ buildings, search, setSearch }: any) {
  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"><SearchBar placeholder="Search buildings by ID or address..." value={search} onChange={setSearch} /><p className="text-xs font-black text-slate-500 uppercase">{buildings.length} Buildings Found</p></div>
      {buildings.length === 0 ? ( <div className="bg-white rounded-xl border border-slate-200 p-12 text-center"><Home className="w-12 h-12 text-slate-300 mx-auto mb-4" /><p className="text-sm font-bold text-slate-500">No buildings found.</p></div> ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden"><div className="overflow-x-auto"><table className="w-full text-left"><thead className="bg-slate-50 border-b border-slate-200"><tr><th className="px-6 py-3 text-xs font-black text-slate-500 uppercase">Building ID</th><th className="px-6 py-3 text-xs font-black text-slate-500 uppercase">Address</th><th className="px-6 py-3 text-xs font-black text-slate-500 uppercase">Type</th><th className="px-6 py-3 text-xs font-black text-slate-500 uppercase">Status</th><th className="px-6 py-3 text-xs font-black text-slate-500 uppercase">Payment</th></tr></thead><tbody className="divide-y divide-slate-100">{buildings.map((b: any, idx: number) => ( <tr key={b.id || idx} className="hover:bg-slate-50 transition-all"><td className="px-6 py-4 text-sm font-black text-slate-900 uppercase">{b.custom_id || 'N/A'}</td><td className="px-6 py-4 text-sm font-bold text-slate-700 truncate max-w-xs">{b.address || 'No address'}</td><td className="px-6 py-4 text-sm font-bold text-slate-700">{b.building_type || 'N/A'}</td><td className="px-6 py-4"><span className={`text-xs font-black px-2 py-1 rounded-full uppercase ${b.status === 'picked_up' ? 'bg-emerald-100 text-emerald-700' : 'bg-orange-100 text-orange-700'}`}>{b.status || 'Pending'}</span></td><td className="px-6 py-4"><span className={`text-xs font-black px-2 py-1 rounded-full uppercase ${b.payment_status === 'paid' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>{b.payment_status || 'Unpaid'}</span></td></tr> ))}</tbody></table></div></div>
      )}
    </div>
  );
}

// ============ COLLECTIONS PAGE ============
function CollectionsPage({ collections, search, setSearch }: any) {
  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"><SearchBar placeholder="Search collections by building or truck..." value={search} onChange={setSearch} /><p className="text-xs font-black text-slate-500 uppercase">{collections.length} Collections Found</p></div>
      {collections.length === 0 ? ( <div className="bg-white rounded-xl border border-slate-200 p-12 text-center"><ClipboardList className="w-12 h-12 text-slate-300 mx-auto mb-4" /><p className="text-sm font-bold text-slate-500">No collections found.</p></div> ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden"><div className="overflow-x-auto"><table className="w-full text-left"><thead className="bg-slate-50 border-b border-slate-200"><tr><th className="px-6 py-3 text-xs font-black text-slate-500 uppercase">Date</th><th className="px-6 py-3 text-xs font-black text-slate-500 uppercase">Building</th><th className="px-6 py-3 text-xs font-black text-slate-500 uppercase">Truck</th><th className="px-6 py-3 text-xs font-black text-slate-500 uppercase">Driver</th><th className="px-6 py-3 text-xs font-black text-slate-500 uppercase">Status</th></tr></thead><tbody className="divide-y divide-slate-100">{collections.map((c: any, idx: number) => ( <tr key={c.id || idx} className="hover:bg-slate-50 transition-all"><td className="px-6 py-4 text-sm font-bold text-slate-700">{new Date(c.collection_date).toLocaleDateString()}</td><td className="px-6 py-4 text-sm font-black text-slate-900 uppercase">{c.building_id || 'N/A'}</td><td className="px-6 py-4 text-sm font-bold text-slate-700">{c.truck_id || 'N/A'}</td><td className="px-6 py-4 text-sm font-bold text-slate-700">{c.driver_id || 'N/A'}</td><td className="px-6 py-4"><span className="text-xs font-black px-2 py-1 rounded-full uppercase bg-emerald-100 text-emerald-700">{c.status || 'Completed'}</span></td></tr> ))}</tbody></table></div></div>
      )}
    </div>
  );
}

// ============ ISSUES PAGE ============
function IssuesPage({ issues, search, setSearch }: any) {
  const getSeverityColor = (sev: string) => { if (sev === 'Critical') return 'bg-red-100 text-red-700'; if (sev === 'High') return 'bg-orange-100 text-orange-700'; if (sev === 'Medium') return 'bg-yellow-100 text-yellow-700'; return 'bg-blue-100 text-blue-700'; };
  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"><SearchBar placeholder="Search issues by type or location..." value={search} onChange={setSearch} /><p className="text-xs font-black text-slate-500 uppercase">{issues.length} Issues Found</p></div>
      {issues.length === 0 ? ( <div className="bg-white rounded-xl border border-slate-200 p-12 text-center"><AlertTriangle className="w-12 h-12 text-slate-300 mx-auto mb-4" /><p className="text-sm font-bold text-slate-500">No issues found.</p></div> ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden"><div className="overflow-x-auto"><table className="w-full text-left"><thead className="bg-slate-50 border-b border-slate-200"><tr><th className="px-6 py-3 text-xs font-black text-slate-500 uppercase">Date</th><th className="px-6 py-3 text-xs font-black text-slate-500 uppercase">Type</th><th className="px-6 py-3 text-xs font-black text-slate-500 uppercase">Location</th><th className="px-6 py-3 text-xs font-black text-slate-500 uppercase">Severity</th><th className="px-6 py-3 text-xs font-black text-slate-500 uppercase">Status</th></tr></thead><tbody className="divide-y divide-slate-100">{issues.map((i: any, idx: number) => ( <tr key={i.id || idx} className="hover:bg-slate-50 transition-all"><td className="px-6 py-4 text-sm font-bold text-slate-700">{new Date(i.created_at).toLocaleDateString()}</td><td className="px-6 py-4 text-sm font-black text-slate-900 uppercase">{i.type || 'N/A'}</td><td className="px-6 py-4 text-sm font-bold text-slate-700 truncate max-w-xs">{i.location || 'N/A'}</td><td className="px-6 py-4"><span className={`text-xs font-black px-2 py-1 rounded-full uppercase ${getSeverityColor(i.severity)}`}>{i.severity || 'Medium'}</span></td><td className="px-6 py-4"><span className={`text-xs font-black px-2 py-1 rounded-full uppercase ${i.status === 'Open' ? 'bg-red-100 text-red-700' : i.status === 'Resolved' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'}`}>{i.status}</span></td></tr> ))}</tbody></table></div></div>
      )}
    </div>
  );
}

// ============ ANALYTICS PAGE ============
function AnalyticsPage() {
  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl border border-slate-200 p-6"><h3 className="text-xs font-black text-slate-900 uppercase mb-4">Compliance Trend (6 Months)</h3><div className="flex items-end gap-2 h-48">{[82, 85, 88, 91, 94, 96.8].map((h, idx) => ( <div key={idx} className="flex-1 flex flex-col items-center gap-2"><div className="w-full bg-emerald-600 rounded-t-lg transition-all hover:bg-emerald-700" style={{ height: `${h}%` }}></div><span className="text-xs font-black text-slate-500 uppercase">{['J','F','M','A','M','J'][idx]}</span></div> ))}</div></div>
    </div>
  );
}