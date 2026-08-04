// lib/core/company/driverEngine.ts

export interface CreateDriverInput {
  name: string;
  email: string;
  phone?: string;
  license_number?: string;
  truck_id?: string | null;
}

export interface DriverCredentials {
  employeeId: string;
  tempPassword: string;
}

export interface DriverRecord {
  id?: string;
  employee_id: string;
  full_name: string;
  email: string;
  phone?: string | null;
  license_number?: string | null;
  truck_id?: string | null;
  status?: string;
  company_id?: string;
  created_at?: string;
}

export interface CreateDriverResult {
  driver: DriverRecord;
  credentials: DriverCredentials;
  emailSent: boolean;
}

export class DriverEngineError extends Error {
  status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = 'DriverEngineError';
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

function validateCreateDriverInput(input: CreateDriverInput) {
  if (!input.name.trim()) {
    throw new DriverEngineError('Driver name is required.');
  }

  if (!input.email.trim()) {
    throw new DriverEngineError('Driver email is required.');
  }

  const email = input.email.trim().toLowerCase();

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new DriverEngineError('Enter a valid driver email address.');
  }
}

export async function createDriver(
  input: CreateDriverInput
): Promise<CreateDriverResult> {
  validateCreateDriverInput(input);

  const company = getCompanyContext();

  if (!company.company_id) {
    throw new DriverEngineError(
      'Company session not found. Please log in again.'
    );
  }

  const payload = {
    name: input.name.trim(),
    email: input.email.trim().toLowerCase(),
    phone: input.phone?.trim() || undefined,
    license_number: input.license_number?.trim() || undefined,
    truck_id: input.truck_id ?? null,
    company_id: company.company_id,
    company_name: company.company_name,
  };

  const res = await fetch('/api/company/drivers', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    throw new DriverEngineError(
      data?.error || 'Failed to create driver.',
      res.status
    );
  }

  if (!data?.driver || !data?.credentials) {
    throw new DriverEngineError('Driver creation response was incomplete.');
  }

  return data as CreateDriverResult;
}