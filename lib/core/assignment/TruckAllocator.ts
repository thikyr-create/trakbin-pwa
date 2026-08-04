export function availableTrucks(trucks: any[]): any[] {
  return (trucks || []).filter((t) => t.status !== 'maintenance' && !t.current_driver);
}