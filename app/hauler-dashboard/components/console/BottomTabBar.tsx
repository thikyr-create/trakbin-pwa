// app/hauler-dashboard/components/console/BottomTabBar.tsx
"use client";

import { useConsoleStore } from '@/lib/features/driver-console/store/consoleStore';
import { CONSOLE_TABS, CONSOLE_TOKENS } from '@/lib/features/driver-console/constants/console';

export default function BottomTabBar() {
  const { activeTab, setActiveTab } = useConsoleStore();

  return (
    <div className="absolute bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 shadow-[0_-4px_20px_rgba(0,0,0,0.08)]">
      <div className="flex items-center justify-around px-2 py-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))]">
        {CONSOLE_TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="flex flex-col items-center justify-center gap-1 px-4 py-2 rounded-xl transition-all active:scale-95"
              style={{
                color: isActive ? CONSOLE_TOKENS.green : CONSOLE_TOKENS.textMuted,
                backgroundColor: isActive ? '#F0FDF4' : 'transparent',
              }}
            >
              <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
              <span className="text-[10px] font-bold uppercase tracking-wide">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}