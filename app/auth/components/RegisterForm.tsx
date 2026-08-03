"use client";

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { motion } from 'framer-motion';
import { JetBrains_Mono } from 'next/font/google';
import { Building2, UserPlus, Truck, MapPin, Phone, Loader2, Search, CheckCircle2, AlertCircle, Smartphone, Monitor, ChevronDown } from 'lucide-react';
import CompanyIdCard from './CompanyIdCard';
import { authEngine } from '@/lib/auth/authEngine';
import type { AccountType } from '@/lib/auth/types';

const DraggableMap = dynamic(() => import('../../dashboard/DraggableMap'), { ssr: false });
const mono = JetBrains_Mono({ subsets: ['latin'], display: 'swap', variable: '--font-mono' });
const EASE = [0.22, 1, 0.36, 1] as [number, number, number, number];
const inputCls = 'w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-semibold text-gray-900 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-200';
const labelCls = 'mb-1 block font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400';

interface Props { accountType: AccountType; onRegistered: (id: string, passcode: string, address: string) => void; onSwitchToLogin: () => void; }

export default function RegisterForm({ accountType, onRegistered, onSwitchToLogin }: Props) {
  const [isMobile, setIsMobile] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

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

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [operatingAddress, setOperatingAddress] = useState('');
  const [contactNumber, setContactNumber] = useState('');

  // INSIDE the component — this was the bug (it was at module scope)
  const [companyCard, setCompanyCard] = useState<null | { id: number; name: string; email: string; license: string }>(null);

  useEffect(() => { if (typeof window !== 'undefined') setIsMobile(/iPhone|iPad|iPod|Android/i.test(navigator.userAgent)); }, []);

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
        if (d && d.length > 0) { setCoords({ lat: parseFloat(d[0].lat), lon: parseFloat(d[0].lon) }); setGpsStatus('captured'); setGpsAddress(d[0].display_name); setMessage('✅ Location found! Drag the red pin to your exact house.'); }
        else setMessage('❌ Location not found.');
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
      const res = await authEngine.registerCaretaker({ passcode, buildingType, officialAddress, estate, gpsAddress, latitude: coords.lat, longitude: coords.lon, numberOfFlats, numberOfShops });
      setMessage(res.message);
      if (res.ok && res.buildingId) onRegistered(res.buildingId, passcode, officialAddress);
      setLoading(false);
      return;
    }
    const res = await authEngine.registerCompany({ email, password, companyName, licenseNumber, operatingAddress, contactNumber });
    setMessage(res.message);
    if (res.ok && res.companyId) {
      setCompanyCard({ id: res.companyId, name: companyName, email, license: licenseNumber });
    }
    setLoading(false);
  };

  return (
    <motion.form key={accountType} onSubmit={submit} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: EASE }} className="space-y-4">
      <h2 className="flex items-center gap-2 text-xl font-extrabold tracking-tight text-gray-900"><UserPlus className="h-5 w-5 text-emerald-600" /> Create {accountType === 'Operations' ? 'Waste Company' : accountType} Account</h2>

      {accountType === 'Caretaker' ? (
        <>
          <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
            <p className="text-xs font-bold text-blue-800">ℹ️ Building ID will be auto-generated</p>
            <p className="mt-0.5 text-xs text-blue-700">You'll receive a digital ID card to save after registration.</p>
          </div>

          <input type="password" placeholder="Set Passcode" value={passcode} onChange={(e) => setPasscode(e.target.value)} required className={inputCls} />

          <div className="relative">
            <Building2 className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
            <select value={buildingType} onChange={(e) => { setBuildingType(e.target.value); setNumberOfFlats(''); setNumberOfShops(''); }} className={`${inputCls} appearance-none pl-10`}>
              <option value="Residential Single Unit">Residential Single Unit</option>
              <option value="Residential Multi-Unit">Residential Multi-Unit (Apartment)</option>
              <option value="Commercial">Commercial Building</option>
              <option value="Industrial">Industrial Complex</option>
            </select>
            <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
          </div>

          {buildingType === 'Residential Multi-Unit' && (
            <div className="relative">
              <Building2 className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
              <select value={numberOfFlats} onChange={(e) => setNumberOfFlats(e.target.value)} required className={`${inputCls} appearance-none border-green-200 bg-green-50 pl-10`}>
                <option value="">Select Number of Flats</option>
                {[...Array(50)].map((_, i) => (<option key={i + 1} value={i + 1}>{i + 1} {i + 1 === 1 ? 'Flat' : 'Flats'}</option>))}
                <option value="50+">50+ Flats</option>
              </select>
              <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
            </div>
          )}

          {buildingType === 'Commercial' && (
            <div className="relative">
              <Building2 className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
              <select value={numberOfShops} onChange={(e) => setNumberOfShops(e.target.value)} required className={`${inputCls} appearance-none border-green-200 bg-green-50 pl-10`}>
                <option value="">Select Number of Shops</option>
                {[...Array(50)].map((_, i) => (<option key={i + 1} value={i + 1}>{i + 1} {i + 1 === 1 ? 'Shop' : 'Shops'}</option>))}
                <option value="50+">50+ Shops</option>
              </select>
              <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
            </div>
          )}

          <div>
            <label className={labelCls}>Official building address</label>
            <textarea placeholder="House 12, Nsugbe Road" value={officialAddress} onChange={(e) => setOfficialAddress(e.target.value)} required rows={2} className={`${inputCls} resize-none`} />
          </div>

          <div>
            <label className={labelCls}>Estate / street <span className="text-gray-300">(feeds matching)</span></label>
            <input type="text" placeholder="Independence Estate, Nsugbe Road" value={estate} onChange={(e) => setEstate(e.target.value)} className={inputCls} />
          </div>

          <div className={`rounded-xl border-2 p-4 ${gpsStatus === 'captured' ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-gray-50'}`}>
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                {gpsStatus === 'requesting' && <Loader2 className="h-5 w-5 animate-spin text-green-600" />}
                {gpsStatus === 'captured' && <CheckCircle2 className="h-5 w-5 text-green-600" />}
                {gpsStatus === 'error' && <AlertCircle className="h-5 w-5 text-gray-600" />}
                <div>
                  <p className="flex items-center gap-2 text-sm font-bold text-gray-900">
                    {isMobile ? <Smartphone size={14} /> : <Monitor size={14} />}
                    {gpsStatus === 'requesting' && (isMobile ? 'Requesting phone location...' : 'Locating via Wi-Fi...')}
                    {gpsStatus === 'captured' && '✓ Location Locked'}
                    {gpsStatus === 'error' && (isMobile ? 'Location Unavailable' : 'Desktop GPS Inaccurate')}
                  </p>
                  {accuracy && gpsStatus === 'captured' && <p className="text-xs font-medium text-green-700">Accuracy: {Math.round(accuracy)} meters</p>}
                </div>
              </div>
              {gpsStatus !== 'requesting' && (
                <button type="button" onClick={() => { setGpsStatus('requesting'); setAccuracy(null); navigator.geolocation.getCurrentPosition((pos) => { setCoords({ lat: pos.coords.latitude, lon: pos.coords.longitude }); setAccuracy(pos.coords.accuracy); setGpsStatus('captured'); }, () => setGpsStatus('error'), { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }); }} className="whitespace-nowrap text-xs font-bold text-green-600 underline hover:text-green-800">Refresh GPS</button>
              )}
            </div>
          </div>

          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input type="text" placeholder='Search "Nsugbe, Anambra"' value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleSearch(); } }} className={`${inputCls} pl-9`} />
            </div>
            <button type="button" onClick={handleSearch} disabled={searching} className="rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-emerald-700 disabled:bg-gray-400">{searching ? 'Searching...' : 'Search'}</button>
          </div>

          {gpsStatus !== 'idle' && (
            <div className="overflow-hidden rounded-xl border-2 border-gray-200 shadow-inner">
              <div className="flex items-center justify-between border-b border-gray-200 bg-gray-50 px-4 py-2">
                <p className="flex items-center gap-2 text-xs font-bold text-gray-700"><MapPin size={14} className="text-green-600" /> Pinpoint Exact Location</p>
                <p className="text-[10px] text-gray-500">Drag the red pin</p>
              </div>
              <div style={{ height: '300px' }}>
                <DraggableMap coords={coords} onDragEnd={(lat, lon) => { setCoords({ lat, lon }); fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`).then((r) => r.json()).then((d) => { if (d.display_name) setGpsAddress(d.display_name); }).catch(() => {}); }} />
              </div>
            </div>
          )}

          {gpsAddress && (
            <div className="relative">
              <MapPin className="absolute left-3 top-3 h-5 w-5 text-green-600" />
              <div className="w-full rounded-xl border border-green-200 bg-green-50 py-3 pl-10 pr-4 text-sm text-gray-700">
                <p className="mb-1 text-[10px] font-bold uppercase text-green-700">Detected Map Location (Auto)</p>
                <p>{gpsAddress}</p>
              </div>
            </div>
          )}
        </>
      ) : (
        <>
          <input type="email" placeholder="Business Email" value={email} onChange={(e) => setEmail(e.target.value)} required className={inputCls} />
          <input type="password" placeholder="Create Password" value={password} onChange={(e) => setPassword(e.target.value)} required className={inputCls} />
          <div className="relative">
            <Truck className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
            <input type="text" placeholder="Company Name" value={companyName} onChange={(e) => setCompanyName(e.target.value)} required className={`${inputCls} pl-10`} />
          </div>
          <input type="text" placeholder="Business License Number" value={licenseNumber} onChange={(e) => setLicenseNumber(e.target.value)} required className={inputCls} />
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
            <input type="text" placeholder="Operating Address" value={operatingAddress} onChange={(e) => setOperatingAddress(e.target.value)} required className={`${inputCls} pl-10`} />
          </div>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
            <input type="tel" placeholder="Contact Number" value={contactNumber} onChange={(e) => setContactNumber(e.target.value)} required className={`${inputCls} pl-10`} />
          </div>
        </>
      )}

      <motion.button whileTap={{ scale: 0.98 }} whileHover={{ y: -1 }} type="submit" disabled={loading || (accountType === 'Caretaker' && gpsStatus !== 'captured')} className={`w-full rounded-xl py-3 font-extrabold text-white shadow-lg transition-all ${loading || (accountType === 'Caretaker' && gpsStatus !== 'captured') ? 'cursor-not-allowed bg-gray-400 shadow-none' : 'bg-emerald-600 shadow-emerald-200 hover:bg-emerald-700'}`}>
        {loading ? 'Creating Account...' : `Register as ${accountType === 'Operations' ? 'Waste Company' : accountType}`}
      </motion.button>

      {message && (
        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className={`flex items-start gap-3 rounded-xl p-4 text-sm font-medium ${message.includes('❌') ? 'border border-red-100 bg-red-50 text-red-700' : message.includes('✅') ? 'border border-green-200 bg-green-50 text-green-700' : 'border border-gray-100 bg-gray-50 text-gray-700'}`}>
          {message.includes('❌') ? <AlertCircle size={18} className="mt-0.5 shrink-0" /> : <CheckCircle2 size={18} className="mt-0.5 shrink-0" />}
          <p>{message}</p>
        </motion.div>
      )}

      {/* INSIDE the returned JSX — this was floating outside before */}
      {companyCard && (
        <CompanyIdCard company={companyCard} onClose={() => { setCompanyCard(null); onSwitchToLogin(); }} />
      )}
    </motion.form>
  );
}