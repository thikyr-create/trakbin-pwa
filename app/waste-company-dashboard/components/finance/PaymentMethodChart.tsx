"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { CreditCard, Landmark, Smartphone, PieChart } from "lucide-react";
import { Sora, JetBrains_Mono } from "next/font/google";
import { formatNaira } from "@/lib/utils/money";
import { fetchPaymentMethodStats, type PaymentMethodStat } from "@/lib/features/finance/services/paymentStatsService";

const display = Sora({ subsets: ["latin"], display: "swap", variable: "--font-display" });
const mono = JetBrains_Mono({ subsets: ["latin"], display: "swap", variable: "--font-mono" });
const EASE = [0.22, 1, 0.36, 1] as [number, number, number, number];

const METHOD_META: Record<string, { label: string; Icon: any; bar: string }> = {
  card: { label: "Card", Icon: CreditCard, bar: "bg-emerald-500" },
  bank: { label: "Bank transfer", Icon: Landmark, bar: "bg-sky-500" },
  ussd: { label: "USSD", Icon: Smartphone, bar: "bg-violet-500" },
};

function getCompanyId(): number | null {
  if (typeof window === "undefined") return null;
  try {
    const stored = window.localStorage.getItem("trakbin_company");
    if (!stored) return null;
    const parsed = JSON.parse(stored);
    const raw = parsed?.id ?? parsed?.company_id ?? null;
    if (raw == null) return null;
    const num = Number(raw);
    return Number.isFinite(num) ? num : null;
  } catch {
    return null;
  }
}

export default function PaymentMethodChart() {
  const [stats, setStats] = useState<PaymentMethodStat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const companyId = getCompanyId();
    if (!companyId) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    fetchPaymentMethodStats(companyId).then((data) => {
      if (!cancelled) {
        setStats(data);
        setLoading(false);
      }
    });

    return () => {
      cancelled = true;
    };
  }, []);

  const total = stats.reduce((s, m) => s + m.amount, 0);

  if (loading) {
    return <div className="h-48 animate-pulse rounded-[24px] bg-gray-200/60" />;
  }

  if (stats.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-[24px] border border-gray-200/80 bg-white p-10 text-center shadow-sm">
        <PieChart className="mb-2 h-8 w-8 text-gray-300" />
        <p className="text-sm font-bold text-gray-500">No successful payments yet</p>
        <p className="mt-1 text-xs text-gray-400">
          Method breakdown appears after the first successful payment.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-[24px] border border-gray-200/80 bg-white p-6 shadow-sm">
      <div className="mb-5 flex items-center justify-between">
        <h2 className={`${display.className} text-lg font-extrabold tracking-tight text-gray-900`}>
          Payment methods
        </h2>
        <span className={`${mono.className} text-[10px] font-bold uppercase tracking-[0.18em] text-gray-400`}>
          successful only
        </span>
      </div>

      <div className="space-y-4">
        {stats.map((m, i) => {
          const meta = METHOD_META[m.method] || {
            label: m.method,
            Icon: CreditCard,
            bar: "bg-gray-400",
          };
          const Icon = meta.Icon;
          const pct = total > 0 ? Math.round((m.amount / total) * 100) : 0;

          return (
            <motion.div
              key={m.method}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.35, delay: i * 0.06, ease: EASE }}
            >
              <div className="mb-1.5 flex items-center justify-between">
                <span className="flex items-center gap-2 text-xs font-bold text-gray-700">
                  <Icon size={14} className="text-gray-400" />
                  {meta.label}
                  <span className={`${mono.className} text-[10px] font-semibold text-gray-400`}>
                    · {m.count} payment{m.count === 1 ? "" : "s"}
                  </span>
                </span>
                <span className="text-xs font-bold tabular-nums text-gray-900">
                  {formatNaira(m.amount)}
                  <span className={`${mono.className} ml-1.5 text-[10px] font-semibold text-gray-400`}>
                    {pct}%
                  </span>
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-gray-100">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 0.7, delay: i * 0.06, ease: EASE }}
                  className={`h-full rounded-full ${meta.bar}`}
                />
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}