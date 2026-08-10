// app/hauler-dashboard/components/progress/SummaryRow.tsx
"use client";

import type { LucideIcon } from 'lucide-react';

export default function SummaryRow({ Icon, label, value }: { Icon: LucideIcon; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
          <Icon size={15} className="text-emerald-700" />
        </div>
        <p className="text-sm font-bold text-gray-600">{label}</p>
      </div>
      <p className="text-sm font-black text-gray-900">{value}</p>
    </div>
  );
}