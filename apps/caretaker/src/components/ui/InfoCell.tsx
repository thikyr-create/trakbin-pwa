import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../../theme/colors';
import { radius, sp } from '../../theme/spacing';
import { text } from '../../theme/typography';

interface Props {
  label: string;
  value: string;
  valueColor?: string;
  wide?: boolean;
}

export function InfoCell({ label, value, valueColor, wide }: Props) {
  return (
    <View style={[styles.cell, wide && styles.wide]}>
      <Text style={styles.label}>{label}</Text>
      <Text style={[styles.value, valueColor && { color: valueColor }]} numberOfLines={2}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  cell: {
    width: '48.5%',
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.md,
    paddingHorizontal: sp.x3,
    paddingVertical: sp.x2,
  },
  wide: { width: '100%' },
  label: { ...text.label, fontSize: 10, color: colors.text.muted },
  value: { ...text.semibold, color: colors.text.primary, marginTop: 2 },
});