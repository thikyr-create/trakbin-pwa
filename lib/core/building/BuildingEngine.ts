// lib/core/building/BuildingEngine.ts

export class BuildingEngineError extends Error {
  status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = 'BuildingEngineError';
    this.status = status;
  }
}

function getCompanyNumericId(): number | null {
  if (typeof window === 'undefined') return null;

  try {
    const stored = window.localStorage.getItem('trakbin_company');
    if (!stored) return null;

    const parsed = JSON.parse(stored);
    const raw = parsed?.id ?? parsed?.company_id ?? null;
    if (raw == null) return null;

    const num = Number(raw);
    return Number.isFinite(num) ? num : null;
  } catch {
    return null;
  }
}

function requireCompany(): number {
  const id = getCompanyNumericId();
  if (id == null) {
    throw new BuildingEngineError('Company session not found. Please log in again.');
  }
  return id;
}

async function sendAction(payload: Record<string, unknown>) {
  const res = await fetch('/api/company/buildings', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    throw new BuildingEngineError(
      data?.error || 'Building operation failed.',
      res.status
    );
  }

  return data;
}

export interface UpdateScheduleInput {
  custom_id: string;
  pickup_days: string[];
  time_window?: string | null;
}

export async function updateSchedule(input: UpdateScheduleInput) {
  if (!input.custom_id) {
    throw new BuildingEngineError('Building reference missing.');
  }
  if (!input.pickup_days || input.pickup_days.length === 0) {
    throw new BuildingEngineError('Select at least one collection day.');
  }

  const company_id = requireCompany();

  return sendAction({
    action: 'update_schedule',
    company_id,
    custom_id: input.custom_id,
    pickup_days: input.pickup_days,
    time_window: input.time_window ?? null,
  });
}

export interface ToggleAutopayInput {
  custom_id: string;
  enabled: boolean;
}

export async function toggleAutopay(input: ToggleAutopayInput) {
  if (!input.custom_id) {
    throw new BuildingEngineError('Building reference missing.');
  }

  const company_id = requireCompany();

  return sendAction({
    action: 'toggle_autopay',
    company_id,
    custom_id: input.custom_id,
    enabled: !!input.enabled,
  });
}

export interface ReportIssueInput {
  custom_id: string;
  issue_type: string;
  severity?: string;
  priority?: string;
  description?: string;
}

export async function reportIssue(input: ReportIssueInput) {
  if (!input.custom_id) {
    throw new BuildingEngineError('Building reference missing.');
  }
  if (!input.issue_type || !input.issue_type.trim()) {
    throw new BuildingEngineError('Issue type is required.');
  }

  const company_id = requireCompany();

  return sendAction({
    action: 'report_issue',
    company_id,
    custom_id: input.custom_id,
    issue_type: input.issue_type.trim(),
    severity: input.severity || 'medium',
    priority: input.priority || 'normal',
    description: input.description?.trim() || null,
  });
}