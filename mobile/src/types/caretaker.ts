export interface Building {
  building_id: number;
  custom_id: string | null;
  address: string | null;
  estate: string | null;
  building_type: string | null;
  unit_type: string | null;
  number_of_units: number | null;
  num_flats: string | null;
  num_stores: string | null;
  status: string | null;
  payment_status: string | null;
  wallet_balance: number | null;
  autopay_enabled: boolean | null;
  autopay_source: string | null;
  billing_day: number | null;
  next_billing_date: string | null;
  company_id: number | null;
  caretaker_email: string | null;
  latitude: number | null;
  longitude: number | null;
  gps_location_address: string | null;
  created_at: string | null;
}

export interface CollectionSchedule {
  id: number;
  building_id: string | null;
  next_pickup_date: string | null;
  time_window: string | null;
  frequency: string | null;
  waste_type: string | null;
  status: string | null;
}

export interface Collection {
  id: number;
  building_id: string | null;
  collection_date: string | null;
  status: string | null;
  hauler_name: string | null;
  notes: string | null;
}

export interface Invoice {
  id: number;
  building_id: string | null;
  amount: number | null;
  due_date: string | null;
  status: string | null;
  description: string | null;
  paid_at: string | null;
  created_at: string | null;
}

export type CaretakerNotificationKind =
  | 'pickup'
  | 'pickup_disputed'
  | 'issue_update'
  | 'service_activated'
  | 'invoice_paid'
  | 'wallet_topup'
  | 'charge_failed';

export interface AppNotification {
  id: string;
  kind: CaretakerNotificationKind;
  label: string;
  sub: string | null;
  at: string;
  refId: string | null;
  disputed: boolean;
  data?: {
    reference?: string;
    amount?: number;
    purpose?: string;
    channel?: string;
    psp?: string;
    card?: { brand?: string; last4?: string };
    reason?: string;
    [key: string]: any;
  };
}