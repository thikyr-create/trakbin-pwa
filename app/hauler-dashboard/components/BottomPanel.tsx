"use client";

export default function BottomPanel() {
  return (
    <div className="bg-slate-900/95 backdrop-blur-xl rounded-t-[18px] p-5 shadow-2xl border-t border-slate-800">
      <div className="flex justify-center mb-3">
        <div className="w-12 h-1.5 bg-slate-700 rounded-full"></div>
      </div>
      
      <div className="text-center">
        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">
          Status
        </p>
        <p className="text-sm font-medium text-gray-300">
          Waiting for route assignment...
        </p>
      </div>
    </div>
  );
}