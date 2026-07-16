"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import { 
  LayoutDashboard, Truck, Users, MapPin, ClipboardList, CheckCircle2, 
  AlertTriangle, BarChart3, Wrench, Globe, Settings, LogOut, Plus, 
  TrendingUp, Clock, Navigation, Phone, Activity, Menu, X, Map, Building2,
  ArrowLeft, Mail, Hash, Save, Search
} from 'lucide-react';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

type PageView = 'overview' | 'fleet' | 'drivers' | 'buildings' | 'assignments' | 'mission' | 'verification' | 'issues' | 'analytics' | 'maintenance' | 'zones' | 'settings';

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
  const [saving, setSaving] = useState(false);
  
  const [driverForm, setDriverForm] = useState({ full_name: '', email: '', phone: '', license_number: '' });
  const [truckForm, setTruckForm] = useState({ license_plate: '', driver_name: '', truck_type: 'Compactor', capacity: '', status: 'active' });
  const [settingsForm, setSettingsForm] = useState({ email: '', phone: '', password: '' });

  // Search States
  const [searchFleet, setSearchFleet] = useState('');
  const [searchDrivers, setSearchDrivers] = useState('');

  useEffect(() => {
    const storedCompany = localStorage.getItem('trakbin_company');
    if (!storedCompany) { router.push('/auth'); return; }
    const userData = JSON.parse(storedCompany);
    setCompanyName(userData.company_name || 'Waste Company');
    setCompanyId(userData.id || '');
    setSettingsForm({ email: userData.email || '', phone: userData.phone || '', password: '' });
    fetchData();
  }, [router]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: trucksData } = await supabase.from('trucks').select('*').order('truck_id', { ascending: true });
      const { data: driversData } = await supabase.from('users').select('*').eq('account_type', 'Driver').eq('company_name', companyName).order('employee_id', { ascending: true });
      const { data: buildingsData } = await supabase.from('Buildings').select('*').order('custom_id', { ascending: true });
      const { data: collectionsData } = await supabase.from('collections').select('*').order('collection_date', { ascending: false });
      const { data: issuesData } = await supabase.from('issues').select('*').order('created_at', { ascending: false });

      if (trucksData) setTrucks(trucksData);
      if (driversData) setDrivers(driversData);
      if (buildingsData) setBuildings(buildingsData);
      if (collectionsData) setCollections(collectionsData);
      if (issuesData) setIssues(issuesData);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const generateEmployeeId = () => `DRV-${Math.floor(1000 + Math.random() * 9000)}`;
  const generateTruckId = () => `TRK-${Math.floor(1000 + Math.random() * 9000)}`;

  const handleSaveDriver = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    
    const employeeId = generateEmployeeId();
    const generatedPassword = `Trakbin${Math.floor(1000 + Math.random() * 9000)}!`;
    
    try {
      const { error: userError } = await supabase.from('users').insert([{ 
        email: driverForm.email, 
        employee_id: employeeId, 
        password: generatedPassword, 
        account_type: 'Driver', 
        company_name: companyName,
        full_name: driverForm.full_name,
        phone: driverForm.phone
      }]);
      
      if (userError) throw userError;
      
      const { error: driverError } = await supabase.from('drivers').insert([{
        employee_id: employeeId, 
        full_name: driverForm.full_name,
        email: driverForm.email,
        phone: driverForm.phone, 
        license_number: driverForm.license_number,
        company_name: companyName
      }]);
      
      if (driverError) throw driverError;
      
      setShowDriverModal(false); 
      setDriverForm({ full_name: '', email: '', phone: '', license_number: '' }); 
      alert(`✅ Driver Created Successfully!\n\n🆔 Employee ID: ${employeeId}\n📧 Email: ${driverForm.email}\n🔑 Password: ${generatedPassword}\n\nPlease save these credentials!`);
      fetchData(); 
    } catch (error: any) {
      alert('Error: ' + error.message);
    }
    setSaving(false);
  };

  const handleSaveTruck = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    
    const truckId = generateTruckId();
    
    try {
      const { error } = await supabase.from('trucks').insert([{
        truck_id: truckId,
        license_plate: truckForm.license_plate,
        driver_name: truckForm.driver_name,
        truck_type: truckForm.truck_type,
        capacity: truckForm.capacity,
        status: truckForm.status,
        company_name: companyName
      }]);
      
      if (error) throw error;
      
      setShowTruckModal(false); 
      setTruckForm({ license_plate: '', driver_name: '', truck_type: 'Compactor', capacity: '', status: 'active' }); 
      alert(`✅ Truck Registered Successfully!\n\n🚛 Truck ID: ${truckId}`);
      fetchData(); 
    } catch (error: any) {
      alert('Error: ' + error.message);
    }
    setSaving(false);
  };

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

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-50"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div></div>;

  const navItems = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'fleet', label: 'Fleet', icon: Truck },
    { id: 'drivers', label: 'Drivers', icon: Users },
    { id: 'buildings', label: 'Buildings', icon: Building2 },
    { id: 'assignments', label: 'Assignments', icon: ClipboardList },
    { id: 'mission', label: 'Mission Map', icon: Map },
    { id: 'verification', label: 'Verification', icon: CheckCircle2 },
    { id: 'issues', label: 'Issues', icon: AlertTriangle },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'maintenance', label: 'Maintenance', icon: Wrench },
    { id: 'zones', label: 'Zones', icon: Globe },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  // Filter Logic
  const filterText = (text: string) => text?.toLowerCase() || '';
  const filteredTrucks = trucks.filter(t => 
    filterText(t.truck_id).includes(searchFleet.toLowerCase()) || 
    filterText(t.license_plate).includes(searchFleet.toLowerCase()) ||
    filterText(t.driver_name).includes(searchFleet.toLowerCase())
  );
  const filteredDrivers = drivers.filter(d => 
    filterText(d.full_name).includes(searchDrivers.toLowerCase()) || 
    filterText(d.employee_id).includes(searchDrivers.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {sidebarOpen && <div className="fixed inset-0 z-40 bg-black/50" onClick={() => setSidebarOpen(false)}></div>}

      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-600 rounded-xl flex items-center justify-center shadow-lg shadow-green-200">
              <span className="text-white font-black text-xl">T</span>
            </div>
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Operations</p>
              <p className="text-sm font-bold text-gray-900 truncate max-w-[120px]">{companyName}</p>
            </div>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg">
            <X size={20} />
          </button>
        </div>

        <nav className="p-3 space-y-1 overflow-y-auto max-h-[calc(100vh-150px)]">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activePage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => { setActivePage(item.id as PageView); setSelectedDriver(null); setSelectedTruck(null); setSelectedZone(null); setSidebarOpen(false); }}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${
                  isActive 
                    ? 'bg-green-600 text-white shadow-lg shadow-green-200' 
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Icon size={18} />
                <span className="uppercase tracking-wide text-xs">{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-3 border-t border-gray-100 bg-white">
          <button 
            onClick={() => { localStorage.removeItem('trakbin_company'); router.push('/'); }} 
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-bold text-red-600 hover:bg-red-50 transition-all"
          >
            <LogOut size={18} />
            <span className="uppercase tracking-wide text-xs">Logout</span>
          </button>
        </div>
      </aside>

      <main className="min-w-0 flex flex-col">
        <header className="bg-white border-b border-gray-200 sticky top-0 z-30 px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button onClick={() => setSidebarOpen(true)} className="p-2 rounded-lg hover:bg-gray-100 text-gray-700">
                <Menu size={22} />
              </button>
              <div>
                <h1 className="text-xl font-black text-gray-900 uppercase tracking-tight">
                  {selectedDriver && activePage === 'drivers' ? 'Driver Profile' : 
                   selectedTruck && activePage === 'fleet' ? 'Truck Profile' :
                   selectedZone && activePage === 'zones' ? 'Zone Details' :
                   navItems.find(n => n.id === activePage)?.label}
                </h1>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mt-0.5">
                  {selectedDriver && activePage === 'drivers' ? 'Driver Details' :
                   selectedTruck && activePage === 'fleet' ? 'Vehicle Information' :
                   selectedZone && activePage === 'zones' ? 'Buildings & Coverage' :
                   activePage === 'overview' && 'Executive Dashboard'}
                  {activePage === 'fleet' && !selectedTruck && 'Fleet Management'}
                  {activePage === 'drivers' && !selectedDriver && 'Driver Management'}
                  {activePage === 'buildings' && 'Building Registry'}
                  {activePage === 'assignments' && 'Dispatch Center'}
                  {activePage === 'mission' && 'Live Operations Map'}
                  {activePage === 'verification' && 'Collection Verification'}
                  {activePage === 'issues' && 'Issue Management'}
                  {activePage === 'analytics' && 'Performance Analytics'}
                  {activePage === 'maintenance' && 'Fleet Maintenance'}
                  {activePage === 'zones' && !selectedZone && 'Zone Management'}
                  {activePage === 'settings' && 'Company Settings'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-3 pl-3 border-l border-gray-200">
                <div className="w-9 h-9 bg-green-100 rounded-xl flex items-center justify-center">
                  <span className="text-green-700 font-black text-sm">{companyName.charAt(0).toUpperCase()}</span>
                </div>
                <div className="hidden sm:block">
                  <p className="text-sm font-bold text-gray-900">{companyName}</p>
                  <p className="text-xs font-bold text-gray-500 uppercase">Admin</p>
                </div>
              </div>
            </div>
          </div>
        </header>

        <div className="p-4 lg:p-6 flex-1">
          {activePage === 'overview' && <OverviewPage trucks={trucks} drivers={drivers} buildings={buildings} collections={collections} issues={issues} setActivePage={setActivePage} />}
          {activePage === 'fleet' && !selectedTruck && <FleetPage trucks={filteredTrucks} search={searchFleet} setSearch={setSearchFleet} setShowTruckModal={setShowTruckModal} onSelectTruck={setSelectedTruck} />}
          {activePage === 'fleet' && selectedTruck && <TruckProfile truck={selectedTruck} onBack={() => setSelectedTruck(null)} />}
          {activePage === 'drivers' && !selectedDriver && <DriversPage drivers={filteredDrivers} search={searchDrivers} setSearch={setSearchDrivers} setShowDriverModal={setShowDriverModal} onSelectDriver={setSelectedDriver} />}
          {activePage === 'drivers' && selectedDriver && <DriverProfile driver={selectedDriver} trucks={trucks} onBack={() => setSelectedDriver(null)} />}
          {activePage === 'buildings' && <BuildingsPage buildings={buildings} />}
          {activePage === 'assignments' && <AssignmentsPage trucks={trucks} drivers={drivers} />}
          {activePage === 'mission' && <MissionMapPage buildings={buildings} />}
          {activePage === 'verification' && <VerificationPage collections={collections} />}
          {activePage === 'issues' && <IssuesPage issues={issues} />}
          {activePage === 'analytics' && <AnalyticsPage />}
          {activePage === 'maintenance' && <MaintenancePage trucks={trucks} />}
          {activePage === 'zones' && !selectedZone && <ZonesPage buildings={buildings} onSelectZone={setSelectedZone} />}
          {activePage === 'zones' && selectedZone && <ZoneDetails zone={selectedZone} buildings={buildings} onBack={() => setSelectedZone(null)} />}
          {activePage === 'settings' && <SettingsPage settingsForm={settingsForm} setSettingsForm={setSettingsForm} handleSaveSettings={handleSaveSettings} saving={saving} companyName={companyName} />}
        </div>
      </main>

      {showDriverModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1000] p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-black text-gray-900 uppercase">Register Driver</h3>
              <button onClick={() => setShowDriverModal(false)} className="p-2 hover:bg-gray-100 rounded-lg"><X size={20} /></button>
            </div>
            <form onSubmit={handleSaveDriver} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Full Name</label>
                <input type="text" required value={driverForm.full_name} onChange={(e) => setDriverForm({...driverForm, full_name: e.target.value})} className="w-full px-4 py-3 bg-white border-2 border-gray-300 rounded-xl font-bold text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none" placeholder="John Doe" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Email</label>
                <input type="email" required value={driverForm.email} onChange={(e) => setDriverForm({...driverForm, email: e.target.value})} className="w-full px-4 py-3 bg-white border-2 border-gray-300 rounded-xl font-bold text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none" placeholder="driver@trakbin.com" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Phone</label>
                  <input type="text" value={driverForm.phone} onChange={(e) => setDriverForm({...driverForm, phone: e.target.value})} className="w-full px-4 py-3 bg-white border-2 border-gray-300 rounded-xl font-bold text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none" placeholder="+234..." />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">License</label>
                  <input type="text" value={driverForm.license_number} onChange={(e) => setDriverForm({...driverForm, license_number: e.target.value})} className="w-full px-4 py-3 bg-white border-2 border-gray-300 rounded-xl font-bold text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none" placeholder="LIC-123" />
                </div>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-3">
                <p className="text-xs font-bold text-blue-900">ℹ️ Employee ID and Password will be auto-generated after submission.</p>
              </div>
              <button type="submit" disabled={saving} className="w-full py-3.5 bg-green-600 text-white font-black rounded-xl hover:bg-green-700 transition-all uppercase tracking-wide disabled:bg-gray-400">
                {saving ? 'Creating...' : 'Create Driver'}
              </button>
            </form>
          </div>
        </div>
      )}

      {showTruckModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1000] p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-black text-gray-900 uppercase">Register Truck</h3>
              <button onClick={() => setShowTruckModal(false)} className="p-2 hover:bg-gray-100 rounded-lg"><X size={20} /></button>
            </div>
            <form onSubmit={handleSaveTruck} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">License Plate</label>
                <input type="text" required value={truckForm.license_plate} onChange={(e) => setTruckForm({...truckForm, license_plate: e.target.value})} className="w-full px-4 py-3 bg-white border-2 border-gray-300 rounded-xl font-bold text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none" placeholder="ABC-123" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Driver Name</label>
                <input type="text" value={truckForm.driver_name} onChange={(e) => setTruckForm({...truckForm, driver_name: e.target.value})} className="w-full px-4 py-3 bg-white border-2 border-gray-300 rounded-xl font-bold text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none" placeholder="John Doe" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Type</label>
                  <select value={truckForm.truck_type} onChange={(e) => setTruckForm({...truckForm, truck_type: e.target.value})} className="w-full px-4 py-3 bg-white border-2 border-gray-300 rounded-xl font-bold text-gray-900 focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none">
                    <option>Compactor</option>
                    <option>Open Truck</option>
                    <option>Skip Loader</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Status</label>
                  <select value={truckForm.status} onChange={(e) => setTruckForm({...truckForm, status: e.target.value})} className="w-full px-4 py-3 bg-white border-2 border-gray-300 rounded-xl font-bold text-gray-900 focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none">
                    <option value="active">Active</option>
                    <option value="idle">Idle</option>
                    <option value="maintenance">Maintenance</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Capacity</label>
                <input type="text" value={truckForm.capacity} onChange={(e) => setTruckForm({...truckForm, capacity: e.target.value})} className="w-full px-4 py-3 bg-white border-2 border-gray-300 rounded-xl font-bold text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none" placeholder="10 Tons" />
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-3">
                <p className="text-xs font-bold text-blue-900">ℹ️ Truck ID will be auto-generated after submission.</p>
              </div>
              <button type="submit" disabled={saving} className="w-full py-3.5 bg-green-600 text-white font-black rounded-xl hover:bg-green-700 transition-all uppercase tracking-wide disabled:bg-gray-400">
                {saving ? 'Saving...' : 'Save Truck'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ============ REUSABLE SEARCH BAR ============
function SearchBar({ placeholder, value, onChange, icon: Icon = Search }: any) {
  return (
    <div className="relative flex-1 max-w-md w-full">
      <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
      <input 
        type="text" 
        placeholder={placeholder} 
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full pl-9 pr-4 py-2.5 bg-white border-2 border-gray-300 rounded-lg text-sm font-bold text-black placeholder-gray-500 focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none shadow-sm" 
        style={{ color: '#000000' }}
      />
      {value && (
        <button onClick={() => onChange('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-800">
          <X size={14} />
        </button>
      )}
    </div>
  );
}

function OverviewPage({ trucks, drivers, buildings, collections, issues, setActivePage }: any) {
  const activeTrucks = trucks.filter((t: any) => t.status === 'active').length;
  const stats = [
    { label: 'Fleet', value: trucks.length, sub: `${activeTrucks} Active`, icon: Truck, color: 'green', page: 'fleet' },
    { label: 'Drivers', value: drivers.length, sub: 'Registered', icon: Users, color: 'purple', page: 'drivers' },
    { label: 'Buildings', value: buildings.length, sub: 'Service Points', icon: Building2, color: 'blue', page: 'buildings' },
    { label: 'Collections', value: collections.length, sub: 'Completed', icon: ClipboardList, color: 'green', page: 'verification' },
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <button key={idx} onClick={() => setActivePage(stat.page)} className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-lg transition-all text-left">
              <div className={`w-12 h-12 bg-${stat.color}-100 rounded-xl flex items-center justify-center mb-3`}>
                <Icon className={`w-6 h-6 text-${stat.color}-600`} />
              </div>
              <p className="text-xs font-black text-gray-500 uppercase">{stat.label}</p>
              <p className="text-3xl font-black text-gray-900 mt-1">{stat.value}</p>
              <p className={`text-xs font-bold text-${stat.color}-600 mt-1`}>{stat.sub}</p>
            </button>
          );
        })}
      </div>
      <div className="bg-gradient-to-br from-green-600 to-green-700 rounded-xl p-6 text-white">
        <div className="flex items-center gap-2 mb-2"><Activity className="w-5 h-5" /><h2 className="text-sm font-black uppercase">System Status</h2></div>
        <p className="text-2xl font-black mb-2">All Systems Operational</p>
        <p className="text-sm font-bold text-green-100">Fleet management and driver tracking active.</p>
      </div>
    </div>
  );
}

// ============ TRUCK PROFILE PAGE (NEW!) ============
function TruckProfile({ truck, onBack }: any) {
  return (
    <div className="space-y-4">
      <button onClick={onBack} className="flex items-center gap-2 text-sm font-bold text-gray-600 hover:text-green-600 transition-all">
        <ArrowLeft size={18} /> Back to Fleet
      </button>
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6 text-white">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
              <Truck className="w-8 h-8 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-black uppercase">{truck.truck_id || 'Unknown Truck'}</h2>
              <p className="text-sm font-bold text-blue-100 flex items-center gap-2"><Hash size={14} /> {truck.license_plate || 'No Plate'}</p>
            </div>
          </div>
        </div>
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h3 className="text-xs font-black text-gray-500 uppercase tracking-wider">Vehicle Details</h3>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center shrink-0"><Users className="w-4 h-4 text-blue-600" /></div>
                <div><p className="text-xs font-black text-gray-500 uppercase">Assigned Driver</p><p className="text-sm font-bold text-gray-900">{truck.driver_name || 'Unassigned'}</p></div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-purple-50 rounded-lg flex items-center justify-center shrink-0"><Truck className="w-4 h-4 text-purple-600" /></div>
                <div><p className="text-xs font-black text-gray-500 uppercase">Truck Type</p><p className="text-sm font-bold text-gray-900">{truck.truck_type || 'N/A'}</p></div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-orange-50 rounded-lg flex items-center justify-center shrink-0"><TrendingUp className="w-4 h-4 text-orange-600" /></div>
                <div><p className="text-xs font-black text-gray-500 uppercase">Capacity</p><p className="text-sm font-bold text-gray-900">{truck.capacity || 'N/A'}</p></div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-green-50 rounded-lg flex items-center justify-center shrink-0"><CheckCircle2 className="w-4 h-4 text-green-600" /></div>
                <div><p className="text-xs font-black text-gray-500 uppercase">Status</p><p className="text-sm font-bold text-gray-900 uppercase">{truck.status || 'Idle'}</p></div>
              </div>
            </div>
          </div>
          <div className="space-y-4">
            <h3 className="text-xs font-black text-gray-500 uppercase tracking-wider">Performance Metrics</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-green-50 rounded-xl p-4 border border-green-100">
                <p className="text-xs font-black text-green-600 uppercase">Collections</p>
                <p className="text-3xl font-black text-green-700 mt-1">{truck.collections_today || 0}</p>
              </div>
              <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                <p className="text-xs font-black text-blue-600 uppercase">Efficiency</p>
                <p className="text-3xl font-black text-blue-700 mt-1">98<span className="text-sm">%</span></p>
              </div>
            </div>
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
              <p className="text-xs font-black text-gray-500 uppercase mb-2">Maintenance Status</p>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                <p className="text-sm font-bold text-gray-900">Healthy - No issues</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function FleetPage({ trucks, search, setSearch, setShowTruckModal, onSelectTruck }: any) {
  const getStatusBadge = (status: string) => {
    if (status === 'active') return { label: 'ACTIVE', color: 'bg-green-100 text-green-700' };
    if (status === 'maintenance') return { label: 'MAINTENANCE', color: 'bg-orange-100 text-orange-700' };
    return { label: 'IDLE', color: 'bg-gray-100 text-gray-700' };
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <SearchBar placeholder="Search trucks by ID, plate, or driver..." value={search} onChange={setSearch} />
        <div className="flex items-center gap-3">
          <p className="text-xs font-black text-gray-500 uppercase">{trucks.length} Trucks Found</p>
          <button onClick={() => setShowTruckModal(true)} className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg font-black text-xs uppercase hover:bg-green-700 transition-all">
            <Plus size={16} /> Add Truck
          </button>
        </div>
      </div>
      {trucks.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center"><Truck className="w-12 h-12 text-gray-300 mx-auto mb-4" /><p className="text-sm font-bold text-gray-500">No trucks found.</p></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {trucks.map((truck: any) => {
            const badge = getStatusBadge(truck.status);
            return (
              <div key={truck.id} onClick={() => onSelectTruck(truck)} className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-lg hover:-translate-y-1 transition-all cursor-pointer">
                <div className="flex items-start justify-between mb-3">
                  <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center"><Truck className="w-6 h-6 text-green-600" /></div>
                  <span className={`text-xs font-black px-2 py-1 rounded-full uppercase ${badge.color}`}>{badge.label}</span>
                </div>
                <h3 className="text-xl font-black text-gray-900 uppercase">{truck.truck_id}</h3>
                <p className="text-xs font-bold text-gray-500 uppercase mt-1">{truck.license_plate}</p>
                <div className="mt-3 pt-3 border-t border-gray-100 space-y-2">
                  <div className="flex items-center justify-between"><span className="text-xs font-black text-gray-500 uppercase">Driver</span><span className="text-xs font-bold text-gray-900">{truck.driver_name || 'Unassigned'}</span></div>
                  <div className="flex items-center justify-between"><span className="text-xs font-black text-gray-500 uppercase">Type</span><span className="text-xs font-bold text-gray-900">{truck.truck_type}</span></div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function DriversPage({ drivers, search, setSearch, setShowDriverModal, onSelectDriver }: any) {
  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <SearchBar placeholder="Search drivers by name or ID..." value={search} onChange={setSearch} />
        <div className="flex items-center gap-3">
          <p className="text-xs font-black text-gray-500 uppercase">{drivers.length} Drivers Found</p>
          <button onClick={() => setShowDriverModal(true)} className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg font-black text-xs uppercase hover:bg-green-700 transition-all">
            <Plus size={16} /> Add Driver
          </button>
        </div>
      </div>
      {drivers.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center"><Users className="w-12 h-12 text-gray-300 mx-auto mb-4" /><p className="text-sm font-bold text-gray-500">No drivers found.</p></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {drivers.map((driver: any) => (
            <div key={driver.id} onClick={() => onSelectDriver(driver)} className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-lg hover:-translate-y-1 transition-all cursor-pointer">
              <div className="flex items-start justify-between mb-3">
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center"><span className="text-purple-700 font-black text-lg">{(driver.full_name || 'D').charAt(0).toUpperCase()}</span></div>
                <span className="text-xs font-black px-2 py-1 rounded-full uppercase bg-green-100 text-green-700">ON SHIFT</span>
              </div>
              <h3 className="text-lg font-black text-gray-900 uppercase">{driver.full_name}</h3>
              <p className="text-xs font-bold text-gray-500 uppercase mt-1">ID: {driver.employee_id}</p>
              <div className="mt-3 pt-3 border-t border-gray-100 space-y-2">
                <div className="flex items-center gap-2 text-xs"><Phone size={12} className="text-gray-400" /><span className="font-bold text-gray-700">{driver.phone || 'N/A'}</span></div>
                <div className="flex items-center gap-2 text-xs"><Mail size={12} className="text-gray-400" /><span className="font-bold text-gray-700 truncate">{driver.email || 'N/A'}</span></div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function DriverProfile({ driver, trucks, onBack }: any) {
  const assignedTruck = trucks.find((t: any) => t.driver_name === driver.full_name);
  return (
    <div className="space-y-4">
      <button onClick={onBack} className="flex items-center gap-2 text-sm font-bold text-gray-600 hover:text-green-600 transition-all"><ArrowLeft size={18} /> Back to Drivers</button>
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="bg-gradient-to-r from-purple-600 to-purple-700 p-6 text-white">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm"><span className="text-white font-black text-2xl">{(driver.full_name || 'D').charAt(0).toUpperCase()}</span></div>
            <div><h2 className="text-2xl font-black uppercase">{driver.full_name || 'Unknown Driver'}</h2><p className="text-sm font-bold text-purple-100 flex items-center gap-2"><Hash size={14} /> {driver.employee_id}</p></div>
          </div>
        </div>
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h3 className="text-xs font-black text-gray-500 uppercase tracking-wider">Personal Information</h3>
            <div className="space-y-3">
              <div className="flex items-start gap-3"><div className="w-8 h-8 bg-purple-50 rounded-lg flex items-center justify-center shrink-0"><Users className="w-4 h-4 text-purple-600" /></div><div><p className="text-xs font-black text-gray-500 uppercase">Full Name</p><p className="text-sm font-bold text-gray-900">{driver.full_name || 'Not provided'}</p></div></div>
              <div className="flex items-start gap-3"><div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center shrink-0"><Mail className="w-4 h-4 text-blue-600" /></div><div><p className="text-xs font-black text-gray-500 uppercase">Email</p><p className="text-sm font-bold text-gray-900">{driver.email || 'Not provided'}</p></div></div>
              <div className="flex items-start gap-3"><div className="w-8 h-8 bg-green-50 rounded-lg flex items-center justify-center shrink-0"><Phone className="w-4 h-4 text-green-600" /></div><div><p className="text-xs font-black text-gray-500 uppercase">Phone</p><p className="text-sm font-bold text-gray-900">{driver.phone || 'Not provided'}</p></div></div>
              <div className="flex items-start gap-3"><div className="w-8 h-8 bg-orange-50 rounded-lg flex items-center justify-center shrink-0"><Hash className="w-4 h-4 text-orange-600" /></div><div><p className="text-xs font-black text-gray-500 uppercase">License Number</p><p className="text-sm font-bold text-gray-900">{driver.license_number || 'Not provided'}</p></div></div>
            </div>
          </div>
          <div className="space-y-4">
            <h3 className="text-xs font-black text-gray-500 uppercase tracking-wider">Assigned Vehicle</h3>
            {assignedTruck ? (
              <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                <div className="flex items-center gap-3 mb-3"><div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center"><Truck className="w-5 h-5 text-green-600" /></div><div><p className="text-sm font-black text-gray-900 uppercase">{assignedTruck.truck_id}</p><p className="text-xs font-bold text-gray-500">{assignedTruck.license_plate}</p></div></div>
                <div className="space-y-2 text-xs"><div className="flex justify-between"><span className="font-black text-gray-500 uppercase">Type</span><span className="font-bold text-gray-900">{assignedTruck.truck_type}</span></div><div className="flex justify-between"><span className="font-black text-gray-500 uppercase">Status</span><span className="font-bold text-green-600">{assignedTruck.status}</span></div></div>
              </div>
            ) : (
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-center"><Truck className="w-8 h-8 text-gray-400 mx-auto mb-2" /><p className="text-sm font-bold text-gray-500">No truck assigned</p></div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function BuildingsPage({ buildings }: any) {
  return (
    <div className="space-y-4">
      <p className="text-sm font-bold text-gray-500 uppercase">{buildings.length} Buildings Registered</p>
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr><th className="px-6 py-3 text-xs font-black text-gray-500 uppercase">Building ID</th><th className="px-6 py-3 text-xs font-black text-gray-500 uppercase">Address</th><th className="px-6 py-3 text-xs font-black text-gray-500 uppercase">Type</th><th className="px-6 py-3 text-xs font-black text-gray-500 uppercase">Status</th><th className="px-6 py-3 text-xs font-black text-gray-500 uppercase">Payment</th></tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {buildings.map((building: any, idx: number) => (
                <tr key={building.id || idx} className="hover:bg-gray-50 transition-all">
                  <td className="px-6 py-4 text-sm font-black text-gray-900 uppercase">{building.custom_id || 'N/A'}</td>
                  <td className="px-6 py-4 text-sm font-bold text-gray-700 truncate max-w-xs">{building.address || 'No address'}</td>
                  <td className="px-6 py-4 text-sm font-bold text-gray-700">{building.building_type || 'N/A'}</td>
                  <td className="px-6 py-4"><span className={`text-xs font-black px-2 py-1 rounded-full uppercase ${building.status === 'picked_up' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>{building.status || 'Pending'}</span></td>
                  <td className="px-6 py-4"><span className={`text-xs font-black px-2 py-1 rounded-full uppercase ${building.payment_status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{building.payment_status || 'Unpaid'}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function AssignmentsPage({ trucks, drivers }: any) {
  return (
    <div className="space-y-4">
      <div className="bg-gradient-to-br from-green-600 to-green-700 rounded-xl p-6 text-white"><h2 className="text-xl font-black uppercase mb-1">Dispatch Center</h2><p className="text-green-100 text-sm font-bold">Assign trucks, drivers, and zones</p></div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4"><h3 className="text-xs font-black text-gray-900 uppercase mb-3 flex items-center gap-2"><Truck className="w-4 h-4 text-green-600" /> Trucks</h3><div className="space-y-2">{trucks.filter((t: any) => t.status === 'active').map((truck: any) => (<div key={truck.id} className="p-3 bg-gray-50 rounded-lg border border-gray-200 hover:border-green-500 cursor-pointer transition-all"><p className="text-xs font-black text-gray-900 uppercase">{truck.truck_id}</p><p className="text-xs font-bold text-gray-500">{truck.driver_name || 'No Driver'}</p></div>))}</div></div>
        <div className="bg-white rounded-xl border border-gray-200 p-4"><h3 className="text-xs font-black text-gray-900 uppercase mb-3 flex items-center gap-2"><Users className="w-4 h-4 text-purple-600" /> Drivers</h3><div className="space-y-2">{drivers.map((driver: any) => (<div key={driver.id} className="p-3 bg-gray-50 rounded-lg border border-gray-200 hover:border-purple-500 cursor-pointer transition-all"><p className="text-xs font-black text-gray-900 uppercase">{driver.full_name}</p><p className="text-xs font-bold text-gray-500">{driver.employee_id}</p></div>))}</div></div>
        <div className="bg-white rounded-xl border border-gray-200 p-4"><h3 className="text-xs font-black text-gray-900 uppercase mb-3 flex items-center gap-2"><Globe className="w-4 h-4 text-blue-600" /> Zones</h3><div className="space-y-2">{['Zone A - Port Harcourt', 'Zone B - GRA', 'Zone C - Trans Amadi'].map((zone, idx) => (<div key={idx} className="p-3 bg-gray-50 rounded-lg border border-gray-200 hover:border-blue-500 cursor-pointer transition-all"><p className="text-xs font-black text-gray-900 uppercase">{zone}</p><p className="text-xs font-bold text-gray-500">{12 + idx * 5} Buildings</p></div>))}</div></div>
      </div>
    </div>
  );
}

function MissionMapPage({ buildings }: any) {
  return (
    <div className="h-[calc(100vh-140px)] bg-white rounded-xl border border-gray-200 overflow-hidden relative flex items-center justify-center">
      <div className="text-center"><Map className="w-20 h-20 text-gray-300 mx-auto mb-4" /><p className="text-sm font-black text-gray-500 uppercase">Live Mission Map</p><p className="text-xs font-bold text-gray-400 mt-2">{buildings.length} buildings tracked</p></div>
    </div>
  );
}

function VerificationPage({ collections }: any) {
  const events = collections.slice(0, 10).map((c: any) => ({ time: new Date(c.collection_date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}), truck: c.truck_id || 'N/A', driver: c.driver_id || 'N/A', building: c.building_id || 'N/A' }));
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-100"><h2 className="text-xs font-black text-gray-900 uppercase">Verification Timeline</h2></div>
      <div className="divide-y divide-gray-100">
        {events.length === 0 ? (<div className="p-8 text-center text-sm font-bold text-gray-500">No collections verified yet.</div>) : (events.map((e: any, idx: number) => (<div key={idx} className="px-4 py-3 flex items-center gap-3"><div className="w-10 text-xs font-black text-gray-500 uppercase">{e.time}</div><div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center"><CheckCircle2 className="w-4 h-4 text-green-600" /></div><div className="flex-1"><p className="text-xs font-black text-gray-900 uppercase">{e.building} • {e.truck}</p><p className="text-xs font-bold text-gray-500">{e.driver}</p></div><div className="flex items-center gap-1"><span className="text-xs font-black text-green-700 uppercase bg-green-100 px-2 py-1 rounded">GPS ✓</span><span className="text-xs font-black text-green-700 uppercase bg-green-100 px-2 py-1 rounded">Photo ✓</span></div></div>)))}
      </div>
    </div>
  );
}

function IssuesPage({ issues }: any) {
  const mappedIssues = issues.map((i: any) => ({ type: i.type || 'Issue', building: i.location || i.building_id || 'N/A', priority: i.severity || 'Medium', time: new Date(i.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) }));
  return (
    <div className="space-y-3">
      {mappedIssues.length === 0 ? (<div className="bg-white rounded-xl border border-gray-200 p-8 text-center"><CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-3" /><p className="text-sm font-bold text-gray-500">No issues reported. All operations running smoothly!</p></div>) : (mappedIssues.map((issue: any, idx: number) => (<div key={idx} className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-lg transition-all"><div className="flex items-center justify-between"><div className="flex items-center gap-3"><div className={`w-10 h-10 rounded-lg flex items-center justify-center ${issue.priority === 'Critical' || issue.priority === 'Urgent' ? 'bg-red-100' : 'bg-orange-100'}`}><AlertTriangle className={`w-5 h-5 ${issue.priority === 'Critical' || issue.priority === 'Urgent' ? 'text-red-600' : 'text-orange-600'}`} /></div><div><h3 className="text-sm font-black text-gray-900 uppercase">{issue.type}</h3><p className="text-xs font-bold text-gray-500 uppercase">{issue.building} • {issue.time}</p></div></div><span className={`text-xs font-black px-2 py-1 rounded-full uppercase ${issue.priority === 'Critical' || issue.priority === 'Urgent' ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'}`}>{issue.priority}</span></div></div>)))}
    </div>
  );
}

function AnalyticsPage() {
  const metrics = [{ label: 'Collection Rate', value: '98%', icon: TrendingUp, color: 'green' }, { label: 'Avg Time', value: '6 min', icon: Clock, color: 'blue' }, { label: 'Missed', value: '2', icon: AlertTriangle, color: 'red' }];
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">{metrics.map((m, idx) => { const Icon = m.icon; return (<div key={idx} className="bg-white rounded-xl border border-gray-200 p-4"><div className={`w-10 h-10 bg-${m.color}-100 rounded-lg flex items-center justify-center mb-3`}><Icon className={`w-5 h-5 text-${m.color}-600`} /></div><p className="text-xs font-black text-gray-500 uppercase">{m.label}</p><p className="text-2xl font-black text-gray-900 mt-1">{m.value}</p></div>); })}</div>
      <div className="bg-white rounded-xl border border-gray-200 p-6"><h3 className="text-xs font-black text-gray-900 uppercase mb-4">Weekly Performance</h3><div className="flex items-end gap-2 h-40">{[65, 78, 82, 91, 88, 95, 98].map((h, idx) => (<div key={idx} className="flex-1 flex flex-col items-center gap-2"><div className="w-full bg-green-600 rounded-t-lg transition-all hover:bg-green-700" style={{ height: `${h}%` }}></div><span className="text-xs font-black text-gray-500 uppercase">{['M','T','W','T','F','S','S'][idx]}</span></div>))}</div></div>
    </div>
  );
}

function MaintenancePage({ trucks }: any) {
  return (
    <div className="space-y-4">
      <div className="bg-gradient-to-br from-orange-600 to-orange-700 rounded-xl p-6 text-white"><h2 className="text-xl font-black uppercase mb-1">Fleet Maintenance</h2><p className="text-orange-100 text-sm font-bold">Track and manage vehicle maintenance schedules</p></div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {trucks.map((truck: any) => (<div key={truck.id} className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-lg transition-all"><div className="flex items-start justify-between mb-3"><div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center"><Wrench className="w-5 h-5 text-orange-600" /></div><span className={`text-xs font-black px-2 py-1 rounded-full uppercase ${truck.status === 'maintenance' ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700'}`}>{truck.status === 'maintenance' ? 'In Maintenance' : 'Healthy'}</span></div><h3 className="text-lg font-black text-gray-900 uppercase">{truck.truck_id}</h3><p className="text-xs font-bold text-gray-500 uppercase mt-1">{truck.license_plate}</p><div className="mt-3 pt-3 border-t border-gray-100 space-y-2"><div className="flex justify-between"><span className="text-xs font-black text-gray-500 uppercase">Driver</span><span className="text-xs font-bold text-gray-900">{truck.driver_name || 'Unassigned'}</span></div><div className="flex justify-between"><span className="text-xs font-black text-gray-500 uppercase">Type</span><span className="text-xs font-bold text-gray-900">{truck.truck_type || 'N/A'}</span></div><div className="flex justify-between"><span className="text-xs font-black text-gray-500 uppercase">Next Inspection</span><span className="text-xs font-bold text-orange-600">15 days</span></div></div></div>))}
      </div>
    </div>
  );
}

function ZonesPage({ buildings, onSelectZone }: any) {
  const zones = [
    { id: 'zone-a', name: 'Zone A', state: 'Rivers State', town: 'Port Harcourt', type: 'Estate', description: 'Mainland residential and commercial estate coverage', buildings: buildings?.filter((b: any) => b.zone === 'A' || b.address?.toLowerCase().includes('port harcourt')).length || 245, trucks: 2, progress: 82 },
    { id: 'zone-b', name: 'Zone B', state: 'Rivers State', town: 'GRA', type: 'Community', description: 'Government Reserved Area community coverage', buildings: buildings?.filter((b: any) => b.zone === 'B' || b.address?.toLowerCase().includes('gra')).length || 132, trucks: 1, progress: 61 },
    { id: 'zone-c', name: 'Zone C', state: 'Rivers State', town: 'Trans Amadi', type: 'Industrial', description: 'Industrial layout and warehouse coverage', buildings: buildings?.filter((b: any) => b.zone === 'C' || b.address?.toLowerCase().includes('trans amadi')).length || 89, trucks: 1, progress: 45 },
  ];
  return (
    <div className="space-y-4">
      <div className="bg-gradient-to-br from-green-600 to-green-700 rounded-xl p-6 text-white"><h2 className="text-xl font-black uppercase mb-1">Zone Management</h2><p className="text-green-100 text-sm font-bold">Click any zone to view detailed buildings and coverage information</p></div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {zones.map((zone, idx) => (<div key={idx} onClick={() => onSelectZone(zone)} className="bg-white rounded-xl border-2 border-green-200 p-5 hover:shadow-lg hover:border-green-400 transition-all cursor-pointer"><div className="flex items-start justify-between mb-3"><div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center"><Globe className="w-6 h-6 text-green-600" /></div><span className="text-xs font-black px-2 py-1 rounded-full uppercase bg-green-100 text-green-700">{zone.progress}%</span></div><h3 className="text-xl font-black text-gray-900 uppercase">{zone.name}</h3><p className="text-xs font-bold text-gray-500 uppercase mt-1">{zone.town}, {zone.state}</p><div className="mt-2"><span className={`text-xs font-black px-2 py-1 rounded-full uppercase ${zone.type === 'Estate' ? 'bg-purple-100 text-purple-700' : zone.type === 'Community' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'}`}>{zone.type}</span></div><div className="mt-3 pt-3 border-t border-green-100 space-y-2"><div className="flex justify-between"><span className="text-xs font-black text-gray-500 uppercase">Buildings</span><span className="text-xs font-black text-green-600">{zone.buildings}</span></div><div className="flex justify-between"><span className="text-xs font-black text-gray-500 uppercase">Trucks</span><span className="text-xs font-black text-green-600">{zone.trucks}</span></div><div className="w-full bg-green-50 rounded-full h-2 mt-2"><div className="bg-green-600 h-2 rounded-full" style={{ width: `${zone.progress}%` }}></div></div></div></div>))}
      </div>
    </div>
  );
}

function ZoneDetails({ zone, buildings, onBack }: any) {
  const zoneBuildings = buildings?.filter((b: any) => {
    if (zone.id === 'zone-a') return b.zone === 'A' || b.address?.toLowerCase().includes('port harcourt');
    if (zone.id === 'zone-b') return b.zone === 'B' || b.address?.toLowerCase().includes('gra');
    if (zone.id === 'zone-c') return b.zone === 'C' || b.address?.toLowerCase().includes('trans amadi');
    return false;
  }) || [];
  const completedBuildings = zoneBuildings.filter((b: any) => b.status === 'picked_up').length;
  const pendingBuildings = zoneBuildings.length - completedBuildings;
  const unpaidBuildings = zoneBuildings.filter((b: any) => b.payment_status === 'unpaid').length;

  return (
    <div className="space-y-4">
      <button onClick={onBack} className="flex items-center gap-2 text-sm font-bold text-gray-600 hover:text-green-600 transition-all"><ArrowLeft size={18} /> Back to Zones</button>
      <div className="bg-gradient-to-r from-green-600 to-green-700 rounded-xl p-6 text-white"><div className="flex items-start justify-between"><div className="flex items-center gap-4"><div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm"><Globe className="w-8 h-8 text-white" /></div><div><h2 className="text-2xl font-black uppercase">{zone.name}</h2><p className="text-sm font-bold text-green-100">{zone.town}, {zone.state}</p><div className="mt-2"><span className={`text-xs font-black px-2 py-1 rounded-full uppercase ${zone.type === 'Estate' ? 'bg-purple-500 text-white' : zone.type === 'Community' ? 'bg-blue-500 text-white' : 'bg-orange-500 text-white'}`}>{zone.type}</span></div></div></div><div className="text-right"><p className="text-4xl font-black">{zone.progress}%</p><p className="text-xs font-bold text-green-100 uppercase">Coverage</p></div></div></div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-5"><div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mb-3"><Building2 className="w-5 h-5 text-blue-600" /></div><p className="text-xs font-black text-gray-500 uppercase">Total Buildings</p><p className="text-3xl font-black text-gray-900 mt-1">{zone.buildings}</p></div>
        <div className="bg-white rounded-xl border border-gray-200 p-5"><div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mb-3"><CheckCircle2 className="w-5 h-5 text-green-600" /></div><p className="text-xs font-black text-gray-500 uppercase">Completed</p><p className="text-3xl font-black text-green-600 mt-1">{completedBuildings}</p></div>
        <div className="bg-white rounded-xl border border-gray-200 p-5"><div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center mb-3"><Clock className="w-5 h-5 text-orange-600" /></div><p className="text-xs font-black text-gray-500 uppercase">Pending</p><p className="text-3xl font-black text-orange-600 mt-1">{pendingBuildings}</p></div>
        <div className="bg-white rounded-xl border border-gray-200 p-5"><div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center mb-3"><AlertTriangle className="w-5 h-5 text-red-600" /></div><p className="text-xs font-black text-gray-500 uppercase">Payment Due</p><p className="text-3xl font-black text-red-600 mt-1">{unpaidBuildings}</p></div>
      </div>
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between"><h2 className="text-sm font-black text-gray-900 uppercase">Buildings in {zone.name} ({zoneBuildings.length})</h2><div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" /><input type="text" placeholder="Search buildings..." className="pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs font-bold focus:ring-2 focus:ring-green-500 outline-none" /></div></div>
        <div className="divide-y divide-gray-100 max-h-[600px] overflow-y-auto">
          {zoneBuildings.length === 0 ? (<div className="p-8 text-center"><Building2 className="w-12 h-12 text-gray-300 mx-auto mb-3" /><p className="text-sm font-bold text-gray-500">No buildings registered in this zone yet.</p></div>) : (zoneBuildings.map((building: any, idx: number) => (<div key={building.id || idx} className="px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-all"><div className="flex items-center gap-3"><div className={`w-2 h-2 rounded-full ${building.status === 'picked_up' ? 'bg-green-500' : building.payment_status === 'unpaid' ? 'bg-red-500' : 'bg-blue-500'}`}></div><div><p className="text-sm font-black text-gray-900 uppercase">{building.custom_id}</p><p className="text-xs font-bold text-gray-500">{building.address || 'No address'}</p></div></div><div className="flex items-center gap-4"><div className="text-right"><p className="text-xs font-black text-gray-500 uppercase">{building.building_type || 'N/A'}</p><p className={`text-xs font-bold uppercase ${building.payment_status === 'paid' ? 'text-green-600' : 'text-red-600'}`}>{building.payment_status || 'Unknown'}</p></div><div className={`text-xs font-black px-2 py-1 rounded-full uppercase ${building.status === 'picked_up' ? 'bg-green-100 text-green-700' : building.status === 'collecting' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'}`}>{building.status || 'Unknown'}</div></div></div>)))}
        </div>
      </div>
    </div>
  );
}

function SettingsPage({ settingsForm, setSettingsForm, handleSaveSettings, saving, companyName }: any) {
  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <div className="bg-gradient-to-br from-green-600 to-green-700 rounded-xl p-6 text-white">
        <div className="flex items-center gap-3 mb-2"><Settings className="w-6 h-6" /><h2 className="text-xl font-black uppercase">Company Settings</h2></div>
        <p className="text-sm font-bold text-green-100">Manage your company information and security</p>
      </div>
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <form onSubmit={handleSaveSettings} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Company Name</label>
            <input type="text" value={companyName} disabled className="w-full px-4 py-3 bg-gray-100 border-2 border-gray-200 rounded-xl font-bold text-gray-500 cursor-not-allowed" />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Email Address</label>
            <input type="email" required value={settingsForm.email} onChange={(e) => setSettingsForm({...settingsForm, email: e.target.value})} className="w-full px-4 py-3 bg-white border-2 border-gray-300 rounded-xl font-bold text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none" placeholder="company@trakbin.com" />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Phone Number</label>
            <input type="tel" required value={settingsForm.phone} onChange={(e) => setSettingsForm({...settingsForm, phone: e.target.value})} className="w-full px-4 py-3 bg-white border-2 border-gray-300 rounded-xl font-bold text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none" placeholder="+234..." />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">New Password</label>
            <input type="password" value={settingsForm.password} onChange={(e) => setSettingsForm({...settingsForm, password: e.target.value})} className="w-full px-4 py-3 bg-white border-2 border-gray-300 rounded-xl font-bold text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none" placeholder="Leave blank to keep current" />
          </div>
          <button type="submit" disabled={saving} className="w-full py-3.5 bg-green-600 text-white font-black rounded-xl hover:bg-green-700 transition-all uppercase tracking-wide disabled:bg-gray-400 flex items-center justify-center gap-2">
            <Save size={18} />
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      </div>
    </div>
  );
}