// mobile/app/driver/index.tsx
import { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useAuthStore } from '../../store/authStore';
import { useDriverStore } from '../../store/driverStore';
import { colors } from '../../theme/colors';
import { text } from '../../theme/typography';
import { spacing } from '../../theme/spacing';
import { radius } from '../../theme/radius';
import { shadows } from '../../theme/shadows';

export default function DriverHome() {
  const driver = useAuthStore((s) => s.driver);
  const logout = useAuthStore((s) => s.logout);
  const { route, stops, loading, load, startRoute } = useDriverStore();

  useEffect(() => { load(); }, []);

  const completed = stops.filter((s) => s.status === 'completed').length;
  const remaining = stops.filter((s) => s.status === 'pending').length;

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.header}>
        
          <Text style={[text.eyebrow, { color: colors.textFaint }]}>DRIVER</Text>
          <Text style={styles.name}>{driver?.employee_id ?? '—'}</Text>
        </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.x4 }}>
          <TouchableOpacity onPress={() => router.push('./history')}><Text style={[styles.out, { color: colors.textMuted }]}>History</Text></TouchableOpacity>
          <TouchableOpacity onPress={() => router.push('./profile')}><Text style={[styles.out, { color: colors.textMuted }]}>Profile</Text></TouchableOpacity>
        </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 48 }} color={colors.primary} />
      ) : !route ? (
        <View style={styles.card}>
          <Text style={styles.title}>No assignment today</Text>
          <Text style={styles.sub}>When dispatch assigns you a route, it appears here.</Text>
        </View>
      ) : (
        <View style={styles.card}>
          <Text style={[text.eyebrow, { color: colors.textFaint }]}>TODAY'S ROUTE</Text>
          <Text style={styles.routeId}>{String(route.truck_id ?? '')} · {route.zone_id ?? '—'}</Text>

          <View style={styles.row}>
            <Meta label="STOPS" value={String(stops.length)} />
            <Meta label="COMPLETED" value={String(completed)} accent={colors.success} />
            <Meta label="REMAINING" value={String(remaining)} accent={colors.warning} />
          </View>

          <TouchableOpacity
            style={styles.cta}
            onPress={async () => { if (route.status === 'assigned') await startRoute(); router.push('./route'); }}
          >
            <Text style={styles.ctaLabel}>{route.status === 'assigned' ? 'Start Route' : 'Continue Route'}</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

function Meta({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <View style={styles.meta}>
      <Text style={[text.eyebrow, { color: colors.textFaint }]}>{label}</Text>
      <Text style={[styles.metaValue, accent ? { color: accent } : null]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing.x5, paddingTop: spacing.x4 },
  name: { ...text.headingL, color: colors.textPrimary },
  out: { color: colors.danger, ...text.bodyXs, fontWeight: '800' },
  card: { margin: spacing.x5, backgroundColor: colors.card, borderRadius: radius.cardLg, padding: spacing.x5, ...shadows.card },
  title: { ...text.headingM, color: colors.textPrimary },
  sub: { ...text.bodyXs, color: colors.textMuted, marginTop: spacing.x2 },
  routeId: { ...text.headingM, color: colors.textPrimary, marginTop: spacing.x2, marginBottom: spacing.x4 },
  row: { flexDirection: 'row', gap: spacing.x4, marginBottom: spacing.x5 },
  meta: { flex: 1, backgroundColor: colors.inputBg, borderRadius: radius.input, padding: spacing.x3 },
  metaValue: { ...text.headingM, color: colors.textPrimary, marginTop: 2 },
  cta: { backgroundColor: colors.primary, borderRadius: radius.button, paddingVertical: 15, alignItems: 'center', ...shadows.button },
  ctaLabel: { color: '#fff', ...text.bodySm, fontWeight: '800' },
});