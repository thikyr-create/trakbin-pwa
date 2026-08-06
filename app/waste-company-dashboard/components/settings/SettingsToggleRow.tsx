"use client";

interface SettingsToggleRowProps {
  label: string;
  desc?: string;
  value: boolean;
  onChange: (value: boolean) => void;
}

export default function SettingsToggleRow({ label, desc, value, onChange }: SettingsToggleRowProps) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-gray-200 bg-gray-50/60 px-4 py-3">
      <div>
        <p className="text-sm font-bold text-gray-700">{label}</p>
        {desc && <p className="text-[11px] font-medium text-gray-400">{desc}</p>}
      </div>
      <button
        type="button"
        onClick={() => onChange(!value)}
        className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${value ? "bg-emerald-500" : "bg-gray-300"}`}
      >
        <span className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow transition-transform ${value ? "left-6" : "left-1"}`} />
      </button>
    </div>
  );
}