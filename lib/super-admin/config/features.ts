// lib/super-admin/config/features.ts
// Code registry of feature flags — values live in platform_config, definitions live here
export interface FeatureFlagDefinition {
  key: 'announcements' | 'subscriptions' | 'field_intelligence';
  label: string;
  description: string;
  gates: string;
}

export const FEATURE_FLAGS: FeatureFlagDefinition[] = [
  { key: 'announcements', label: 'Announcements', description: 'Platform broadcast composer', gates: 'Communications → Announcements send path' },
  { key: 'subscriptions', label: 'Subscriptions', description: 'Commercial relationship engine', gates: 'Subscriptions granting + MRR surfaces' },
  { key: 'field_intelligence', label: 'Field Intelligence', description: 'Platform learning loop', gates: 'FI surfaces across console + company dashboards' },
];