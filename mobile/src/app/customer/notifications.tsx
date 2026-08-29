import { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { Bell, CheckCheck } from 'lucide-react-native';
import { Screen } from '../../components/ui/Screen';
import { Header } from '../../components/ui/Header';
import { Rise } from '../../components/ui/motion';
import { useCaretakerStore } from '../../store/caretakerStore';
import { dateTime } from '../../services/format';
import { colors } from '../../theme/colors';
import { radius, sp } from '../../theme/spacing';
import { text } from '../../theme/typography';

export default function NotificationsScreen() {
  const notifications = useCaretakerStore((s: any) => s.notifications);
  const markAllRead = useCaretakerStore((s: any) => s.markAllRead);
  const load = useCaretakerStore((s: any) => s.load);

  useEffect(() => { load(true); }, []);

  return (
    <Screen scroll>
      <Header title="Notifications" subtitle="Approvals, invoices & dispatch updates" />

      <Rise delay={0}>
        <Pressable style={styles.markAll} onPress={markAllRead} accessibilityRole="button">
          <CheckCheck size={15} color={colors.brand[400]} />
          <Text style={styles.markAllLabel}>Mark all read</Text>
        </Pressable>
      </Rise>

      {notifications.length === 0 ? (
        <Rise delay={60}>
          <View style={styles.empty}>
            <Bell size={28} color={colors.text.muted} />
            <Text style={styles.emptyTitle}>No notifications</Text>
            <Text style={styles.emptyBody}>Pickup approvals, invoices and driver updates land here.</Text>
          </View>
        </Rise>
      ) : (
        notifications.map((n: any, i: number) => {
          const unread = !n.read && !n.is_read;
          return (
            <Rise key={n.id ?? i} delay={60 + i * 40}>
              <View style={[styles.row, unread && styles.rowUnread]}>
                <View style={[styles.dot, !unread && styles.dotRead]} />
                <View style={styles.main}>
                  <Text style={[styles.title, unread && styles.titleUnread]} numberOfLines={1}>{n.title}</Text>
                  <Text style={styles.body}>{n.body}</Text>
                  <Text style={styles.time}>{dateTime(n.created_at)}</Text>
                </View>
              </View>
            </Rise>
          );
        })
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  markAll: { flexDirection: 'row', alignItems: 'center', gap: sp.x2, alignSelf: 'flex-end', marginBottom: sp.x3 },
  markAllLabel: { ...text.semibold, fontSize: 13, color: colors.brand[400] },
  empty: { alignItems: 'center', paddingVertical: sp.x12, gap: sp.x2 },
  emptyTitle: { ...text.titleM, color: colors.text.primary },
  emptyBody: { ...text.bodyS, color: colors.text.muted, textAlign: 'center' },
  row: { flexDirection: 'row', gap: sp.x3, backgroundColor: colors.surface, borderRadius: radius.xl, padding: sp.x4, borderWidth: 1, borderColor: colors.border.subtle, marginBottom: sp.x3 },
  rowUnread: { borderColor: colors.brand[500], backgroundColor: colors.material.emerald },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.brand[500], marginTop: 6 },
  dotRead: { backgroundColor: colors.border.strong },
  main: { flex: 1 },
  title: { ...text.semibold, color: colors.text.primary },
  titleUnread: { color: colors.text.inverse },
  body: { ...text.bodyS, color: colors.text.secondary, marginTop: 2 },
  time: { ...text.label, fontSize: 9, color: colors.text.muted, marginTop: sp.x2 },
});