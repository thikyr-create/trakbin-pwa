// app/hauler-dashboard/components/more/AccountCard.tsx
"use client";

import { LogOut, IdCard, Building2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useDriverSession } from '@/lib/store/useDriverSession';

export default function AccountCard() {
  const router = useRouter();
  const { driver, driverCompanyId, stopGpsTracking } = useDriverSession();

  const signOut = () => {
    stopGpsTracking();
    localStorage.removeItem('trakbin_driver');
    router.push('/');
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      <p className="px-4 pt-3 pb-1 text-[10px] font-bold uppercase tracking-wide text-gray-400">Account</p>
      <div className="flex items-center gap-3 px-4 py-3.5 border-t border-gray-100">
        <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center">
          <IdCard size={17} className="text-gray-700" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-bold text-gray-900">Driver ID</p>
          <p className="text-[11px] text-gray-400 font-mono">{driver?.employee_id || driver?.id || '—'}</p>
        </div>
      </div>
      <div className="flex items-center gap-3 px-4 py-3.5 border-t border-gray-100">
        <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center">
          <Building2 size={17} className="text-gray-700" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-bold text-gray-900">Company</p>
          <p className="text-[11px] text-gray-400 font-mono">#{driverCompanyId ?? '—'}</p>
        </div>
      </div>
      <button
        onClick={signOut}
        className="w-full flex items-center gap-3 px-4 py-3.5 text-left border-t border-gray-100 active:bg-red-50"
      >
        <div className="w-9 h-9 rounded-lg bg-red-50 flex items-center justify-center">
          <LogOut size={17} className="text-red-600" />
        </div>
        <p className="text-sm font-bold text-red-600">Sign Out</p>
      </button>
    </div>
  );
}