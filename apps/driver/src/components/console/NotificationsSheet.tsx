import { useEffect } from 'react';
import { View, Text, Pressable, Modal, ScrollView, StyleSheet } from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useConsoleStore } from '../../store/ui';
import { useDriverNotifications } from '../../hooks/useDriverNotifications';
import { colors, typography, spacing, radius, elevation } from '../../theme/design';

export function NotificationsSheet() {
  const notifOpen = useConsoleStore((s) => s.notifOpen);
  const setNotifOpen = useConsoleStore((s) => s.setNotifOpen);
  const setActiveTab = useConsoleStore((s) => s.setActiveTab);
  const { items, markSeen } = useDriverNotifications();

  useEffect(() => {
    if (notifOpen) markSeen();
  }, [notifOpen, markSeen]);

  return (
    <Modal visible={notifOpen} transparent animationType="slide">
      <View style={styles.backdrop}>
        <BlurView intensity={90} tint="light" style={styles.sheet}>
          <View style={styles.header}>
            <Text style={styles.title}>Notifications</Text>
            <Pressable onPress={() => setNotifOpen(false)} style={({ pressed }) => [styles.closeBtn, pressed && styles.pressed]}>
              <Ionicons name="close" size={20} color={colors.text.secondary} />
            </Pressable>
          </View>

          {items.length === 0 ? (
            <View style={styles.empty}>
              <View style={styles.emptyIcon}>
                <Ionicons name="notifications-outline" size={24} color={colors.neutral[40]} />
              </View>
              <Text style={styles.emptyTitle}>No notifications</Text>
              <Text style={styles.emptyBody}>
                Updates from dispatch and your reports appear here.
              </Text>
            </View>
          ) : (
            <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
              {items.map((n: any) => (
                <View key={n.id} style={styles.item}>
                  <View style={[styles.itemIcon, n.kind === 'issue_update' ? styles.itemIconIssue : styles.itemIconRoute]}>
                    <Ionicons
                      name={n.kind === 'issue_update' ? 'flag-outline' : 'navigate-outline'}
                      size={16}
                      color={n.kind === 'issue_update' ? '#9333ea' : colors.primary[700]}
                    />
                  </View>
                  <View style={styles.itemText}>
                    <Text style={styles.itemLabel}>{n.label}</Text>
                    {n.sub && <Text style={styles.itemSub} numberOfLines={1}>{n.sub}</Text>}
                  </View>
                  <Text style={styles.itemTime}>
                    {new Date(n.at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                </View>
              ))}
            </ScrollView>
          )}

          <Pressable
            onPress={() => { setActiveTab('activity'); setNotifOpen(false); }}
            style={({ pressed }) => [styles.viewAllBtn, pressed && styles.pressed]}
          >
            <Text style={styles.viewAllText}>VIEW FULL ACTIVITY</Text>
          </Pressable>
        </BlurView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: radius.extraLarge,
    borderTopRightRadius: radius.extraLarge,
    maxHeight: '70%',
    backgroundColor: colors.surface.containerHighest,
    ...elevation[4],
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.x20,
    paddingTop: spacing.x16,
    paddingBottom: spacing.x8,
  },
  title: {
    ...typography.titleMedium,
    color: colors.primary[900],
  },
  closeBtn: {
    padding: spacing.x8,
    borderRadius: radius.medium,
  },
  pressed: {
    backgroundColor: colors.neutral[10],
  },
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.x24,
    paddingVertical: spacing.x48,
  },
  emptyIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.neutral[10],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.x12,
  },
  emptyTitle: {
    ...typography.titleMedium,
    color: colors.text.primary,
    marginBottom: spacing.x8,
  },
  emptyBody: {
    ...typography.bodyMedium,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  list: {
    paddingHorizontal: spacing.x16,
    paddingBottom: spacing.x16,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.x12,
    backgroundColor: colors.surface.container,
    borderRadius: radius.large,
    padding: spacing.x16,
    marginBottom: spacing.x8,
    borderWidth: 1,
    borderColor: colors.neutral[20],
  },
  itemIcon: {
    width: 36,
    height: 36,
    borderRadius: radius.medium,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemIconIssue: {
    backgroundColor: '#9333ea15',
  },
  itemIconRoute: {
    backgroundColor: colors.primary[50],
  },
  itemText: {
    flex: 1,
  },
  itemLabel: {
    ...typography.bodyMedium,
    color: colors.text.primary,
  },
  itemSub: {
    ...typography.bodySmall,
    color: colors.text.secondary,
    marginTop: 2,
  },
  itemTime: {
    ...typography.labelSmall,
    color: colors.text.tertiary,
    fontSize: 10,
  },
  viewAllBtn: {
    margin: spacing.x16,
    backgroundColor: colors.neutral[10],
    borderRadius: radius.medium,
    paddingVertical: spacing.x12,
    alignItems: 'center',
  },
  viewAllText: {
    ...typography.labelLarge,
    color: colors.text.secondary,
  },
});