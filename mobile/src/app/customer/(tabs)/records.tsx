import { useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Truck, ArrowRight } from 'lucide-react-native';
import { TabScreen } from '../../../components/layout/TabScreen';
import { StatusPill } from '../../../components/ui/StatusPill';
import { Rise } from '../../../components/ui/motion';
import { useCaretakerStore } from '../../../store/caretakerStore';
import { dayLabel, dateTime, nextPickupISO } from '../../../services/format';
import { colors } from '../../../theme/colors';
import { radius, sp } from '../../../theme/spacing';
import { text } from '../../../theme/typography';

export default function RecordsScreen() {
  const router = useRouter();
  const collections = useCaretakerStore((s) => s.collections);
  const assignment = useCaretakerStore((s) => s.assignment);
  const schedules = useCaretakerStore((s) => s.schedules);
  const load = useCaretakerStore((s) => s.load);

  useEffect(() => { load(); }, []);

  const now = new Date();

  const sorted = useMemo(
    () => [...collections].sort((a, b) => String(b.collection_date).localeCompare(String(a.collection_date))),
    [collections]
  );

  const preview = sorted.slice(0, 5);

  const thisMonth = useMemo(
    () => collections.filter((c) => {
      if (!c.collection_date) return false;
      const d = new Date(c.collection_date);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }).length,
    [collections]
  );

  const months = useMemo(() => {
    const list: { label: string; count: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const count = collections.filter((c) => {
        if (!c.collection_date) return false;
        const cd = new Date(c.collection_date);
        return cd.getMonth() === d.getMonth() && cd.getFullYear() === d.getFullYear();
      }).length;
      list.push({ label: d.toLocaleDateString('en-US', { month: 'narrow' }), count });
    }
    return list;
  }, [collections]);

  const maxCount = Math.max(1, ...months.map((m) => m.count));
  const nextDate = nextPickupISO(assignment, schedules);
  const empty = sorted.length === 0;

  return (
    <TabScreen>
      <Rise delay={0}>
        <View style={styles.pulseCard}>
          <View style={styles.pulseTop}>
            <View>
              <Text style={styles.pulseLabel}>This month</Text>
              <View style={styles.pulseValueRow}>
                <Text style={styles.pulseValue}>{thisMonth}</Text>
                <Text style={styles.pulseUnit}>pickup{thisMonth === 1 ? '' : 's'}</Text>
              </View>
            </View>
            <View style={styles.pulseRight}>
              <Text style={styles.pulseLabel}>All time</Text>
              <Text style={styles.pulseAll}>{collections.length}</Text>
            </View>
          </View>

          <View style={styles.chart}>
            {months.map((m, i) => (
              <View key={i} style={styles.chartCol}>
                <View style={styles.barTrack}>
                  <View
                    style={[
                      styles.bar,
                      { height: Math.max(4, (m.count / maxCount) * 56) },
                      m.count === 0 && styles.barEmpty,
                      i === months.length - 1 && m.count > 0 && styles.barCurrent,
                    ]}
                  />
                </View>
                <Text style={[styles.chartLabel, i === months.length - 1 && styles.chartLabelCurrent]}>
                  {m.label}
                </Text>
              </View>
            ))}
          </View>
        </View>
      </Rise>

      <Rise delay={90}>
        <View style={styles.ledgerHeader}>
          <Text style={styles.ledgerTitle}>Collection history</Text>
          <Text style={styles.ledgerCount}>{sorted.length} record{sorted.length === 1 ? '' : 's'}</Text>
        </View>

        {empty ? (
          <View style={styles.emptyCard}>
            <View style={styles.emptyIcon}><Truck size={26} color={colors.brand[400]} /></View>
            <Text style={styles.emptyTitle}>No collections yet</Text>
            <View style={styles.awaitPill}>
              <View style={styles.awaitDot} />
              <Text style={styles.awaitText}>Awaiting first pickup</Text>
            </View>
            <Text style={styles.emptyBody}>
              {nextDate
                ? `Your first pickup is ${dayLabel(nextDate).toLowerCase()}. Each completed collection will be logged here automatically.`
                : 'Each completed collection will be logged here automatically once your provider begins service.'}
            </Text>
          </View>
        ) : (
          <View style={styles.ledgerCard}>
            <View style={styles.colHeader}>
              <Text style={styles.colHeaderText}>Date</Text>
              <Text style={[styles.colHeaderText, styles.colHeaderMid]}>Details</Text>
              <Text style={styles.colHeaderText}>Status</Text>
            </View>

            {preview.map((c, idx) => {
              const d = c.collection_date ? new Date(c.collection_date) : null;
              const valid = !!d && !isNaN(d.getTime());
              return (
                <View key={c.id} style={[styles.row, idx < preview.length - 1 && styles.rowBorder]}>
                  <View style={styles.dateBlock}>
                    <Text style={styles.dateDay}>{d && valid ? d.getDate() : '—'}</Text>
                    <Text style={styles.dateMonth}>{d && valid ? d.toLocaleDateString('en-US', { month: 'short' }) : ''}</Text>
                  </View>
                  <View style={styles.rowMain}>
                    <Text style={styles.rowTitle} numberOfLines={1}>{c.hauler_name ?? 'Trakbin Operations'}</Text>
                    <Text style={styles.rowSub} numberOfLines={1}>
                      {d && valid ? dateTime(c.collection_date) : '—'} · #{String(idx + 1).padStart(3, '0')}
                    </Text>
                  </View>
                  <StatusPill value={c.status ?? 'completed'} />
                </View>
              );
            })}
          </View>
        )}

        {/* Always visible — leads to the full ledger (empty or full) */}
        <Pressable
          style={styles.viewAll}
          onPress={() => router.push('/customer/history')}
          accessibilityRole="button"
          accessibilityLabel="View complete history"
        >
          <Text style={styles.viewAllLabel}>View complete history</Text>
          <ArrowRight size={16} color={colors.brand[400]} />
        </Pressable>
      </Rise>
    </TabScreen>
  );
}

const styles = StyleSheet.create({
  pulseCard: { backgroundColor: colors.card.navy, borderRadius: radius.xxl, padding: sp.x5, shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 16, shadowOffset: { width: 0, height: 6 }, elevation: 5 },
  pulseTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  pulseLabel: { ...text.label, fontSize: 10, color: colors.brand[200] },
  pulseValueRow: { flexDirection: 'row', alignItems: 'baseline', gap: sp.x2, marginTop: sp.x1 },
  pulseValue: { ...text.display, color: colors.text.primary },
  pulseUnit: { ...text.bodyM, color: colors.brand[200] },
  pulseRight: { alignItems: 'flex-end' },
  pulseAll: { ...text.titleM, color: colors.text.primary, marginTop: sp.x1 },
  chart: { flexDirection: 'row', justifyContent: 'space-between', marginTop: sp.x5, paddingTop: sp.x4, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.1)' },
  chartCol: { alignItems: 'center', gap: sp.x1 },
  barTrack: { height: 56, justifyContent: 'flex-end', alignItems: 'center', width: 18 },
  bar: { width: 10, borderRadius: 5, backgroundColor: colors.brand[400] },
  barEmpty: { backgroundColor: 'rgba(255,255,255,0.12)' },
  barCurrent: { backgroundColor: colors.brand[300] },
  chartLabel: { ...text.label, fontSize: 9, color: colors.text.muted },
  chartLabelCurrent: { color: colors.brand[300] },
  ledgerHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: sp.x6, marginBottom: sp.x3 },
  ledgerTitle: { ...text.headingM, color: colors.text.primary },
  ledgerCount: { ...text.label, fontSize: 10, color: colors.text.muted },
  emptyCard: { backgroundColor: colors.surface, borderRadius: radius.xxl, padding: sp.x7, alignItems: 'center', borderWidth: 1, borderColor: colors.border.subtle },
  emptyIcon: { width: 64, height: 64, borderRadius: 32, backgroundColor: colors.state.successSoft, alignItems: 'center', justifyContent: 'center', marginBottom: sp.x4 },
  emptyTitle: { ...text.titleM, color: colors.text.primary },
  awaitPill: { flexDirection: 'row', alignItems: 'center', gap: sp.x2, backgroundColor: colors.state.successSoft, borderRadius: radius.full, paddingHorizontal: sp.x4, paddingVertical: sp.x2, marginTop: sp.x3 },
  awaitDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.state.success },
  awaitText: { ...text.label, fontSize: 10, color: colors.state.success },
  emptyBody: { ...text.bodyM, color: colors.text.muted, textAlign: 'center', marginTop: sp.x4 },
  ledgerCard: { backgroundColor: colors.surface, borderRadius: radius.xxl, paddingHorizontal: sp.x5, paddingVertical: sp.x3, borderWidth: 1, borderColor: colors.border.subtle },
  colHeader: { flexDirection: 'row', alignItems: 'center', paddingVertical: sp.x3, borderBottomWidth: 1, borderBottomColor: colors.border.subtle },
  colHeaderText: { ...text.label, fontSize: 9, color: colors.text.muted, width: 56 },
  colHeaderMid: { flex: 1, width: undefined },
  row: { flexDirection: 'row', alignItems: 'center', gap: sp.x3, paddingVertical: sp.x4 },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: colors.border.subtle },
  dateBlock: { width: 48, height: 52, borderRadius: radius.md, backgroundColor: colors.surfaceMuted, alignItems: 'center', justifyContent: 'center' },
  dateDay: { ...text.titleS, color: colors.text.primary },
  dateMonth: { ...text.label, fontSize: 9, color: colors.brand[400], marginTop: 1 },
  rowMain: { flex: 1 },
  rowTitle: { ...text.semibold, color: colors.text.primary },
  rowSub: { ...text.bodyS, color: colors.text.muted, marginTop: 2 },
  viewAll: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: sp.x2, backgroundColor: colors.surface, borderRadius: radius.xl, paddingVertical: sp.x4, marginTop: sp.x3, marginBottom: sp.x6, borderWidth: 1, borderColor: colors.border.subtle },
  viewAllLabel: { ...text.semibold, fontSize: 14, color: colors.brand[400] },
});