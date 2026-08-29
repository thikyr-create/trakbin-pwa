import { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, TextInput, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { CalendarPlus, Truck, CircleCheck, CircleX, Clock } from 'lucide-react-native';
import { Screen } from '../../../components/ui/Screen';

import { StatusPill } from '../../../components/ui/StatusPill';
import { Rise } from '../../../components/ui/motion';
import { useCaretakerStore } from '../../../store/caretakerStore';
import { createPickupRequest, fetchPickupRequests, settleInvoice } from '../../../services/caretaker';
import { dayLabel, naira } from '../../../services/format';
import { colors } from '../../../theme/colors';
import { radius, sp, touch } from '../../../theme/spacing';
import { text } from '../../../theme/typography';
import { CreditCard } from 'lucide-react-native';

const REASONS = ['Extra waste', 'Missed scheduled pickup', 'Bulk / cleanup', 'Overflowing bins', 'Other'];

function nextAction(status: string): string {
  switch (status) {
    case 'REQUESTED':
    case 'UNDER_REVIEW': return 'Awaiting provider review';
    case 'APPROVED': return 'Approved — invoice on the way';
    case 'INVOICE_SENT':
    case 'PAYMENT_PENDING': return 'Pay your invoice in Billing';
    case 'PAYMENT_FAILED': return 'Payment failed — retry in Billing';
    case 'PAID': return 'Paid — awaiting driver & truck';
    case 'ASSIGNED': return 'Driver & truck assigned';
    case 'IN_PROGRESS': return 'Pickup in progress';
    case 'COMPLETED': return 'Completed';
    case 'REJECTED': return 'Rejected by provider';
    case 'CANCELLED': return 'Cancelled';
    case 'EXPIRED': return 'Expired';
    default: return status;
  }
}

export default function CreateRequestScreen() {
  const router = useRouter();
  const building = useCaretakerStore((s: any) => s.building);

  const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
  const [date, setDate] = useState(tomorrow);
  const [reason, setReason] = useState(REASONS[0]);
  const [notes, setNotes] = useState('');
  const [busy, setBusy] = useState(false);
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!building?.custom_id) return;
    setLoading(true);
    setRequests(await fetchPickupRequests(building.custom_id));
    setLoading(false);
  }, [building?.custom_id]);

  useEffect(() => { load(); }, [load]);

  const canSubmit = !!date && !!reason && !busy;

  const submit = async () => {
    if (!canSubmit || !building?.custom_id) return;
    setBusy(true);
    const res = await createPickupRequest({
      buildingId: building.custom_id,
      companyId: Number(building.company_id) || null,
      requestedDate: date,
      reason,
      notes: notes.trim() || undefined,
    });
    setBusy(false);
    if (res.ok) {
      Alert.alert('Requested', `Pickup request ${res.request_number} sent to your provider.`);
      setNotes('');
      await load();
    } else {
      Alert.alert('Failed', res.error ?? 'Could not submit request.');
    }
  };

  return (
        <Screen scroll keyboard>
      <Rise delay={0}>
        <Text style={styles.label}>Requested date</Text>
        <View style={styles.chipRow}>
          <Pressable style={[styles.chip, date === new Date().toISOString().slice(0, 10) && styles.chipActive]} onPress={() => setDate(new Date().toISOString().slice(0, 10))} accessibilityRole="button">
            <Text style={[styles.chipLabel, date === new Date().toISOString().slice(0, 10) && styles.chipLabelActive]}>Today</Text>
          </Pressable>
          <Pressable style={[styles.chip, date === tomorrow && styles.chipActive]} onPress={() => setDate(tomorrow)} accessibilityRole="button">
            <Text style={[styles.chipLabel, date === tomorrow && styles.chipLabelActive]}>Tomorrow</Text>
          </Pressable>
        </View>
        <TextInput style={styles.input} value={date} onChangeText={(v) => setDate(v.replace(/[^\d-]/g, ''))} placeholder="YYYY-MM-DD" placeholderTextColor={colors.text.muted} />

        <Text style={styles.label}>Reason</Text>
        <View style={styles.reasonWrap}>
          {REASONS.map((r) => (
            <Pressable key={r} style={[styles.reasonChip, reason === r && styles.reasonChipActive]} onPress={() => setReason(r)} accessibilityRole="button">
              <Text style={[styles.reasonLabel, reason === r && styles.reasonLabelActive]}>{r}</Text>
            </Pressable>
          ))}
        </View>

        <Text style={styles.label}>Notes (optional)</Text>
        <TextInput style={[styles.input, styles.area]} value={notes} onChangeText={setNotes} placeholder="Anything the driver should know…" placeholderTextColor={colors.text.muted} multiline />

        <Pressable style={[styles.cta, !canSubmit && styles.ctaDisabled]} onPress={submit} disabled={!canSubmit} accessibilityRole="button" accessibilityLabel="Send pickup request">
          {busy ? <ActivityIndicator color={colors.text.inverse} /> : <><CalendarPlus size={18} color={colors.text.inverse} /><Text style={styles.ctaLabel}>Send request</Text></>}
        </Pressable>
        <Text style={styles.note}>Your provider reviews it, sets a fee, and sends an invoice. Once paid, they assign a driver & truck.</Text>
      </Rise>

      <Rise delay={120}>
        <Text style={styles.sectionTitle}>My pickup requests</Text>
        {loading ? (
          <ActivityIndicator size="small" color={colors.brand[500]} style={{ paddingVertical: sp.x6 }} />
        ) : requests.length === 0 ? (
          <Text style={styles.none}>No pickup requests yet.</Text>
        ) : (
          requests.map((r) => (
            <View key={r.id} style={styles.reqCard}>
              <View style={styles.reqTop}>
                <View style={styles.reqIcon}>
                  {r.status === 'COMPLETED' ? <CircleCheck size={16} color={colors.state.success} />
                    : r.status === 'REJECTED' || r.status === 'CANCELLED' ? <CircleX size={16} color={colors.state.danger} />
                    : <Truck size={16} color={colors.brand[400]} />}
                </View>
                <View style={styles.reqMain}>
                  <Text style={styles.reqTitle}>{r.reason}</Text>
                  <Text style={styles.reqSub}>{r.request_number} · {r.requested_date ? dayLabel(r.requested_date) : ''}</Text>
                </View>
                <StatusPill value={r.status} />
              </View>
              <View style={styles.reqFooter}>
                <Clock size={12} color={colors.text.muted} />
                <Text style={styles.reqFooterText}>{nextAction(r.status)}</Text>
                {r.fee_amount != null ? <Text style={styles.reqFee}>{naira(r.fee_amount)}</Text> : null}
              </View>
                            {(r.status === 'INVOICE_SENT' || r.status === 'PAYMENT_PENDING' || r.status === 'PAYMENT_FAILED') ? (
                <Pressable
                  style={styles.payBtn}
                  onPress={async () => {
                    if (!r.invoice_id) { Alert.alert('No invoice', 'Invoice not created yet.'); return; }
                    Alert.alert('Pay invoice', `₦${r.fee_amount?.toLocaleString() || 0} for on-demand pickup?`, [
                      { text: 'Cancel', style: 'cancel' },
                      { text: 'Pay now', onPress: async () => {
                        setBusy(true);
                        const res = await settleInvoice(r.invoice_id!);
                        setBusy(false);
                        if (res.ok) {
                          Alert.alert('Paid', 'Pickup request paid.');
                          await load();
                        } else if (res.reason === 'insufficient_wallet') {
                          Alert.alert('Insufficient balance', 'Top up your wallet to pay.');
                        } else {
                          Alert.alert('Failed', res.error ?? 'Could not pay.');
                        }
                      }},
                    ]);
                  }}
                  accessibilityRole="button"
                >
                  <CreditCard size={16} color={colors.text.inverse} />
                  <Text style={styles.payLabel}>Pay ₦{r.fee_amount?.toLocaleString() || 0}</Text>
                </Pressable>
              ) : null}
            </View>
          ))
        )}
      </Rise>
    </Screen>
  );
}

const styles = StyleSheet.create({
  label: { ...text.label, fontSize: 10, color: colors.text.secondary, marginTop: sp.x4, marginBottom: sp.x2 },
  chipRow: { flexDirection: 'row', gap: sp.x2, marginBottom: sp.x2 },
  chip: { paddingHorizontal: sp.x4, paddingVertical: sp.x2, borderRadius: radius.lg, backgroundColor: colors.material.surface, borderWidth: 1, borderColor: colors.material.border },
  chipActive: { backgroundColor: colors.material.emerald, borderColor: colors.brand[500] },
  chipLabel: { ...text.semibold, fontSize: 12, color: colors.text.secondary },
  chipLabelActive: { color: colors.text.primary },
  input: { backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border.subtle, paddingHorizontal: sp.x4, height: touch.field, ...text.bodyM, color: colors.text.primary },
  area: { minHeight: 72, textAlignVertical: 'top', paddingVertical: sp.x3 },
  reasonWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: sp.x2 },
  reasonChip: { paddingHorizontal: sp.x3, paddingVertical: sp.x2, borderRadius: radius.lg, backgroundColor: colors.material.surface, borderWidth: 1, borderColor: colors.material.border },
  reasonChipActive: { backgroundColor: colors.material.emerald, borderColor: colors.brand[500] },
  reasonLabel: { ...text.bodyS, color: colors.text.secondary },
  reasonLabelActive: { color: colors.text.primary },
  cta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: sp.x2, backgroundColor: colors.brand[600], borderRadius: radius.xl, height: touch.cta, marginTop: sp.x5 },
  ctaDisabled: { opacity: 0.45 },
  ctaLabel: { ...text.button, color: colors.text.inverse },
  note: { ...text.bodyS, color: colors.text.muted, textAlign: 'center', marginTop: sp.x3 },
  sectionTitle: { ...text.label, color: colors.text.muted, marginTop: sp.x7, marginBottom: sp.x3 },
  none: { ...text.bodyM, color: colors.text.muted },
  reqCard: { backgroundColor: colors.surface, borderRadius: radius.xl, padding: sp.x4, borderWidth: 1, borderColor: colors.border.subtle, marginBottom: sp.x3 },
  reqTop: { flexDirection: 'row', alignItems: 'center', gap: sp.x3 },
  reqIcon: { width: 36, height: 36, borderRadius: radius.md, backgroundColor: colors.material.surfaceStrong, alignItems: 'center', justifyContent: 'center' },
  reqMain: { flex: 1 },
  reqTitle: { ...text.semibold, color: colors.text.primary },
  reqSub: { ...text.bodyS, color: colors.text.muted, marginTop: 1 },
  reqFooter: { flexDirection: 'row', alignItems: 'center', gap: sp.x2, marginTop: sp.x3 },
  reqFooterText: { flex: 1, ...text.bodyS, color: colors.text.muted },
  reqFee: { ...text.semibold, fontSize: 13, color: colors.brand[400] },
  payBtn: { marginTop: sp.x3, backgroundColor: colors.card.amber, borderRadius: radius.lg, paddingVertical: sp.x3, alignItems: 'center' },
  payLabel: { ...text.button, color: colors.text.inverse },
});