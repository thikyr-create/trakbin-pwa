// lib/core/company/truckEngine.ts

export interface TruckRecord {
  truck_id: string;
  license_plate: string;
  truck_type?: string | null;
  capacity?: string | null;
  status?: string;
  driver_name?: string | null;
  current_driver?: string | null;
  company_id?: string;
  company_name?: string | null;
  collections_today?: number;
}

export interface CreateTruckInput {
  license_plate: string;
  truck_type?: string;
  capacity?: string;
  status?: string;
  driver_employee_id?: string | null;
}

export interface UpdateTruckInput {
  license_plate?: string;
  truck_type?: string;
  capacity?: string;
  status?: string;
}

export class TruckEngineError extends Error {
  status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = 'TruckEngineError';
    this.status = status;
  }
}

function getCompanyContext(): {
  company_id: string | null;
  company_name: string | null;
} {
  if (typeof window === 'undefined') {
    return { company_id: null, company_name: null };
  }

  try {
    const stored = window.localStorage.getItem('trakbin_company');
    if (!stored) return { company_id: null, company_name: null };

    const parsed = JSON.parse(stored);
    return {
      company_id: parsed?.id || parsed?.company_id || null,
      company_name: parsed?.company_name || null,
    };
  } catch {
    return { company_id: null, company_name: null };
  }
}

function requireCompany() {
  const company = getCompanyContext();
  if (!company.company_id) {
    throw new TruckEngineError('Company session not found. Please log in again.');
  }
  return company;
}

async function request(method: 'POST' | 'PATCH', payload: Record<string, unknown>) {
  const res = await fetch('/api/company/trucks', {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    throw new TruckEngineError(
      data?.error || 'Truck request failed.',
      res.status
    );
  }

  return data;
}

export async function createTruck(input: CreateTruckInput): Promise<TruckRecord> {
  if (!input.license_plate.trim()) {
    throw new TruckEngineError('License plate is required.');
  }

  const company = requireCompany();

  const data = await request('POST', {
    license_plate: input.license_plate.trim(),
    truck_type: input.truck_type || 'Compactor',
    capacity: input.capacity?.trim() || undefined,
    status: input.status || 'active',
    driver_employee_id: input.driver_employee_id ?? null,
    company_id: company.company_id,
    company_name: company.company_name,
  });

  if (!data?.truck) {
    throw new TruckEngineError('Truck creation response was incomplete.');
  }

  return data.truck as TruckRecord;
}

export async function updateTruck(
  truck_id: string,
  input: UpdateTruckInput
): Promise<TruckRecord> {
  const company = requireCompany();

  const data = await request('PATCH', {
    truck_id,
    company_id: company.company_id,
    ...input,
  });

  if (!data?.truck) {
    throw new TruckEngineError('Truck update response was incomplete.');
  }

  return data.truck as TruckRecord;
}

export async function assignDriver(
  truck_id: string,
  employee_id: string
): Promise<TruckRecord> {
  const company = requireCompany();

  const data = await request('PATCH', {
    truck_id,
    company_id: company.company_id,
    driver_employee_id: employee_id,
  });

  if (!data?.truck) {
    throw new TruckEngineError('Assignment response was incomplete.');
  }

  return data.truck as TruckRecord;
}

export async function unassignDriver(truck_id: string): Promise<TruckRecord> {
  const company = requireCompany();

  const data = await request('PATCH', {
    truck_id,
    company_id: company.company_id,
    driver_employee_id: null,
  });

  if (!data?.truck) {
    throw new TruckEngineError('Unassignment response was incomplete.');
  }

  return data.truck as TruckRecord;
}

export async function setTruckStatus(
  truck_id: string,
  status: string
): Promise<TruckRecord> {
  const company = requireCompany();

  const data = await request('PATCH', {
    truck_id,
    company_id: company.company_id,
    status,
  });

  if (!data?.truck) {
    throw new TruckEngineError('Status update response was incomplete.');
  }

  return data.truck as TruckRecord;
}