import { View, Text, StyleSheet } from 'react-native';
import { Truck } from 'lucide-react-native';
import { StatusPill } from '../ui/StatusPill';
import { dayLabel } from '../../services/format';
import type { CollectionSchedule } from '../../types/caretaker';
import { colors } from '../../theme/colors';
import { radius, sp } from '../../theme/spacing';
import { text } from '../../theme/typography';

export function NextCollectionCard({ schedule }: { schedule: CollectionSchedule | null }) {
  return (
    <View style={styles.card}>
      <View style={styles.top}>
        <Text style={styles.label}>Your next collection</Text>
        <StatusPill value={schedule?.status ?? 'scheduled'} />
      </View>
      {schedule ? (
        <>
          <Text style={styles.day}>{dayLabel(schedule.next_pickup_date)}</Text>
          <Text style={styles.window}>{schedule.time_window ?? '—'}</Text>
          <View style={styles.meta}>
            <Truck size={14} color={colors.text.muted} />
            <Text style={styles.metaText}>{schedule.frequency ?? '—'} · {schedule.waste_type ?? 'Mixed waste'}</Text>
          </View>
        </>
      ) : (
        <Text style={styles.none}>No upcoming pickup scheduled.</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: sp.x5,
    borderWidth: 1,
    borderColor: colors.brand[100],
    shadowColor: colors.brand[900],
    shadowOpacity: 0.06,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: sp.x3 },
  label: { ...text.label, color: colors.text.muted },
  day: { ...text.display, color: colors.text.primary },
  window: { ...text.titleS, color: colors.brand[700], marginTop: sp.x1 },
  meta: { flexDirection: 'row', alignItems: 'center', gap: sp.x2, marginTop: sp.x3 },
  metaText: { ...text.bodyS, color: colors.text.muted },
  none: { ...text.bodyM, color: colors.text.muted },
});