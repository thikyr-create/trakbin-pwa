import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { colors, typography, spacing } from '../../theme/design';

interface Props {
  pct: number;
}

export function ProgressRing({ pct }: Props) {
  const r = 52;
  const c = 2 * Math.PI * r;
  const filled = c * Math.min(1, Math.max(0, pct));

  return (
    <View style={styles.container}>
      <Svg width={120} height={120} viewBox="0 0 120 120">
        <Circle
          cx="60"
          cy="60"
          r={r}
          fill="none"
          stroke={colors.neutral[30]}
          strokeWidth="10"
        />
        <Circle
          cx="60"
          cy="60"
          r={r}
          fill="none"
          stroke={colors.primary[600]}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={`${filled} ${c - filled}`}
          rotation="-90"
          origin="60, 60"
        />
      </Svg>
      <View style={styles.textWrap}>
        <Text style={styles.pctText}>{Math.round(pct * 100)}%</Text>
        <Text style={styles.labelText}>COMPLETED</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 120,
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textWrap: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pctText: {
    ...typography.headlineMedium,
    color: colors.primary[900],
  },
  labelText: {
    ...typography.labelSmall,
    color: colors.text.tertiary,
    fontSize: 9,
    marginTop: 2,
  },
});