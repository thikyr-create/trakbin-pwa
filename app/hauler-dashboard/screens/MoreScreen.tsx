// app/hauler-dashboard/screens/MoreScreen.tsx
"use client";

import OfflineCard from '../components/more/OfflineCard';
import ToolsList from '../components/more/ToolsList';
import AccountCard from '../components/more/AccountCard';

export default function MoreScreen() {
  return (
    <div className="absolute inset-0 bg-gray-50 overflow-y-auto">
      <div className="px-4 pt-4 pb-3">
        <h2 className="text-lg font-black text-gray-900">More</h2>
        <p className="text-xs font-semibold text-gray-500">Tools, connectivity & account</p>
      </div>

      <div className="px-4 pb-6 space-y-3">
        <OfflineCard />
        <ToolsList />
        <AccountCard />
        <p className="text-center text-[10px] font-bold uppercase tracking-wide text-gray-300 pt-2">
          Trakbin Driver Console
        </p>
      </div>
    </div>
  );
}