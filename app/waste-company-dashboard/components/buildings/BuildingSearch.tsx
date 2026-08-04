"use client";

import { Search, X } from "lucide-react";

interface BuildingSearchProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export default function BuildingSearch({
  value,
  onChange,
  placeholder = "Search by ID, address, estate or type…",
}: BuildingSearchProps) {
  return (
    <div className="relative w-full max-w-md">
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-9 pr-9 text-sm font-semibold text-gray-900 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
      />
      {value && (
        <button
          onClick={() => onChange("")}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 transition hover:text-gray-800"
          aria-label="Clear search"
        >
          <X size={14} />
        </button>
      )}
    </div>
  );
}