import { View, Text, Pressable, Modal, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSessionStore } from '../../store/session';
import { useConsoleStore } from '../../store/ui';
import { colors, typography, spacing, radius, elevation } from '../../theme/design';

export function EndShiftModal() {
  const route = useSessionStore((s) => s.route);
  const routeStops = useSessionStore((s) => s.routeStops);
  const endShift = useSessionStore((s) => s.endShift);
  const open = useConsoleStore((s) => s.endShiftOpen);
  const setEndShiftOpen = useConsoleStore((s) => s.setEndShiftOpen);

  const remainingStops = route ? route.total_stops - route.completed_stops : 0;
  const skippedCount = routeStops.filter((s: any) => s.status === 'skipped').length;

  const handleEnd = async () => {
    await endShift();
    setEndShiftOpen(false);
  };

  return (
    <Modal visible={open} transparent animationType="fade">
      <View style={styles.backdrop}>
        <View style={styles.modal}>
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={styles.iconWrap}>
                <Ionicons name="log-out" size={16} color={colors.state.danger} />
              </View>
              <Text style={styles.title}>END SHIFT</Text>
            </View>
            <Pressable onPress={() => setEndShiftOpen(false)} style={styles.closeBtn}>
              <Ionicons name="close" size={20} color={colors.text.secondary} />
            </Pressable>
          </View>

          <View style={styles.content}>
            {remainingStops > 0 ? (
              <View style={styles.warningCard}>
                <Ionicons name="alert-circle" size={20} color={colors.state.warning} />
                <View style={styles.warningText}>
                  <Text style={styles.warningTitle}>Unfinished Stops</Text>
                  <Text style={styles.warningBody}>
                    You have {remainingStops} remaining stop{remainingStops !== 1 ? 's' : ''} that will be marked as incomplete.
                  </Text>
                </View>
              </View>
            ) : (
              <View style={styles.successCard}>
                <Ionicons name="checkmark-circle" size={20} color={colors.state.success} />
                <View style={styles.warningText}>
                  <Text style={styles.successTitle}>Route Complete!</Text>
                  <Text style={styles.warningBody}>Great job! All stops have been completed.</Text>
                </View>
              </View>
            )}

            <View style={styles.summaryCard}>
              <Text style={styles.summaryTitle}>TODAY'S SUMMARY</Text>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Completed:</Text>
                <Text style={[styles.summaryValue, styles.summaryCompleted]}>{route?.completed_stops || 0}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Skipped:</Text>
                <Text style={[styles.summaryValue, styles.summarySkipped]}>{skippedCount}</Text>
              </View>
              <View style={[styles.summaryRow, styles.summaryRowBorder]}>
                <Text style={styles.summaryLabel}>Total:</Text>
                <Text style={styles.summaryValue}>{route?.total_stops || 0}</Text>
              </View>
            </View>

            <Text style={styles.confirmText}>Are you sure you want to end your shift?</Text>

            <Pressable onPress={handleEnd} style={({ pressed }) => [styles.submitBtn, pressed && styles.pressed]}>
              <Text style={styles.submitText}>YES, END SHIFT</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.x16,
  },
  modal: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: colors.surface.containerHighest,
    borderRadius: radius.large,
    overflow: 'hidden',
    ...elevation[4],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.x20,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[20],
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.x8,
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: radius.medium,
    backgroundColor: `${colors.state.danger}20`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    ...typography.titleMedium,
    color: colors.primary[900],
  },
  closeBtn: {
    padding: spacing.x4,
  },
  content: {
    padding: spacing.x20,
  },
  warningCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.x12,
    backgroundColor: `${colors.state.warning}15`,
    borderWidth: 1,
    borderColor: `${colors.state.warning}40`,
    borderRadius: radius.medium,
    padding: spacing.x12,
    marginBottom: spacing.x16,
  },
  successCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.x12,
    backgroundColor: `${colors.state.success}15`,
    borderWidth: 1,
    borderColor: `${colors.state.success}40`,
    borderRadius: radius.medium,
    padding: spacing.x12,
    marginBottom: spacing.x16,
  },
  warningText: {
    flex: 1,
  },
  warningTitle: {
    ...typography.titleSmall,
    color: colors.state.warning,
    marginBottom: 2,
  },
  successTitle: {
    ...typography.titleSmall,
    color: colors.state.success,
    marginBottom: 2,
  },
  warningBody: {
    ...typography.bodySmall,
    color: colors.text.secondary,
  },
  summaryCard: {
    backgroundColor: colors.neutral[10],
    borderRadius: radius.medium,
    padding: spacing.x16,
    marginBottom: spacing.x16,
    borderWidth: 1,
    borderColor: colors.neutral[20],
  },
  summaryTitle: {
    ...typography.labelSmall,
    color: colors.text.tertiary,
    marginBottom: spacing.x8,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.x4,
  },
  summaryRowBorder: {
    paddingTop: spacing.x8,
    borderTopWidth: 1,
    borderTopColor: colors.neutral[20],
  },
  summaryLabel: {
    ...typography.bodyMedium,
    color: colors.text.secondary,
  },
  summaryValue: {
    ...typography.titleMedium,
    color: colors.text.primary,
  },
  summaryCompleted: {
    color: colors.state.success,
  },
  summarySkipped: {
    color: colors.state.warning,
  },
  confirmText: {
    ...typography.bodySmall,
    color: colors.text.secondary,
    marginBottom: spacing.x16,
  },
  submitBtn: {
    backgroundColor: colors.state.danger,
    borderRadius: radius.medium,
    paddingVertical: spacing.x12,
    alignItems: 'center',
    ...elevation[2],
  },
  pressed: {
    opacity: 0.9,
  },
  submitText: {
    ...typography.labelLarge,
    color: colors.text.inverse,
  },
});