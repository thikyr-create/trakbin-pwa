import { Text, View, StyleSheet } from 'react-native';
import { Building2 } from 'lucide-react-native';
import { StatusPill } from '../ui/StatusPill';
import type { Building } from '../../types/caretaker';
import { colors } from '../../theme/colors';
import { radius, sp } from '../../theme/spacing';
import { text } from '../../theme/typography';

export function BuildingCard({ building }: { building: Building | null }) {
  if (!building) return null;
  return (
    <View style={styles.card}>
      <View style={styles.top}>
        <View style={styles.iconWrap}>
          <Building2 size={18} color={colors.brand[700]} />
        </View>
        <View style={styles.titles}>
          <Text style={styles.id}>{building.custom_id ?? '—'}</Text>
          <Text style={styles.addr} numberOfLines={1}>
            {building.address ?? '—'}{building.estate ? ` · ${building.estate}` : ''}
          </Text>
        </View>
        <StatusPill value={building.status ?? 'active'} />
      </View>
      <View style={styles.row}>
        <Text style={styles.meta}>{building.unit_type ?? building.building_type ?? '—'}</Text>
        <Text style={styles.metaDot}>·</Text>
        <Text style={styles.meta}>{building.number_of_units ?? 1} unit{(building.number_of_units ?? 1) > 1 ? 's' : ''}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: sp.x4,
    borderWidth: 1,
    borderColor: colors.border.subtle,
  },
  top: { flexDirection: 'row', alignItems: 'center', gap: sp.x3 },
  iconWrap: {
    width: 40, height: 40, borderRadius: radius.md,
    backgroundColor: colors.brand[50],
    alignItems: 'center', justifyContent: 'center',
  },
  titles: { flex: 1 },
  id: { ...text.monoBold, color: colors.text.primary },
  addr: { ...text.bodyS, color: colors.text.muted, marginTop: 2 },
  row: { flexDirection: 'row', alignItems: 'center', gap: sp.x2, marginTop: sp.x3 },
  meta: { ...text.bodyS, color: colors.text.secondary },
  metaDot: { color: colors.text.muted },
});