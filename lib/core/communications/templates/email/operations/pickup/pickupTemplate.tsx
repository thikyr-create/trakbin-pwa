// lib/core/communications/templates/email/operations/pickup/pickupTemplate.tsx
export interface PickupCompletedContext { companyName: string; buildingId: string; driverName: string; completedAt: string; }
export function renderPickupCompletedEmail(c: PickupCompletedContext) {
  return {
    subject: `Pickup completed at ${c.buildingId}`,
    html: `<div style="font-family:sans-serif;max-width:500px;margin:0 auto;"><h2>Pickup completed ✓</h2><p>${c.driverName} completed collection at <strong>${c.buildingId}</strong> at ${c.completedAt} for ${c.companyName}.</p></div>`,
    text: `Pickup completed at ${c.buildingId} by ${c.driverName} at ${c.completedAt}.`,
  };
}