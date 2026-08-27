import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { Truck } from 'lucide-react-native';
import { Screen } from '../../components/ui/Screen';
import { Header } from '../../components/ui/Header';
import { StatusPill } from '../../components/ui/StatusPill';
import { Rise } from '../../components/ui/motion';
import { supabase } from '../../services/supabase';
import { useCaretakerStore } from '../../store/caretakerStore';
import { dateTime, dayLabel, nextPickupISO } from '../../services/format';
import { colors } from '../../theme/colors';
import { radius, sp } from '../../theme/spacing';
import { text } from '../../theme/typography';

export default function HistoryScreen() {
  const building = useCaretakerStore((s) => s.building);
  const assignment = useCaretakerStore((s) => s.assignment);
  const schedules = useCaretakerStore((s) => s.schedules);
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      if (!building?.custom_id) { setLoading(false); return; }
      const { data } = await supabase
        .from('collections')
        .select('*')
        .eq('building_id', building.custom_id)
        .order('collection_date', { ascending: false });
      setRows((data as any[]) ?? []);
      setLoading(false);
    })();
  }, [building?.custom_id]);

  const completed = rows.filter((r) => r.status === 'completed').length;
  const missed = rows.filter((r) => r.status === 'missed').length;
  const nextDate = nextPickupISO(assignment, schedules);

  return (
    <Screen scroll>
      <Header title="Complete history" subtitle="Every collection on record" />

      <Rise delay={0}>
        <View style={styles.summaryRow}>
          <View style={styles.summaryChip}>
            <Text style={styles.summaryValue}>{rows.length}</Text>
            <Text style={styles.summaryLabel}>Total</Text>
          </View>
          <View style={styles.summaryChip}>
            <Text style={[styles.summaryValue, { color: colors.brand[400] }]}>{completed}</Text>
            <Text style={styles.summaryLabel}>Completed</Text>
          </View>
          <View style={styles.summaryChip}>
            <Text style={[styles.summaryValue, { color: colors.state.danger }]}>{missed}</Text>
            <Text style={styles.summaryLabel}>Missed</Text>
          </View>
        </View>
      </Rise>

      {loading ? (
        <ActivityIndicator size="large" color={colors.brand[500]} style={styles.loader} />
      ) : rows.length === 0 ? (
        <Rise delay={90}>
          <View style={styles.emptyCard}>
            <View style={styles.emptyIcon}><Truck size={26} color={colors.brand[400]} /></View>
            <Text style={styles.emptyTitle}>No collections yet</Text>
            <View style={styles.awaitPill}>
              <View style={styles.awaitDot} />
              <Text style={styles.awaitText}>Awaiting first pickup</Text>
            </View>
            <Text style={styles.emptyBody}>
              {nextDate
                ? `Your first pickup is ${dayLabel(nextDate).toLowerCase()}. Every future collection will appear here automatically.`
                : 'Every future collection will appear here automatically once your provider begins service.'}
            </Text>
          </View>
        </Rise>
      ) : (
        <Rise delay={90}>
          <View style={styles.ledgerCard}>
            <View style={styles.colHeader}>
              <Text style={styles.colHeaderText}>Date</Text>
              <Text style={[styles.colHeaderText, styles.colHeaderMid]}>Details</Text>
              <Text style={styles.colHeaderText}>Status</Text>
            </View>

            {rows.map((c, idx) => {
              const d = c.collection_date ? new Date(c.collection_date) : null;
              const valid = !!d && !isNaN(d.getTime());
              return (
                <View key={c.id} style={[styles.row, idx < rows.length - 1 && styles.rowBorder]}>
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
        </Rise>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  loader: { marginTop: sp.x8 },
  summaryRow: { flexDirection: 'row', gap: sp.x3, marginBottom: sp.x5 },
  summaryChip: { flex: 1, backgroundColor: colors.surface, borderRadius: radius.xl, padding: sp.x4, alignItems: 'center', borderWidth: 1, borderColor: colors.border.subtle },
  summaryValue: { ...text.titleM, color: colors.text.primary },
  summaryLabel: { ...text.label, fontSize: 9, color: colors.text.muted, marginTop: 2 },
  emptyCard: { backgroundColor: colors.surface, borderRadius: radius.xxl, padding: sp.x7, alignItems: 'center', borderWidth: 1, borderColor: colors.border.subtle, marginBottom: sp.x6 },
  emptyIcon: { width: 64, height: 64, borderRadius: 32, backgroundColor: colors.state.successSoft, alignItems: 'center', justifyContent: 'center', marginBottom: sp.x4 },
  emptyTitle: { ...text.titleM, color: colors.text.primary },
  awaitPill: { flexDirection: 'row', alignItems: 'center', gap: sp.x2, backgroundColor: colors.state.successSoft, borderRadius: radius.full, paddingHorizontal: sp.x4, paddingVertical: sp.x2, marginTop: sp.x3 },
  awaitDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.state.success },
  awaitText: { ...text.label, fontSize: 10, color: colors.state.success },
  emptyBody: { ...text.bodyM, color: colors.text.muted, textAlign: 'center', marginTop: sp.x4 },
  ledgerCard: { backgroundColor: colors.surface, borderRadius: radius.xxl, paddingHorizontal: sp.x5, paddingVertical: sp.x3, borderWidth: 1, borderColor: colors.border.subtle, marginBottom: sp.x6 },
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
});