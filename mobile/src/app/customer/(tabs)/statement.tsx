import { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { CreditCard, Landmark, Plus, Zap, Trash2 } from 'lucide-react-native';
import { TabScreen } from '../../../components/layout/TabScreen';
import { StatusPill } from '../../../components/ui/StatusPill';
import { Rise } from '../../../components/ui/motion';
import { LinkBankSheet } from '../../../components/caretaker/LinkBankSheet';
import { useCaretakerStore } from '../../../store/caretakerStore';
import { settleInvoice, fetchLedger, deletePaymentMethod } from '../../../services/caretaker';
import { dayLabel, naira, dateTime } from '../../../services/format';
import { colors } from '../../../theme/colors';
import { radius, sp } from '../../../theme/spacing';
import { text } from '../../../theme/typography';

type Seg = 'invoices' | 'history' | 'methods';

/** Last-4 digits of a saved card, tolerant of whichever column the backend used. */
/** Last-4 digits of a saved card or bank, matching the PWA schema exactly. */
const last4Of = (m: any) => {
  if (m.instrument_type === 'card') {
    return String(m.card_last_four ?? '').replace(/\D/g, '').slice(-4);
  }
  return String(m.account_last4 ?? m.account_number ?? '').replace(/\D/g, '').slice(-4);
};

export default function BillingScreen() {
  const router = useRouter();
  const { invoices, outstandingTotal, nextDueDate, paymentMethods, building, loading, loaded, load } =
    useCaretakerStore();

  const [seg, setSeg] = useState<Seg>('invoices');
  const [showAllInv, setShowAllInv] = useState(false);
  const [showAllHist, setShowAllHist] = useState(false);
  const [ledger, setLedger] = useState<any[]>([]);
  const [showLinkBank, setShowLinkBank] = useState(false);
  const [paying, setPaying] = useState(false);

  useEffect(() => { load(); }, []);
  useEffect(() => {
    if (building?.custom_id) fetchLedger(building.custom_id).then(setLedger);
  }, [building?.custom_id]);

  const outstanding = useMemo(
    () => invoices.filter((i) => i.status !== 'paid' && i.status !== 'cancelled'),
    [invoices]
  );
  const nextInvoice = useMemo(
    () => [...outstanding].sort((a, b) => String(a.due_date).localeCompare(String(b.due_date)))[0] ?? null,
    [outstanding]
  );

  // Composed activity feed: money movement + payment-method actions
  const activity = useMemo(() => {
    const money = ledger.map((l) => ({
      id: `l-${l.id}`, kind: 'money' as const,
      title: l.type ?? 'Transaction',
      sub: dateTime(l.created_at),
      amount: l.amount ?? null,
      date: l.created_at,
      method: null as string | null,
    }));
    const methods = paymentMethods.map((m) => ({
      id: `m-${m.id}`, kind: 'method' as const,
      title: m.instrument_type === 'card'
        ? `Card added · ${m.bank_name ?? 'Card'} •••• ${last4Of(m)}`
        : `Bank linked · ${m.bank_name ?? ''}`,
      sub: dateTime(m.created_at),
      amount: null as number | null,
      date: m.created_at,
      method: m.instrument_type,
    }));
    return [...money, ...methods].sort((a, b) => String(b.date).localeCompare(String(a.date)));
  }, [ledger, paymentMethods]);

  const payNext = async () => {
    if (!nextInvoice) return;
    setPaying(true);
    const res = await settleInvoice(nextInvoice.id);
    setPaying(false);
    if (res.ok) { Alert.alert('Paid', 'Invoice settled from your wallet.'); load(true); }
    else if (res.reason === 'insufficient_wallet') Alert.alert('Insufficient balance', 'Top up your wallet to pay this invoice.');
    else if (res.reason === 'no_provider_assigned') Alert.alert('Held', 'No provider assigned yet — invoice stays pending.');
    else Alert.alert('Failed', res.error ?? 'Could not pay.');
  };

  const removeMethod = (m: any) => {
    Alert.alert('Remove method?', `${m.bank_name ?? ''} ${m.account_number ?? ''}`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: async () => { await deletePaymentMethod(m.id); load(true); } },
    ]);
  };

  const invList = showAllInv ? invoices : invoices.slice(0, 3);
  const actList = showAllHist ? activity : activity.slice(0, 3);

  return (
    <TabScreen>
      {/* OUTSTANDING */}
      <Rise delay={0}>
        {outstandingTotal > 0 ? (
          <View style={styles.outstandingActive}>
            <Text style={styles.outLabel}>Outstanding balance</Text>
            <Text style={styles.outValue}>{naira(outstandingTotal)}</Text>
            <Text style={styles.outSub}>
              {nextDueDate ? `Next due ${dayLabel(nextDueDate)}` : `${outstanding.length} invoice${outstanding.length > 1 ? 's' : ''}`}
            </Text>
            <Pressable style={styles.payBtn} onPress={payNext} disabled={paying} accessibilityRole="button" accessibilityLabel="Pay now">
              {paying ? <ActivityIndicator color={colors.card.amber} /> : <Text style={styles.payLabel}>Pay now</Text>}
            </Pressable>
          </View>
        ) : (
          <View style={styles.outstandingInactive}>
            <Text style={styles.outLabelMuted}>Outstanding balance</Text>
            <Text style={styles.outValueMuted}>{naira(0)}</Text>
            <Text style={styles.outSubMuted}>Nothing due — you're all settled.</Text>
          </View>
        )}
      </Rise>

      {/* AUTOPAY */}
      <Rise delay={70}>
        <Pressable style={styles.autopayRow} onPress={() => router.push('/customer/autopay')} accessibilityRole="button" accessibilityLabel="Manage autopay">
          <View style={styles.autopayIcon}><Zap size={18} color={colors.brand[400]} /></View>
          <View style={styles.autopayMain}>
            <Text style={styles.autopayLabel}>Autopay</Text>
            <Text style={styles.autopaySub}>{building?.autopay_enabled ? `On · from ${building.autopay_source}` : 'Off · pay manually'}</Text>
          </View>
          <StatusPill value={building?.autopay_enabled ? 'active' : 'paused'} />
        </Pressable>
      </Rise>

      {/* SEGMENTED TABS */}
      <Rise delay={140}>
        <View style={styles.segRow}>
          {(['invoices', 'history', 'methods'] as Seg[]).map((s) => (
            <Pressable key={s} style={[styles.segBtn, seg === s && styles.segBtnActive]} onPress={() => setSeg(s)} accessibilityRole="button">
              <Text style={[styles.segLabel, seg === s && styles.segLabelActive]}>
                {s === 'invoices' ? 'Invoices' : s === 'history' ? 'History' : 'Methods'}
              </Text>
            </Pressable>
          ))}
        </View>
      </Rise>

      {/* INVOICES */}
      {seg === 'invoices' ? (
        <Rise delay={180}>
          {!loaded || loading ? (
            <ActivityIndicator size="large" color={colors.brand[500]} style={styles.loader} />
          ) : (
            <>
              {invoices.length === 0 ? (
                <Text style={styles.none}>No invoices yet.</Text>
              ) : (
                invList.map((i) => (
                  <View key={i.id} style={styles.row}>
                    <View style={styles.rowMain}>
                      <Text style={styles.rowTitle}>{naira(i.amount)}</Text>
                      <Text style={styles.rowSub} numberOfLines={1}>{i.description ?? 'Waste service'}</Text>
                    </View>
                    <View style={styles.rowRight}>
                      <Text style={styles.rowSub}>{i.due_date ? dayLabel(i.due_date) : ''}</Text>
                      <StatusPill value={i.status ?? 'pending'} />
                    </View>
                  </View>
                ))
              )}
              {invoices.length > 3 ? (
                <Pressable style={styles.viewAll} onPress={() => setShowAllInv((v) => !v)} accessibilityRole="button">
                  <Text style={styles.viewAllLabel}>{showAllInv ? 'Show less' : `View all (${invoices.length})`}</Text>
                </Pressable>
              ) : null}
            </>
          )}
        </Rise>
      ) : null}

      {/* HISTORY — composed activity feed */}
      {seg === 'history' ? (
        <Rise delay={180}>
          {activity.length === 0 ? (
            <Text style={styles.none}>No payment activity yet.</Text>
          ) : (
            actList.map((a) => (
              <View key={a.id} style={styles.row}>
                <View style={styles.methodIcon}>
                  {a.kind === 'method'
                    ? (a.method === 'card' ? <CreditCard size={16} color={colors.brand[400]} /> : <Landmark size={16} color={colors.brand[400]} />)
                    : <Zap size={16} color={colors.brand[400]} />}
                </View>
                <View style={styles.rowMain}>
                  <Text style={styles.rowTitle}>{a.title}</Text>
                  <Text style={styles.rowSub} numberOfLines={1}>{a.sub}</Text>
                </View>
                {a.amount != null ? <Text style={styles.rowAmount}>{naira(Math.abs(a.amount))}</Text> : null}
              </View>
            ))
          )}
          {activity.length > 3 ? (
            <Pressable style={styles.viewAll} onPress={() => setShowAllHist((v) => !v)} accessibilityRole="button">
              <Text style={styles.viewAllLabel}>{showAllHist ? 'Show less' : `View all (${activity.length})`}</Text>
            </Pressable>
          ) : null}
        </Rise>
      ) : null}

      {/* METHODS */}
      {seg === 'methods' ? (
        <Rise delay={180}>
          {paymentMethods.length === 0 ? (
            <Text style={styles.none}>No payment methods yet.</Text>
          ) : (
            paymentMethods.map((m) => (
              <View key={m.id} style={styles.row}>
                <View style={styles.methodIcon}>
                  {m.instrument_type === 'card' ? <CreditCard size={16} color={colors.brand[400]} /> : <Landmark size={16} color={colors.brand[400]} />}
                </View>
                <View style={styles.rowMain}>
                  <Text style={styles.rowTitle}>
                    {m.instrument_type === 'card'
                      ? `${m.bank_name ?? 'Card'} •••• ${last4Of(m) || '····'}`
                      : (m.bank_name ?? 'Bank')}
                  </Text>
                  <Text style={styles.rowSub}>
                    {m.instrument_type === 'card' ? (m.account_name ?? 'Card') : (m.account_number ?? '')}
                  </Text>
                </View>
                {m.is_default ? <StatusPill value="active" /> : null}
                <Pressable style={styles.delBtn} onPress={() => removeMethod(m)} accessibilityRole="button" accessibilityLabel="Delete method">
                  <Trash2 size={16} color={colors.state.danger} />
                </Pressable>
              </View>
            ))
          )}

          <View style={styles.addRow}>
            <Pressable style={[styles.addBtn, styles.addBtnEmerald]} onPress={() => router.push('/customer/add-card')} accessibilityRole="button" accessibilityLabel="Add card">
              <Plus size={16} color={colors.text.inverse} />
              <Text style={styles.addLabel}>Add card</Text>
            </Pressable>
            <Pressable style={[styles.addBtn, styles.addBtnSlate]} onPress={() => setShowLinkBank(true)} accessibilityRole="button" accessibilityLabel="Link bank">
              <Landmark size={16} color={colors.text.primary} />
              <Text style={[styles.addLabel, { color: colors.text.primary }]}>Link bank</Text>
            </Pressable>
          </View>
        </Rise>
      ) : null}

      {showLinkBank ? <LinkBankSheet onClose={() => setShowLinkBank(false)} onSuccess={() => load(true)} /> : null}
    </TabScreen>
  );
}

const styles = StyleSheet.create({
  loader: { marginTop: sp.x8 },

  outstandingActive: {
    backgroundColor: colors.card.amber,
    borderRadius: radius.xxl,
    padding: sp.x5,
    shadowColor: colors.card.amber,
    shadowOpacity: 0.4,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 5,
  },
  outLabel: { ...text.label, fontSize: 10, color: 'rgba(255,255,255,0.8)' },
  outValue: { ...text.display, color: colors.text.inverse, marginTop: sp.x2 },
  outSub: { ...text.bodyS, color: 'rgba(255,255,255,0.85)', marginTop: sp.x1 },
  payBtn: { marginTop: sp.x4, backgroundColor: 'rgba(255,255,255,0.96)', borderRadius: radius.lg, paddingVertical: sp.x3, alignItems: 'center' },
  payLabel: { ...text.button, color: colors.card.amber },

  outstandingInactive: {
    backgroundColor: colors.card.graphite,
    borderRadius: radius.xxl,
    padding: sp.x5,
    borderWidth: 1,
    borderColor: colors.border.subtle,
  },
  outLabelMuted: { ...text.label, fontSize: 10, color: colors.text.muted },
  outValueMuted: { ...text.display, color: colors.text.muted, marginTop: sp.x2 },
  outSubMuted: { ...text.bodyS, color: colors.text.muted, marginTop: sp.x1 },

  autopayRow: { flexDirection: 'row', alignItems: 'center', gap: sp.x3, backgroundColor: colors.material.surface, borderRadius: radius.xl, padding: sp.x4, marginTop: sp.x4, borderWidth: 1, borderColor: colors.material.border },
  autopayIcon: { width: 38, height: 38, borderRadius: radius.md, backgroundColor: colors.material.surfaceStrong, alignItems: 'center', justifyContent: 'center' },
  autopayMain: { flex: 1 },
  autopayLabel: { ...text.semibold, color: colors.text.primary },
  autopaySub: { ...text.bodyS, color: colors.text.muted, marginTop: 1 },

  segRow: { flexDirection: 'row', gap: sp.x2, backgroundColor: colors.material.surface, borderRadius: radius.lg, padding: sp.x1, marginTop: sp.x5 },
  segBtn: { flex: 1, paddingVertical: sp.x2, alignItems: 'center', borderRadius: radius.md },
  segBtnActive: { backgroundColor: colors.brand[600] },
  segLabel: { ...text.label, fontSize: 10, color: colors.text.muted },
  segLabelActive: { color: colors.text.inverse },

  row: { flexDirection: 'row', alignItems: 'center', gap: sp.x3, backgroundColor: colors.surface, borderRadius: radius.xl, padding: sp.x4, marginTop: sp.x3, borderWidth: 1, borderColor: colors.border.subtle },
  rowMain: { flex: 1 },
  rowTitle: { ...text.semibold, color: colors.text.primary },
  rowSub: { ...text.bodyS, color: colors.text.muted, marginTop: 2 },
  rowRight: { alignItems: 'flex-end', gap: sp.x1 },
  rowAmount: { ...text.titleS, color: colors.brand[400] },
  methodIcon: { width: 36, height: 36, borderRadius: radius.md, backgroundColor: colors.material.surfaceStrong, alignItems: 'center', justifyContent: 'center' },
  delBtn: { width: 34, height: 34, borderRadius: radius.md, backgroundColor: colors.state.dangerSoft, alignItems: 'center', justifyContent: 'center' },

  viewAll: { alignItems: 'center', paddingVertical: sp.x3, marginTop: sp.x3 },
  viewAllLabel: { ...text.semibold, fontSize: 13, color: colors.brand[400] },
  none: { ...text.bodyM, color: colors.text.muted, marginTop: sp.x4 },

  addRow: { flexDirection: 'row', gap: sp.x3, marginTop: sp.x4 },
  addBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: sp.x2, borderRadius: radius.xl, paddingVertical: sp.x4 },
  addBtnEmerald: { backgroundColor: colors.card.emerald },
  addBtnSlate: { backgroundColor: colors.card.slate },
  addLabel: { ...text.semibold, fontSize: 14, color: colors.text.inverse },
});