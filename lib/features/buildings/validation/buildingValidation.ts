// lib/features/buildings/validation/buildingValidation.ts

export const ISSUE_TYPES = [
  "Illegal dumping",
  "Missed collection",
  "Overflowing bin",
  "Spillage on street",
  "Pest infestation",
  "Other",
];

export const SEVERITIES = ["low", "medium", "high", "critical"];
export const PRIORITIES = ["normal", "urgent"];

export const TIME_WINDOWS = [
  "Morning (7am – 11am)",
  "Midday (11am – 3pm)",
  "Afternoon (3pm – 7pm)",
];

export interface ScheduleValidationErrors {
  pickup_days?: string;
  time_window?: string;
}

export function validateSchedule(input: {
  pickup_days: string[];
  time_window?: string | null;
}): ScheduleValidationErrors {
  const errors: ScheduleValidationErrors = {};

  if (!input.pickup_days || input.pickup_days.length === 0) {
    errors.pickup_days = "Select at least one collection day.";
  } else if (input.pickup_days.length > 6) {
    errors.pickup_days = "Maximum six collection days per week.";
  }

  if (input.time_window && input.time_window.length > 60) {
    errors.time_window = "Time window is too long.";
  }

  return errors;
}

export interface IssueValidationErrors {
  issue_type?: string;
  description?: string;
}

export function validateIssueReport(input: {
  issue_type: string;
  description?: string;
}): IssueValidationErrors {
  const errors: IssueValidationErrors = {};

  if (!input.issue_type || !input.issue_type.trim()) {
    errors.issue_type = "Issue type is required.";
  }

  if (input.description && input.description.length > 600) {
    errors.description = "Description is too long (max 600 characters).";
  }

  return errors;
}