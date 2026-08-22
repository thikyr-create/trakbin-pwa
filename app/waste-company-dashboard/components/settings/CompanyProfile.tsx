// app/waste-company-dashboard/components/settings/CompanyProfile.tsx
"use client";

import { useEffect, useState } from "react";
import { Building2, Loader2, CircleCheck, TriangleAlert, Mail, UserCheck, FileCheck2, Upload, ShieldCheck } from "lucide-react";
import { Sora, JetBrains_Mono } from "next/font/google";
import { supabaseBrowser } from "@/lib/supabaseBrowser";
import { getCompanyVerification } from "@/lib/auth/companyVerification";
import type { SettingsSectionProps } from "./settingsConfig";

const supabase = supabaseBrowser;
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
    const [resending, setResending] = useState(false);
  const [sessionUser, setSessionUser] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSessionUser(data?.session?.user ?? null));
  }, []);
  const [uploading, setUploading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    if (bundle?.profile) {
      setBusinessName(bundle.profile.business_name || "");
      setLicenseNumber(bundle.profile.license_number || "");
      setAddress(bundle.profile.operating_address || "");
      setPhone(bundle.profile.contact_number || "");
    }
  }, [bundle]);

   const v = getCompanyVerification(bundle?.profile, sessionUser);
  const missing = [
    !businessName.trim() && "business name",
    !licenseNumber.trim() && "license number",
    !address.trim() && "operating address",
    !phone.trim() && "contact number",
  ].filter(Boolean) as string[];

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

  const resendEmail = async () => {
    setResending(true);
    setFeedback(null);
    
        const email = sessionUser?.email;
    if (!email) {
      setResending(false);
      setFeedback({ type: "error", text: "No email on this session — sign in again." });
      return;
    }
    const { error } = await supabase.auth.resend({ type: "signup", email });
    setResending(false);
    setFeedback(
      error
        ? { type: "error", text: error.message }
        : { type: "success", text: `Confirmation email re-sent to ${email}. Confirm it, then sign in again.` }
    );
  };

  const uploadDocs = async (files: FileList | null) => {
    const companyId = bundle?.profile?.id;
    if (!files || files.length === 0 || !companyId) return;
    setUploading(true);
    setFeedback(null);
    try {
      const urls: string[] = [];
      for (const f of Array.from(files)) {
        const path = `company-${companyId}/${Date.now()}-${f.name}`;
        const { error } = await supabase.storage.from("trakbin-company-docs").upload(path, f, { upsert: false });
        if (error) throw error;
        const { data } = supabase.storage.from("trakbin-company-docs").getPublicUrl(path);
        urls.push(data.publicUrl);
      }
      await supabase.from("haulers").update({ documents_urls: urls, documents_status: "pending" }).eq("id", Number(companyId));
      setFeedback({ type: "success", text: "Documents submitted — pending review. This does not block your operations." });
    } catch (e: any) {
      setFeedback({ type: "error", text: "Upload failed: " + (e?.message || "unknown") });
    } finally {
      setUploading(false);
    }
  };

  if (loading && !bundle) {
    return <div className="h-64 animate-pulse rounded-[24px] bg-gray-200/60" />;
  }

  return (
    <div className="space-y-4">
      {/* ── VERIFICATION PANEL ── */}
      <div className="rounded-[24px] border border-gray-200/80 bg-white p-6 shadow-sm">
        <div className="mb-5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className={`flex h-10 w-10 items-center justify-center rounded-xl ring-1 ${v.canOperate ? "bg-emerald-50 text-emerald-600 ring-emerald-100" : "bg-amber-50 text-amber-600 ring-amber-100"}`}>
              <ShieldCheck size={18} />
            </span>
            <div>
              <h2 className={`${display.className} text-lg font-extrabold tracking-tight text-gray-900`}>Operator verification</h2>
              <p className={`${mono.className} text-[10px] font-bold uppercase tracking-[0.18em] text-gray-400`}>
                {v.canOperate ? "cleared to operate" : "action needed to be cleared"}
              </p>
            </div>
          </div>
          {v.canOperate && (
            <span className="rounded-full bg-emerald-50 px-3 py-1.5 font-mono text-[10px] font-bold uppercase tracking-wider text-emerald-700 ring-1 ring-emerald-200">cleared</span>
          )}
        </div>

        <div className="space-y-3">
          {/* Email */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-gray-100 bg-gray-50/60 p-3.5">
            <div className="flex items-start gap-3">
              <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ring-1 ${v.email ? "bg-emerald-50 text-emerald-600 ring-emerald-100" : "bg-amber-50 text-amber-600 ring-amber-100"}`}>
                {v.email ? <CircleCheck className="h-4 w-4" /> : <Mail className="h-4 w-4" />}
              </span>
              <div>
                <p className="text-sm font-bold text-gray-900">Email verification</p>
                <p className="text-xs font-medium text-gray-500">{v.email ? "Your email is confirmed." : "Confirm the email we sent you, then sign in again."}</p>
              </div>
            </div>
            {!v.email && (
              <button onClick={resendEmail} disabled={resending} className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-emerald-700 disabled:opacity-50">
                {resending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Mail className="h-3.5 w-3.5" />}
                {resending ? "Sending…" : "Resend confirmation"}
              </button>
            )}
          </div>

          {/* Profile */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-gray-100 bg-gray-50/60 p-3.5">
            <div className="flex items-start gap-3">
              <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ring-1 ${v.profile ? "bg-emerald-50 text-emerald-600 ring-emerald-100" : "bg-amber-50 text-amber-600 ring-amber-100"}`}>
                {v.profile ? <CircleCheck className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
              </span>
              <div>
                <p className="text-sm font-bold text-gray-900">Profile completion</p>
                <p className="text-xs font-medium text-gray-500">
                  {v.profile ? "Business name, licence, address and contact are on file." : `Missing: ${missing.length ? missing.join(", ") : "save the form below"}.`}
                </p>
              </div>
            </div>
            {!v.profile && (
              <span className="rounded-full bg-amber-50 px-2.5 py-1 font-mono text-[9px] font-bold uppercase tracking-wider text-amber-700 ring-1 ring-amber-200">complete below</span>
            )}
          </div>

          {/* Documents (optional) */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-gray-100 bg-gray-50/60 p-3.5">
            <div className="flex items-start gap-3">
              <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ring-1 ${v.documents === "approved" ? "bg-emerald-50 text-emerald-600 ring-emerald-100" : v.documents === "pending" ? "bg-amber-50 text-amber-600 ring-amber-100" : "bg-gray-100 text-gray-400 ring-gray-200"}`}>
                {v.documents === "approved" ? <CircleCheck className="h-4 w-4" /> : <FileCheck2 className="h-4 w-4" />}
              </span>
              <div>
                <p className="flex items-center gap-2 text-sm font-bold text-gray-900">
                  Document verification
                  <span className="rounded-full bg-gray-100 px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wider text-gray-500 ring-1 ring-gray-200">optional</span>
                </p>
                <p className="text-xs font-medium text-gray-500">
                  {v.documents === "approved" ? "Business registration / licence approved." : v.documents === "pending" ? "Documents submitted — pending review." : "Upload your business registration or licence."}
                </p>
              </div>
            </div>
            {v.documents !== "approved" && (
              <label className={`inline-flex cursor-pointer items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-emerald-700 ${uploading ? "opacity-60" : ""}`}>
                {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
                {uploading ? "Uploading…" : "Upload documents"}
                <input type="file" multiple accept=".pdf,image/*" className="hidden" disabled={uploading} onChange={(e) => uploadDocs(e.target.files)} />
              </label>
            )}
          </div>
        </div>

        {feedback && (
          <div className={`mt-4 flex items-center gap-2 rounded-xl border px-4 py-3 text-xs font-semibold ${feedback.type === "success" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-red-200 bg-red-50 text-red-700"}`}>
            {feedback.type === "success" ? <CircleCheck size={14} /> : <TriangleAlert size={14} />}
            {feedback.text}
          </div>
        )}
      </div>

      {/* ── PROFILE FORM ── */}
      <div className="rounded-[24px] border border-gray-200/80 bg-white p-6 shadow-sm">
        <div className="mb-6 flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100">
            <Building2 size={18} />
          </span>
          <div>
            <h2 className={`${display.className} text-lg font-extrabold tracking-tight text-gray-900`}>Company profile</h2>
            <p className={`${mono.className} text-[10px] font-bold uppercase tracking-[0.18em] text-gray-400`}>identity · written to your company record</p>
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
            <p className={`${mono.className} text-[10px] font-bold uppercase tracking-[0.16em] text-gray-400`}>Company ID</p>
            <p className="mt-1 text-sm font-bold text-gray-700">{bundle?.profile?.id ?? "—"}</p>
          </div>

          <button
            type="submit"
            disabled={saving || !dirty}
            className="flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-6 py-3 text-sm font-bold text-white shadow-md shadow-emerald-200 transition hover:bg-emerald-700 disabled:opacity-50"
          >
            {saving ? <Loader2 size={15} className="animate-spin" /> : <CircleCheck size={15} />}
            {saving ? "Saving…" : "Save changes"}
          </button>
        </form>
      </div>
    </div>
  );
}