import { View, Text, StyleSheet } from 'react-native';
import { colors, typography, spacing } from '../../theme/design';
import type { ActivityEvent } from '../../hooks/useActivityTimeline';

interface Meta {
  label: string;
  color: string;
}

function eventMeta(e: ActivityEvent): Meta {
  switch (e.event_type) {
    case 'DRIVER_ROUTE_STARTED': return { label: 'Route started', color: colors.state.success };
    case 'DRIVER_ROUTE_COMPLETED': return { label: 'Route completed', color: colors.primary[700] };
    case 'DRIVER_ROUTE_PAUSED': return { label: 'Route paused', color: colors.state.warning };
    case 'DRIVER_ROUTE_RESUMED': return { label: 'Route resumed', color: colors.state.success };
    case 'DRIVER_STOP_APPROACHED': return { label: `Approaching ${e.building_id ?? 'stop'}`, color: '#2563eb' };
    case 'DRIVER_STOP_ARRIVED': return { label: `Arrived at ${e.building_id ?? 'stop'}`, color: '#2563eb' };
    case 'DRIVER_PICKUP_CONFIRMED': return { label: `Pickup confirmed · ${e.building_id ?? ''}`, color: colors.state.success };
    case 'DRIVER_PICKUP_SKIPPED': return { label: `Cannot collect · ${e.building_id ?? ''}`, color: colors.state.danger };
    case 'DRIVER_PICKUP_FAILED': return { label: `Pickup failed · ${e.building_id ?? ''}`, color: colors.state.danger };
    case 'DRIVER_EVIDENCE_ATTACHED': return { label: 'Evidence submitted', color: '#2563eb' };
    case 'DRIVER_DEVIATED': return { label: 'Deviated from route', color: colors.state.danger };
    case 'DRIVER_REJOINED_ROUTE': return { label: 'Rejoined route', color: colors.state.success };
    case 'DRIVER_FEEDBACK_SUBMITTED': return { label: 'Note / issue reported', color: '#9333ea' };
    case 'DRIVER_LOCATION_CORRECTED': return { label: 'Location corrected', color: '#2563eb' };
    default: return { label: e.event_type.replace(/DRIVER_|_/g, ' ').toLowerCase(), color: colors.neutral[40] };
  }
}

function subLabel(e: ActivityEvent): string | null {
  const m = e.metadata || {};
  if (m.reason) return m.reason;
  if (m.distanceM != null) return `${m.distanceM} m from pin`;
  if (m.category) return m.category;
  if (m.count != null) return `${m.count} file(s)`;
  return null;
}

export function ActivityItem({ event, isLast }: { event: ActivityEvent; isLast: boolean }) {
  const meta = eventMeta(event);
  const sub = subLabel(event);

  return (
    <View style={styles.container}>
      <View style={styles.timeline}>
        <View style={[styles.dot, { backgroundColor: meta.color }]} />
        {!isLast && <View style={styles.line} />}
      </View>
      <View style={[styles.content, !isLast && styles.contentSpacing]}>
        <View style={styles.header}>
          <Text style={styles.label} numberOfLines={1}>{meta.label}</Text>
          <Text style={styles.time}>
            {new Date(event.occurred_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>
        {sub && <Text style={styles.sub} numberOfLines={1}>{sub}</Text>}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: spacing.x12,
  },
  timeline: {
    alignItems: 'center',
    width: 16,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginTop: 4,
  },
  line: {
    width: 1,
    flex: 1,
    backgroundColor: colors.neutral[20],
    marginTop: spacing.x8,
  },
  content: {
    flex: 1,
  },
  contentSpacing: {
    paddingBottom: spacing.x16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: spacing.x8,
  },
  label: {
    ...typography.bodyMedium,
    color: colors.text.primary,
    flex: 1,
  },
  time: {
    ...typography.labelSmall,
    color: colors.text.tertiary,
    fontSize: 10,
  },
  sub: {
    ...typography.bodySmall,
    color: colors.text.secondary,
    marginTop: 2,
  },
});