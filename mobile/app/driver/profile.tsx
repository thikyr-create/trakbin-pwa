// mobile/app/driver/profile.tsx
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { useAuthStore } from '../../store/authStore';
import { colors } from '../../theme/colors';
import { text } from '../../theme/typography';
import { spacing } from '../../theme/spacing';
import { radius } from '../../theme/radius';
import { shadows } from '../../theme/shadows';

export default function ProfileScreen() {
  const driver = useAuthStore((s) => s.driver);
  const logout = useAuthStore((s) => s.logout);
  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.back}><ArrowLeft size={18} color={colors.textPrimary} /></TouchableOpacity>
        <Text style={styles.title}>Driver Profile</Text>
      </View>
      <View style={styles.card}>
        <Text style={[text.eyebrow, { color: colors.textFaint }]}>DRIVER ID</Text>
        <Text style={styles.id}>{driver?.employee_id ?? '—'}</Text>
        <Text style={styles.name}>{driver?.full_name ?? ''}</Text>
        <View style={styles.metaRow}>
          <Meta label="COMPANY" value={String(driver?.company_id ?? '—')} />
          <Meta label="STATUS" value={driver?.status ?? '—'} />
        </View>
        <TouchableOpacity style={styles.out} onPress={logout}><Text style={styles.outLabel}>Sign Out</Text></TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.meta}>
      <Text style={[text.eyebrow, { color: colors.textFaint }]}>{label}</Text>
      <Text style={styles.metaValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.x3, paddingHorizontal: spacing.x4, paddingVertical: spacing.x3, backgroundColor: colors.card },
  back: { padding: spacing.x2, borderRadius: radius.sm, backgroundColor: colors.inputBg },
  title: { ...text.headingM, color: colors.textPrimary },
  card: { margin: spacing.x5, backgroundColor: colors.card, borderRadius: radius.cardLg, padding: spacing.x5, ...shadows.card },
  id: { ...text.headingXl, color: colors.textPrimary, marginTop: spacing.x2 },
  name: { ...text.bodySm, color: colors.textMuted, marginTop: spacing.x1, marginBottom: spacing.x5 },
  metaRow: { flexDirection: 'row', gap: spacing.x4, marginBottom: spacing.x6 },
  meta: { flex: 1, backgroundColor: colors.inputBg, borderRadius: radius.input, padding: spacing.x3 },
  metaValue: { ...text.bodySm, color: colors.textPrimary, fontWeight: '800', marginTop: 2 },
  out: { paddingVertical: 14, borderRadius: radius.button, backgroundColor: colors.dangerBg, alignItems: 'center' },
  outLabel: { color: colors.danger, ...text.bodySm, fontWeight: '800' },
});