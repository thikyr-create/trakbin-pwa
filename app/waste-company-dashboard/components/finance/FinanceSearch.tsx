// app/waste-company-dashboard/components/finance/FinanceSearch.tsx
"use client";

import { Search } from "lucide-react";

interface FinanceSearchProps {
  value: string;
  onChange: (v: string) => void;
}

export default function FinanceSearch({ value, onChange }: FinanceSearchProps) {
  return (
    <div className="relative w-full max-w-sm">
      <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search building, address, reference…"
        className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-xs font-semibold text-gray-800 outline-none transition placeholder:text-gray-400 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
      />
    </div>
  );
}