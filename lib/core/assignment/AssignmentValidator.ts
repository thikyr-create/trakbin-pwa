// lib/core/assignment/AssignmentValidator.ts
export interface ValidationResult {
  ok: boolean;
  errors: string[];
}

/**
 * Validate an assignment before persisting.
 * Accepts the same status set as availableDrivers() / availableTrucks()
 * so the validator can never contradict the allocator.
 */
export function validateAssignment(args: {
  driver: any;
  truck: any;
  stops: any[];
}): ValidationResult {
  const errors: string[] = [];

  if (!args.driver) {
    errors.push('Select a driver.');
  } else {
    const driverStatus = (args.driver.status || 'available').toLowerCase();
    const isAvailable = driverStatus === 'available' || driverStatus === 'active';
    if (!isAvailable || args.driver.current_assignment_id) {
      errors.push('Driver is not available.');
    }
  }

  if (!args.truck) {
    errors.push('Select a truck.');
  } else {
    const truckStatus = (args.truck.status || '').toLowerCase();
    if (truckStatus === 'maintenance' || args.truck.current_driver) {
      errors.push('Truck is not available.');
    }
  }

  if (!args.stops?.length) {
    errors.push('Select at least one building.');
  } else if (args.stops.some((s) => s.lat == null || s.lng == null)) {
    errors.push('Some selected buildings have no coordinates.');
  }

  return { ok: errors.length === 0, errors };
}