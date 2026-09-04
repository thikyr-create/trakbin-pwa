// app/hauler-dashboard/components/progress/ProgressRing.tsx
"use client";

export default function ProgressRing({ pct }: { pct: number }) {
  const r = 52;
  const c = 2 * Math.PI * r;
  const filled = c * Math.min(1, Math.max(0, pct));

  return (
    <div className="relative w-32 h-32">
      <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
        <circle cx="60" cy="60" r={r} fill="none" stroke="#E5E7EB" strokeWidth="10" />
        <circle
          cx="60" cy="60" r={r} fill="none"
          stroke="#059669" strokeWidth="10" strokeLinecap="round"
          strokeDasharray={`${filled} ${c - filled}`}
          className="transition-all duration-700"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <p className="text-2xl font-black text-gray-900">{Math.round(pct * 100)}%</p>
        <p className="text-[9px] font-bold uppercase tracking-wide text-gray-400">Completed</p>
      </div>
    </div>
  );
}
