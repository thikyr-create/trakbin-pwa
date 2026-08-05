// app/waste-company-dashboard/components/settings/settingsRegistry.tsx
import type { ComponentType } from "react";
import type { SettingsSectionId, SettingsSectionProps } from "./settingsConfig";
import CompanyProfile from "./CompanyProfile";
import BillingSettings from "./BillingSettings";

/** Mount each shipped section here. Unmounted ids render the honest "under construction" state. */
export const SECTIONS: Partial<Record<SettingsSectionId, ComponentType<SettingsSectionProps>>> = {
  profile: CompanyProfile,
  billing: BillingSettings,
};