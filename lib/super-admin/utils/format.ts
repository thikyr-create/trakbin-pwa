// lib/super-admin/utils/format.ts
export const formatN = (n: number) => '₦' + n.toLocaleString('en-NG');

export const formatDate = (iso: string | null | undefined) =>
  iso ? new Date(iso).toLocaleDateString('en-NG', { day: '2-digit', month: 'short' }) : '—';

export const formatDateTime = (iso: string | null | undefined) =>
  iso ? new Date(iso).toLocaleString('en-NG', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—';

export const bpsToPercentLabel = (bps: number) =>
  `${(bps / 100).toFixed(1).replace(/\.0$/, '')}%`;