import { View, Text, StyleSheet, Pressable, Alert } from 'react-native';
import { Info, LogOut, Settings, Shield } from 'lucide-react-native';
import { Screen } from '../../components/ui/Screen';
import { useAuthStore } from '../../store/authStore';
import { colors } from '../../theme/colors';
import { gutter, radius, sp } from '../../theme/spacing';
import { text } from '../../theme/typography';

export default function MoreScreen() {
  const driver = useAuthStore((s) => s.driver);
  const signOut = useAuthStore((s) => s.signOut);

  const handleSignOut = () => {
    Alert.alert('Sign out?', 'You will need to sign in again to access your route.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign out', style: 'destructive', onPress: signOut },
    ]);
  };

  return (
    <Screen scroll>
      <Text style={styles.title}>More</Text>

      <View style={styles.card}>
        <Row icon={<Shield size={20} color={colors.brand[700]} />} label="Account" value={driver?.employee_id ?? '—'} />
        <Row icon={<Settings size={20} color={colors.text.secondary} />} label="Settings" value="Coming soon" last />
      </View>

      <View style={styles.card}>
        <Row icon={<Info size={20} color={colors.text.secondary} />} label="Version" value="1.0.0" last />
      </View>

      <Pressable style={styles.signOutBtn} onPress={handleSignOut}>
        <LogOut size={18} color={colors.state.danger} />
        <Text style={styles.signOutLabel}>Sign out</Text>
      </Pressable>
    </Screen>
  );
}

function Row({ icon, label, value, last }: { icon: React.ReactNode; label: string; value: string; last?: boolean }) {
  return (
    <View style={[styles.row, !last && styles.rowBorder]}>
      <View style={styles.iconWrap}>{icon}</View>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  title: { ...text.titleL, color: colors.text.primary, marginBottom: sp.x5 },
  card: {
    backgroundColor: colors.surface, borderRadius: radius.xl, padding: sp.x5,
    marginBottom: sp.x4, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 10, elevation: 2,
  },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: sp.x3, gap: sp.x3 },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: colors.border.subtle },
  iconWrap: { width: 32, height: 32, borderRadius: radius.md, backgroundColor: colors.surfaceMuted, alignItems: 'center', justifyContent: 'center' },
  rowLabel: { flex: 1, ...text.bodyM, color: colors.text.primary },
  rowValue: { ...text.bodyS, color: colors.text.muted },
  signOutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: sp.x2,
    backgroundColor: colors.state.dangerSoft, borderRadius: radius.lg,
    paddingVertical: sp.x4, marginTop: sp.x6,
  },
  signOutLabel: { ...text.button, color: colors.state.danger },
});