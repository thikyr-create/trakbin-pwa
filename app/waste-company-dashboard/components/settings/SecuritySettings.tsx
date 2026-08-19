"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { Shield, Loader2, CircleCheck, TriangleAlert, KeyRound, Fingerprint, MonitorSmartphone } from "lucide-react";
import { Sora, JetBrains_Mono } from "next/font/google";
import type { SettingsSectionProps } from "./settingsConfig";

const supabase = supabaseBrowser;

const display = Sora({ subsets: ["latin"], display: "swap", variable: "--font-display" });
const mono = JetBrains_Mono({ subsets: ["latin"], display: "swap", variable: "--font-mono" });

const inputCls =
  "w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm font-semibold text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100";
const labelCls = `${mono.className} mb-1.5 block text-[10px] font-bold uppercase tracking-[0.16em] text-gray-500`;

export default function SecuritySettings(_props: SettingsSectionProps) {
  const [email, setEmail] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setEmail(data.user?.email ?? null);
    });
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    if (newPassword.length < 8) {
      setFeedback({ type: "error", text: "Password must be at least 8 characters." });
      return;
    }
    if (newPassword !== confirmPassword) {
      setFeedback({ type: "error", text: "Passwords do not match." });
      return;
    }

    setSaving(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setSaving(false);

    if (error) {
      setFeedback({ type: "error", text: error.message });
      return;
    }
    setNewPassword("");
    setConfirmPassword("");
    setFeedback({ type: "success", text: "Password updated successfully." });
  };

  return (
    <div className="space-y-4">
      {/* Session card */}
      <div className="rounded-[24px] border border-gray-200/80 bg-white p-6 shadow-sm">
        <div className="mb-5 flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100">
            <Shield size={18} />
          </span>
          <div>
            <h2 className={`${display.className} text-lg font-extrabold tracking-tight text-gray-900`}>
              Security
            </h2>
            <p className={`${mono.className} text-[10px] font-bold uppercase tracking-[0.18em] text-gray-400`}>
              session Â· password Â· hardening
            </p>
          </div>
        </div>

        <div className="rounded-xl border border-gray-100 bg-gray-50/60 px-4 py-3">
          <p className={`${mono.className} text-[10px] font-bold uppercase tracking-[0.16em] text-gray-400`}>
            Signed in as
          </p>
          <p className="mt-1 text-sm font-bold text-gray-800">{email ?? "Loading sessionâ€¦"}</p>
        </div>
      </div>

      {/* Change password */}
      <div className="rounded-[24px] border border-gray-200/80 bg-white p-6 shadow-sm">
        <p className={`${display.className} mb-4 flex items-center gap-2 text-sm font-extrabold text-gray-900`}>
          <KeyRound size={15} className="text-gray-400" />
          Change password
        </p>

        <form onSubmit={submit} className="max-w-md space-y-4">
          <div>
            <label className={labelCls}>New password</label>
            <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Minimum 8 characters" className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Confirm new password</label>
            <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Repeat new password" className={inputCls} />
          </div>

          {feedback && (
            <div className={`flex items-center gap-2 rounded-xl border px-4 py-3 text-xs font-semibold ${
              feedback.type === "success" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-red-200 bg-red-50 text-red-700"
            }`}>
              {feedback.type === "success" ? <CircleCheck size={14} /> : <TriangleAlert size={14} />}
              {feedback.text}
            </div>
          )}

          <button type="submit" disabled={saving || !newPassword}
            className="flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-6 py-3 text-sm font-bold text-white shadow-md shadow-emerald-200 transition hover:bg-emerald-700 disabled:opacity-50">
            {saving ? <Loader2 size={15} className="animate-spin" /> : <KeyRound size={15} />}
            {saving ? "Updatingâ€¦" : "Update password"}
          </button>
        </form>
      </div>

      {/* Planned capabilities â€” honest */}
      <div className="rounded-[24px] border border-gray-200/80 bg-white p-6 shadow-sm">
        <p className={`${mono.className} mb-3 text-[10px] font-bold uppercase tracking-[0.18em] text-gray-400`}>
          Planned with the security-hardening phase
        </p>
        <div className="space-y-2">
          {[
            { Icon: Fingerprint, label: "Two-factor authentication", desc: "Requires the auth-linkage foundation (Phase SEC)" },
            { Icon: MonitorSmartphone, label: "Active sessions & login history", desc: "Requires a session-audit table â€” not built yet" },
          ].map((row) => {
            const Icon = row.Icon;
            return (
              <div key={row.label} className="flex items-center gap-3 rounded-xl border border-dashed border-gray-200 bg-gray-50/40 px-4 py-3">
                <Icon size={16} className="shrink-0 text-gray-300" />
                <div>
                  <p className="text-xs font-bold text-gray-500">{row.label}</p>
                  <p className="text-[11px] font-medium text-gray-400">{row.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}