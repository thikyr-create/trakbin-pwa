"use client";

import { useEffect, useState } from "react";
import { Building2, Loader2, CheckCircle2, AlertTriangle } from "lucide-react";
import { Sora, JetBrains_Mono } from "next/font/google";
import type { SettingsSectionProps } from "./settingsConfig";

const display = Sora({ subsets: ["latin"], display: "swap", variable: "--font-display" });
const mono = JetBrains_Mono({ subsets: ["latin"], display: "swap", variable: "--font-mono" });

const inputCls =
  "w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm font-semibold text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100";
const labelCls = `${mono.className} mb-1.5 block text-[10px] font-bold uppercase tracking-[0.16em] text-gray-500`;

export default function CompanyProfile({ bundle, loading, saveProfile }: SettingsSectionProps) {
  const [businessName, setBusinessName] = useState("");
  const [licenseNumber, setLicenseNumber] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    if (bundle?.profile) {
      setBusinessName(bundle.profile.business_name || "");
      setLicenseNumber(bundle.profile.license_number || "");
      setAddress(bundle.profile.operating_address || "");
      setPhone(bundle.profile.contact_number || "");
    }
  }, [bundle]);

  const dirty =
    bundle?.profile &&
    (businessName !== (bundle.profile.business_name || "") ||
      licenseNumber !== (bundle.profile.license_number || "") ||
      address !== (bundle.profile.operating_address || "") ||
      phone !== (bundle.profile.contact_number || ""));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);
    setSaving(true);

    const result = await saveProfile({
      business_name: businessName.trim(),
      license_number: licenseNumber.trim(),
      operating_address: address.trim(),
      contact_number: phone.trim(),
    });

    setSaving(false);
    setFeedback(
      result.ok
        ? { type: "success", text: "Profile updated." }
        : { type: "error", text: result.error || "Failed to save profile." }
    );
  };

  if (loading && !bundle) {
    return <div className="h-64 animate-pulse rounded-[24px] bg-gray-200/60" />;
  }

  return (
    <div className="rounded-[24px] border border-gray-200/80 bg-white p-6 shadow-sm">
      <div className="mb-6 flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100">
          <Building2 size={18} />
        </span>
        <div>
          <h2 className={`${display.className} text-lg font-extrabold tracking-tight text-gray-900`}>
            Company profile
          </h2>
          <p className={`${mono.className} text-[10px] font-bold uppercase tracking-[0.18em] text-gray-400`}>
            identity · written to your company record
          </p>
        </div>
      </div>

      <form onSubmit={submit} className="max-w-xl space-y-4">
        <div>
          <label className={labelCls}>Business name</label>
          <input type="text" value={businessName} onChange={(e) => setBusinessName(e.target.value)} placeholder="e.g. Trakbin Waste Services" className={inputCls} />
        </div>

        <div>
          <label className={labelCls}>CAC / License number</label>
          <input type="text" value={licenseNumber} onChange={(e) => setLicenseNumber(e.target.value)} placeholder="e.g. RC 12234" className={inputCls} />
        </div>

        <div>
          <label className={labelCls}>Operating address</label>
          <input type="text" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Office / depot address" className={inputCls} />
        </div>

        <div>
          <label className={labelCls}>Contact number</label>
          <input type="text" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="e.g. 0803 000 0000" className={inputCls} />
        </div>

        <div className="rounded-xl border border-gray-100 bg-gray-50/60 px-4 py-3">
          <p className={`${mono.className} text-[10px] font-bold uppercase tracking-[0.16em] text-gray-400`}>
            Company ID
          </p>
          <p className="mt-1 text-sm font-bold text-gray-700">{bundle?.profile?.id ?? "—"}</p>
        </div>

        {feedback && (
          <div
            className={`flex items-center gap-2 rounded-xl border px-4 py-3 text-xs font-semibold ${
              feedback.type === "success"
                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                : "border-red-200 bg-red-50 text-red-700"
            }`}
          >
            {feedback.type === "success" ? <CheckCircle2 size={14} /> : <AlertTriangle size={14} />}
            {feedback.text}
          </div>
        )}

        <button
          type="submit"
          disabled={saving || !dirty}
          className="flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-6 py-3 text-sm font-bold text-white shadow-md shadow-emerald-200 transition hover:bg-emerald-700 disabled:opacity-50"
        >
          {saving ? <Loader2 size={15} className="animate-spin" /> : <CheckCircle2 size={15} />}
          {saving ? "Saving…" : "Save changes"}
        </button>
      </form>
    </div>
  );
}