import { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Modal, Pressable, Linking, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CheckCircle2, ExternalLink, X } from 'lucide-react-native';
import { TextField } from '../ui/TextField';
import { initializeWalletTopUp } from '../../services/wallet';
import { supabase } from '../../services/supabase';
import { useCaretakerStore } from '../../store/caretakerStore';
import { naira } from '../../services/format';
import { colors } from '../../theme/colors';
import { radius, sp } from '../../theme/spacing';
import { text } from '../../theme/typography';

const AMOUNTS = [100000, 250000, 500000, 1000000]; // kobo → ₦1k / ₦2.5k / ₦5k / ₦10k
const MIN_KOBO = 10000; // ₦100 floor

interface Props {
  onClose: () => void;
  onSuccess: () => void;
}

export function AddFundsSheet({ onClose, onSuccess }: Props) {
  const insets = useSafeAreaInsets();
  const building = useCaretakerStore((s) => s.building);

  const [chip, setChip] = useState<number>(AMOUNTS[0]);
  const [custom, setCustom] = useState('');
  const [amountError, setAmountError] = useState<string | null>(null);

  const [phase, setPhase] = useState<'amount' | 'waiting' | 'success'>('amount');
  const [reference, setReference] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const balanceBefore = useRef<number>(building?.wallet_balance ?? 0);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  // Effective amount in kobo: custom wins when typed, else the chip
  const customKobo = custom ? Math.round(parseFloat(custom) * 100) : 0;
  const effectiveKobo = custom ? customKobo : chip;

  const stopPolling = () => {
    if (timer.current) {
      clearInterval(timer.current);
      timer.current = null;
    }
  };

  useEffect(() => () => stopPolling(), []);

  const verify = async (ref: string | null): Promise<boolean> => {
    if (ref) {
      const { data } = await supabase
        .from('wallet_transactions')
        .select('*')
        .eq('transaction_ref', ref)
        .maybeSingle();
      if (data && String(data.status).toLowerCase() === 'success') return true;
    }
    if (building?.custom_id) {
      const { data } = await supabase
        .from('Buildings')
        .select('wallet_balance')
        .eq('custom_id', building.custom_id)
        .maybeSingle();
      if ((data?.wallet_balance ?? 0) > balanceBefore.current) return true;
    }
    return false;
  };

  const finish = () => {
    stopPolling();
    setPhase('success');
    onSuccess();
    setTimeout(onClose, 1600);
  };

  const startPolling = (ref: string | null) => {
    stopPolling();
    timer.current = setInterval(async () => {
      if (await verify(ref)) finish();
    }, 5000);
  };

  const start = async () => {
    if (!building?.custom_id) return;
    if (!effectiveKobo || isNaN(effectiveKobo) || effectiveKobo < MIN_KOBO) {
      setAmountError(`Minimum top-up is ${naira(MIN_KOBO / 100)}.`);
      return;
    }
    setAmountError(null);
    setBusy(true);
    balanceBefore.current = building.wallet_balance ?? 0;
    const { data } = await supabase.auth.getSession();
    const email = data.session?.user?.email ?? 'caretaker@trakbin.app';
    const res = await initializeWalletTopUp(building.custom_id, effectiveKobo, email);
    setBusy(false);
    if (res.ok && res.authorizationUrl) {
      setReference(res.reference ?? null);
      setPhase('waiting');
      await Linking.openURL(res.authorizationUrl);
      startPolling(res.reference ?? null);
    } else {
      setAmountError('Could not start checkout. Try again.');
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

        {phase === 'amount' ? (
          <View style={styles.content}>
            <Text style={styles.section}>Quick amounts</Text>
            <View style={styles.grid}>
              {AMOUNTS.map((a) => (
                <Pressable
                  key={a}
                  style={[styles.amountBtn, !custom && chip === a && styles.amountBtnActive]}
                  onPress={() => { setChip(a); setCustom(''); setAmountError(null); }}
                  accessibilityRole="button"
                >
                  <Text style={[styles.amountLabel, !custom && chip === a && styles.amountLabelActive]}>
                    {naira(a / 100)}
                  </Text>
                </Pressable>
              ))}
            </View>

            <Text style={styles.sectionGap}>Or enter any amount</Text>
            <TextField
              label="Custom amount (₦)"
              placeholder="e.g. 1500"
              keyboardType="decimal-pad"
              value={custom}
              onChangeText={(v) => { setCustom(v.replace(/[^\d.]/g, '')); setAmountError(null); }}
              error={amountError}
            />

            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>You'll add</Text>
              <Text style={styles.summaryValue}>{naira(effectiveKobo / 100)}</Text>
            </View>

            <Pressable
              style={[styles.cta, busy && styles.ctaDisabled]}
              onPress={start}
              disabled={busy}
              accessibilityRole="button"
            >
              {busy ? (
                <ActivityIndicator color={colors.text.inverse} />
              ) : (
                <Text style={styles.ctaLabel}>Continue to Paystack</Text>
              )}
            </Pressable>

            <Text style={styles.note}>
              Checkout opens in your browser · secured by Paystack · card details never touch Trakbin.
            </Text>
          </View>
        ) : phase === 'waiting' ? (
          <View style={styles.content}>
            <ActivityIndicator size="large" color={colors.brand[600]} style={styles.spinner} />
            <Text style={styles.waitTitle}>Waiting for payment…</Text>
            <Text style={styles.waitBody}>
              Complete the {naira(effectiveKobo / 100)} checkout in your browser. We'll detect it automatically.
            </Text>
            {reference ? <Text style={styles.ref}>Ref: {reference}</Text> : null}
            <Pressable
              style={styles.verifyBtn}
              onPress={async () => { if (await verify(reference)) finish(); }}
              accessibilityRole="button"
            >
              <ExternalLink size={16} color={colors.brand[700]} />
              <Text style={styles.verifyLabel}>I've paid — verify now</Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.content}>
            <CheckCircle2 size={56} color={colors.state.success} />
            <Text style={styles.waitTitle}>Funds added</Text>
            <Text style={styles.waitBody}>Your wallet has been credited.</Text>
          </View>
        )}
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
  content: { flex: 1, padding: sp.x5 },
  section: { ...text.label, color: colors.text.muted, marginBottom: sp.x3 },
  sectionGap: { ...text.label, color: colors.text.muted, marginTop: sp.x4, marginBottom: sp.x3 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: sp.x3 },
  amountBtn: {
    width: '48%',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    paddingVertical: sp.x4,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.border.subtle,
  },
  amountBtnActive: { borderColor: colors.brand[600], backgroundColor: colors.brand[50] },
  amountLabel: { ...text.titleS, color: colors.text.primary },
  amountLabelActive: { color: colors.brand[700] },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.lg,
    paddingHorizontal: sp.x4,
    paddingVertical: sp.x3,
    marginBottom: sp.x4,
  },
  summaryLabel: { ...text.bodyS, color: colors.text.muted },
  summaryValue: { ...text.titleS, color: colors.brand[700] },
  cta: {
    backgroundColor: colors.brand[600],
    borderRadius: radius.lg,
    paddingVertical: sp.x4,
    alignItems: 'center',
  },
  ctaDisabled: { opacity: 0.5 },
  ctaLabel: { ...text.button, color: colors.text.inverse },
  note: { ...text.bodyS, color: colors.text.muted, textAlign: 'center', marginTop: sp.x4 },
  spinner: { marginTop: sp.x8, marginBottom: sp.x4 },
  waitTitle: { ...text.titleM, color: colors.text.primary, textAlign: 'center' },
  waitBody: { ...text.bodyM, color: colors.text.muted, textAlign: 'center', marginTop: sp.x2 },
  ref: { ...text.mono, color: colors.text.muted, textAlign: 'center', marginTop: sp.x3 },
  verifyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: sp.x2,
    backgroundColor: colors.brand[50],
    borderRadius: radius.lg,
    paddingVertical: sp.x4,
    marginTop: sp.x6,
  },
  verifyLabel: { ...text.semibold, color: colors.brand[700] },
});