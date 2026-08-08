// lib/core/communications/templates/email/operations/incident/incidentTemplate.tsx
export interface IncidentContext { issueType: string; driverName: string; buildingId?: string; description?: string; occurredAt: string; dashboardUrl: string; }
export function renderIncidentReportedEmail(c: IncidentContext) {
  return {
    subject: `Incident reported: ${c.issueType}`,
    html: `<div style="font-family:sans-serif;max-width:500px;margin:0 auto;">
      <h2>Incident reported</h2>
      <p><strong>${c.issueType}</strong> at ${c.buildingId || 'on route'} — reported by ${c.driverName} at ${c.occurredAt}.</p>
      ${c.description ? `<blockquote style="border-left:3px solid #e5e7eb;padding-left:12px;color:#6b7280;">${c.description}</blockquote>` : ''}
      <a href="${c.dashboardUrl}" style="display:inline-block;background:#059669;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:700;">Review in dashboard</a>
    </div>`,
    text: `Incident: ${c.issueType} — ${c.driverName} at ${c.occurredAt}`,
  };
}