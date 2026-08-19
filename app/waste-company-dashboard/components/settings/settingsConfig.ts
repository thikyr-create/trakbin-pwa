// app/waste-company-dashboard/components/settings/settingsConfig.ts
import type { SettingsBundle } from "@/lib/features/settings/services/settingsService";

export type SettingsSectionId =
  | "profile"
  | "billing"
  | "pricing"
  | "collection"
  | "notifications"
  | "payments"
  | "preferences"
  | "security"
  | "users"
  | "danger";

export interface SettingsNavItem {
  id: SettingsSectionId;
  label: string;
  description: string;
}

export interface SettingsCategory {
  id: string;
  label: string;
  items: SettingsNavItem[];
}

export const SETTINGS_CATEGORIES: SettingsCategory[] = [
  {
    id: "business",
    label: "Business configuration",
    items: [
      { id: "profile", label: "Profile", description: "Company identity and contact details" },
      { id: "billing", label: "Billing", description: "Cutoff, invoice, and due-date rules" },
      { id: "pricing", label: "Service pricing", description: "Plans, effective dates, history" },
      { id: "collection", label: "Collection", description: "Pickup days, hours, route rules" },
    ],
  },
  {
    id: "platform",
    label: "Platform configuration",
    items: [
      { id: "notifications", label: "Notifications", description: "Email, SMS, push, and alerts" },
      { id: "payments", label: "Payments", description: "Gateway, settlement, and wallet" },
      { id: "preferences", label: "Preferences", description: "Theme, language, timezone, units" },
    ],
  },
  {
    id: "security",
    label: "Security & administration",
    items: [
      { id: "security", label: "Security", description: "Password and sessions" },
      { id: "users", label: "Company users", description: "Staff and roles" },
      { id: "danger", label: "Danger zone", description: "Destructive actions" },
    ],
  },
];

export interface ActionResult {
  ok: boolean;
  error?: string;
}

/** Shared contract — every settings section receives the same props. */
export interface SettingsSectionProps {
  bundle: SettingsBundle | null;
  loading: boolean;
  saveProfile: (payload: {
    business_name?: string;
    license_number?: string;
    operating_address?: string;
    contact_number?: string;
  }) => Promise<ActionResult>;
  saveSettings: (payload: Record<string, unknown>) => Promise<ActionResult>;
  addPlan: (payload: {
    plan_name: string;
    building_type: string;
    monthly_fee: number;
    effective_date?: string;
  }) => Promise<ActionResult>;
  changeFee: (
    planId: string,
    payload: { monthly_fee: number; effective_date: string; reason: string }
  ) => Promise<ActionResult>;
}