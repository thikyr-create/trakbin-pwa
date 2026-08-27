import { Pressable, StyleSheet, View } from 'react-native';
import { Layers, LocateFixed } from 'lucide-react-native';
import { colors } from '../../theme/colors';
import { gutter, radius, sp } from '../../theme/spacing';

interface Props {
  onLocate: () => void;
  onToggleLayer: () => void;
  bottom: number;
}

export function MapFabs({ onLocate, onToggleLayer, bottom }: Props) {
  return (
    <View style={[styles.fabs, { bottom }]}>
      <Pressable style={styles.fab} onPress={onLocate} accessibilityRole="button" accessibilityLabel="My location">
        <LocateFixed size={20} color={colors.brand[700]} />
      </Pressable>
      <Pressable style={styles.fab} onPress={onToggleLayer} accessibilityRole="button" accessibilityLabel="Map layers">
        <Layers size={20} color={colors.brand[700]} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  fabs: { position: 'absolute', right: gutter, gap: sp.x2 },
  fab: {
    width: 44, height: 44, borderRadius: radius.lg, backgroundColor: colors.surface,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 8, elevation: 3,
  },
});