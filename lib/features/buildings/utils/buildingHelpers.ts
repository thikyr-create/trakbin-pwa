// lib/features/buildings/utils/buildingHelpers.ts

export const WEEKDAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

export interface BuildingLike {
  custom_id?: string | null;
  address?: string | null;
  estate?: string | null;
  gps_location_address?: string | null;
  building_type?: string | null;
  num_flats?: string | null;
  num_stores?: string | null;
  number_of_units?: number | null;
  unit_type?: string | null;
  latitude?: number | string | null;
  longitude?: number | string | null;
  created_at?: string | null;
}

export function matchesBuildingSearch(building: BuildingLike, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;

  const haystack = [
    building.custom_id,
    building.address,
    building.estate,
    building.gps_location_address,
    building.building_type,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return haystack.includes(q);
}

export function unitsLabel(building: BuildingLike): string {
  const parts: string[] = [];

  if (building.num_flats) parts.push(`${building.num_flats} flats`);
  if (building.num_stores) parts.push(`${building.num_stores} stores`);
  if (parts.length === 0 && building.number_of_units != null) {
    parts.push(
      `${building.number_of_units} ${building.unit_type || "unit"}${building.number_of_units === 1 ? "" : "s"}`
    );
  }

  return parts.length > 0 ? parts.join(" · ") : "Units not recorded";
}

export function nextPickupFromDays(days?: string[] | null): string | null {
  if (!days || days.length === 0) return null;

  const today = new Date();

  for (let offset = 0; offset < 8; offset++) {
    const d = new Date(today);
    d.setDate(today.getDate() + offset);
    const name = WEEKDAYS[(d.getDay() + 6) % 7];
    if (days.includes(name)) {
      return d.toISOString().slice(0, 10);
    }
  }

  return null;
}

export function resolveNextCollection(
  nextPickupDate?: string | null,
  pickupDays?: string[] | null
): string | null {
  if (nextPickupDate) return nextPickupDate;
  return nextPickupFromDays(pickupDays);
}

export function formatNaira(amount?: number | null): string {
  if (amount == null) return "—";
  // Amounts stored in kobo (Paystack convention). Flip divisor if ledger proves otherwise.
  const naira = amount / 100;
  return `₦${naira.toLocaleString("en-NG", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
}

export function distanceKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371;
  const toRad = (v: number) => (v * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

export type TimelineType =
  | "registered"
  | "assigned"
  | "collection"
  | "payment"
  | "issue"
  | "issue_resolved";

export interface TimelineEntry {
  id: string;
  type: TimelineType;
  label: string;
  detail?: string;
  at: string; // ISO timestamp
  tone: "emerald" | "sky" | "amber" | "red" | "gray";
}

export interface TimelineSource {
  building: BuildingLike & { created_at?: string | null };
  serviceAssignment?: {
    activated_at?: string | null;
    pickup_days?: string[] | null;
  } | null;
  collections?: Array<{
    id?: number;
    collection_date?: string | null;
    status?: string | null;
    hauler_name?: string | null;
  }>;
  receipts?: Array<{
    id?: string;
    issued_at?: string | null;
    gross?: number | null;
    receipt_number?: string | null;
  }>;
  issues?: Array<{
    id?: string;
    created_at?: string | null;
    resolved_at?: string | null;
    issue_type?: string | null;
    status?: string | null;
  }>;
}

export function buildBuildingTimeline(source: TimelineSource): TimelineEntry[] {
  const entries: TimelineEntry[] = [];

  if (source.building.created_at) {
    entries.push({
      id: `reg-${source.building.custom_id || "b"}`,
      type: "registered",
      label: "Building registered",
      detail: source.building.custom_id || undefined,
      at: source.building.created_at,
      tone: "gray",
    });
  }

  if (source.serviceAssignment?.activated_at) {
    entries.push({
      id: `assign-${source.building.custom_id || "b"}`,
      type: "assigned",
      label: "Service activated",
      detail: (source.serviceAssignment.pickup_days || []).join(", ") || undefined,
      at: source.serviceAssignment.activated_at,
      tone: "emerald",
    });
  }

  (source.collections || []).forEach((c, i) => {
    if (!c.collection_date) return;
    entries.push({
      id: `col-${c.id ?? i}`,
      type: "collection",
      label: c.status === "missed" ? "Collection missed" : "Waste collected",
      detail: c.hauler_name || undefined,
      at: c.collection_date,
      tone: c.status === "missed" ? "red" : "sky",
    });
  });

  (source.receipts || []).forEach((r, i) => {
    if (!r.issued_at) return;
    entries.push({
      id: `pay-${r.id ?? i}`,
      type: "payment",
      label: "Payment received",
      detail: r.receipt_number || undefined,
      at: r.issued_at,
      tone: "emerald",
    });
  });

  (source.issues || []).forEach((iss, i) => {
    if (iss.created_at) {
      entries.push({
        id: `iss-${iss.id ?? i}`,
        type: "issue",
        label: "Issue reported",
        detail: iss.issue_type || undefined,
        at: iss.created_at,
        tone: "amber",
      });
    }
    if (iss.resolved_at) {
      entries.push({
        id: `issres-${iss.id ?? i}`,
        type: "issue_resolved",
        label: "Issue resolved",
        detail: iss.issue_type || undefined,
        at: iss.resolved_at,
        tone: "emerald",
      });
    }
  });

  return entries.sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime());
}