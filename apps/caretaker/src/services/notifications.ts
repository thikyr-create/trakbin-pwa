import { API_BASE } from './caretaker';
async function safeJson(res: Response) { const t = await res.text(); try { return JSON.parse(t); } catch { throw new Error(t.slice(0,60)); } }

export async function fetchNotifications(userId: string) {
  const res = await fetch(`${API_BASE}/api/notifications?userId=${encodeURIComponent(userId)}`);
  return safeJson(res);
}
export async function markAllRead(userId: string) {
  const res = await fetch(`${API_BASE}/api/notifications`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId }) });
  return safeJson(res);
}