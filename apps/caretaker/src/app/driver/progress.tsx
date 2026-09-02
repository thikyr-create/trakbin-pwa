import { useEffect, useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Screen } from '../../components/ui/Screen';
import { useDriverStore } from '../../store/driverStore';
import { colors } from '../../theme/colors';
import { gutter, radius, sp } from '../../theme/spacing';
import { text } from '../../theme/typography';

export default function ProgressScreen() {
  const { route, stops, load } = useDriverStore();
  useEffect(() => { load(); }, []);

  const completed = stops.filter((s) => s.status === 'completed').length;
  const skipped = stops.filter((s) => s.status === 'skipped').length;
  const pending = stops.filter((s) => s.status === 'pending').length;
  const total = stops.length;
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <Screen scroll>
      <Text style={styles.title}>Route progress</Text>

      <View style={styles.card}>
        <Text style={styles.cardLabel}>Completion</Text>
        <View style={styles.progressRow}>
          <Text style={styles.pct}>{pct}%</Text>
          <Text style={styles.frac}>{completed} / {total}</Text>
        </View>
        <View style={styles.bar}>
          <View style={[styles.barFill, { width: `${pct}%` }]} />
        </View>
      </View>

      <View style={styles.grid}>
        <Stat label="Completed" value={String(completed)} color={colors.state.success} />
        <Stat label="Pending" value={String(pending)} color={colors.state.warning} />
        <Stat label="Skipped" value={String(skipped)} color={colors.state.info} />
        <Stat label="Total" value={String(total)} />
      </View>

      <View style={styles.card}>
        <Text style={styles.cardLabel}>Route status</Text>
        <Text style={styles.statusValue}>{String(route?.status ?? '—').toUpperCase()}</Text>
      </View>
    </Screen>
  );
}

function Stat({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <View style={styles.stat}>
      <Text style={[styles.statValue, color && { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  title: { ...text.titleL, color: colors.text.primary, marginBottom: sp.x5 },
  card: {
    backgroundColor: colors.surface, borderRadius: radius.xl, padding: sp.x5,
    marginBottom: sp.x4, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 10, elevation: 2,
  },
  cardLabel: { ...text.label, color: colors.text.muted, marginBottom: sp.x2 },
  progressRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: sp.x3 },
  pct: { ...text.display, color: colors.brand[600] },
  frac: { ...text.titleS, color: colors.text.secondary },
  bar: { height: 8, backgroundColor: colors.surfaceMuted, borderRadius: 4 },
  barFill: { height: 8, backgroundColor: colors.brand[600], borderRadius: 4 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: sp.x3, marginBottom: sp.x4 },
  stat: {
    width: '48%', backgroundColor: colors.surface, borderRadius: radius.xl,
    padding: sp.x4, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 10, elevation: 2,
  },
  statValue: { ...text.titleL, color: colors.text.primary },
  statLabel: { ...text.label, color: colors.text.muted, marginTop: sp.x1 },
  statusValue: { ...text.titleM, color: colors.text.primary },
});