import { useMemo } from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSessionStore } from '../store/session';
import { useConsoleStore } from '../store/ui';
import { StopListItem } from '../components/stops/StopListItem';
import { calculateDistanceInMeters } from '../utils/geo';
import { colors, typography, spacing, radius } from '../theme/design';

export function StopsScreen() {
  const route = useSessionStore((s) => s.route);
  const routeStops = useSessionStore((s) => s.routeStops);
  const currentStop = useSessionStore((s) => s.currentStop);
  const gpsLocation = useSessionStore((s) => s.gpsLocation);
  const { setActiveTab, selectedStopId, setSelectedStopId } = useConsoleStore();

  const sorted = useMemo(() => [...routeStops].sort((a, b) => a.sequence - b.sequence), [routeStops]);
  const completed = sorted.filter((s) => s.status === 'completed').length;
  const skipped = sorted.filter((s) => s.status === 'skipped').length;
  const nextId = sorted.find((s: any) => s.status === 'pending')?.id;

  const handleNavigate = (stop: any) => {
    // Fly to location on map tab
    setActiveTab('map');
    // The MapScreen will handle the actual camera animation when selectedStopId is set
  };

  if (!route) {
    return (
      <View style={styles.emptyContainer}>
        <View style={styles.emptyIcon}>
          <Ionicons name="cube-outline" size={26} color={colors.text.tertiary} />
        </View>
        <Text style={styles.emptyTitle}>No route assigned</Text>
        <Text style={styles.emptyBody}>
          Your assigned stops will appear here once dispatch assigns a route.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Stops</Text>
          <Text style={styles.subtitle}>In route order</Text>
        </View>
        <View style={styles.stats}>
          <View style={[styles.statChip, styles.statCompleted]}>
            <Text style={styles.statTextCompleted}>{completed} done</Text>
          </View>
          <View style={[styles.statChip, styles.statSkipped]}>
            <Text style={styles.statTextSkipped}>{skipped} skipped</Text>
          </View>
          <View style={[styles.statChip, styles.statLeft]}>
            <Text style={styles.statTextLeft}>{sorted.length - completed - skipped} left</Text>
          </View>
        </View>
      </View>

      <FlatList
        data={sorted}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item: stop, index }) => {
          const prev = index > 0 ? sorted[index - 1] : null;
          const legDistanceM =
            prev?.latitude != null && prev?.longitude != null && stop.latitude != null && stop.longitude != null
              ? calculateDistanceInMeters(prev.latitude, prev.longitude, stop.latitude, stop.longitude)
              : null;
          const liveDistanceM =
            gpsLocation && stop.latitude != null && stop.longitude != null
              ? calculateDistanceInMeters(gpsLocation.latitude, gpsLocation.longitude, stop.latitude, stop.longitude)
              : null;

          return (
            <StopListItem
              stop={stop}
              isNext={stop.id === nextId}
              liveDistanceM={liveDistanceM}
              legDistanceM={legDistanceM}
              selected={selectedStopId === stop.id}
              onSelect={() => setSelectedStopId(selectedStopId === stop.id ? null : String(stop.id))}
              onNavigate={() => handleNavigate(stop)}
            />
          );
        }}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.primary[50],
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.x24,
    backgroundColor: colors.primary[50],
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
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.x16,
    paddingTop: 110,
    paddingBottom: spacing.x12,
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
  stats: {
    flexDirection: 'row',
    gap: spacing.x6,
  },
  statChip: {
    paddingHorizontal: spacing.x10,
    paddingVertical: spacing.x4,
    borderRadius: radius.medium,
  },
  statCompleted: {
    backgroundColor: `${colors.state.success}20`,
  },
  statTextCompleted: {
    ...typography.labelSmall,
    color: colors.state.success,
  },
  statSkipped: {
    backgroundColor: `${colors.state.warning}20`,
  },
  statTextSkipped: {
    ...typography.labelSmall,
    color: colors.state.warning,
  },
  statLeft: {
    backgroundColor: colors.neutral[20],
  },
  statTextLeft: {
    ...typography.labelSmall,
    color: colors.text.primary,
  },
  list: {
    paddingHorizontal: spacing.x16,
    paddingBottom: 100,
  },
});