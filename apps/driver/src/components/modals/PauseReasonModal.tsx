import { useState } from 'react';
import { View, Text, Pressable, Modal, TextInput, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSessionStore } from '../../store/session';
import { useConsoleStore } from '../../store/ui';
import { colors, typography, spacing, radius, elevation } from '../../theme/design';

const REASONS = ['Truck full — disposal drop', 'Refuel', 'Break', 'Traffic', 'Vehicle issue', 'Other'];

export function PauseReasonModal() {
  const pauseModalOpen = useConsoleStore((s) => s.pauseModalOpen);
  const setPauseModalOpen = useConsoleStore((s) => s.setPauseModalOpen);
  const toggleRoutePause = useSessionStore((s) => s.toggleRoutePause);
  const [reason, setReason] = useState<string | null>(null);
  const [note, setNote] = useState('');

  const close = () => {
    setPauseModalOpen(false);
    setReason(null);
    setNote('');
  };

  const confirm = async () => {
    const finalReason = reason === 'Other' ? (note.trim() || 'Other') : (reason ?? undefined);
    await toggleRoutePause(finalReason);
    close();
  };

  return (
    <Modal visible={pauseModalOpen} transparent animationType="slide">
      <View style={styles.backdrop}>
        <View style={styles.modal}>
          <View style={styles.header}>
            <View style={styles.iconWrap}>
              <Ionicons name="pause" size={18} color={colors.state.warning} />
            </View>
            <View style={styles.headerText}>
              <Text style={styles.title}>Pause route?</Text>
              <Text style={styles.subtitle}>Progress is preserved. Stops won't be marked late while paused.</Text>
            </View>
          </View>

          <View style={styles.content}>
            <Text style={styles.sectionTitle}>REASON (OPTIONAL)</Text>
            <View style={styles.reasons}>
              {REASONS.map((r) => (
                <Pressable
                  key={r}
                  onPress={() => setReason(reason === r ? null : r)}
                  style={({ pressed }) => [
                    styles.reasonBtn,
                    pressed && styles.pressed,
                    reason === r && styles.reasonSelected,
                  ]}
                >
                  <Text style={[styles.reasonText, reason === r && styles.reasonTextSelected]}>
                    {r}
                  </Text>
                </Pressable>
              ))}
            </View>

            {(reason === 'Other' || note.length > 0) && (
              <TextInput
                value={note}
                onChangeText={setNote}
                placeholder="Add a note…"
                placeholderTextColor={colors.text.disabled}
                style={styles.noteInput}
              />
            )}

            <View style={styles.actions}>
              <Pressable onPress={close} style={({ pressed }) => [styles.cancelBtn, pressed && styles.pressed]}>
                <Text style={styles.cancelText}>CANCEL</Text>
              </Pressable>
              <Pressable onPress={confirm} style={({ pressed }) => [styles.confirmBtn, pressed && styles.pressed]}>
                <Text style={styles.confirmText}>PAUSE ROUTE</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'flex-end',
    padding: spacing.x16,
    paddingBottom: spacing.x96,
  },
  modal: {
    backgroundColor: colors.surface.containerHighest,
    borderRadius: radius.large,
    ...elevation[4],
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.x12,
    padding: spacing.x20,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[20],
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: radius.medium,
    backgroundColor: `${colors.state.warning}20`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    flex: 1,
  },
  title: {
    ...typography.titleMedium,
    color: colors.primary[900],
  },
  subtitle: {
    ...typography.bodySmall,
    color: colors.text.secondary,
    marginTop: 2,
  },
  content: {
    padding: spacing.x20,
  },
  sectionTitle: {
    ...typography.labelSmall,
    color: colors.text.tertiary,
    marginBottom: spacing.x8,
  },
  reasons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.x8,
    marginBottom: spacing.x12,
  },
  reasonBtn: {
    paddingHorizontal: spacing.x12,
    paddingVertical: spacing.x8,
    borderRadius: radius.medium,
    backgroundColor: colors.surface.container,
    borderWidth: 1,
    borderColor: colors.neutral[20],
  },
  reasonSelected: {
    backgroundColor: colors.primary[600],
    borderColor: colors.primary[600],
  },
  pressed: {
    opacity: 0.8,
  },
  reasonText: {
    ...typography.labelMedium,
    color: colors.text.primary,
  },
  reasonTextSelected: {
    color: colors.text.inverse,
  },
  noteInput: {
    backgroundColor: colors.surface.container,
    borderRadius: radius.medium,
    borderWidth: 1,
    borderColor: colors.neutral[20],
    padding: spacing.x12,
    marginBottom: spacing.x12,
    fontSize: 14,
    color: colors.text.primary,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.x8,
  },
  cancelBtn: {
    flex: 1,
    backgroundColor: colors.neutral[10],
    borderRadius: radius.medium,
    paddingVertical: spacing.x12,
    alignItems: 'center',
  },
  cancelText: {
    ...typography.labelLarge,
    color: colors.text.secondary,
  },
  confirmBtn: {
    flex: 1,
    backgroundColor: colors.state.warning,
    borderRadius: radius.medium,
    paddingVertical: spacing.x12,
    alignItems: 'center',
  },
  confirmText: {
    ...typography.labelLarge,
    color: colors.text.inverse,
  },
});