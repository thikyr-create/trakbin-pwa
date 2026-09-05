import { useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useActivityTimeline } from '../hooks/useActivityTimeline';
import { useProgress } from '../hooks/useProgress';
import { useSessionStore } from '../store/session';
import { ActivityItem } from '../components/activity/ActivityItem';
import { ProgressRing } from '../components/progress/ProgressRing';
import { SummaryRow } from '../components/progress/SummaryRow';
import { OfflineCard } from '../components/more/OfflineCard';
import { useLayout } from '../theme/layout';
import { colors, typography, spacing, radius, elevation } from '../theme/design';

function fmtTime(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

function dayLabel(iso: string): string {
  const d = new Date(iso);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  const same = (a: Date, b: Date) => a.toDateString() === b.toDateString();
  if (same(d, today)) return 'Today';
  if (same(d, yesterday)) return 'Yesterday';
  return d.toLocaleDateString([], { weekday: 'short', day: 'numeric', month: 'short' });
}

export function ActivityScreen() {
  const L = useLayout();
  const { events, loading } = useActivityTimeline();
  const route = useSessionStore((s) => s.route);
  const driver = useSessionStore((s) => s.driver);
  const driverCompanyId = useSessionStore((s) => s.driverCompanyId);
  const p = useProgress();

  const groups = useMemo(() => {
    const map = new Map<string, typeof events>();
    for (const e of events) {
      const key = dayLabel(e.occurred_at);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(e);
    }
    return [...map.entries()];
  }, [events]);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, { paddingTop: L.screenTop, paddingBottom: L.listBottom }]}
    >
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Activity</Text>
          <Text style={styles.subtitle}>Operational timeline & progress</Text>
        </View>
        <View style={styles.countChip}>
          <Text style={styles.countText}>{events.length} events</Text>
        </View>
      </View>

      <OfflineCard />

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary[600]} />
          <Text style={styles.loadingText}>Loading timeline…</Text>
        </View>
      ) : events.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIcon}>
            <Ionicons name="pulse-outline" size={26} color={colors.text.tertiary} />
          </View>
          <Text style={styles.emptyTitle}>No activity yet</Text>
          <Text style={styles.emptyBody}>Your operational timeline builds automatically as you work.</Text>
        </View>
      ) : (
        <View style={styles.groups}>
          {groups.map(([day, list]) => (
            <View key={day} style={styles.group}>
              <Text style={styles.dayLabel}>{day}</Text>
              <View style={styles.timelineCard}>
                {list.map((e, i) => (
                  <ActivityItem key={e.id} event={e} isLast={i === list.length - 1} />
                ))}
              </View>
            </View>
          ))}
        </View>
      )}

      {route && (
        <View style={styles.card}>
          <View style={styles.ringSection}>
            <ProgressRing pct={p.pct} />
            <View style={styles.counts}>
              <View style={styles.countRow}>
                <Text style={styles.countLabel}>Completed</Text>
                <Text style={[styles.countValue, styles.countCompleted]}>{p.completed}</Text>
              </View>
              <View style={styles.countRow}>
                <Text style={styles.countLabel}>On route</Text>
                <Text style={[styles.countValue, styles.countInProgress]}>{p.inProgress}</Text>
              </View>
              <View style={styles.countRow}>
                <Text style={styles.countLabel}>Remaining</Text>
                <Text style={[styles.countValue, styles.countRemaining]}>{p.remaining}</Text>
              </View>
              {p.skipped > 0 && (
                <View style={styles.countRow}>
                  <Text style={styles.countLabel}>Skipped</Text>
                  <Text style={[styles.countValue, styles.countSkipped]}>{p.skipped}</Text>
                </View>
              )}
            </View>
          </View>

          <View style={styles.summaryBlock}>
            <SummaryRow icon="scale-outline" label="Waste collected" value={p.wasteKg != null ? `${p.wasteKg} kg` : '—'} />
            <SummaryRow icon="navigate-outline" label="Distance travelled" value={p.traveledKm != null ? `${p.traveledKm} km` : '—'} />
            <SummaryRow icon="time-outline" label="Time on route" value={p.timeOnRouteMin != null ? fmtTime(p.timeOnRouteMin) : '—'} />
            <SummaryRow icon="checkmark-circle-outline" label="Stops on time" value={p.onTime ? `${p.onTime.done} / ${p.onTime.total}` : '—'} />
            <SummaryRow icon="flag-outline" label="Success rate" value={p.successRate != null ? `${Math.round(p.successRate * 100)}%` : '—'} />
          </View>
        </View>
      )}

      <Text style={styles.footer}>
        DRIVER {driver?.employee_id || driver?.id || '—'} · COMPANY #{driverCompanyId ?? '—'}
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.primary[50] },
  content: { paddingHorizontal: spacing.x16, gap: spacing.x12 },
  header: {
    flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between',
    marginBottom: spacing.x4,
  },
  title: { ...typography.titleLarge, color: colors.primary[900] },
  subtitle: { ...typography.bodySmall, color: colors.text.secondary, marginTop: 2 },
  countChip: {
    paddingHorizontal: spacing.x10, paddingVertical: spacing.x4,
    borderRadius: radius.medium, backgroundColor: `${colors.state.success}20`,
  },
  countText: { ...typography.labelSmall, color: colors.state.success },
  card: {
    backgroundColor: colors.surface.container, borderRadius: radius.large,
    padding: spacing.x20, ...elevation[1],
  },
  ringSection: { flexDirection: 'row', alignItems: 'center', gap: spacing.x20 },
  counts: { flex: 1, gap: spacing.x10 },
  countRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  countLabel: { ...typography.bodyMedium, color: colors.text.secondary },
  countValue: { ...typography.titleLarge },
  countCompleted: { color: colors.state.success },
  countInProgress: { color: '#2563eb' },
  countRemaining: { color: colors.state.warning },
  countSkipped: { color: colors.state.danger },
  summaryBlock: { marginTop: spacing.x12, borderTopWidth: 1, borderTopColor: colors.neutral[20] },
  loadingContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: spacing.x48 },
  loadingText: { ...typography.bodyMedium, color: colors.text.tertiary, marginTop: spacing.x12 },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', padding: spacing.x24, paddingTop: spacing.x48 },
  emptyIcon: {
    width: 56, height: 56, borderRadius: 28, backgroundColor: colors.neutral[20],
    alignItems: 'center', justifyContent: 'center', marginBottom: spacing.x12,
  },
  emptyTitle: { ...typography.titleMedium, color: colors.text.primary, marginBottom: spacing.x8 },
  emptyBody: { ...typography.bodyMedium, color: colors.text.secondary, textAlign: 'center' },
  groups: { gap: spacing.x20 },
  group: { gap: spacing.x8 },
  dayLabel: { ...typography.labelSmall, color: colors.text.tertiary },
  timelineCard: {
    backgroundColor: colors.surface.container, borderRadius: radius.large,
    padding: spacing.x16, ...elevation[1],
  },
  footer: {
    ...typography.labelSmall, color: colors.neutral[40],
    textAlign: 'center', paddingTop: spacing.x16,
  },
});