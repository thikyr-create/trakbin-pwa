export function availableDrivers(drivers: any[]): any[] {
  // FIX: Accept both 'active' and 'available' status
  // The drivers API creates with status='active', not 'available'
  return (drivers || []).filter((d) => {
    const status = (d.status || 'available').toLowerCase();
    const isAvailable = status === 'available' || status === 'active';
    const hasNoAssignment = !d.current_assignment_id;
    return isAvailable && hasNoAssignment;
  });
}