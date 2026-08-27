import { Text, View, StyleSheet, Pressable } from 'react-native';
import { ArrowRight, Headset, MapPin, Phone } from 'lucide-react-native';
import { colors } from '../../theme/colors';
import { radius, sp } from '../../theme/spacing';
import { text } from '../../theme/typography';
import { useCaretakerStore } from '../../store/caretakerStore';

interface Props { onPress: () => void; }

export function ProviderCard({ onPress }: Props) {
  const company = useCaretakerStore((s) => s.company);
  const details = useCaretakerStore((s) => s.companyDetails);
  const zone = useCaretakerStore((s) => s.zone);
  const contacts = useCaretakerStore((s) => s.contacts);

  const name: string =
    company?.business_name ?? company?.name ?? company?.company_name ?? company?.trading_name ?? 'Awaiting assignment';

  const assigned = !!company;
  const zoneLabel = zone?.name ? `Zone ${zone.name.replace(/^zone\s*/i, '')}` : 'Unassigned zone';
  const primaryContact = contacts[0];

  return (
    <View style={[styles.card, !assigned && styles.cardUnassigned]}>
      <View style={styles.avatar}>
        <Text style={styles.avatarLetter}>{name.charAt(0).toUpperCase()}</Text>
      </View>

      <View style={styles.main}>
        <View style={styles.labelRow}>
          <Headset size={12} color={colors.brand[200]} />
          <Text style={styles.label}>YOUR WASTE PROVIDER</Text>
        </View>
        <Text style={styles.name} numberOfLines={1}>{name}</Text>

        <View style={styles.metaRow}>
          <View style={styles.statusRow}>
            <View style={styles.dotRing}><View style={[styles.dot, !assigned && styles.dotOff]} /></View>
            <Text style={styles.status}>{assigned ? 'Online' : 'Offline'}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.zoneRow}>
            <MapPin size={12} color={colors.brand[200]} />
            <Text style={styles.zone}>{zoneLabel}</Text>
          </View>
        </View>
      </View>

      <Pressable style={styles.details} onPress={onPress} accessibilityRole="button" accessibilityLabel="Provider details">
        <Text style={styles.detailsLabel}>Details</Text>
        <ArrowRight size={14} color={colors.text.inverse} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row', alignItems: 'center', gap: sp.x3,
    backgroundColor: colors.card.navy,
    borderRadius: radius.xxl, padding: sp.x5,
    shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 }, elevation: 6,
  },
  cardUnassigned: { backgroundColor: colors.card.graphite },
  avatar: {
    width: 48, height: 48, borderRadius: radius.lg,
    backgroundColor: 'rgba(255,255,255,0.14)',
    alignItems: 'center', justifyContent: 'center',
  },
  avatarLetter: { fontFamily: 'Sora_800ExtraBold', fontSize: 22, color: colors.text.inverse },
  main: { flex: 1 },
  labelRow: { flexDirection: 'row', alignItems: 'center', gap: sp.x1, marginBottom: 2 },
  label: { ...text.label, fontSize: 10, color: colors.brand[200] },
  name: { ...text.titleS, color: colors.text.inverse },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: sp.x3, marginTop: sp.x2 },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: sp.x2 },
  dotRing: { width: 10, height: 10, borderRadius: 5, backgroundColor: 'rgba(52,211,153,0.25)', alignItems: 'center', justifyContent: 'center' },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.brand[400] },
  dotOff: { backgroundColor: colors.text.muted },
  status: { ...text.bodyS, fontSize: 12, color: colors.brand[100] },
  divider: { width: 1, height: 12, backgroundColor: 'rgba(255,255,255,0.15)' },
  zoneRow: { flexDirection: 'row', alignItems: 'center', gap: sp.x1 },
  zone: { ...text.bodyS, fontSize: 12, color: colors.brand[100] },
  details: {
    flexDirection: 'row', alignItems: 'center', gap: sp.x1,
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderRadius: radius.full, paddingHorizontal: sp.x4, paddingVertical: sp.x2,
  },
  detailsLabel: { ...text.semibold, fontSize: 13, color: colors.text.inverse },
});