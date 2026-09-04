import { useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useActivityTimeline } from '../hooks/useActivityTimeline';
import { ActivityItem } from '../components/activity/ActivityItem';
import { colors, typography, spacing, radius, elevation } from '../theme/design';

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
  const { events, loading } = useActivityTimeline();

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
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Activity</Text>
          <Text style={styles.subtitle}>Operational timeline</Text>
        </View>
        <View style={styles.countChip}>
          <Text style={styles.countText}>{events.length} events</Text>
        </View>
      </View>

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
          <Text style={styles.emptyBody}>
            Your operational timeline builds automatically as you work.
          </Text>
        </View>
      ) : (
        <View style={styles.groups}>
          {groups.map(([day, list]) => (
            <View key={day} style={styles.group}>
              <Text style={styles.dayLabel}>{day}</Text>
              <View style={styles.card}>
                {list.map((e, i) => (
                  <ActivityItem key={e.id} event={e} isLast={i === list.length - 1} />
                ))}
              </View>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.primary[50],
  },
  content: {
    paddingTop: 110,
    paddingHorizontal: spacing.x16,
    paddingBottom: 100,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: spacing.x16,
  },
  title: {
    ...typography.titleLarge,
    color: colors.primary[900],
  },
  subtitle: {
    ...typography.bodySmall,
    color: colors.text.secondary,
    marginTop: 2,
  },
  countChip: {
    paddingHorizontal: spacing.x10,
    paddingVertical: spacing.x4,
    borderRadius: radius.medium,
    backgroundColor: `${colors.state.success}20`,
  },
  countText: {
    ...typography.labelSmall,
    color: colors.state.success,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.x48,
  },
  loadingText: {
    ...typography.bodyMedium,
    color: colors.text.tertiary,
    marginTop: spacing.x12,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.x24,
    paddingTop: spacing.x48,
  },
  emptyIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.neutral[20],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.x12,
  },
  emptyTitle: {
    ...typography.titleMedium,
    color: colors.text.primary,
    marginBottom: spacing.x8,
  },
  emptyBody: {
    ...typography.bodyMedium,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  groups: {
    gap: spacing.x20,
  },
  group: {
    gap: spacing.x8,
  },
  dayLabel: {
    ...typography.labelSmall,
    color: colors.text.tertiary,
  },
  card: {
    backgroundColor: colors.surface.container,
    borderRadius: radius.large,
    padding: spacing.x16,
    ...elevation[1],
  },
});