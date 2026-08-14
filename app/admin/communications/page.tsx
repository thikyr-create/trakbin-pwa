// app/admin/communications/page.tsx
"use client";

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Sora, Plus_Jakarta_Sans, JetBrains_Mono } from 'next/font/google';
import {
  Mail, Send, Inbox, Smartphone, MessageSquare, FileText, Activity,
} from 'lucide-react';
import { useCommunications } from '@/lib/super-admin/hooks/useCommunications';
import { getConfig } from '@/lib/super-admin/services/settings.service';

const display = Sora({ subsets: ['latin'], display: 'swap', variable: '--font-display' });
const body = Plus_Jakarta_Sans({ subsets: ['latin'], display: 'swap', variable: '--font-body' });
const mono = JetBrains_Mono({ subsets: ['latin'], display: 'swap', variable: '--font-mono' });
const EASE = [0.22, 1, 0.36, 1] as [number, number, number, number];

type Tab = 'announcements' | 'inbox' | 'email' | 'delivery' | 'inapp' | 'sms' | 'templates';
const TABS: { key: Tab; label: string }[] = [
  { key: 'announcements', label: 'Announcements' },
  { key: 'inbox', label: 'Inbox' },
  { key: 'email', label: 'Email' },
  { key: 'delivery', label: 'Delivery Logs' },
  { key: 'inapp', label: 'In-App' },
  { key: 'sms', label: 'SMS' },
  { key: 'templates', label: 'Templates' },
];

const pick = (row: any, keys: string[]) => { for (const k of keys) if (row?.[k] != null) return row[k]; return null; };

export default function AdminCommunicationsPage() {
  const { data, orgs, loading, reload, send } = useCommunications();
  const [tab, setTab] = useState<Tab>('announcements');
  const [title, setTitle] = useState('');
  const [msg, setMsg] = useState('');
  const [audience, setAudience] = useState<'all' | 'org'>('all');
  const [orgId, setOrgId] = useState<number | ''>('');
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<string>('');
  const [announcementsOn, setAnnouncementsOn] = useState<boolean>(true);

  useEffect(() => { getConfig().then((c) => setAnnouncementsOn(c.flags.announcements)).catch(() => {}); }, []);

  if (loading || !data) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <motion.div className="h-10 w-10 rounded-full border-b-2 border-emerald-400"
          animate={{ rotate: 360 }} transition={{ duration: 0.9, repeat: Infinity, ease: 'linear' }} />
      </div>
    );
  }

  const doSend = async () => {
    if (!title.trim() || !msg.trim()) return;
    setBusy(true); setResult('');
    const json = await send({ title: title.trim(), body: msg.trim(), audience, orgId: orgId === '' ? undefined : Number(orgId) });
    setBusy(false);
    if (json.ok) {
      setResult(`Sent → ${json.recipients} recipients · ${json.notified} in-app · ${json.queued} queued emails · notice ${json.noticeOk ? 'recorded' : 'failed'}`);
      setTitle(''); setMsg('');
      await reload();
    } else {
      setResult(`Failed: ${json.error || 'unknown'}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* HERO */}
      <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, ease: EASE }}
        className="relative overflow-hidden rounded-[26px] border border-emerald-400/20 bg-gradient-to-br from-emerald-950 to-[#0c1411] p-8">
        <div aria-hidden className="pointer-events-none absolute inset-0 opacity-[0.16]"
          style={{ backgroundImage: 'repeating-radial-gradient(circle at 100% 0%, rgba(255,255,255,0.5) 0 1px, transparent 1px 28px)' }} />
        <div className="relative z-10">
          <p className={`${mono.className} text-[11px] font-bold uppercase tracking-[0.24em] text-emerald-300/70`}>
            Communications · one engine, every surface
          </p>
          <h1 className={`${display.className} mt-3 text-3xl font-black tracking-tight text-white sm:text-4xl`}>Platform voice</h1>
          <p className="mt-2 max-w-xl text-sm font-medium text-emerald-100/70">
            The same engine that sends receipts and settlement notices powers admin announcements. Fanout is server-gated.
          </p>
        </div>
      </motion.section>

      {/* TABS */}
      <div className="flex flex-wrap gap-2">
        {TABS.map((x) => (
          <button key={x.key} onClick={() => setTab(x.key)}
            className={`rounded-xl px-3.5 py-2 text-xs font-bold transition-all ${
              tab === x.key ? 'bg-emerald-400 text-emerald-950 shadow-lg shadow-emerald-400/30'
                            : 'bg-white/5 text-emerald-100/70 ring-1 ring-white/10 hover:bg-white/10 hover:text-white'
            }`}>
            {x.label}
          </button>
        ))}
      </div>

      {/* ANNOUNCEMENTS — composer + sent */}
      {tab === 'announcements' && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <motion.section initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: EASE }}
            className="rounded-[24px] border border-white/10 bg-white/[0.03] p-6 lg:col-span-1">
            <p className={`${mono.className} flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.22em] text-emerald-300/70`}>
              <Send className="h-4 w-4" /> Compose announcement
            </p>
            <div className="mt-4 space-y-3">
              <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title — e.g. Maintenance window Sunday"
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-semibold text-white placeholder-emerald-100/40 outline-none focus:border-emerald-400/50" />
              <textarea value={msg} onChange={(e) => setMsg(e.target.value)} rows={4} placeholder="Message body…"
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-semibold text-white placeholder-emerald-100/40 outline-none focus:border-emerald-400/50" />
              <select value={audience} onChange={(e) => setAudience(e.target.value as 'all' | 'org')}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm font-semibold text-white outline-none focus:border-emerald-400/50">
                <option value="all">All operators</option>
                <option value="org">Specific organization</option>
              </select>
              {audience === 'org' && (
                <select value={orgId} onChange={(e) => setOrgId(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm font-semibold text-white outline-none focus:border-emerald-400/50">
                  <option value="">Select organization…</option>
                  {orgs.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
                </select>
              )}
              {!announcementsOn && (
                <p className="rounded-xl bg-amber-400/10 px-4 py-2.5 text-xs font-bold text-amber-200 ring-1 ring-amber-300/30">
                  Announcements are disabled by platform feature flag (Settings → Feature Flags).
                </p>
              )}
              <motion.button whileTap={{ scale: 0.97 }} onClick={doSend} disabled={busy || !title.trim() || !msg.trim() || !announcementsOn}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-400 py-3 text-sm font-extrabold text-emerald-950 hover:bg-emerald-300 disabled:bg-white/10 disabled:text-white/40">
                <Send className="h-4 w-4" /> {busy ? 'Sending…' : 'Send announcement'}
              </motion.button>
              {result && (
                <motion.p initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
                  className="rounded-xl bg-emerald-400/10 px-4 py-2.5 text-xs font-bold text-emerald-200 ring-1 ring-emerald-300/30">
                  {result}
                </motion.p>
              )}
            </div>
          </motion.section>

          <motion.section initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.08, ease: EASE }}
            className="overflow-hidden rounded-[24px] border border-white/10 bg-white/[0.03] lg:col-span-2">
            <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
              <p className={`${mono.className} text-[11px] font-bold uppercase tracking-[0.22em] text-emerald-300/70`}>Sent announcements</p>
              <span className={`${mono.className} text-[10px] font-bold uppercase tracking-wider text-emerald-100/40`}>{data.notices.length}</span>
            </div>
            {data.notices.length === 0 ? (
              <p className="px-6 py-14 text-center text-sm font-semibold text-emerald-100/50">Nothing sent yet. Compose the first announcement.</p>
            ) : (
              <ul className="divide-y divide-white/5">
                {data.notices.map((n: any, i: number) => (
                  <motion.li key={String(pick(n, ['id']) ?? i)} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03, ease: EASE }}
                    className="px-6 py-4">
                    <p className="text-sm font-extrabold text-white">{pick(n, ['title', 'subject']) || 'Untitled'}</p>
                    <p className="mt-1 text-xs font-semibold text-emerald-100/50">{String(pick(n, ['body', 'message']) || '').slice(0, 160)}</p>
                    <p className={`${mono.className} mt-1.5 text-[10px] font-bold uppercase tracking-wider text-emerald-100/40`}>
                      {pick(n, ['audience']) || 'all'}{pick(n, ['created_at']) && ` · ${new Date(pick(n, ['created_at'])).toLocaleString('en-NG', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}`}
                    </p>
                  </motion.li>
                ))}
              </ul>
            )}
          </motion.section>
        </div>
      )}

      {/* INBOX */}
      {tab === 'inbox' && (
        <ListSection title="Platform inbox" Icon={Inbox} rows={data.notices} empty="Inbox zero — no incoming platform messages."
          render={(n: any) => ({
            head: String(pick(n, ['title', 'subject']) || 'Untitled'),
            sub: String(pick(n, ['body', 'message']) || '').slice(0, 140),
            meta: pick(n, ['created_at']) ? new Date(pick(n, ['created_at'])).toLocaleString('en-NG', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '',
            badge: null,
          })} />
      )}

      {/* EMAIL QUEUE */}
      {tab === 'email' && (
        <ListSection title="Email queue" Icon={Mail} rows={data.emailQueue} empty="Queue empty — no emails waiting."
          render={(e: any) => ({
            head: String(pick(e, ['to_email', 'recipient', 'email']) || '—'),
            sub: String(pick(e, ['subject', 'title']) || ''),
            meta: pick(e, ['created_at']) ? new Date(pick(e, ['created_at'])).toLocaleString('en-NG', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '',
            badge: String(pick(e, ['status', 'state']) || 'queued'),
          })} />
      )}

      {/* DELIVERY LOGS */}
      {tab === 'delivery' && (
        <ListSection title="Delivery logs" Icon={Activity} rows={data.emailDelivery} empty="No delivery events yet — run the queue drain to process."
          render={(e: any) => ({
            head: String(pick(e, ['to_email', 'recipient', 'email']) || pick(e, ['subject']) || '—'),
            sub: String(pick(e, ['error', 'reason']) || ''),
            meta: pick(e, ['created_at']) ? new Date(pick(e, ['created_at'])).toLocaleString('en-NG', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '',
            badge: String(pick(e, ['status', 'state', 'event']) || '—'),
          })} />
      )}

      {/* IN-APP */}
      {tab === 'inapp' && (
        <ListSection title="In-app notifications" Icon={MessageSquare} rows={data.notifications} empty="No in-app notifications yet."
          render={(n: any) => ({
            head: String(pick(n, ['title', 'heading']) || 'Notification'),
            sub: String(pick(n, ['body', 'message']) || '').slice(0, 140),
            meta: pick(n, ['created_at']) ? new Date(pick(n, ['created_at'])).toLocaleString('en-NG', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '',
            badge: pick(n, ['read']) === false ? 'unread' : String(pick(n, ['status']) || 'read'),
          })} />
      )}

      {/* SMS */}
      {tab === 'sms' && (
        <motion.section initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: EASE }}
          className="rounded-[24px] border border-white/10 bg-white/[0.03] px-6 py-16 text-center">
          <Smartphone className="mx-auto h-8 w-8 text-emerald-300/40" />
          <p className={`${display.className} mt-4 text-lg font-extrabold text-white`}>SMS channel not provisioned</p>
          <p className="mt-1 text-sm font-medium text-emerald-100/50">The channel slot exists in the communications engine; a provider lands when you choose one. Real empty state.</p>
        </motion.section>
      )}

      {/* TEMPLATES */}
      {tab === 'templates' && (
        <motion.section initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: EASE }}
          className="rounded-[24px] border border-white/10 bg-white/[0.03] px-6 py-16 text-center">
          <FileText className="mx-auto h-8 w-8 text-emerald-300/40" />
          <p className={`${display.className} mt-4 text-lg font-extrabold text-white`}>Templates are code-owned</p>
          <p className="mt-1 text-sm font-medium text-emerald-100/50">Receipt, notice and settlement templates live in lib/core/communications/templates — versioned with the engine, not editable from the console.</p>
        </motion.section>
      )}

      <motion.footer initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6, delay: 0.3 }}
        className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-6">
        <span className="flex items-center gap-2 text-xs font-semibold text-emerald-100/50">
          <Mail className="h-3.5 w-3.5 text-emerald-300" /> One engine · every surface · fanout server-gated
        </span>
        <span className={`${mono.className} flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.2em] text-emerald-300/60`}>
          <Mail className="h-3.5 w-3.5" /> Trakbin Communications
        </span>
      </motion.footer>
    </div>
  );
}

function ListSection({ title, Icon, rows, empty, render }: {
  title: string; Icon: any; rows: any[]; empty: string;
  render: (row: any) => { head: string; sub: string; meta: string; badge: string | null };
}) {
  return (
    <motion.section initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: EASE }}
      className="overflow-hidden rounded-[24px] border border-white/10 bg-white/[0.03]">
      <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
        <p className={`${mono.className} flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.22em] text-emerald-300/70`}>
          <Icon className="h-4 w-4" /> {title}
        </p>
        <span className={`${mono.className} text-[10px] font-bold uppercase tracking-wider text-emerald-100/40`}>{rows.length}</span>
      </div>
      {rows.length === 0 ? (
        <p className="px-6 py-14 text-center text-sm font-semibold text-emerald-100/50">{empty}</p>
      ) : (
        <ul className="divide-y divide-white/5">
          {rows.map((r, i) => {
            const x = render(r);
            return (
              <motion.li key={String(pick(r, ['id']) ?? i)} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.02, ease: EASE }}
                className="flex flex-wrap items-center justify-between gap-3 px-6 py-4">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-extrabold text-white">{x.head}</p>
                  {x.sub && <p className="mt-0.5 text-xs font-semibold text-emerald-100/50">{x.sub}</p>}
                  {x.meta && <p className={`${mono.className} mt-1 text-[10px] font-bold uppercase tracking-wider text-emerald-100/40`}>{x.meta}</p>}
                </div>
                {x.badge && <span className="rounded-full bg-white/5 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-100/60 ring-1 ring-white/10">{x.badge}</span>}
              </motion.li>
            );
          })}
        </ul>
      )}
    </motion.section>
  );
}