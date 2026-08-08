// lib/core/communications/templates/email/operations/routeAssignment/routeAssignmentTemplate.tsx
export interface RouteAssignmentContext { driverName: string; routeName: string; date: string; totalStops: number; appUrl: string; }
export function renderRouteAssignmentEmail(c: RouteAssignmentContext) {
  return {
    subject: `New route assigned: ${c.routeName}`,
    html: `<div style="font-family:sans-serif;max-width:500px;margin:0 auto;">
      <h2>Hi ${c.driverName}</h2>
      <p>You've been assigned <strong>${c.routeName}</strong> for ${c.date} — ${c.totalStops} stops.</p>
      <a href="${c.appUrl}/auth" style="display:inline-block;background:#059669;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:700;">Open console</a>
    </div>`,
    text: `New route: ${c.routeName} on ${c.date} (${c.totalStops} stops).`,
  };
}