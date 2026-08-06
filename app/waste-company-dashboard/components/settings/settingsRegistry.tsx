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
import IntegrationsSettings from "./IntegrationsSettings";
import SecuritySettings from "./SecuritySettings";
import UserManagement from "./UserManagement";
import DangerZone from "./DangerZone";

/** All sections mounted. The registry stays the single growth point for future additions. */
export const SECTIONS: Partial<Record<SettingsSectionId, ComponentType<SettingsSectionProps>>> = {
  profile: CompanyProfile,
  billing: BillingSettings,
  pricing: PricingSettings,
  collection: CollectionSettings,
  notifications: NotificationSettings,
  payments: PaymentSettings,
  preferences: Preferences,
  integrations: IntegrationsSettings,
  security: SecuritySettings,
  users: UserManagement,
  danger: DangerZone,
};