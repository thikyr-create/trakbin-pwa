// lib/core/company/driverEngine.ts

export interface CreateDriverInput {
  name: string;
  email: string;
  phone?: string;
  truck_id?: string | null;
}

export interface DriverCredentials {
  employeeId: string;
  tempPassword: string;
}

export interface DriverRecord {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  employee_id: string;
  truck_id?: string | null;
  status: string;
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

  const payload: CreateDriverInput = {
    name: input.name.trim(),
    email: input.email.trim().toLowerCase(),
    phone: input.phone?.trim() || undefined,
    truck_id: input.truck_id ?? null,
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