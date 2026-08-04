export interface ValidationResult { ok: boolean; errors: string[]; }
export function validateAssignment(args: { driver: any; truck: any; stops: any[] }): ValidationResult {
  const errors: string[] = [];
  if (!args.driver) errors.push('Select a driver.');
  else if ((args.driver.status || 'available') !== 'available' || args.driver.current_assignment_id) errors.push('Driver is not available.');
  if (!args.truck) errors.push('Select a truck.');
  else if (args.truck.status === 'maintenance' || args.truck.current_driver) errors.push('Truck is not available.');
  if (!args.stops?.length) errors.push('Select at least one building.');
  else if (args.stops.some((s) => s.lat == null || s.lng == null)) errors.push('Some selected buildings have no coordinates.');
  return { ok: errors.length === 0, errors };
}