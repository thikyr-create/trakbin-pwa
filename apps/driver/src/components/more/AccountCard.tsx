import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSessionStore } from '../../store/session';
import { signOut } from '../../services/auth';
import { colors, typography, spacing, radius, elevation } from '../../theme/design';

export function AccountCard() {
  const driver = useSessionStore((s) => s.driver);
  const driverCompanyId = useSessionStore((s) => s.driverCompanyId);
  const resetSession = useSessionStore((s) => s.resetSession);
  const stopGpsTracking = useSessionStore((s) => s.stopGpsTracking);

  const handleSignOut = async () => {
    stopGpsTracking();
    await signOut();
    resetSession();
  };

  return (
    <View style={styles.card}>
      <Text style={styles.sectionTitle}>ACCOUNT</Text>
      <View style={[styles.row, styles.rowBorder]}>
        <View style={styles.iconWrap}>
          <Ionicons name="card-outline" size={17} color={colors.text.secondary} />
        </View>
        <View style={styles.text}>
          <Text style={styles.label}>Driver ID</Text>
          <Text style={styles.value}>{driver?.employee_id || driver?.id || '—'}</Text>
        </View>
      </View>
      <View style={[styles.row, styles.rowBorder]}>
        <View style={styles.iconWrap}>
          <Ionicons name="business-outline" size={17} color={colors.text.secondary} />
        </View>
        <View style={styles.text}>
          <Text style={styles.label}>Company</Text>
          <Text style={styles.value}>#{driverCompanyId ?? '—'}</Text>
        </View>
      </View>
      <Pressable onPress={handleSignOut} style={({ pressed }) => [styles.row, pressed && styles.signOutPressed]}>
        <View style={styles.signOutIconWrap}>
          <Ionicons name="log-out-outline" size={17} color={colors.state.danger} />
        </View>
        <Text style={styles.signOutLabel}>Sign Out</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface.container,
    borderRadius: radius.large,
    overflow: 'hidden',
    ...elevation[1],
  },
  sectionTitle: {
    ...typography.labelSmall,
    color: colors.text.tertiary,
    paddingHorizontal: spacing.x16,
    paddingTop: spacing.x12,
    paddingBottom: spacing.x4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.x12,
    paddingHorizontal: spacing.x16,
    paddingVertical: spacing.x14,
  },
  rowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[20],
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: radius.medium,
    backgroundColor: colors.neutral[10],
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    flex: 1,
  },
  label: {
    ...typography.bodyMedium,
    color: colors.text.primary,
  },
  value: {
    ...typography.bodySmall,
    color: colors.text.tertiary,
    marginTop: 2,
    fontFamily: 'monospace',
  },
  signOutPressed: {
    backgroundColor: `${colors.state.danger}10`,
  },
  signOutIconWrap: {
    width: 36,
    height: 36,
    borderRadius: radius.medium,
    backgroundColor: `${colors.state.danger}10`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  signOutLabel: {
    ...typography.bodyMedium,
    color: colors.state.danger,
  },
});