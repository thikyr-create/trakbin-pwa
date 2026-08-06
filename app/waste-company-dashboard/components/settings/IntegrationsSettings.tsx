"use client";

import { Plug, Database, CreditCard, Globe, Map, MapPin, Radio } from "lucide-react";
import { Sora, JetBrains_Mono } from "next/font/google";
import type { SettingsSectionProps } from "./settingsConfig";

const display = Sora({ subsets: ["latin"], display: "swap", variable: "--font-display" });
const mono = JetBrains_Mono({ subsets: ["latin"], display: "swap", variable: "--font-mono" });

type IntegrationStatus = "connected" | "configured" | "not_connected";

const STATUS_META: Record<IntegrationStatus, { label: string; classes: string; dot: string }> = {
  connected: {
    label: "Connected",
    classes: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    dot: "bg-emerald-500",
  },
  configured: {
    label: "Configured",
    classes: "bg-sky-50 text-sky-700 ring-sky-200",
    dot: "bg-sky-500",
  },
  not_connected: {
    label: "Not connected",
    classes: "bg-gray-100 text-gray-500 ring-gray-200",
    dot: "bg-gray-400",
  },
};

export default function IntegrationsSettings({ bundle, loading }: SettingsSectionProps) {
  if (loading && !bundle) {
    return <div className="h-64 animate-pulse rounded-[24px] bg-gray-200/60" />;
  }

  const gateway = bundle?.settings?.payment_gateway ?? "paystack";

  const integrations: Array<{
    Icon: React.ComponentType<{ size?: number | string; className?: string }>;
    name: string;
    desc: string;
    status: IntegrationStatus;
    detail: string;
  }> = [
    {
      Icon: Database,
      name: "Supabase",
      desc: "Postgres database, auth, realtime sync",
      status: "connected",
      detail: "All Trakbin data lives here — live and verified",
    },
    {
      Icon: CreditCard,
      name: "Paystack",
      desc: "Payment collection and settlement",
      status: gateway === "paystack" ? "configured" : "not_connected",
      detail: gateway === "paystack" ? "Active gateway — managed in the Payments section" : "Disabled in Payment settings",
    },
    {
      Icon: Globe,
      name: "Flutterwave",
      desc: "Alternative payment gateway",
      status: "not_connected",
      detail: "Arrives when the gateway is approved",
    },
    {
      Icon: Map,
      name: "Google Maps",
      desc: "Map tiles and geocoding",
      status: "not_connected",
      detail: "Current maps are dependency-free SVG — no tiles required yet",
    },
    {
      Icon: MapPin,
      name: "Mapbox",
      desc: "Advanced map rendering",
      status: "not_connected",
      detail: "Arrives when advanced mapping is approved",
    },
    {
      Icon: Radio,
      name: "Webhook API",
      desc: "Outbound events to your systems",
      status: "not_connected",
      detail: "Planned alongside the security-hardening phase",
    },
  ];

  return (
    <div className="rounded-[24px] border border-gray-200/80 bg-white p-6 shadow-sm">
      <div className="mb-6 flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100">
          <Plug size={18} />
        </span>
        <div>
          <h2 className={`${display.className} text-lg font-extrabold tracking-tight text-gray-900`}>
            Integrations
          </h2>
          <p className={`${mono.className} text-[10px] font-bold uppercase tracking-[0.18em] text-gray-400`}>
            live status only · nothing faked
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {integrations.map((it, i) => {
          const meta = STATUS_META[it.status];
          const Icon = it.Icon;
          return (
            <div key={it.name} className="rounded-2xl border border-gray-100 bg-gray-50/40 p-4">
              <div className="flex items-start justify-between gap-2">
                <span className={`flex h-9 w-9 items-center justify-center rounded-xl ring-1 ${
                  it.status === "connected"
                    ? "bg-emerald-50 text-emerald-600 ring-emerald-100"
                    : it.status === "configured"
                    ? "bg-sky-50 text-sky-600 ring-sky-100"
                    : "bg-white text-gray-400 ring-gray-200"
                }`}>
                  <Icon size={16} />
                </span>
                <span className={`${mono.className} inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider ring-1 ${meta.classes}`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} />
                  {meta.label}
                </span>
              </div>
              <p className="mt-3 text-sm font-bold text-gray-900">{it.name}</p>
              <p className="text-[11px] font-medium text-gray-500">{it.desc}</p>
              <p className={`${mono.className} mt-2 text-[10px] font-semibold uppercase tracking-wider text-gray-400`}>
                {it.detail}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}