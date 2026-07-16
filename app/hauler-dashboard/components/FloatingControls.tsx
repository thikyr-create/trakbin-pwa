"use client";

import { MapPin, Navigation, Plus, Minus, AlertTriangle } from 'lucide-react';

interface FloatingControlsProps {
  onRecenter: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
}

export default function FloatingControls({ onRecenter, onZoomIn, onZoomOut }: FloatingControlsProps) {
  return (
    <div className="flex flex-col gap-2">
      <button
        onClick={onRecenter}
        className="w-11 h-11 bg-slate-900/90 backdrop-blur-md rounded-full flex items-center justify-center shadow-lg border border-slate-800 hover:bg-emerald-600 transition-colors"
      >
        <MapPin size={18} className="text-emerald-400" />
      </button>

      <button
        onClick={onZoomIn}
        className="w-11 h-11 bg-slate-900/90 backdrop-blur-md rounded-full flex items-center justify-center shadow-lg border border-slate-800 hover:bg-slate-800 transition-colors"
      >
        <Plus size={18} className="text-white" />
      </button>

      <button
        onClick={onZoomOut}
        className="w-11 h-11 bg-slate-900/90 backdrop-blur-md rounded-full flex items-center justify-center shadow-lg border border-slate-800 hover:bg-slate-800 transition-colors"
      >
        <Minus size={18} className="text-white" />
      </button>

      <button
        className="w-11 h-11 bg-slate-900/90 backdrop-blur-md rounded-full flex items-center justify-center shadow-lg border border-slate-800 hover:bg-orange-500/20 transition-colors"
      >
        <AlertTriangle size={18} className="text-orange-400" />
      </button>
    </div>
  );
}