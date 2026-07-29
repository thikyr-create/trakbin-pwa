"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { LogOut, Home, Building2, Calendar, Truck, Phone, ArrowRight, CheckCircle2 } from 'lucide-react';
import { useCaretakerSession } from '@/lib/store/useCaretakerSession';

// Import the smart components
import BillingCard from './components/BillingCard';
import WalletCard from './components/WalletCard';
import CollectionStatusCard from './components/CollectionStatusCard';
import AddFundsModal from './components/AddFundsModal';
import AutopayModal from './components/AutopayModal';

export default function CaretakerDashboard() {
  const router = useRouter();
  const { 
    building, collectionHistory, loading, billingProcessing,
    initializeSession, logout 
  } = useCaretakerSession();

  useEffect(() => {
    initializeSession();
  }, []);

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-white"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div></div>;
  if (!building) return null;

  return (
    <div className="min-h-screen bg-gray-50/50 font-sans">
      {billingProcessing && (
        <div className="fixed top-4 right-4 bg-blue-600 text-white px-4 py-3 rounded-xl shadow-lg z-[1000] flex items-center gap-2 animate-pulse text-sm font-bold">
          Processing Monthly Billing...
        </div>
      )}

      <header className="bg-white border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center"><span className="text-white font-bold text-xl">T</span></div>
              <span className="text-xl font-bold text-gray-900 tracking-tight">Trakbin</span>
            </div>
            <button onClick={logout} className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"><LogOut size={16} /> Logout</button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Welcome Header */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-8 flex items-center gap-4 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-green-50 to-transparent opacity-50"></div>
          <div className="relative z-10 flex items-center gap-4">
            <div className="bg-green-600 p-3 rounded-xl shadow-lg shadow-green-200"><Home className="w-6 h-6 text-white" /></div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Welcome Back!</h1>
              <p className="text-sm text-gray-500 font-medium">Here's your building's waste collection status</p>
            </div>
          </div>
        </div>

        {/* Top 3 Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <BillingCard />
          <WalletCard />
          <CollectionStatusCard />
        </div>

        {/* Building Details */}
        <div 
          className="group relative bg-white rounded-2xl shadow-sm border border-gray-200 p-8 transition-all duration-200 hover:-translate-y-1 hover:shadow-xl hover:border-green-500 cursor-pointer mb-10" 
          onClick={() => router.push("/caretaker-dashboard/building")}
        >
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="bg-green-50 p-3 rounded-2xl"><Building2 className="w-8 h-8 text-green-600" /></div>
              <h3 className="text-lg font-bold text-gray-900 uppercase">BUILDING ID</h3>
            </div>
          </div>
          <h2 className="text-4xl font-bold tracking-tight text-gray-900 mb-2">{building.custom_id}</h2>
          <p className="text-lg font-medium text-gray-700 mb-6">{building.building_type}</p>
          <div className="border-t border-gray-100 my-6"></div>
          <div className="space-y-3 mb-6">
            <div className="flex items-center gap-3 text-sm text-gray-600">
              <span className="font-bold">{building.address || 'Address not provided'}</span>
            </div>
          </div>
          <div className="flex items-center gap-1 text-green-600 font-semibold text-sm">
            <span>View Building</span>
            <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
          </div>
        </div>

        {/* Collection History */}
        <div 
          className="group relative bg-white rounded-2xl shadow-sm border border-gray-200 p-8 transition-all duration-200 hover:-translate-y-1 hover:shadow-xl hover:border-green-500 cursor-pointer mb-10" 
          onClick={() => router.push("/caretaker-dashboard/collection-history")}
        >
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="bg-green-50 p-3 rounded-2xl"><Calendar className="w-8 h-8 text-green-600" /></div>
              <h3 className="text-lg font-bold text-gray-900 uppercase">COLLECTION HISTORY</h3>
            </div>
            <span className="bg-green-50 text-green-700 text-sm font-medium px-3 py-1 rounded-full flex items-center gap-1.5 border border-green-100">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span> Up to Date
            </span>
          </div>
          <p className="text-sm font-medium text-gray-500 mb-1">Last Collection</p>
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 mb-2">
            {collectionHistory.length > 0 ? new Date(collectionHistory[0].collection_date).toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) : 'No Collections Yet'}
          </h2>
          <p className="text-base font-medium text-green-600 flex items-center gap-2 mb-6">
            <CheckCircle2 className="w-5 h-5" /> {collectionHistory.length > 0 ? 'Completed Successfully' : 'Awaiting First Pickup'}
          </p>
          <div className="border-t border-gray-100 my-6"></div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-gray-500 uppercase">This Month</p>
              <p className="text-lg font-bold text-gray-900">{collectionHistory.length} Collections Completed</p>
            </div>
            <div className="flex items-center gap-1 text-green-600 font-semibold text-sm">
              <span>View History</span>
              <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
            </div>
          </div>
        </div>

        {/* Help Banner */}
        <div className="bg-green-600 rounded-2xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold mb-1">Need Help?</h3>
              <p className="text-sm text-green-100 font-semibold">Contact your waste collection hauler</p>
            </div>
            <button className="flex items-center gap-2 bg-white text-green-600 px-6 py-3 rounded-xl font-bold hover:bg-gray-100 transition-all">
              <Phone size={18} /> Call Hauler
            </button>
          </div>
        </div>
      </main>

      {/* Global Modals */}
      <AddFundsModal />
      <AutopayModal />
    </div>
  );
}