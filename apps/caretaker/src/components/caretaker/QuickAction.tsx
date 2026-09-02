import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '../../theme/colors';
import { radius, sp } from '../../theme/spacing';
import { text } from '../../theme/typography';

interface Props { icon: ReactNode; label: string; onPress: () => void; }

export function QuickAction({ icon, label, onPress }: Props) {
  return (
    <Pressable style={styles.box} onPress={onPress} accessibilityRole="button" accessibilityLabel={label}>
      <View style={styles.iconWrap}>{icon}</View>
      <Text style={styles.label} numberOfLines={1}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  box: {
    width: '48.5%',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: sp.x4,
    gap: sp.x3,
    borderWidth: 1,
    borderColor: colors.border.subtle,
  },
  iconWrap: {
    width: 40, height: 40, borderRadius: radius.md,
    backgroundColor: colors.brand[50],
    alignItems: 'center', justifyContent: 'center',
  },
  label: { ...text.semibold, fontSize: 13, color: colors.text.primary },
});