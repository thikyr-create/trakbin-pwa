import { useMemo } from 'react';
import { View, Text, StyleSheet, Pressable, Linking } from 'react-native';
import { useRouter } from 'expo-router';
import {
  Building2, ShieldCheck, CalendarDays, CalendarPlus, TriangleAlert,
  Phone, MessageCircle, Radio, CheckCircle2,
} from 'lucide-react-native';
import { useCaretakerStore } from '../../store/caretakerStore';
import { dayLabel, nextPickupISO } from '../../services/format';
import { Rise } from '../ui/motion';
import { colors } from '../../theme/colors';
import { radius, sp, touch } from '../../theme/spacing';
import { text } from '../../theme/typography';

const fmtDate = (iso?: string | null) =>
  iso ? new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';

export function ServiceDashboard() {
  const router = useRouter();
  const building = useCaretakerStore((s) => s.building);
  const company = useCaretakerStore((s) => s.company);
  const companyDetails = useCaretakerStore((s) => s.companyDetails);
  const zone = useCaretakerStore((s) => s.zone);
  const contacts = useCaretakerStore((s) => s.contacts);
  const assignment = useCaretakerStore((s) => s.assignment);
  const schedules = useCaretakerStore((s) => s.schedules);
  

  const active = !!assignment;
  const name: string = company?.business_name ?? company?.name ?? 'Awaiting assignment';
  const zoneLabel = zone?.name ? zone.name.replace(/^zone\s*/i, '') : '';
  const activeSince = fmtDate(assignment?.activated_at ?? null);

  const collectionDays = useMemo(() => {
    const pd = assignment?.pickup_days;
    if (Array.isArray(pd) && pd.length) return pd as string[];
    if (typeof pd === 'string' && pd.trim()) return pd.split(',').map((s) => s.trim());
    return [];
  }, [assignment]);

  const next = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const future = schedules
      .filter((s) => s.next_pickup_date && new Date(s.next_pickup_date) >= today)
      .sort((a, b) => String(a.next_pickup_date).localeCompare(String(b.next_pickup_date)));
    return future[0] ?? schedules[0] ?? null;
  }, [schedules]);

  const nextDate = nextPickupISO(assignment, schedules);

  const callContact = contacts.find((c) => c.type === 'call') ?? contacts[0];
  const whatsappNumber =
    contacts.find((c) => c.type === 'whatsapp')?.value ??
    companyDetails?.whatsapp_number ??
    company?.whatsapp_number ??
    null;

  const openCall = () => { if (callContact) Linking.openURL(`tel:${callContact.value}`); };
  const openWhatsApp = () => {
    if (whatsappNumber) Linking.openURL(`https://wa.me/${String(whatsappNumber).replace(/\D/g, '')}`);
  };

  if (!active) {
    return (
      <Rise delay={0}>
        <View style={styles.inactive}>
          <View style={styles.inactiveIcon}><Radio size={22} color={colors.text.muted} /></View>
          <Text style={styles.inactiveTitle}>Service not active yet</Text>
          <Text style={styles.inactiveBody}>
            {building?.custom_id ?? 'Your building'} is registered. We're matching you with a waste company
            operating in your zone. Pickups, billing and provider details unlock once a company accepts your building.
          </Text>
        </View>
      </Rise>
    );
  }

  return (
    <View style={styles.container}>
      {/* 1. THE OPERATOR */}
      <Rise delay={0}>
        <View style={styles.operatorCard}>
          <View style={styles.operatorAvatar}><Building2 size={20} color={colors.brand[300]} /></View>
          <View style={styles.operatorMain}>
            <Text style={styles.operatorName} numberOfLines={1}>{name}</Text>
            <View style={styles.operatorMeta}>
              <View style={styles.onlineDot} />
              <Text style={styles.operatorStatus}>Online</Text>
              {zoneLabel ? <Text style={styles.operatorZone}>· Zone {zoneLabel}</Text> : null}
            </View>
          </View>
          <View style={styles.verifiedBadge}>
            <ShieldCheck size={14} color={colors.brand[400]} />
          </View>
        </View>
      </Rise>

      {/* 2. THE SCHEDULE */}
      <Rise delay={70}>
        <View style={styles.scheduleCard}>
          <View style={styles.scheduleHeader}>
            <CalendarDays size={16} color={colors.brand[400]} />
            <Text style={styles.scheduleEyebrow}>Next collection</Text>
          </View>

          <View style={styles.scheduleBody}>
            <View style={styles.scheduleLeft}>
              <Text style={styles.scheduleDay}>{dayLabel(nextDate)}</Text>
              <Text style={styles.scheduleWindow}>{assignment?.time_window ?? next?.time_window ?? '—'}</Text>
            </View>
            <View style={styles.scheduleRight}>
              <StatusPillCompact value={next?.status ?? 'scheduled'} />
            </View>
          </View>

          {collectionDays.length > 0 ? (
            <View style={styles.daysRow}>
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => {
                const isActive = collectionDays.some((cd) =>
                  String(cd).toLowerCase().includes(d.slice(0, 3).toLowerCase())
                );
                return (
                  <View key={d} style={[styles.dayChip, isActive && styles.dayChipActive]}>
                    <Text style={[styles.dayText, isActive && styles.dayTextActive]}>{d.slice(0, 2)}</Text>
                  </View>
                );
              })}
            </View>
          ) : null}
        </View>
      </Rise>

      {/* 3. THE LIFELINE */}
      <Rise delay={140}>
        <View style={styles.actionRow}>
          <Pressable
            style={[styles.actionBtn, styles.actionBtnSlate]}
            onPress={openCall}
            disabled={!callContact}
            accessibilityRole="button"
            accessibilityLabel="Call hauler"
          >
            <Phone size={18} color={colors.text.primary} />
            <Text style={styles.actionLabel}>Call Hauler</Text>
          </Pressable>

          <Pressable
            style={[styles.actionBtn, styles.actionBtnEmerald]}
            onPress={openWhatsApp}
            disabled={!whatsappNumber}
            accessibilityRole="button"
            accessibilityLabel="WhatsApp hauler"
          >
            <MessageCircle size={18} color={colors.text.inverse} />
            <Text style={[styles.actionLabel, styles.actionLabelInverse]}>WhatsApp</Text>
          </Pressable>
        </View>
      </Rise>

      {/* 4. DUAL ACTION — pickup + report (danger) */}
      <Rise delay={200}>
        <View style={styles.actionRow}>
          <Pressable
            style={[styles.actionBtn, styles.actionBtnEmerald]}
            onPress={() => router.push('/customer/requests/create')}
            accessibilityRole="button"
            accessibilityLabel="Request pickup"
          >
            <CalendarPlus size={18} color={colors.text.inverse} />
            <Text style={[styles.actionLabel, styles.actionLabelInverse]}>Request pickup</Text>
          </Pressable>

          <Pressable
            style={[styles.actionBtn, styles.actionBtnDanger]}
            onPress={() => router.push('/customer/report')}
            accessibilityRole="button"
            accessibilityLabel="Report issue"
          >
            <TriangleAlert size={18} color={colors.text.inverse} />
            <Text style={[styles.actionLabel, styles.actionLabelInverse]}>Report issue</Text>
          </Pressable>
        </View>
      </Rise>

      {/* 5. THE LEDGER — below the actions */}
      <Rise delay={260}>
        <View style={styles.ledgerCard}>
          <Text style={styles.ledgerTitle}>Service contract</Text>
          <LedgerRow label="Active since" value={activeSince} />
          <LedgerRow label="Service plan" value={assignment?.schedule_template ?? next?.frequency ?? '—'} />
          <LedgerRow label="Next collection" value={dayLabel(nextDate)} isLast />
        </View>
      </Rise>
    </View>
  );
}

function LedgerRow({ label, value, isLast }: { label: string; value: string; isLast?: boolean }) {
  return (
    <View style={[styles.ledgerRow, !isLast && styles.ledgerRowBorder]}>
      <Text style={styles.ledgerLabel}>{label}</Text>
      <Text style={styles.ledgerValue}>{value}</Text>
    </View>
  );
}

function StatusPillCompact({ value }: { value: string }) {
  const isScheduled = value === 'scheduled' || value === 'active';
  return (
    <View style={[styles.pill, isScheduled ? styles.pillSuccess : styles.pillMuted]}>
      <CheckCircle2 size={10} color={isScheduled ? colors.state.success : colors.text.muted} />
      <Text style={[styles.pillText, isScheduled ? styles.pillTextSuccess : styles.pillTextMuted]}>
        {value.charAt(0).toUpperCase() + value.slice(1)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: sp.x4 },

  inactive: {
    backgroundColor: colors.card.graphite,
    borderRadius: radius.xxl,
    padding: sp.x6,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border.subtle,
  },
  inactiveIcon: { width: 48, height: 48, borderRadius: radius.lg, backgroundColor: colors.surfaceMuted, alignItems: 'center', justifyContent: 'center', marginBottom: sp.x3 },
  inactiveTitle: { ...text.titleM, color: colors.text.primary },
  inactiveBody: { ...text.bodyM, color: colors.text.muted, textAlign: 'center', marginTop: sp.x2 },

  operatorCard: { flexDirection: 'row', alignItems: 'center', gap: sp.x3, backgroundColor: colors.card.navy, borderRadius: radius.xxl, padding: sp.x4 },
  operatorAvatar: { width: 44, height: 44, borderRadius: radius.lg, backgroundColor: 'rgba(255,255,255,0.08)', alignItems: 'center', justifyContent: 'center' },
  operatorMain: { flex: 1 },
  operatorName: { ...text.titleM, color: colors.text.inverse },
  operatorMeta: { flexDirection: 'row', alignItems: 'center', gap: sp.x1, marginTop: 2 },
  onlineDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.state.success },
  operatorStatus: { ...text.bodyS, fontSize: 12, color: colors.brand[200] },
  operatorZone: { ...text.bodyS, fontSize: 12, color: colors.text.muted },
  verifiedBadge: { width: 32, height: 32, borderRadius: radius.full, backgroundColor: 'rgba(255,255,255,0.06)', alignItems: 'center', justifyContent: 'center' },

  scheduleCard: { backgroundColor: colors.surface, borderRadius: radius.xxl, padding: sp.x5, borderWidth: 1, borderColor: colors.border.subtle },
  scheduleHeader: { flexDirection: 'row', alignItems: 'center', gap: sp.x2, marginBottom: sp.x4 },
  scheduleEyebrow: { ...text.label, fontSize: 10, color: colors.brand[400] },
  scheduleBody: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  scheduleLeft: { flex: 1 },
  scheduleDay: { ...text.display, color: colors.text.primary },
  scheduleWindow: { ...text.titleS, color: colors.text.secondary, marginTop: sp.x1 },
  scheduleRight: { paddingTop: sp.x2 },

  pill: { flexDirection: 'row', alignItems: 'center', gap: sp.x1, paddingHorizontal: sp.x3, paddingVertical: sp.x1, borderRadius: radius.full },
  pillSuccess: { backgroundColor: colors.state.successSoft },
  pillMuted: { backgroundColor: colors.surfaceMuted },
  pillText: { ...text.label, fontSize: 9 },
  pillTextSuccess: { color: colors.state.success },
  pillTextMuted: { color: colors.text.muted },

  daysRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: sp.x5, paddingTop: sp.x4, borderTopWidth: 1, borderTopColor: colors.border.subtle },
  dayChip: { width: 32, height: 32, borderRadius: radius.md, backgroundColor: colors.surfaceMuted, alignItems: 'center', justifyContent: 'center' },
  dayChipActive: { backgroundColor: colors.brand[600] },
  dayText: { ...text.label, fontSize: 10, color: colors.text.muted },
  dayTextActive: { color: colors.text.inverse },

  actionRow: { flexDirection: 'row', gap: sp.x3 },
  actionBtn: { flex: 1, height: touch.field, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: sp.x2, borderRadius: radius.xl },
  actionBtnSlate: { backgroundColor: colors.card.slate },
  actionBtnEmerald: { backgroundColor: colors.card.emerald },
  actionBtnDanger: { backgroundColor: colors.state.danger },
  actionLabel: { ...text.semibold, fontSize: 14, color: colors.text.primary },
  actionLabelInverse: { color: colors.text.inverse },

  ledgerCard: { backgroundColor: colors.surface, borderRadius: radius.xxl, padding: sp.x5, borderWidth: 1, borderColor: colors.border.subtle },
  ledgerTitle: { ...text.headingM, color: colors.text.primary, marginBottom: sp.x3 },
  ledgerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: sp.x3 },
  ledgerRowBorder: { borderBottomWidth: 1, borderBottomColor: colors.border.subtle },
  ledgerLabel: { ...text.bodyM, color: colors.text.muted },
  ledgerValue: { ...text.semibold, color: colors.text.primary },
});