import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Bell, LogOut } from 'lucide-react-native';
import { colors } from '../../theme/colors';
import { gutter, radius, sp } from '../../theme/spacing';
import { text } from '../../theme/typography';

interface Props {
  status?: string;
  onSignOut: () => void;
  topInset: number;
}

export function ShiftBar({ status, onSignOut, topInset }: Props) {
  const onShift = status === 'active' || status === 'paused';
  const label = status === 'paused' ? 'Paused' : onShift ? 'On shift' : 'Off shift';

  return (
    <View style={[styles.bar, { paddingTop: topInset + sp.x2 }]}>
      <View style={[styles.pill, !onShift && styles.pillOff]}>
        <View style={[styles.dot, !onShift && styles.dotOff]} />
        <Text style={[styles.pillLabel, !onShift && { color: colors.text.muted }]}>{label}</Text>
      </View>
      <View style={styles.right}>
        <Pressable style={styles.iconBtn} accessibilityRole="button" accessibilityLabel="Notifications">
          <Bell size={20} color={colors.text.secondary} />
        </Pressable>
        <Pressable style={styles.iconBtn} onPress={onSignOut} accessibilityRole="button" accessibilityLabel="Sign out">
          <LogOut size={20} color={colors.state.danger} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    position: 'absolute', top: 0, left: 0, right: 0,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: gutter,
  },
  pill: {
    flexDirection: 'row', alignItems: 'center', gap: sp.x2,
    backgroundColor: colors.brand[100], borderRadius: radius.full,
    paddingHorizontal: sp.x4, paddingVertical: sp.x2,
  },
  pillOff: { backgroundColor: colors.surfaceMuted },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.brand[600] },
  dotOff: { backgroundColor: colors.text.muted },
  pillLabel: { ...text.label, color: colors.brand[800] },
  right: { flexDirection: 'row', gap: sp.x2 },
  iconBtn: {
    width: 40, height: 40, borderRadius: radius.full, backgroundColor: colors.surface,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 6, elevation: 2,
  },
});