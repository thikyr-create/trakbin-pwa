import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSessionStore } from '../../store/session';
import { useConsoleStore } from '../../store/ui';
import { useDriverNotifications } from '../../hooks/useDriverNotifications';
import { signOut } from '../../services/auth';
import { useLayout } from '../../theme/layout';
import { colors, typography, spacing, radius, elevation } from '../../theme/design';

export function TopBar() {
  const L = useLayout();
  const route = useSessionStore((s) => s.route);
  const isRoutePaused = useSessionStore((s) => s.isRoutePaused);
  const resetSession = useSessionStore((s) => s.resetSession);
  const setSearchOpen = useConsoleStore((s) => s.setSearchOpen);
  const setNotifOpen = useConsoleStore((s) => s.setNotifOpen);
  const { unread } = useDriverNotifications();

  const onShift = !!route && route.status !== 'completed';

  const handleSignOut = async () => {
    await signOut();
    resetSession();
  };

  const pillColor = onShift
    ? isRoutePaused ? colors.state.warning : colors.state.success
    : colors.neutral[40];
  const pillText = onShift
    ? isRoutePaused ? 'ON SHIFT · PAUSED' : 'ON SHIFT'
    : 'OFF SHIFT';

  return (
    <View style={[styles.bar, { paddingTop: L.topBarPadTop }]}>
      <View style={styles.left}>
        <Pressable onPress={() => setSearchOpen(true)} style={({ pressed }) => [styles.iconBtn, pressed && styles.pressed]}>
          <Ionicons name="search-outline" size={22} color={colors.text.primary} />
        </Pressable>
        <View style={[styles.pill, { backgroundColor: `${pillColor}20` }]}>
          <View style={[styles.pillDot, { backgroundColor: pillColor }]} />
          <Text style={[styles.pillText, { color: pillColor }]}>{pillText}</Text>
        </View>
      </View>

      <View style={styles.right}>
        <Pressable onPress={() => setNotifOpen(true)} style={({ pressed }) => [styles.iconBtn, pressed && styles.pressed]}>
          <Ionicons name="notifications-outline" size={20} color={colors.text.primary} />
          {unread > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{unread > 9 ? '9+' : unread}</Text>
            </View>
          )}
        </Pressable>
        <Pressable onPress={handleSignOut} style={({ pressed }) => [styles.iconBtn, pressed && styles.pressed]}>
          <Ionicons name="log-out-outline" size={20} color={colors.state.danger} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingBottom: spacing.x8,
    paddingHorizontal: spacing.x16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface.containerHighest,
    ...elevation[2],
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.x12,
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.x8,
  },
  iconBtn: {
    padding: spacing.x8,
    borderRadius: radius.medium,
  },
  pressed: {
    backgroundColor: colors.neutral[10],
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.x8,
    paddingHorizontal: spacing.x12,
    paddingVertical: spacing.x6,
    borderRadius: radius.full,
  },
  pillDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  pillText: {
    ...typography.labelSmall,
  },
  badge: {
    position: 'absolute',
    top: 0,
    right: 0,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 4,
    borderRadius: 9,
    backgroundColor: colors.state.danger,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    ...typography.labelSmall,
    color: colors.text.inverse,
    fontSize: 10,
  },
});