// lib/core/analytics/metricsEngine.ts
import type { AnalyticsData } from '@/lib/features/analytics/services/analyticsService';

export interface DateRange {
  start: Date;
  end: Date;
}

export interface AnalyticsKpis {
  buildingsServed: number;
  collectionsCompleted: number;
  collectionSuccessRate: number | null; // null = no runs to measure
  revenue: number;
  outstanding: number;
  activeDrivers: number;
  fleetUtilization: number;
  issueReports: number;
}

export interface SeriesPoint {
  month: string;
  label: string;
  value: number;
}

export interface PaymentDistribution {
  paid: number;
  overdue: number;
  open: number;
  cancelled: number;
  total: number;
}

export interface FleetSnapshot {
  total: number;
  available: number;
  onRoute: number;
  maintenance: number;
  utilizationPct: number;
}

export interface Insight {
  tone: 'positive' | 'warning' | 'neutral';
  text: string;
}

export function inRange(dateStr: string | null | undefined, range: DateRange): boolean {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return false;
  return d.getTime() >= range.start.getTime() && d.getTime() <= range.end.getTime();
}

export function computeKpis(data: AnalyticsData, range: DateRange): AnalyticsKpis {
  const revenue = data.receipts
    .filter((r) => inRange(r.issued_at || r.created_at, range))
    .reduce((sum, r) => sum + (Number(r.gross) || 0), 0);

  const outstanding = data.invoices
    .filter((i) => i.status !== 'paid' && i.status !== 'cancelled')
    .reduce((sum, i) => sum + (Number(i.amount) || 0), 0);

  const activeDrivers = data.drivers.filter(
    (d) => !d.status || d.status === 'active'
  ).length;

  const fleet = computeFleetSnapshot(data.trucks);

  const issueReports = data.issues.filter((i) => inRange(i.created_at, range)).length;

  return {
    buildingsServed: data.buildings.length,
    collectionsCompleted: data.connectedRuns,
    collectionSuccessRate: data.plannedRuns > 0
      ? Math.round((data.connectedRuns / data.plannedRuns) * 1000) / 10
      : null,
    revenue,
    outstanding,
    activeDrivers,
    fleetUtilization: fleet.utilizationPct,
    issueReports,
  };
}

export function computeFleetSnapshot(trucks: any[]): FleetSnapshot {
  const total = trucks.length;
  const onRoute = trucks.filter((t) => t.status === 'on_route' || t.status === 'active').length;
  const maintenance = trucks.filter((t) => t.status === 'maintenance').length;
  const available = total - onRoute - maintenance;

  return {
    total,
    available,
    onRoute,
    maintenance,
    utilizationPct: total > 0 ? Math.round((onRoute / total) * 100) : 0,
  };
}

export function computePaymentDistribution(invoices: any[]): PaymentDistribution {
  const dist: PaymentDistribution = { paid: 0, overdue: 0, open: 0, cancelled: 0, total: invoices.length };

  invoices.forEach((i) => {
    if (i.status === 'paid') dist.paid += 1;
    else if (i.status === 'overdue') dist.overdue += 1;
    else if (i.status === 'cancelled') dist.cancelled += 1;
    else dist.open += 1;
  });

  return dist;
}

function lastMonths(count: number): Array<{ year: number; month: number; key: string; label: string }> {
  const now = new Date();
  const out = [];
  for (let i = count - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    out.push({
      year: d.getFullYear(),
      month: d.getMonth() + 1,
      key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
      label: d.toLocaleDateString('en-NG', { month: 'short' }),
    });
  }
  return out;
}

export function computeRevenueSeries(receipts: any[], months = 6): SeriesPoint[] {
  const buckets = lastMonths(months);
  const map = new Map(buckets.map((b) => [b.key, 0]));

  receipts.forEach((r) => {
    const d = new Date(r.issued_at || r.created_at);
    if (Number.isNaN(d.getTime())) return;
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    if (map.has(key)) map.set(key, (map.get(key) || 0) + (Number(r.gross) || 0));
  });

  return buckets.map((b) => ({ month: b.key, label: b.label, value: map.get(b.key) || 0 }));
}

export function computeBuildingGrowth(buildings: any[], months = 6): SeriesPoint[] {
  const buckets = lastMonths(months);
  const map = new Map(buckets.map((b) => [b.key, 0]));

  buildings.forEach((b) => {
    const d = new Date(b.created_at);
    if (Number.isNaN(d.getTime())) return;
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    if (map.has(key)) map.set(key, (map.get(key) || 0) + 1);
  });

  return buckets.map((b) => ({ month: b.key, label: b.label, value: map.get(b.key) || 0 }));
}

/** Deterministic, rule-based insights — honest sentences from real numbers. */
export function computeInsights(
  data: AnalyticsData,
  kpis: AnalyticsKpis,
  revenueSeries: SeriesPoint[],
  growthSeries: SeriesPoint[]
): Insight[] {
  const insights: Insight[] = [];

  // Revenue momentum
  if (revenueSeries.length >= 2) {
    const last = revenueSeries[revenueSeries.length - 1].value;
    const prev = revenueSeries[revenueSeries.length - 2].value;
    if (prev > 0 && last > prev) {
      const pct = Math.round(((last - prev) / prev) * 100);
      insights.push({ tone: 'positive', text: `Revenue increased ${pct}% compared to last month.` });
    } else if (prev > 0 && last < prev) {
      const pct = Math.round(((prev - last) / prev) * 100);
      insights.push({ tone: 'warning', text: `Revenue decreased ${pct}% compared to last month.` });
    }
  }

  // Outstanding pressure
  const dist = computePaymentDistribution(data.invoices);
  if (dist.overdue > 0) {
    insights.push({
      tone: 'warning',
      text: `${dist.overdue} invoice${dist.overdue === 1 ? ' is' : 's are'} overdue — ${formatMoney(kpis.outstanding)} outstanding in total.`,
    });
  } else if (dist.total > 0 && dist.overdue === 0) {
    insights.push({ tone: 'positive', text: 'No overdue invoices — all buildings in good standing.' });
  }

  // Fleet state
  const fleet = computeFleetSnapshot(data.trucks);
  if (fleet.maintenance > 0) {
    insights.push({
      tone: 'warning',
      text: `${fleet.maintenance} truck${fleet.maintenance === 1 ? '' : 's'} in maintenance — fleet utilization at ${fleet.utilizationPct}%.`,
    });
  }

  // Building growth
  if (growthSeries.length >= 2) {
    const last = growthSeries[growthSeries.length - 1].value;
    const prev = growthSeries[growthSeries.length - 2].value;
    if (last > prev) {
      insights.push({ tone: 'positive', text: `Building registrations are growing — ${last} added this month vs ${prev} last month.` });
    }
  }

  // Execution gap (the honest finding)
  if (data.plannedRuns === 0) {
    insights.push({
      tone: 'neutral',
      text: 'No collection runs planned yet — dispatch assignments will appear here once routes are assigned.',
    });
  } else if (data.connectedRuns === 0) {
    insights.push({
      tone: 'warning',
      text: `${data.plannedRuns} planned run${data.plannedRuns === 1 ? '' : 's'} not connected to any route — dispatch linkage needs attention.`,
    });
  }

  // Issues
  if (kpis.issueReports > 0) {
    insights.push({ tone: 'warning', text: `${kpis.issueReports} issue report${kpis.issueReports === 1 ? '' : 's'} filed in this period.` });
  }

  return insights;
}

function formatMoney(value: number): string {
  return '₦' + Math.round(value).toLocaleString('en-NG');
}