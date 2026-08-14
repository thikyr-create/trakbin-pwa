// lib/super-admin/types/organization.ts
export type OrganizationKind = 'waste_operator' | 'property' | 'agency';
export interface Organization {
  id: number;
  name: string;
  kind: OrganizationKind;
  status: 'active' | 'pending' | 'suspended';
  contactEmail: string | null;
  contactPhone: string | null;
  createdAt: string;
  properties: number;
  drivers: number;
  trucks: number;
}