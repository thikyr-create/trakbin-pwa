"use client";

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { Building2, UserPlus, Truck, MapPin, Phone, Loader2, Search, CheckCircle2, AlertCircle, Smartphone, Monitor, ChevronDown } from 'lucide-react';
import { authEngine } from '@/lib/auth/authEngine';
import type { AccountType } from '@/lib/auth/types';

const DraggableMap = dynamic(() => import('../../dashboard/DraggableMap'), { ssr: false });

interface Props {
  accountType: AccountType;
  onRegistered: (buildingId: string, passcode: string, address: string) => void;
  onSwitchToLogin: () => void;
}

export default function RegisterForm({ accountType, onRegistered, onSwitchToLogin }: Props) {
  const [isMobile, setIsMobile] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  // caretaker fields
  const [passcode, setPasscode] = useState('');
  const [buildingType, setBuildingType] = useState('Residential Single Unit');
  const [numberOfFlats, setNumberOfFlats] = useState('');
  const [numberOfShops, setNumberOfShops] = useState('');
  const [officialAddress, setOfficialAddress] = useState('');
  const [estate, setEstate] = useState('');
  const [gpsAddress, setGpsAddress] = useState('');
  const [coords, setCoords] = useState({ lat: 6.5244, lon: 3.3792 });
  const [gpsStatus, setGpsStatus] = useState('idle');
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);

  // company fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [operatingAddress, setOperatingAddress] = useState('');
  const [contactNumber, setContactNumber] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') setIsMobile(/iPhone|iPad|iPod|Android/i.test(navigator.userAgent));
  }, []);

  useEffect(() => {
    if (accountType === 'Caretaker') {
      setGpsStatus('requesting');
      if (!navigator.geolocation) { setGpsStatus('unsupported'); setMessage('GPS is not supported in your browser'); return; }
      const watchId = navigator.geolocation.watchPosition(
        (position) => {
          setCoords({ lat: position.coords.latitude, lon: position.coords.longitude });
          setAccuracy(position.coords.accuracy); setGpsStatus('captured'); setMessage('');
          fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${position.coords.latitude}&lon=${position.coords.longitude}`)
            .then((r) => r.json()).then((d) => { if (d.display_name) setGpsAddress(d.display_name); }).catch(() => {});
        },
        (error) => {
          setGpsStatus('error');
          setMessage(error.code === 1
            ? (isMobile ? 'Location access denied. Please enable GPS in your phone settings.' : 'GPS access denied. Please use the search bar below.')
            : (isMobile ? 'Phone GPS unavailable. Use the search bar below.' : 'Desktop GPS is inaccurate. Use the search bar below.'));
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
      return () => navigator.geolocation.clearWatch(watchId);
    }
  }, [accountType, isMobile]);

  const handleSearch = () => {
    if (!searchQuery) return;
    setSearching(true); setMessage('');
    fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=1`)
      .then((r) => r.json()).then((d) => {
        if (d && d.length > 0) {
          setCoords({ lat: parseFloat(d[0].lat), lon: parseFloat(d[0].lon) });
          setGpsStatus('captured'); setGpsAddress(d[0].display_name);
          setMessage('✅ Location found! Drag the red pin to your exact house.');
        } else setMessage('❌ Location not found.');
        setSearching(false);
      }).catch(() => { setMessage('Search failed.'); setSearching(false); });
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true); setMessage('');

    if (accountType === 'Caretaker') {
      if (gpsStatus !== 'captured') { setMessage('Please search for your location or allow GPS.'); setLoading(false); return; }
      if (!officialAddress) { setMessage('❌ Please enter the official building address.'); setLoading(false); return; }
      if (buildingType === 'Residential Multi-Unit' && !numberOfFlats) { setMessage('Please select number of flats.'); setLoading(false); return; }
      if (buildingType === 'Commercial' && !numberOfShops) { setMessage('❌ Please select number of shops.'); setLoading(false); return; }

      const res = await authEngine.registerCaretaker({
        passcode, buildingType, officialAddress, estate, gpsAddress,
        latitude: coords.lat, longitude: coords.lon, numberOfFlats, numberOfShops,
      });
      setMessage(res.message);
      if (res.ok && res.buildingId) onRegistered(res.buildingId, passcode, officialAddress);
      setLoading(false);
      return;
    }

    const res = await authEngine.registerCompany({ email, password, companyName, licenseNumber, operatingAddress, contactNumber });
    setMessage(res.message);
    if (res.ok) setTimeout(() => { onSwitchToLogin(); setMessage(''); }, 2000);
    setLoading(false);
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
        <UserPlus className="w-6 h-6 text-green-600" /> Create {accountType === 'Operations' ? 'Waste Company' : accountType} Account
      </h2>

      {accountType === 'Caretaker' ? (
        <>
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4">
            <p className="text-xs font-bold text-blue-800 mb-1">ℹ️ Building ID will be auto-generated</p>
            <p className="text-xs text-blue-700">A unique Building ID will be created for you after registration. You'll receive a digital ID card to save.</p>
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
            <textarea placeholder="Official Building Address (e.g. House 12, Nsugbe Road)" value={officialAddress} onChange={(e) => setOfficialAddress(e.target.value)} required rows={2} className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:ring-2 focus:ring-green-500 outline-none resize-none" />
          </div>

          {/* NEW: estate — feeds the zone matcher */}
          <div className="relative">
            <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input type="text" placeholder="Estate / Street (e.g. Independence Estate, Nsugbe Road)" value={estate} onChange={(e) => setEstate(e.target.value)} className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:ring-2 focus:ring-green-500 outline-none" />
          </div>

          <div className={`p-4 rounded-xl border-2 ${gpsStatus === 'captured' ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
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
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 w-4 text-gray-400" />
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
                  fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`).then((r) => r.json()).then((d) => { if (d.display_name) setGpsAddress(d.display_name); }).catch(() => {});
                }} />
              </div>
            </div>
          )}

          {gpsAddress && (
            <div className="relative">
              <MapPin className="absolute left-3 top-3 w-5 w-5 text-green-600" />
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

      {message && (
        <div className={`flex items-start gap-3 p-4 rounded-xl text-sm font-medium ${message.includes('❌') ? 'text-red-700 bg-red-50 border border-red-100' : message.includes('✅') ? 'text-green-700 bg-green-50 border border-green-200' : 'text-gray-700 bg-gray-50 border border-gray-100'}`}>
          {message.includes('❌') ? <AlertCircle size={18} className="shrink-0 mt-0.5" /> : <CheckCircle2 size={18} className="shrink-0 mt-0.5" />}
          <p>{message}</p>
        </div>
      )}
    </form>
  );
}