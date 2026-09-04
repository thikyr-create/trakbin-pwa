import { useState } from 'react';
import { View, Text, Pressable, Modal, TextInput, ScrollView, ActivityIndicator, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSessionStore } from '../../store/session';
import { colors, typography, spacing, radius, elevation } from '../../theme/design';
import { useConsoleStore } from '../../store/ui';

const ISSUE_TYPES = ["Blocked access", "Illegal dumping nearby", "Bin damaged", "Bin missing", "Wrong location", "Other"];

export function DriverReportModal() {
  const currentStop = useSessionStore((s) => s.currentStop);
  const reportIssue = useSessionStore((s) => s.reportIssue);
  const open = useConsoleStore((s) => s.reportOpen);
const setReportOpen = useConsoleStore((s) => s.setReportOpen);
  const [selectedType, setSelectedType] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);

  const close = () => {
    setReportOpen(false);
    setSelectedType('');
    setDescription('');
  };

  const handleSubmit = async () => {
    if (!selectedType) return;
    setSaving(true);
    await reportIssue(selectedType, description.trim());
    setSaving(false);
    close();
  };

  return (
    <Modal visible={open} transparent animationType="fade">
      <View style={styles.backdrop}>
        <View style={styles.modal}>
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={styles.iconWrap}>
                <Ionicons name="flag" size={16} color={colors.state.danger} />
              </View>
              <View>
                <Text style={styles.title}>REPORT ISSUE</Text>
                {currentStop && <Text style={styles.subtitle}>{currentStop.building_id}</Text>}
              </View>
            </View>
            <Pressable onPress={close} style={styles.closeBtn}>
              <Ionicons name="close" size={20} color={colors.text.secondary} />
            </Pressable>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            <View style={styles.types}>
              {ISSUE_TYPES.map((t) => (
                <Pressable
                  key={t}
                  onPress={() => setSelectedType(t)}
                  style={({ pressed }) => [
                    styles.typeBtn,
                    pressed && styles.pressed,
                    selectedType === t && styles.typeSelected,
                  ]}
                >
                  <Text style={[styles.typeText, selectedType === t && styles.typeTextSelected]}>
                    {t}
                  </Text>
                </Pressable>
              ))}
            </View>

            <TextInput
              value={description}
              onChangeText={setDescription}
              placeholder="Optional details…"
              placeholderTextColor={colors.text.disabled}
              multiline
              numberOfLines={3}
              style={styles.description}
            />

            <Pressable
              onPress={handleSubmit}
              disabled={!selectedType || saving}
              style={({ pressed }) => [
                styles.submitBtn,
                pressed && styles.pressed,
                (!selectedType || saving) && styles.submitDisabled,
              ]}
            >
              {saving ? (
                <ActivityIndicator color={colors.text.inverse} />
              ) : (
                <Text style={[styles.submitText, (!selectedType || saving) && styles.submitTextDisabled]}>
                  SUBMIT REPORT
                </Text>
              )}
            </Pressable>
          </ScrollView>
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
    maxHeight: '80%',
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
    flex: 1,
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
  subtitle: {
    ...typography.labelSmall,
    color: colors.text.tertiary,
    fontSize: 10,
  },
  closeBtn: {
    padding: spacing.x4,
  },
  content: {
    padding: spacing.x20,
  },
  types: {
    gap: spacing.x8,
    marginBottom: spacing.x16,
  },
  typeBtn: {
    padding: spacing.x12,
    borderRadius: radius.medium,
    borderWidth: 2,
    borderColor: colors.neutral[20],
  },
  typeSelected: {
    borderColor: colors.state.danger,
    backgroundColor: `${colors.state.danger}15`,
  },
  pressed: {
    opacity: 0.8,
  },
  typeText: {
    ...typography.bodyMedium,
    color: colors.text.primary,
  },
  typeTextSelected: {
    color: colors.state.danger,
  },
  description: {
    backgroundColor: colors.neutral[10],
    borderRadius: radius.medium,
    borderWidth: 1,
    borderColor: colors.neutral[20],
    padding: spacing.x12,
    marginBottom: spacing.x16,
    minHeight: 80,
    fontSize: 14,
    color: colors.text.primary,
  },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.x8,
    backgroundColor: colors.state.danger,
    borderRadius: radius.medium,
    paddingVertical: spacing.x12,
    ...elevation[1],
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