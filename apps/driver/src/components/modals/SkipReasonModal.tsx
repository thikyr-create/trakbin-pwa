import { useState } from 'react';
import { View, Text, Pressable, Modal, ScrollView, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSessionStore } from '../../store/session';
import { useConsoleStore } from '../../store/ui';
import { colors, typography, spacing, radius, elevation } from '../../theme/design';

const REASONS = [
  "Not available",
  "No bin on site",
  "Resident absent",
  "Locked gate",
  "Road blocked",
  "Construction",
  "Flooding",
  "Security issue",
  "Other",
];

export function SkipReasonModal() {
  const skipStop = useSessionStore((s) => s.skipStop);
  const [selectedReason, setSelectedReason] = useState('');
  const [open, setOpen] = useState(false);

  const handleSubmit = async () => {
    if (selectedReason) {
      await skipStop(selectedReason);
      setSelectedReason('');
      setOpen(false);
    }
  };

  return (
    <Modal visible={open} transparent animationType="fade">
      <View style={styles.backdrop}>
        <View style={styles.modal}>
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={styles.iconWrap}>
                <Ionicons name="play-skip-forward" size={16} color={colors.state.warning} />
              </View>
              <Text style={styles.title}>SKIP STOP</Text>
            </View>
            <Pressable onPress={() => setOpen(false)} style={styles.closeBtn}>
              <Ionicons name="close" size={20} color={colors.text.secondary} />
            </Pressable>
          </View>

          <View style={styles.content}>
            <Text style={styles.subtitle}>Select a reason for skipping this collection:</Text>
            <ScrollView style={styles.reasons} showsVerticalScrollIndicator={false}>
              {REASONS.map((reason) => (
                <Pressable
                  key={reason}
                  onPress={() => setSelectedReason(reason)}
                  style={({ pressed }) => [
                    styles.reasonBtn,
                    pressed && styles.pressed,
                    selectedReason === reason && styles.reasonSelected,
                  ]}
                >
                  <Text style={[styles.reasonText, selectedReason === reason && styles.reasonTextSelected]}>
                    {reason}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>

            <Pressable
              onPress={handleSubmit}
              disabled={!selectedReason}
              style={({ pressed }) => [
                styles.submitBtn,
                pressed && styles.pressed,
                !selectedReason && styles.submitDisabled,
              ]}
            >
              <Text style={[styles.submitText, !selectedReason && styles.submitTextDisabled]}>
                CONFIRM SKIP
              </Text>
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
    backgroundColor: `${colors.state.warning}20`,
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
  subtitle: {
    ...typography.bodyMedium,
    color: colors.text.secondary,
    marginBottom: spacing.x16,
  },
  reasons: {
    maxHeight: 300,
    marginBottom: spacing.x16,
  },
  reasonBtn: {
    padding: spacing.x12,
    borderRadius: radius.medium,
    borderWidth: 2,
    borderColor: colors.neutral[20],
    marginBottom: spacing.x8,
  },
  reasonSelected: {
    borderColor: colors.state.warning,
    backgroundColor: `${colors.state.warning}15`,
  },
  pressed: {
    opacity: 0.8,
  },
  reasonText: {
    ...typography.bodyMedium,
    color: colors.text.primary,
  },
  reasonTextSelected: {
    color: colors.state.warning,
  },
  submitBtn: {
    backgroundColor: colors.state.warning,
    borderRadius: radius.medium,
    paddingVertical: spacing.x12,
    alignItems: 'center',
  },
  submitDisabled: {
    backgroundColor: colors.neutral[20],
  },
  submitText: {
    ...typography.labelLarge,
    color: colors.text.inverse,
  },
  submitTextDisabled: {
    color: colors.text.tertiary,
  },
});