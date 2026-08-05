"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Building2, Receipt, Tags, Truck, Bell, CreditCard, Plug, SlidersHorizontal,
  Shield, Users, AlertTriangle, Construction,
} from "lucide-react";
import { Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google";
import { useSettings } from "@/lib/features/settings/hooks/useSettings";
import {
  SETTINGS_CATEGORIES,
  type SettingsSectionId,
  type SettingsSectionProps,
} from "./settingsConfig";
import CompanyProfile from "./CompanyProfile";

const body = Plus_Jakarta_Sans({ subsets: ["latin"], display: "swap", variable: "--font-body" });
const mono = JetBrains_Mono({ subsets: ["latin"], display: "swap", variable: "--font-mono" });
const EASE = [0.22, 1, 0.36, 1] as [number, number, number, number];

const SECTION_ICONS: Record<SettingsSectionId, React.ComponentType<{ size?: number | string; className?: string }>> = {
  profile: Building2,
  billing: Receipt,
  pricing: Tags,
  collection: Truck,
  notifications: Bell,
  payments: CreditCard,
  integrations: Plug,
  preferences: SlidersHorizontal,
  security: Shield,
  users: Users,
  danger: AlertTriangle,
};

/** Registry — each section mounts here as it ships. */
const SECTIONS: Partial<Record<SettingsSectionId, React.ComponentType<SettingsSectionProps>>> = {
  profile: CompanyProfile,
};

export default function SettingsPage() {
  const { bundle, loading, error, saveProfile, saveSettings, addPlan, changeFee } = useSettings();
  const [active, setActive] = useState<SettingsSectionId>("profile");

  const ActiveSection = SECTIONS[active];
  const activeMeta = SETTINGS_CATEGORIES.flatMap((c) => c.items).find((i) => i.id === active);

  return (
    <div className={`${body.className} grid grid-cols-1 gap-5 lg:grid-cols-[260px_1fr]`}>
      {/* Nav */}
      <motion.nav
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.4, ease: EASE }}
        className="h-fit rounded-[24px] border border-gray-200/80 bg-white p-4 shadow-sm lg:sticky lg:top-5"
      >
        {SETTINGS_CATEGORIES.map((cat) => (
          <div key={cat.id} className="mb-4 last:mb-0">
            <p className={`${mono.className} mb-2 px-2 text-[9px] font-bold uppercase tracking-[0.2em] text-gray-400`}>
              {cat.label}
            </p>
            <div className="space-y-0.5">
              {cat.items.map((item) => {
                const Icon = SECTION_ICONS[item.id];
                const isActive = active === item.id;
                const built = !!SECTIONS[item.id];
                return (
                  <button
                    key={item.id}
                    onClick={() => setActive(item.id)}
                    className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-xs font-bold transition ${
                      isActive
                        ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                    }`}
                  >
                    <Icon size={15} className={isActive ? "text-emerald-600" : "text-gray-400"} />
                    <span className="flex-1">{item.label}</span>
                    {!built && (
                      <span className={`${mono.className} rounded-full bg-gray-100 px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wider text-gray-400`}>
                        soon
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </motion.nav>

      {/* Content */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.05, ease: EASE }}
        className="min-w-0 space-y-4"
      >
        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-semibold text-red-700">
            {error}
          </div>
        )}

        {ActiveSection ? (
          <ActiveSection
            bundle={bundle}
            loading={loading}
            saveProfile={saveProfile}
            saveSettings={saveSettings}
            addPlan={addPlan}
            changeFee={changeFee}
          />
        ) : (
          <div className="flex flex-col items-center justify-center rounded-[24px] border border-gray-200/80 bg-white p-14 text-center shadow-sm">
            <Construction className="mb-3 h-8 w-8 text-gray-300" />
            <p className="text-base font-bold text-gray-600">{activeMeta?.label} — under construction</p>
            <p className="mt-1 max-w-sm text-xs text-gray-400">
              {activeMeta?.description}. This section ships in the next deploy — nothing hidden, nothing faked.
            </p>
          </div>
        )}
      </motion.div>
    </div>
  );
}