"use client";
import { supabaseBrowser } from '@/lib/supabaseBrowser';

import { useEffect, useState } from "react";
import { Users, UserPlus } from "lucide-react";
import { Sora, JetBrains_Mono } from "next/font/google";
import type { SettingsSectionProps } from "./settingsConfig";

const supabase = supabaseBrowser;

const display = Sora({ subsets: ["latin"], display: "swap", variable: "--font-display" });
const mono = JetBrains_Mono({ subsets: ["latin"], display: "swap", variable: "--font-mono" });

interface StaffUser {
  id: number;
  email: string | null;
  full_name: string | null;
  phone: string | null;
  account_type: string | null;
}

export default function UserManagement({ bundle, loading }: SettingsSectionProps) {
  const [staff, setStaff] = useState<StaffUser[]>([]);
  const [loadingStaff, setLoadingStaff] = useState(true);

  const companyId = bundle?.profile?.id ?? null;

  useEffect(() => {
    if (!companyId) return;

    supabase
      .from("users")
      .select("id, email, full_name, phone, account_type")
      .eq("company_id", companyId)
      .order("id", { ascending: true })
      .then(({ data }) => {
        setStaff(data || []);
        setLoadingStaff(false);
      });
  }, [companyId]);

  if ((loading || loadingStaff) && !bundle) {
    return <div className="h-64 animate-pulse rounded-[24px] bg-gray-200/60" />;
  }

  return (
    <div className="rounded-[24px] border border-gray-200/80 bg-white p-6 shadow-sm">
      <div className="mb-6 flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100">
          <Users size={18} />
        </span>
        <div>
          <h2 className={`${display.className} text-lg font-extrabold tracking-tight text-gray-900`}>
            Company users
          </h2>
          <p className={`${mono.className} text-[10px] font-bold uppercase tracking-[0.18em] text-gray-400`}>
            {staff.length} account{staff.length === 1 ? "" : "s"} linked to this company
          </p>
        </div>
      </div>

      {staff.length === 0 ? (
        <div className="flex flex-col items-center rounded-2xl border border-dashed border-gray-200 bg-gray-50/50 p-10 text-center">
          <Users className="mb-2 h-7 w-7 text-gray-300" />
          <p className="text-sm font-bold text-gray-500">No linked user accounts</p>
          <p className="mt-1 max-w-sm text-xs text-gray-400">
            Accounts created with this company ID will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {staff.map((u) => (
            <div key={u.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-gray-100 bg-gray-50/40 px-4 py-3">
              <div className="min-w-0">
                <p className="text-sm font-bold text-gray-900">{u.full_name || u.email || "Unnamed user"}</p>
                <p className="text-[11px] font-medium text-gray-400">
                  {u.email || "No email"}{u.phone ? ` Â· ${u.phone}` : ""}
                </p>
              </div>
              <span className={`${mono.className} rounded-full bg-white px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider text-gray-500 ring-1 ring-gray-200`}>
                {u.account_type || "account"}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Honest roadmap note â€” no dead invite button */}
      <div className="mt-4 flex items-center gap-3 rounded-xl border border-dashed border-gray-200 bg-gray-50/40 px-4 py-3">
        <UserPlus size={16} className="shrink-0 text-gray-300" />
        <div>
          <p className="text-xs font-bold text-gray-500">Roles & invitations</p>
          <p className="text-[11px] font-medium text-gray-400">
            Dispatcher, Finance Officer, Supervisor roles and secure invitations arrive with the
            RBAC foundation â€” until then, account creation stays outside the dashboard for safety.
          </p>
        </div>
      </div>
    </div>
  );
}
