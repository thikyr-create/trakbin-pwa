// lib/core/communications/templates/email/operations/driverAssignment/driverAssignmentTemplate.tsx
export interface DriverAssignmentContext { driverName: string; truckLabel?: string; zoneName?: string; date: string; appUrl: string; }
export function renderDriverAssignmentEmail(c: DriverAssignmentContext) {
  return {
    subject: `You're assigned for ${c.date}`,
    html: `<div style="font-family:sans-serif;max-width:500px;margin:0 auto;"><h2>Hi ${c.driverName}</h2><p>You're scheduled for <strong>${c.date}</strong>${c.zoneName ? ` in <strong>${c.zoneName}</strong>` : ''}${c.truckLabel ? ` with truck <strong>${c.truckLabel}</strong>` : ''}.</p><a href="${c.appUrl}/auth" style="display:inline-block;background:#059669;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:700;">Open console</a></div>`,
    text: `Assigned for ${c.date}${c.zoneName ? ` (${c.zoneName})` : ''}.`,
  };
}