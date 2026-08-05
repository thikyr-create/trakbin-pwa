// lib/core/analytics/ReportEngine.ts
import type { AnalyticsKpis } from './metricsEngine';

export interface ReportOutput {
  filename: string;
  csv: string;
}

function escapeCsv(value: string | number): string {
  const s = String(value ?? '');
  if (/[",\n]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export function toCsv(headers: string[], rows: Array<Array<string | number>>): string {
  const lines = [headers, ...rows].map((row) => row.map(escapeCsv).join(','));
  return lines.join('\n');
}

export function downloadCsv(report: ReportOutput): void {
  if (typeof document === 'undefined') return;

  const blob = new Blob(['\ufeff' + report.csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = report.filename;
  a.click();
  URL.revokeObjectURL(url);
}

function todayStamp(): string {
  return new Date().toISOString().slice(0, 10);
}

export function buildKpiReport(kpis: AnalyticsKpis, preset: string): ReportOutput {
  const csv = toCsv(
    ['Metric', 'Value'],
    [
      ['Period preset', preset],
      ['Buildings served', kpis.buildingsServed],
      ['Collections completed', kpis.collectionsCompleted],
      ['Collection success rate %', kpis.collectionSuccessRate ?? 'no runs to measure'],
      ['Revenue (period)', kpis.revenue],
      ['Outstanding', kpis.outstanding],
      ['Active drivers', kpis.activeDrivers],
      ['Fleet utilization %', kpis.fleetUtilization],
      ['Issue reports', kpis.issueReports],
    ]
  );

  return { filename: `trakbin-kpis-${preset}-${todayStamp()}.csv`, csv };
}

export function buildInvoiceReport(invoices: any[]): ReportOutput {
  const csv = toCsv(
    ['Building', 'Amount', 'Status', 'Due date', 'Created at'],
    invoices.map((i) => [
      i.building_id || '',
      Number(i.amount) || 0,
      i.status || '',
      i.due_date || '',
      i.created_at || '',
    ])
  );

  return { filename: `trakbin-invoices-${todayStamp()}.csv`, csv };
}

export function buildDriverReport(drivers: any[]): ReportOutput {
  const csv = toCsv(
    ['Employee ID', 'Name', 'Status'],
    drivers.map((d) => [
      d.employee_id || '',
      d.full_name || '',
      d.status || '',
    ])
  );

  return { filename: `trakbin-drivers-${todayStamp()}.csv`, csv };
}