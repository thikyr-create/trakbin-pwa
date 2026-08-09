// lib/core/communications/templates/email/reports/reportReady/reportReadyTemplate.tsx
export interface ReportReadyContext { name: string; reportName: string; url: string; }
export function renderReportReadyEmail(c: ReportReadyContext) {
  return {
    subject: `Your report is ready: ${c.reportName}`,
    html: `<div style="font-family:sans-serif;max-width:500px;margin:0 auto;"><h2>Report ready</h2><p>Hi ${c.name}, <strong>${c.reportName}</strong> is ready to view.</p><a href="${c.url}" style="display:inline-block;background:#059669;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:700;">View report</a></div>`,
    text: `Report ready: ${c.reportName} — ${c.url}`,
  };
}