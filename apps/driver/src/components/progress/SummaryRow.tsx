import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, radius } from '../../theme/design';

interface Props {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
}

export function SummaryRow({ icon, label, value }: Props) {
  return (
    <View style={styles.row}>
      <View style={styles.iconWrap}>
        <Ionicons name={icon} size={15} color={colors.primary[700]} />
      </View>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.x12,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[20],
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: radius.medium,
    backgroundColor: colors.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.x12,
  },
  label: {
    ...typography.bodyMedium,
    color: colors.text.secondary,
    flex: 1,
  },
  value: {
    ...typography.titleSmall,
    color: colors.primary[900],
  },
});