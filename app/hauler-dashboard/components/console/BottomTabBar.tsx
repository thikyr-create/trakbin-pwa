// app/hauler-dashboard/components/console/BottomTabBar.tsx
"use client";

import { useConsoleStore } from '@/lib/features/driver-console/store/consoleStore';
import { CONSOLE_TABS, CONSOLE_TOKENS } from '@/lib/features/driver-console/constants/console';

export default function BottomTabBar() {
  const { activeTab, setActiveTab } = useConsoleStore();

  return (
    <div className="flex items-center justify-around px-2 py-2" style={{ height: 72 }}>
      {CONSOLE_TABS.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className="flex flex-col items-center justify-center gap-1 px-4 py-2 rounded-xl transition-all active:scale-95"
            style={{ color: isActive ? CONSOLE_TOKENS.green : CONSOLE_TOKENS.textMuted, backgroundColor: isActive ? '#F0FDF4' : 'transparent' }}
          >
            <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
            <span className="text-[10px] font-bold uppercase tracking-wide">{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
}