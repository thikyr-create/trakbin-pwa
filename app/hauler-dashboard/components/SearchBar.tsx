"use client";

import { useState } from 'react';
import { Search } from 'lucide-react';

export default function SearchBar() {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  const handleSearch = async (value: string) => {
    setQuery(value);
    if (value.length < 3) {
      setSuggestions([]);
      return;
    }

    // TODO: Implement search with Mapbox Geocoding API
    // For now, placeholder
  };

  return (
    <div className="relative">
      <div className="bg-slate-900/90 backdrop-blur-md rounded-[18px] flex items-center gap-3 px-4 py-3 shadow-lg border border-slate-800">
        <Search size={20} className="text-gray-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="Search building, street, or estate..."
          className="flex-1 bg-transparent text-white text-sm font-medium outline-none placeholder:text-gray-500"
        />
      </div>
    </div>
  );
}