import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../../theme/colors';
import { radius, sp } from '../../theme/spacing';
import { text } from '../../theme/typography';

export function Chip({ label }: { label: string }) {
  return (
    <View style={styles.chip}>
      <Text style={styles.label} numberOfLines={1}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.sm,
    paddingHorizontal: sp.x3,
    paddingVertical: sp.x1,
    maxWidth: '70%',
  },
  label: { ...text.label, fontSize: 10, color: colors.text.secondary },
});