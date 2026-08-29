import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, TextInput, Alert } from 'react-native';
import { Bell, CheckCheck, CheckCircle, AlertTriangle, Receipt, Zap, ChevronDown, X } from 'lucide-react-native';
import { Screen } from '../../components/ui/Screen';
import { Rise } from '../../components/ui/motion';
import { useCaretakerStore } from '../../store/caretakerStore';
import { dateTime } from '../../services/format';
import { colors } from '../../theme/colors';
import { radius, sp } from '../../theme/spacing';
import { text } from '../../theme/typography';
import type { AppNotification, CaretakerNotificationKind } from '../../types/caretaker';

const KIND_META: Record<CaretakerNotificationKind, { Icon: any; color: string }> = {
  pickup: { Icon: CheckCircle, color: colors.brand[400] },
  pickup_disputed: { Icon: AlertTriangle, color: colors.state.warning },
  issue_update: { Icon: AlertTriangle, color: colors.state.danger },
  service_activated: { Icon: Zap, color: colors.brand[500] },
  invoice_paid: { Icon: Receipt, color: colors.brand[400] },
};

export default function NotificationsScreen() {
  const notifications = useCaretakerStore((s: any) => s.notifications);
  const markAllRead = useCaretakerStore((s: any) => s.markAllRead);
  const disputePickup = useCaretakerStore((s: any) => s.disputePickup);
  const load = useCaretakerStore((s: any) => s.load);

  const [disputingId, setDisputingId] = useState<string | null>(null);
  const [disputeNote, setDisputeNote] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => { load(true); }, []);

  const handleDispute = async (id: string) => {
    setBusy(true);
    const stopId = id.replace('pickup-', '');
    const res = await disputePickup(stopId, disputeNote);
    setBusy(false);
    if (!res.ok) Alert.alert('Dispute failed', res.error || 'Could not dispute pickup.');
    else {
      setDisputingId(null);
      setDisputeNote('');
    }
  };

  const metaFor = (n: AppNotification) => {
    const base = KIND_META[n.kind];
    // Resolved reports get success color instead of danger
    if (n.kind === 'issue_update' && n.label === 'Your report was resolved') {
      return { Icon: CheckCircle, color: colors.state.success };
    }
    return base;
  };

  return (
    <Screen scroll>
      {notifications.length > 0 && (
        <Rise delay={0}>
          <Pressable style={styles.markAll} onPress={markAllRead}>
            <CheckCheck size={15} color={colors.brand[400]} />
            <Text style={styles.markAllLabel}>Mark all read</Text>
          </Pressable>
        </Rise>
      )}

      {notifications.length === 0 ? (
        <Rise delay={60}>
          <View style={styles.empty}>
            <Bell size={32} color={colors.text.muted} />
            <Text style={styles.emptyTitle}>No notifications</Text>
            <Text style={styles.emptyBody}>Pickup approvals, invoices and driver updates land here.</Text>
          </View>
        </Rise>
      ) : (
        <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
          {notifications.map((n: AppNotification, i: number) => {
            const { Icon, color } = metaFor(n);
            const isDisputing = disputingId === n.id;
            const canDispute = n.kind === 'pickup' && !n.disputed;

            return (
              <Rise key={n.id} delay={60 + i * 40}>
                <View style={styles.card}>
                  <View style={styles.cardHeader}>
                    <View style={[styles.iconWrap, { backgroundColor: `${color}15` }]}>
                      <Icon size={18} color={color} />
                    </View>
                    <View style={styles.cardMeta}>
                      <Text style={styles.title} numberOfLines={1}>{n.label}</Text>
                      <Text style={styles.time}>{dateTime(n.at)}</Text>
                    </View>
                  </View>

                  {n.sub && <Text style={styles.body}>{n.sub}</Text>}

                  {canDispute && (
                    <View style={styles.actions}>
                      <Pressable
                        style={styles.disputeBtn}
                        onPress={() => setDisputingId(isDisputing ? null : n.id)}
                      >
                        <AlertTriangle size={14} color={colors.state.warning} />
                        <Text style={styles.disputeLabel}>Dispute</Text>
                        <ChevronDown size={14} color={colors.state.warning} style={{ transform: [{ rotate: isDisputing ? '180deg' : '0deg' }] }} />
                      </Pressable>
                    </View>
                  )}

                  {isDisputing && (
                    <View style={styles.disputeForm}>
                      <TextInput
                        style={styles.disputeInput}
                        value={disputeNote}
                        onChangeText={setDisputeNote}
                        placeholder="Why are you disputing this pickup? (Optional)"
                        placeholderTextColor={colors.text.muted}
                        multiline
                      />
                      <View style={styles.disputeActions}>
                        <Pressable style={styles.cancelBtn} onPress={() => setDisputingId(null)}>
                          <X size={14} color={colors.text.muted} />
                        </Pressable>
                        <Pressable
                          style={[styles.submitBtn, busy && styles.submitBtnDisabled]}
                          onPress={() => handleDispute(n.id)}
                          disabled={busy}
                        >
                          <Text style={styles.submitLabel}>{busy ? 'Submitting...' : 'Submit Dispute'}</Text>
                        </Pressable>
                      </View>
                    </View>
                  )}
                </View>
              </Rise>
            );
          })}
        </ScrollView>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  markAll: { flexDirection: 'row', alignItems: 'center', gap: sp.x2, alignSelf: 'flex-end', marginBottom: sp.x3 },
  markAllLabel: { ...text.semibold, fontSize: 13, color: colors.brand[400] },
  empty: { alignItems: 'center', paddingVertical: sp.x12, gap: sp.x3 },
  emptyTitle: { ...text.titleM, color: colors.text.primary },
  emptyBody: { ...text.bodyS, color: colors.text.muted, textAlign: 'center', maxWidth: 280 },
  list: { paddingBottom: sp.x8 },

  card: {
    backgroundColor: colors.material.surface,
    borderRadius: radius.xl,
    padding: sp.x4,
    borderWidth: 1,
    borderColor: colors.material.border,
    marginBottom: sp.x3,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: sp.x3, marginBottom: sp.x2 },
  iconWrap: { width: 36, height: 36, borderRadius: radius.lg, alignItems: 'center', justifyContent: 'center' },
  cardMeta: { flex: 1 },
  title: { ...text.semibold, fontSize: 15, color: colors.text.primary, marginBottom: 2 },
  time: { ...text.label, fontSize: 10, color: colors.text.muted },
  body: { ...text.bodyM, color: colors.text.secondary, lineHeight: 20, marginBottom: sp.x2 },

  actions: { marginTop: sp.x2 },
  disputeBtn: {
    flexDirection: 'row', alignItems: 'center', gap: sp.x2,
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    paddingVertical: sp.x2, paddingHorizontal: sp.x3,
    borderRadius: radius.md, alignSelf: 'flex-start',
    borderWidth: 1, borderColor: 'rgba(245, 158, 11, 0.2)',
  },
  disputeLabel: { ...text.semibold, fontSize: 12, color: colors.state.warning },

  disputeForm: { marginTop: sp.x3, gap: sp.x2 },
  disputeInput: {
    backgroundColor: colors.material.surfaceStrong,
    borderRadius: radius.lg, padding: sp.x3,
    borderWidth: 1, borderColor: colors.material.border,
    ...text.bodyM, color: colors.text.primary,
    minHeight: 60, textAlignVertical: 'top',
  },
  disputeActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: sp.x2 },
  cancelBtn: {
    width: 36, height: 36, borderRadius: radius.md,
    backgroundColor: colors.material.surfaceStrong,
    alignItems: 'center', justifyContent: 'center',
  },
  submitBtn: {
    flexDirection: 'row', alignItems: 'center', gap: sp.x2,
    backgroundColor: colors.state.warning,
    paddingHorizontal: sp.x4, borderRadius: radius.md,
  },
  submitBtnDisabled: { opacity: 0.6 },
  submitLabel: { ...text.button, color: colors.text.inverse },
});