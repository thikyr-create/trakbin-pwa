"use client";

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';
import { Building2, Truck, LogIn, UserPlus, ChevronDown, CheckCircle2, AlertCircle, MapPin, Phone, Loader2, Search, ArrowLeft, Smartphone, Monitor } from 'lucide-react';
import dynamic from 'next/dynamic';

const DraggableMap = dynamic(() => import('../dashboard/DraggableMap'), { ssr: false });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [accountType, setAccountType] = useState('Caretaker');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const router = useRouter();

  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsMobile(/iPhone|iPad|iPod|Android/i.test(navigator.userAgent));
    }
    if (typeof window !== 'undefined' && window.location.hash === '#login') {
      setIsLogin(true);
    }
  }, []);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [buildingId, setBuildingId] = useState('');
  const [passcode, setPasscode] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [operatingAddress, setOperatingAddress] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  
  const [gpsAddress, setGpsAddress] = useState(''); 
  const [officialAddress, setOfficialAddress] = useState(''); 
  const [coords, setCoords] = useState({ lat: 6.5244, lon: 3.3792 });
  const [gpsStatus, setGpsStatus] = useState('idle');
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [buildingType, setBuildingType] = useState('Residential Single Unit');
  const [numberOfFlats, setNumberOfFlats] = useState('');
  const [numberOfShops, setNumberOfShops] = useState('');

  // GPS Logic
  useEffect(() => {
    if (accountType === 'Caretaker' && !isLogin) {
      setGpsStatus('requesting');
      if (!navigator.geolocation) { setGpsStatus('unsupported'); setMessage(' GPS is not supported in your browser'); return; }
      
      const watchId = navigator.geolocation.watchPosition(
        (position) => {
          setCoords({ lat: position.coords.latitude, lon: position.coords.longitude });
          setAccuracy(position.coords.accuracy);
          setGpsStatus('captured');
          setMessage('');
          fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${position.coords.latitude}&lon=${position.coords.longitude}`)
            .then(res => res.json()).then(data => { if (data.display_name) setGpsAddress(data.display_name); }).catch(() => {});
        },
        (error) => {
          setGpsStatus('error');
          if (error.code === 1) {
             setMessage(isMobile ? ' Location access denied. Please enable GPS in your phone settings.' : '❌ GPS access denied. Please use the search bar below.');
          } else {
             setMessage(isMobile ? '️ Phone GPS unavailable. Use the search bar below.' : '️ Desktop GPS is inaccurate. Use the search bar below.');
          }
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
      return () => navigator.geolocation.clearWatch(watchId);
    }
  }, [accountType, isLogin, isMobile]);

  const handleSearch = () => {
    if (!searchQuery) return;
    setSearching(true); setMessage('');
    fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=1`)
      .then(res => res.json()).then(data => {
        if (data && data.length > 0) {
          setCoords({ lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) });
          setGpsStatus('captured'); 
          setGpsAddress(data[0].display_name); 
          setMessage('✅ Location found! Drag the red pin to your exact house.');
        } else { setMessage('❌ Location not found.'); }
        setSearching(false);
      }).catch(() => { setMessage('❌ Search failed.'); setSearching(false); });
  };

  // --- SMART LOGIN LOGIC ---
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault(); 
    setLoading(true); 
    setMessage('');

    if (accountType === 'Caretaker') {
      const { data: building, error } = await supabase
        .from('Buildings')
        .select('*')
        .eq('custom_id', buildingId)
        .eq('passcode', passcode)
        .maybeSingle(); // ✅ Prevents 406 error

      if (error || !building) { 
        setMessage('❌ Invalid Building ID or Passcode'); 
        setLoading(false); 
        return; 
      }
      localStorage.setItem('trakbin_caretaker', JSON.stringify(building));
      router.push('/caretaker-dashboard');
    } else {
      // Unified login for Operations (both Driver and Waste Company)
      let user = null;
      let loginAccountType = ''; // Renamed to avoid shadowing the state variable

      // 1. Try to find by Employee ID first (for Drivers)
      const { data: driverUser, error: driverError } = await supabase
        .from('users')
        .select('*')
        .eq('employee_id', email)
        .eq('password', password)
        .maybeSingle(); // ✅ Prevents 406 error

      if (driverUser && !driverError) {
        user = driverUser;
        loginAccountType = 'Driver';
      }

      // 2. If not found, try to find by Email (for Waste Companies)
      if (!user) {
        const { data: companyUser, error: companyError } = await supabase
          .from('users')
          .select('*')
          .eq('email', email)
          .eq('password', password)
          .maybeSingle(); // ✅ Prevents 406 error

        if (companyUser && !companyError) {
          user = companyUser;
          loginAccountType = 'WasteCompany';
        }
      }

      // 3. Route based on account type
      if (!user) {
        setMessage('❌ Invalid ID/Email or password');
        setLoading(false);
      } else {
        setMessage('✅ Login successful! Redirecting...');
        
        if (loginAccountType === 'WasteCompany') {
          localStorage.setItem('trakbin_company', JSON.stringify(user));
          router.push('/waste-company-dashboard');
        } else if (loginAccountType === 'Driver') {
          localStorage.setItem('trakbin_driver', JSON.stringify(user));
          router.push('/hauler-dashboard');
        }
      }
    } // ✅ THIS CLOSING BRACKET WAS MISSING, CAUSING THE ERROR!
  };

  // --- REGISTRATION LOGIC ---
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault(); 
    setLoading(true); 
    setMessage('');
    
    if (accountType === 'Caretaker') {
      if (gpsStatus !== 'captured') { setMessage(' Please search for your location or allow GPS.'); setLoading(false); return; }
      if (!officialAddress) { setMessage('❌ Please enter the official building address.'); setLoading(false); return; }
      if (buildingType === 'Residential Multi-Unit' && !numberOfFlats) { setMessage('❌ Please select number of flats.'); setLoading(false); return; }
      if (buildingType === 'Commercial' && !numberOfShops) { setMessage('❌ Please select number of shops.'); setLoading(false); return; }
      
      const { data: existingBuilding } = await supabase.from('Buildings').select('custom_id').eq('custom_id', buildingId).maybeSingle();
      if (existingBuilding) { setMessage(' Building ID already registered!'); setLoading(false); return; }

      const today = new Date();
      const currentDay = today.getDate();
      let nextBillingDate = new Date(today.getFullYear(), today.getMonth() + 1, 1); 
      if (currentDay > 25) {
        nextBillingDate = new Date(today.getFullYear(), today.getMonth() + 2, 1);
      }
      
      const buildingMetadata: any = { 
        custom_id: buildingId, 
        passcode: passcode, 
        building_type: buildingType, 
        address: officialAddress, 
        gps_location_address: gpsAddress, 
        latitude: coords.lat, 
        longitude: coords.lon, 
        status: 'pending', 
        payment_status: 'unpaid',
        next_billing_date: nextBillingDate.toISOString().split('T')[0],
        billing_day: 1
      };
      
      if (buildingType === 'Residential Multi-Unit') { buildingMetadata.number_of_units = parseInt(numberOfFlats); buildingMetadata.unit_type = 'flats'; } 
      else if (buildingType === 'Commercial') { buildingMetadata.number_of_units = parseInt(numberOfShops); buildingMetadata.unit_type = 'shops'; } 
      else { buildingMetadata.number_of_units = 1; buildingMetadata.unit_type = 'unit'; }
      
      const { error: buildingError } = await supabase.from('Buildings').insert([buildingMetadata]);
      if (buildingError) { setMessage('❌ Error: ' + buildingError.message); setLoading(false); return; }
      setMessage('✅ Building registered successfully! You can now login.');
      setTimeout(() => { setIsLogin(true); setMessage(''); }, 2000);
    } 
    else if (accountType === 'Operations') {
      const { data: existingUser } = await supabase.from('users').select('email').eq('email', email).maybeSingle();
      if (existingUser) { setMessage('❌ Email already registered.'); setLoading(false); return; }
      
      const { error } = await supabase.from('users').insert([{ 
        email, password, account_type: 'WasteCompany', company_name: companyName, license_number: licenseNumber 
      }]);
      
      if (error) { setMessage('❌ Registration failed: ' + error.message); } 
      else { setMessage('✅ Waste Company account created!'); setTimeout(() => { setIsLogin(true); setMessage(''); }, 2000); }
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-white">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden border border-green-100">
        <div className="px-8 pt-6">
          <button onClick={() => router.push('/')} className="flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-green-600 transition-all">
            <ArrowLeft size={16} /> Back to Home
          </button>
        </div>

        <div className="p-8 pb-4 text-center border-b border-green-50">
          <h1 className="text-3xl font-bold text-green-600 tracking-tight">Join Trakbin™</h1>
        </div>

        <div className="px-8 pb-8">
          <div className="flex bg-green-50 p-1 rounded-xl mb-6">
            <button onClick={() => setIsLogin(false)} className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${!isLogin ? 'bg-white text-green-700 shadow-sm' : 'text-gray-500'}`}>Register</button>
            <button onClick={() => setIsLogin(true)} className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${isLogin ? 'bg-white text-green-700 shadow-sm' : 'text-gray-500'}`}>Login</button>
          </div>

          <div className="mb-6">
            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">{isLogin ? 'Login As' : 'Register As'}</label>
            <div className="relative">
              <select value={accountType} onChange={(e) => setAccountType(e.target.value)} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 font-medium appearance-none focus:ring-2 focus:ring-green-500 outline-none">
                <option value="Caretaker">Caretaker / Building Manager</option>
                <option value="Operations">Waste Company / Driver</option>
              </select>
              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
            </div>
          </div>

          {isLogin ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <LogIn className="w-6 h-6 text-green-600" /> {accountType === 'Caretaker' ? 'Caretaker Login' : 'Operations Login'}
              </h2>
              
              {accountType === 'Caretaker' ? (
                <>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input type="text" placeholder="Building ID" value={buildingId} onChange={(e) => setBuildingId(e.target.value)} required className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:ring-2 focus:ring-green-500 outline-none" />
                  </div>
                  <input type="password" placeholder="Passcode" value={passcode} onChange={(e) => setPasscode(e.target.value)} required className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:ring-2 focus:ring-green-500 outline-none" />
                </>
              ) : (
                <>
                  <input 
                    type="text" 
                    placeholder="Email or Employee ID" 
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)} 
                    required 
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:ring-2 focus:ring-green-500 outline-none" 
                  />
                  <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:ring-2 focus:ring-green-500 outline-none" />
                </>
              )}
              <button type="submit" disabled={loading} className={`w-full py-3 font-bold rounded-xl transition-all shadow-lg text-white ${loading ? 'bg-gray-400' : 'bg-green-600 hover:bg-green-700'}`}>
                {loading ? 'Signing In...' : 'Sign In'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="space-y-4">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <UserPlus className="w-6 h-6 text-green-600" /> Create {accountType === 'Operations' ? 'Waste Company' : accountType} Account
              </h2>
              
              {accountType === 'Caretaker' ? (
                <>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input type="text" placeholder="Building ID (e.g., 12b)" value={buildingId} onChange={(e) => setBuildingId(e.target.value)} required className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:ring-2 focus:ring-green-500 outline-none" />
                  </div>
                  <input type="password" placeholder="Set Passcode" value={passcode} onChange={(e) => setPasscode(e.target.value)} required className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:ring-2 focus:ring-green-500 outline-none" />
                  
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <select value={buildingType} onChange={(e) => { setBuildingType(e.target.value); setNumberOfFlats(''); setNumberOfShops(''); }} className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 font-medium appearance-none focus:ring-2 focus:ring-green-500 outline-none">
                      <option value="Residential Single Unit">Residential Single Unit</option>
                      <option value="Residential Multi-Unit">Residential Multi-Unit (Apartment)</option>
                      <option value="Commercial">Commercial Building</option>
                      <option value="Industrial">Industrial Complex</option>
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                  </div>

                  {buildingType === 'Residential Multi-Unit' && (
                    <div className="relative">
                      <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <select value={numberOfFlats} onChange={(e) => setNumberOfFlats(e.target.value)} required className="w-full pl-10 pr-4 py-3 bg-green-50 border border-green-200 rounded-xl text-gray-900 font-medium appearance-none focus:ring-2 focus:ring-green-500 outline-none">
                        <option value="">Select Number of Flats</option>
                        {[...Array(50)].map((_, i) => (<option key={i + 1} value={i + 1}>{i + 1} {i + 1 === 1 ? 'Flat' : 'Flats'}</option>))}
                        <option value="50+">50+ Flats</option>
                      </select>
                      <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                    </div>
                  )}

                  {buildingType === 'Commercial' && (
                    <div className="relative">
                      <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <select value={numberOfShops} onChange={(e) => setNumberOfShops(e.target.value)} required className="w-full pl-10 pr-4 py-3 bg-green-50 border border-green-200 rounded-xl text-gray-900 font-medium appearance-none focus:ring-2 focus:ring-green-500 outline-none">
                        <option value="">Select Number of Shops</option>
                        {[...Array(50)].map((_, i) => (<option key={i + 1} value={i + 1}>{i + 1} {i + 1 === 1 ? 'Shop' : 'Shops'}</option>))}
                        <option value="50+">50+ Shops</option>
                      </select>
                      <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                    </div>
                  )}

                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                    <textarea 
                      placeholder="Official Building Address (e.g. House 12, Nsugbe Road)" 
                      value={officialAddress} 
                      onChange={(e) => setOfficialAddress(e.target.value)} 
                      required 
                      rows={2} 
                      className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:ring-2 focus:ring-green-500 outline-none resize-none" 
                    />
                  </div>
                  
                  <div className={`p-4 rounded-xl border-2 ${gpsStatus === 'captured' ? 'bg-green-50 border-green-200' : gpsStatus === 'requesting' ? 'bg-gray-50 border-gray-200' : 'bg-gray-50 border-gray-200'}`}>
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 flex-1">
                        {gpsStatus === 'requesting' && <Loader2 className="w-5 h-5 text-green-600 animate-spin" />}
                        {gpsStatus === 'captured' && <CheckCircle2 className="w-5 h-5 text-green-600" />}
                        {gpsStatus === 'error' && <AlertCircle className="w-5 h-5 text-gray-600" />}
                        <div>
                          <p className="text-sm font-bold text-gray-900 flex items-center gap-2">
                            {isMobile ? <Smartphone size={14} /> : <Monitor size={14} />}
                            {gpsStatus === 'requesting' && (isMobile ? 'Requesting phone location...' : 'Locating via Wi-Fi...')}
                            {gpsStatus === 'captured' && '✓ Location Locked'}
                            {gpsStatus === 'error' && (isMobile ? 'Location Unavailable' : 'Desktop GPS Inaccurate')}
                          </p>
                          {accuracy && gpsStatus === 'captured' && <p className="text-xs text-green-700 font-medium">Accuracy: {Math.round(accuracy)} meters</p>}
                          {gpsStatus === 'error' && <p className="text-xs text-gray-600 font-medium">{isMobile ? 'Enable GPS in settings or use search.' : 'Use the search bar below.'}</p>}
                        </div>
                      </div>
                      {gpsStatus !== 'requesting' && (
                        <button type="button" onClick={() => { setGpsStatus('requesting'); setAccuracy(null); navigator.geolocation.getCurrentPosition((pos) => { setCoords({ lat: pos.coords.latitude, lon: pos.coords.longitude }); setAccuracy(pos.coords.accuracy); setGpsStatus('captured'); }, () => setGpsStatus('error'), { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }); }} className="text-xs font-bold text-green-600 hover:text-green-800 underline whitespace-nowrap">
                          Refresh GPS
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input type="text" placeholder='Search "Nsugbe, Anambra"' value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleSearch(); } }} className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-green-500 outline-none" />
                    </div>
                    <button type="button" onClick={handleSearch} disabled={searching} className="px-4 py-2.5 bg-green-600 text-white text-sm font-bold rounded-lg hover:bg-green-700 transition-all disabled:bg-gray-400">
                      {searching ? 'Searching...' : 'Search'}
                    </button>
                  </div>
                  {gpsStatus !== 'idle' && (
                    <div className="rounded-xl overflow-hidden border-2 border-gray-200 shadow-inner">
                      <div className="bg-gray-50 px-4 py-2 border-b border-gray-200 flex justify-between items-center">
                        <p className="text-xs font-bold text-gray-700 flex items-center gap-2"><MapPin size={14} className="text-green-600" /> Pinpoint Exact Location</p>
                        <p className="text-[10px] text-gray-500">Drag the red pin</p>
                      </div>
                      <div style={{ height: '300px' }}>
                        <DraggableMap coords={coords} onDragEnd={(lat, lon) => { 
                          setCoords({ lat, lon }); 
                          fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`).then(res => res.json()).then(data => { if (data.display_name) setGpsAddress(data.display_name); }).catch(() => {}); 
                        }} />
                      </div>
                    </div>
                  )}
                  
                  {gpsAddress && (
                    <div className="relative">
                      <MapPin className="absolute left-3 top-3 w-5 h-5 text-green-600" />
                      <div className="w-full pl-10 pr-4 py-3 bg-green-50 border border-green-200 rounded-xl text-sm text-gray-700">
                        <p className="text-[10px] font-bold text-green-700 uppercase mb-1">Detected Map Location (Auto)</p>
                        <p>{gpsAddress}</p>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <>
                  <input type="email" placeholder="Business Email" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:ring-2 focus:ring-green-500 outline-none" />
                  <input type="password" placeholder="Create Password" value={password} onChange={(e) => setPassword(e.target.value)} required className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:ring-2 focus:ring-green-500 outline-none" />
                  <div className="relative">
                    <Truck className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input type="text" placeholder="Company Name" value={companyName} onChange={(e) => setCompanyName(e.target.value)} required className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:ring-2 focus:ring-green-500 outline-none" />
                  </div>
                  <input type="text" placeholder="Business License Number" value={licenseNumber} onChange={(e) => setLicenseNumber(e.target.value)} required className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:ring-2 focus:ring-green-500 outline-none" />
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input type="text" placeholder="Operating Address" value={operatingAddress} onChange={(e) => setOperatingAddress(e.target.value)} required className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:ring-2 focus:ring-green-500 outline-none" />
                  </div>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input type="tel" placeholder="Contact Number" value={contactNumber} onChange={(e) => setContactNumber(e.target.value)} required className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:ring-2 focus:ring-green-500 outline-none" />
                  </div>
                </>
              )}
              <button type="submit" disabled={loading || (accountType === 'Caretaker' && gpsStatus !== 'captured')} className={`w-full py-3 font-bold rounded-xl transition-all shadow-lg text-white ${loading || (accountType === 'Caretaker' && gpsStatus !== 'captured') ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'}`}>
                {loading ? 'Creating Account...' : `Register as ${accountType === 'Operations' ? 'Waste Company' : accountType}`}
              </button>
            </form>
          )}
          {message && (
            <div className={`mt-6 flex items-start gap-3 p-4 rounded-xl text-sm font-medium ${message.includes('❌') ? 'text-red-700 bg-red-50 border border-red-100' : message.includes('✅') ? 'text-green-700 bg-green-50 border border-green-200' : 'text-gray-700 bg-gray-50 border border-gray-100'}`}>
              {message.includes('❌') ? <AlertCircle size={18} className="shrink-0 mt-0.5 text-red-600" /> : <CheckCircle2 size={18} className="shrink-0 mt-0.5 text-green-600" />}
              <p>{message}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}