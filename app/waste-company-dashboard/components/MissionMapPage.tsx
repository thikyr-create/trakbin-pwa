"use client";

import { Map } from 'lucide-react';

interface MissionMapPageProps {
  buildings: any[];
}

export default function MissionMapPage({ buildings }: MissionMapPageProps) {
  return (
    <div className="h-[calc(100vh-140px)] bg-white rounded-xl border border-gray-200 overflow-hidden relative flex items-center justify-center">
      <div className="text-center">
        <Map className="w-20 h-20 text-gray-300 mx-auto mb-4" />
        <p className="text-sm font-black text-gray-500 uppercase">Live Mission Map</p>
        <p className="text-xs font-bold text-gray-400 mt-2">{buildings.length} buildings tracked</p>
      </div>
    </div>
  );
}