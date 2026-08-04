export function availableDrivers(drivers: any[]): any[] {
  return (drivers || []).filter((d) => (d.status || 'available') === 'available' && !d.current_assignment_id);
}