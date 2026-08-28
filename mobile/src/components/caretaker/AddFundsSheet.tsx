import { useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, Modal, Pressable, Alert,
  ActivityIndicator, AppState, Linking, TextInput,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X, Landmark, CreditCard, CheckCircle2, ExternalLink } from 'lucide-react-native';
import { initializeWalletTopUp, verifyTopUp } from '../../services/wallet';
import { useCaretakerStore } from '../../store/caretakerStore';
import { supabase } from '../../services/supabase';
import { naira } from '../../services/format';
import { colors } from '../../theme/colors';
import { radius, sp, touch } from '../../theme/spacing';
import { text } from '../../theme/typography';

const AMOUNTS = [1000, 2500, 5000, 10000, 20000];

interface Props { onClose: () => void; onSuccess: () => void; }

export function AddFundsSheet({ onClose, onSuccess }: Props) {
  const insets = useSafeAreaInsets();
  const building = useCaretakerStore((s) => s.building);
  const paymentMethods = useCaretakerStore((s) => s.paymentMethods);
  const load = useCaretakerStore((s) => s.load);

  const hasBank = paymentMethods.some((m) => m.instrument_type === 'bank_account');

  const [chip, setChip] = useState<number | null>(5000);
  const [custom, setCustom] = useState('');
  const [busy, setBusy] = useState(false);
  const [awaiting, setAwaiting] = useState(false);
  const [reference, setReference] = useState<string | null>(null);
  const [authUrl, setAuthUrl] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);
  const verifyingRef = useRef(false);

  // NAIRA — the value the user typed. Backend converts to kobo (*100), exactly like the PWA.
  const amount = custom ? Number(custom.replace(/\D/g, '')) : chip ?? 0;

  const verify = async (silent = false) => {
    if (!reference || verifyingRef.current) return;
    verifyingRef.current = true;
    setVerifying(true);
    try {
      const res = await verifyTopUp(reference);
      if (res.ok) {
        await load(true);
        Alert.alert('Wallet funded', `${naira(amount)} added to your wallet.`, [
          { text: 'OK', onPress: () => { onSuccess(); onClose(); } },
        ]);
      } else if (!silent) {
        Alert.alert('Not confirmed yet', 'Paystack may still be processing. Wait a few seconds and try again.');
      }
    } catch {
      if (!silent) Alert.alert('Network error', 'Check your connection and try again.');
    }
    verifyingRef.current = false;
    setVerifying(false);
  };

  // Auto-verify when the user returns from the browser
  useEffect(() => {
    const sub = AppState.addEventListener('change', (s) => {
      if (s === 'active' && awaiting) setTimeout(() => verify(true), 1500);
    });
    return () => sub.remove();
  }, [awaiting, reference]);

  const start = async () => {
    if (!amount || amount < 100) { Alert.alert('Enter amount', 'Minimum top-up is ₦100.'); return; }
    if (!building?.custom_id) { Alert.alert('No building', 'Link a building first.'); return; }
    setBusy(true);
    try {
      const { data } = await supabase.auth.getSession();
      const email = data.session?.user?.email;
      if (!email) { Alert.alert('Session', 'Sign in again to add funds.'); setBusy(false); return; }

      // Mirrors PWA CheckoutSheet: amount in NAIRA, purpose 'topup' (set in wallet.ts).
      // Bank linked → bank channel primary; else all channels (card/bank/ussd).
      const { authorizationUrl, reference: ref } = await initializeWalletTopUp({
        buildingId: building.custom_id,
        email,
        amountNaira: amount,
        method: hasBank ? 'bank' : undefined,
      });
      setReference(ref);
      setAuthUrl(authorizationUrl);
      setAwaiting(true);
      Linking.openURL(authorizationUrl);
    } catch (e: any) {
      Alert.alert('Failed', e.message ?? 'Could not start checkout.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal visible animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={styles.root}>
        <View style={[styles.header, { paddingTop: insets.top + sp.x2 }]}>
          <Text style={styles.title}>Add funds</Text>
          <Pressable onPress={onClose} style={styles.close} accessibilityRole="button" accessibilityLabel="Close">
            <X size={22} color={colors.text.primary} />
          </Pressable>
        </View>

        <View style={styles.content}>
          {!awaiting ? (
            <>
              <Text style={styles.label}>Amount</Text>

              <View style={styles.chipRow}>
                {AMOUNTS.map((c) => (
                  <Pressable
                    key={c}
                    style={[styles.chip, chip === c && !custom && styles.chipActive]}
                    onPress={() => { setChip(c); setCustom(''); }}
                    accessibilityRole="button"
                  >
                    <Text style={[styles.chipLabel, chip === c && !custom && styles.chipLabelActive]}>{naira(c)}</Text>
                  </Pressable>
                ))}
              </View>

              <View style={styles.customBox}>
                <Text style={styles.nairaSign}>₦</Text>
                <TextInput
                  style={styles.customInput}
                  value={custom}
                  onChangeText={(v) => setCustom(v.replace(/[^\d]/g, ''))}
                  placeholder="Custom amount"
                  keyboardType="number-pad"
                  placeholderTextColor={colors.text.muted}
                />
              </View>

              {/* Source detection */}
              <View style={styles.sourceRow}>
                {hasBank ? <Landmark size={16} color={colors.brand[400]} /> : <CreditCard size={16} color={colors.brand[400]} />}
                <Text style={styles.sourceText}>
                  {hasBank
                    ? 'Linked bank detected — bank transfer is primary.'
                    : "No linked bank — you'll pay via Paystack checkout (card / bank / ussd)."}
                </Text>
              </View>

              <Pressable
                style={[styles.cta, (!amount || amount < 100 || busy) && styles.ctaDisabled]}
                onPress={start}
                disabled={!amount || amount < 100 || busy}
                accessibilityRole="button"
                accessibilityLabel="Continue to Paystack"
              >
                {busy ? <ActivityIndicator color={colors.text.inverse} /> : <Text style={styles.ctaLabel}>Continue · {naira(amount || 0)}</Text>}
              </Pressable>

              <Text style={styles.note}>Checkout opens in your browser · secured by Paystack · card details never touch Trakbin.</Text>
            </>
          ) : (
            <>
              <View style={styles.awaitIcon}><CheckCircle2 size={26} color={colors.brand[400]} /></View>
              <Text style={styles.awaitTitle}>Complete payment in your browser</Text>
              <Text style={styles.awaitBody}>
                Paystack opened in your browser for {naira(amount)}. Return here when done — we'll confirm automatically.
              </Text>

              <Pressable style={styles.cta} onPress={() => verify(false)} disabled={verifying} accessibilityRole="button" accessibilityLabel="I have completed payment">
                {verifying ? <ActivityIndicator color={colors.text.inverse} /> : <Text style={styles.ctaLabel}>I've completed payment</Text>}
              </Pressable>

              <Pressable style={styles.reopen} onPress={() => authUrl && Linking.openURL(authUrl)} accessibilityRole="button" accessibilityLabel="Reopen checkout">
                <ExternalLink size={15} color={colors.text.primary} />
                <Text style={styles.reopenLabel}>Reopen checkout</Text>
              </Pressable>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: sp.x5,
    paddingBottom: sp.x4,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.subtle,
  },
  title: { ...text.titleM, color: colors.text.primary },
  close: { padding: sp.x1 },
  content: { padding: sp.x5 },

  label: { ...text.label, fontSize: 10, color: colors.text.secondary, marginBottom: sp.x2 },

  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: sp.x2, marginBottom: sp.x3 },
  chip: {
    paddingHorizontal: sp.x4,
    paddingVertical: sp.x3,
    borderRadius: radius.lg,
    backgroundColor: colors.material.surface,
    borderWidth: 1,
    borderColor: colors.material.border,
  },
  chipActive: { backgroundColor: colors.material.emerald, borderColor: colors.brand[500] },
  chipLabel: { ...text.semibold, fontSize: 13, color: colors.text.secondary },
  chipLabelActive: { color: colors.text.primary },

  customBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: colors.border.subtle,
    paddingHorizontal: sp.x4,
    height: touch.field,
    marginBottom: sp.x4,
  },
  nairaSign: { ...text.titleS, color: colors.brand[400], marginRight: sp.x2 },
  customInput: { flex: 1, ...text.bodyL, color: colors.text.primary },

  sourceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: sp.x2,
    backgroundColor: colors.material.surface,
    borderRadius: radius.lg,
    padding: sp.x3,
    marginBottom: sp.x4,
    borderWidth: 1,
    borderColor: colors.material.border,
  },
  sourceText: { flex: 1, ...text.bodyS, color: colors.text.secondary },

  cta: {
    backgroundColor: colors.brand[600],
    borderRadius: radius.xl,
    height: touch.cta,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaDisabled: { opacity: 0.45 },
  ctaLabel: { ...text.button, color: colors.text.inverse },
  note: { ...text.bodyS, color: colors.text.muted, textAlign: 'center', marginTop: sp.x4 },

  awaitIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.material.emerald,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: sp.x4,
  },
  awaitTitle: { ...text.titleM, color: colors.text.primary, textAlign: 'center' },
  awaitBody: { ...text.bodyM, color: colors.text.muted, textAlign: 'center', marginTop: sp.x3, marginBottom: sp.x5 },

  reopen: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: sp.x2,
    paddingVertical: sp.x3,
    marginTop: sp.x3,
  },
  reopenLabel: { ...text.semibold, fontSize: 13, color: colors.text.primary },
});