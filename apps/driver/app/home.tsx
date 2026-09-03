import { useEffect } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, ActivityIndicator, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useSessionStore } from '../src/store/session';
import { signOut } from '../src/services/auth';
import { colors, typography, spacing, elevation, radius } from '../src/theme/design';
import { useState } from 'react';

export default function Home() {
  const router = useRouter();
  const { driver, route, routeStops, currentStop, isLoading, initializeSession } = useSessionStore();
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    initializeSession();
  }, []);

  const handleSignOut = async () => {
    await signOut();
    router.replace('/login');
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await initializeSession();
    setRefreshing(false);
  };

  if (isLoading && !refreshing) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary[600]} />
        <Text style={styles.loadingText}>Loading your route...</Text>
      </View>
    );
  }

  if (!route) {
    return (
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.center}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
      >
        <BlurView intensity={60} tint="light" style={styles.emptyCard}>
          <Ionicons name="leaf-outline" size={64} color={colors.primary[400]} style={styles.emptyIcon} />
          <Text style={styles.emptyTitle}>No Active Route</Text>
          <Text style={styles.emptyBody}>
            You have no assignments right now.{'\n'}Check back later or refresh.
          </Text>
          <Pressable style={styles.signOutButton} onPress={handleSignOut}>
            <Text style={styles.signOutText}>Sign Out</Text>
          </Pressable>
        </BlurView>
      </ScrollView>
    );
  }

  const completedCount = routeStops.filter((s: any) => s.status === 'completed').length;
  const totalCount = routeStops.length;
  const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
    >
      <BlurView intensity={80} tint="light" style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.avatar}>
            <Ionicons name="person" size={32} color={colors.primary[700]} />
          </View>
          <View style={styles.headerText}>
            <Text style={styles.greeting}>Hello, {driver?.full_name || driver?.employee_id}</Text>
            <Text style={styles.company}>{driver?.company_name || 'Waste Collection'}</Text>
          </View>
          <Pressable onPress={handleSignOut} style={styles.signOutButton}>
            <Ionicons name="log-out-outline" size={24} color={colors.text.secondary} />
          </Pressable>
        </View>
      </BlurView>

      <BlurView intensity={70} tint="light" style={styles.card}>
        <Text style={styles.cardTitle}>Route Progress</Text>
        <View style={styles.progressBarContainer}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${progress}%` }]} />
          </View>
          <Text style={styles.progressText}>
            {completedCount} of {totalCount} stops
          </Text>
        </View>
      </BlurView>

      {currentStop && (
        <BlurView intensity={70} tint="light" style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="location" size={24} color={colors.primary[600]} />
            <Text style={styles.cardTitle}>Next Stop</Text>
          </View>
          <Text style={styles.stopAddress}>{currentStop.address || currentStop.building_id}</Text>
          <Text style={styles.stopEstate}>{currentStop.estate || 'No estate'}</Text>
          <View style={styles.stopBadge}>
            <Text style={styles.stopBadgeText}>Stop {currentStop.sequence} of {totalCount}</Text>
          </View>
        </BlurView>
      )}

      <BlurView intensity={70} tint="light" style={styles.card}>
        <View style={styles.cardHeader}>
          <Ionicons name="list" size={24} color={colors.primary[600]} />
          <Text style={styles.cardTitle}>All Stops</Text>
        </View>
        {routeStops.map((stop: any, index: number) => (
          <View key={stop.id} style={styles.stopRow}>
            <View style={[
              styles.stopDot,
              stop.status === 'completed' && styles.stopDotCompleted,
              stop.id === currentStop?.id && styles.stopDotActive,
            ]}>
              {stop.status === 'completed' && (
                <Ionicons name="checkmark" size={12} color={colors.text.inverse} />
              )}
            </View>
            <View style={styles.stopInfo}>
              <Text style={[
                styles.stopName,
                stop.status === 'completed' && styles.stopNameCompleted,
                stop.id === currentStop?.id && styles.stopNameActive,
              ]}>
                {stop.address || stop.building_id}
              </Text>
              {stop.estate && (
                <Text style={styles.stopEstateSmall}>{stop.estate}</Text>
              )}
            </View>
            {stop.id === currentStop?.id && (
              <Ionicons name="arrow-forward-circle" size={24} color={colors.primary[600]} />
            )}
          </View>
        ))}
      </BlurView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.primary[50],
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.x40,
    backgroundColor: colors.primary[50],
  },
  loadingText: {
    ...typography.bodyMedium,
    color: colors.text.secondary,
    marginTop: spacing.x16,
  },
  header: {
    paddingTop: spacing.x48,
    paddingBottom: spacing.x24,
    paddingHorizontal: spacing.x20,
    backgroundColor: colors.surface.containerHigh,
    borderBottomLeftRadius: radius.large,
    borderBottomRightRadius: radius.large,
    ...elevation[2],
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: radius.full,
    backgroundColor: colors.primary[100],
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.x16,
  },
  headerText: {
    flex: 1,
  },
  greeting: {
    ...typography.titleLarge,
    color: colors.primary[900],
  },
  company: {
    ...typography.bodyMedium,
    color: colors.text.secondary,
    marginTop: spacing.x2,
  },
  signOutButton: {
    padding: spacing.x12,
  },
  card: {
    backgroundColor: colors.surface.container,
    borderRadius: radius.large,
    padding: spacing.x20,
    margin: spacing.x16,
    marginTop: spacing.x12,
    ...elevation[2],
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.x16,
  },
  cardTitle: {
    ...typography.titleMedium,
    color: colors.primary[900],
    marginLeft: spacing.x8,
  },
  progressBarContainer: {
    marginTop: spacing.x8,
  },
  progressBar: {
    height: 12,
    backgroundColor: colors.neutral[30],
    borderRadius: radius.full,
    overflow: 'hidden',
    marginBottom: spacing.x8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary[600],
    borderRadius: radius.full,
  },
  progressText: {
    ...typography.bodySmall,
    color: colors.text.secondary,
    textAlign: 'right',
  },
  stopAddress: {
    ...typography.titleMedium,
    color: colors.primary[900],
    marginBottom: spacing.x4,
  },
  stopEstate: {
    ...typography.bodyMedium,
    color: colors.text.secondary,
    marginBottom: spacing.x12,
  },
  stopBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.primary[100],
    paddingHorizontal: spacing.x12,
    paddingVertical: spacing.x4,
    borderRadius: radius.full,
  },
  stopBadgeText: {
    ...typography.labelSmall,
    color: colors.primary[700],
  },
  stopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: spacing.x12,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[20],
  },
  stopDot: {
    width: 24,
    height: 24,
    borderRadius: radius.full,
    backgroundColor: colors.neutral[30],
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.x12,
  },
  stopDotCompleted: {
    backgroundColor: colors.primary[600],
  },
  stopDotActive: {
    backgroundColor: colors.primary[400],
    borderWidth: 3,
    borderColor: colors.primary[200],
  },
  stopInfo: {
    flex: 1,
  },
  stopName: {
    ...typography.bodyMedium,
    color: colors.text.primary,
    marginBottom: spacing.x2,
  },
  stopNameCompleted: {
    color: colors.text.disabled,
    textDecorationLine: 'line-through',
  },
  stopNameActive: {
    ...typography.titleSmall,
    color: colors.primary[900],
  },
  stopEstateSmall: {
    ...typography.bodySmall,
    color: colors.text.tertiary,
  },
  emptyCard: {
    backgroundColor: colors.surface.container,
    borderRadius: radius.large,
    padding: spacing.x40,
    alignItems: 'center',
    ...elevation[2],
    overflow: 'hidden',
  },
  emptyIcon: {
    marginBottom: spacing.x24,
  },
  emptyTitle: {
    ...typography.headlineSmall,
    color: colors.primary[900],
    textAlign: 'center',
    marginBottom: spacing.x12,
  },
  emptyBody: {
    ...typography.bodyMedium,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: spacing.x32,
  },
  signOutButtonEmpty: {
    backgroundColor: colors.neutral[20],
    paddingHorizontal: spacing.x24,
    paddingVertical: spacing.x12,
    borderRadius: radius.full,
  },
  signOutText: {
    ...typography.labelLarge,
    color: colors.text.primary,
  },
});