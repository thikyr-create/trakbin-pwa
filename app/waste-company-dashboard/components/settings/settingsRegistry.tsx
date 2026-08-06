// app/waste-company-dashboard/components/settings/settingsRegistry.tsx
import type { ComponentType } from "react";
import type { SettingsSectionId, SettingsSectionProps } from "./settingsConfig";
import CompanyProfile from "./CompanyProfile";
import BillingSettings from "./BillingSettings";
import PricingSettings from "./PricingSettings";
import CollectionSettings from "./CollectionSettings";
import NotificationSettings from "./NotificationSettings";
import PaymentSettings from "./PaymentSettings";
import Preferences from "./Preferences";

/** Mount each shipped section here. Unmounted ids render the honest "under construction" state. */
export const SECTIONS: Partial<Record<SettingsSectionId, ComponentType<SettingsSectionProps>>> = {
  profile: CompanyProfile,
  billing: BillingSettings,
  pricing: PricingSettings,
  collection: CollectionSettings,
  notifications: NotificationSettings,
  payments: PaymentSettings,
  preferences: Preferences,
};