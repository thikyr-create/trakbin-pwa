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

  const [searchFleet, setSearchFleet] = useState('');
  const [searchDrivers, setSearchDrivers] = useState('');

  const { tenant, addDispatchEvent, addNotification, subscribeToRealtime, unsubscribeFromRealtime } = useCompanySession();

  useEffect(() => {
    const storedCompany = localStorage.getItem('trakbin_company');
    if (!storedCompany) { 
      router.push('/auth'); 
      return; 
    }
    
    const userData = JSON.parse(storedCompany);
    setCompanyName(userData.company_name || 'Waste Company');
    setCompanyId(userData.id || '');
    
    // Redirect drivers to their own dashboard
    if (tenant.role === 'driver') {
      router.push('/driver-dashboard');
      return;
    }
    
    fetchData();

    const cleanup = subscribeToRealtime();
    return () => {
      if (typeof cleanup === 'function') {
        cleanup();
      } else {
        unsubscribeFromRealtime();
      }
    };
  }, [router, tenant.role]);

  const fetchData = async () => {
    const { tenant } = useCompanySession.getState();
    if (!tenant.companyId) {
      setTimeout(fetchData, 500);
      return;
    }

    setLoading(true);
    try {
      const { data: trucksData } = await supabase.from('trucks').select('*').eq('company_id', tenant.companyId).order('truck_id', { ascending: true });
      const { data: driversData } = await supabase.from('users').select('*').eq('account_type', 'Driver').eq('company_name', companyName).order('employee_id', { ascending: true });
      const { data: buildingsData } = await supabase.from('Buildings').select('*').eq('company_id', tenant.companyId).order('custom_id', { ascending: true });
      const { data: collectionsData } = await supabase.from('collections').select('*').eq('company_id', tenant.companyId).order('collection_date', { ascending: false });
      const { data: issuesData } = await supabase.from('issues').select('*').eq('company_id', tenant.companyId).order('created_at', { ascending: false });

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

  const handleSaveDriver = async (formData: any) => {
    const { tenant } = useCompanySession.getState();
    const employeeId = generateEmployeeId();
    const generatedPassword = `Trakbin${Math.floor(1000 + Math.random() * 9000)}!`;
    
    try {
      const { error: userError } = await supabase.from('users').insert([{ 
        email: formData.email, employee_id: employeeId, password: generatedPassword, 
        account_type: 'Driver', company_name: companyName, full_name: formData.full_name, phone: formData.phone
      }]);
      if (userError) throw userError;
      
      const { error: driverError } = await supabase.from('drivers').insert([{
        employee_id: employeeId, full_name: formData.full_name, email: formData.email,
        phone: formData.phone, license_number: formData.license_number, 
        company_name: companyName, company_id: tenant.companyId 
      }]);
      if (driverError) throw driverError;
      
      addDispatchEvent({ type: 'driver_added', truck_id: 'N/A', driver_name: formData.full_name, message: `New driver registered: ${formData.full_name} (${employeeId})` });
      addNotification(`Driver ${formData.full_name} created successfully!`, 'success');
      fetchData(); 
      
      return { success: true, message: `✅ Driver Created Successfully!\n\n Employee ID: ${employeeId}\n Email: ${formData.email}\n Password: ${generatedPassword}\n\nPlease save these credentials!`, employeeId, password: generatedPassword };
    } catch (error: any) {
      addNotification(`Failed to create driver: ${error.message}`, 'error');
      return { success: false, message: error.message };
    }
  };

  const handleSaveTruck = async (formData: any) => {
    const { tenant } = useCompanySession.getState();
    const truckId = generateTruckId();
    try {
      const { error } = await supabase.from('trucks').insert([{
        truck_id: truckId, license_plate: formData.license_plate, driver_name: formData.driver_name,
        truck_type: formData.truck_type, capacity: formData.capacity, status: formData.status, 
        company_name: companyName, company_id: tenant.companyId
      }]);
      if (error) throw error;
      
      addDispatchEvent({ type: 'truck_added', truck_id: truckId, driver_name: formData.driver_name || 'Unassigned', message: `New truck registered: ${truckId} (${formData.license_plate})` });
      addNotification(`Truck ${truckId} registered successfully!`, 'success');
      fetchData(); 
      
      return { success: true, message: `✅ Truck Registered Successfully!\n\n Truck ID: ${truckId}`, truckId };
    } catch (error: any) {
      addNotification(`Failed to register truck: ${error.message}`, 'error');
      return { success: false, message: error.message };
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-50"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div></div>;

  // Role-based navigation configuration
  const allNavItems = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard, roles: ['company', 'admin', 'government'] },
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

  // Filter navigation based on user role
  const navItems = allNavItems.filter(item => 
    tenant.role === 'admin' || item.roles.includes(tenant.role || 'company')
  );

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
    <AuthGate>
      <div className="min-h-screen bg-gray-50 relative">
        <NotificationsPanel />

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
                    {activePage === 'overview' && 'Executive Dashboard'}
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
                    <p className="text-xs font-bold text-gray-500 uppercase">{tenant.role || 'User'}</p>
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
            {activePage === 'verification' && <VerificationPage />}
            {activePage === 'issues' && <IssuesPage issues={issues} />}
            {activePage === 'analytics' && <AnalyticsPage />}
            {activePage === 'maintenance' && <MaintenancePage trucks={trucks} />}
            {activePage === 'zones' && !selectedZone && <ZonesPage buildings={buildings} onSelectZone={setSelectedZone} />}
            {activePage === 'zones' && selectedZone && <ZoneDetailsPage zone={selectedZone} buildings={buildings} onBack={() => setSelectedZone(null)} />}
            {activePage === 'settings' && <SettingsPage companyName={companyName} companyId={companyId} />}
          </div>
        </main>

        <AddDriverModal 
          isOpen={showDriverModal} 
          onClose={() => setShowDriverModal(false)} 
          companyName={companyName} 
          onSubmit={handleSaveDriver} 
        />
        <AddTruckModal 
          isOpen={showTruckModal} 
          onClose={() => setShowTruckModal(false)} 
          companyName={companyName} 
          onSubmit={handleSaveTruck} 
        />
      </div>
    </AuthGate>
  );
}

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
          </div>
        </div>
      </div>
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