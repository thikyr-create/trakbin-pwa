import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../../theme/colors';
import { gutter, radius, sp } from '../../theme/spacing';
import { text } from '../../theme/typography';

interface Props {
  live: boolean;
  accuracy?: number;
  bottom: number;
}

export function GpsChip({ live, accuracy, bottom }: Props) {
  return (
    <View style={[styles.chip, { bottom }]}>
      <View style={[styles.dot, live && styles.dotLive]} />
      <View>
        <Text style={styles.title}>GPS</Text>
        <Text style={styles.sub}>{live ? `Live ±${Math.round(accuracy ?? 0)} m` : 'Acquiring…'}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    position: 'absolute', left: gutter,
    flexDirection: 'row', gap: sp.x2, alignItems: 'center',
    backgroundColor: colors.surface, borderRadius: radius.lg,
    paddingHorizontal: sp.x3, paddingVertical: sp.x2,
    shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 8, elevation: 3,
  },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.text.muted },
  dotLive: { backgroundColor: colors.state.success },
  title: { ...text.label, fontSize: 10, color: colors.text.primary },
  sub: { ...text.bodyS, color: colors.text.muted },
});