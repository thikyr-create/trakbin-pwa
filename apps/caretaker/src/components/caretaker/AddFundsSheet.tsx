import { useRef, useState } from 'react';
import {
  View, Text, StyleSheet, Modal, Pressable, Alert,
  ActivityIndicator, TextInput,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X, Landmark, CreditCard, Wallet, Zap } from 'lucide-react-native';
import { initializeWalletTopUp, verifyTopUp, topUpWithSavedCard } from '../../services/wallet';
import { useCaretakerStore } from '../../store/caretakerStore';
import { supabase } from '../../services/supabase';
import { naira } from '../../services/format';
import { colors } from '../../theme/colors';
import { radius, sp, touch } from '../../theme/spacing';
import { text } from '../../theme/typography';
import PaystackSheet from '../payments/PaystackSheet';

const AMOUNTS = [1000, 2500, 5000, 10000, 20000];

type Selection = { type: 'card' | 'bank'; id: string } | { type: 'checkout' };

interface Props { onClose: () => void; onSuccess: () => void; }

export function AddFundsSheet({ onClose, onSuccess }: Props) {
  const insets = useSafeAreaInsets();
  const building = useCaretakerStore((s) => s.building);
  const paymentMethods = useCaretakerStore((s) => s.paymentMethods);
  const load = useCaretakerStore((s) => s.load);

  const cards = paymentMethods.filter((m: any) => m.instrument_type === 'card');
  const banks = paymentMethods.filter((m: any) => m.instrument_type === 'bank_account');

  const [chip, setChip] = useState<number | null>(5000);
  const [custom, setCustom] = useState('');
  const [busy, setBusy] = useState(false);
  const [authUrl, setAuthUrl] = useState<string | null>(null);
  const [sheetTitle, setSheetTitle] = useState<string>('Secure checkout');
  const amountRef = useRef(0);

  // Quick-pay default: fastest instrument first (one-tap card), else checkout
  const [sel, setSel] = useState<Selection>(() => {
    const oneTap = cards.find((c: any) => c.authorization_code);
    return oneTap ? { type: 'card', id: oneTap.id } : { type: 'checkout' };
  });

  const amount = custom ? Number(custom.replace(/\D/g, '')) : chip ?? 0;

  const handleRedirect = async (reference: string) => {
    setAuthUrl(null);
    try {
      const res = await verifyTopUp(reference);
      if (res.ok) {
        await load(true);
        Alert.alert('Wallet funded', `${naira(amountRef.current)} added to your wallet.`, [
          { text: 'OK', onPress: () => { onSuccess(); onClose(); } },
        ]);
      } else {
        Alert.alert('Not confirmed yet', 'Paystack may still be processing. Wait a few seconds and try again.');
      }
    } catch {
      Alert.alert('Network error', 'Check your connection and try again.');
    }
  };

  const chargeCard = async (card: any) => {
    setBusy(true);
    try {
      const { data } = await supabase.auth.getSession();
      const email = data.session?.user?.email;
      if (!email) { Alert.alert('Session', 'Sign in again to add funds.'); setBusy(false); return; }
      if (!building?.custom_id) { Alert.alert('No building', 'Link a building first.'); setBusy(false); return; }

      const res = await topUpWithSavedCard({
        buildingId: building.custom_id,
        amountNaira: amount,
        authorizationCode: card.authorization_code,
        email,
      });

      if (res.ok) {
        await load(true);
        Alert.alert('Wallet funded', `${naira(amount)} charged to ${card.card_brand ?? 'card'} •••• ${card.card_last_four}.`, [
          { text: 'OK', onPress: () => { onSuccess(); onClose(); } },
        ]);
      } else {
        Alert.alert('Payment failed', res.error || 'Could not charge saved card. Try another option.');
      }
    } catch (e: any) {
      Alert.alert('Failed', e.message ?? 'Could not charge saved card.');
    } finally {
      setBusy(false);
    }
  };

  const start = async () => {
    if (!amount || amount < 100) { Alert.alert('Enter amount', 'Minimum top-up is ₦100.'); return; }
    if (!building?.custom_id) { Alert.alert('No building', 'Link a building first.'); return; }

    // One-tap: selected card with authorization code → charge directly
    if (sel.type === 'card') {
      const card = cards.find((c: any) => c.id === sel.id);
      if (card?.authorization_code) { await chargeCard(card); return; }
    }

    // Everything else → Paystack checkout (bank selection restricts to bank channels)
    setBusy(true);
    try {
      const { data } = await supabase.auth.getSession();
      const email = data.session?.user?.email;
      if (!email) { Alert.alert('Session', 'Sign in again to add funds.'); setBusy(false); return; }

      const { authorizationUrl } = await initializeWalletTopUp({
        buildingId: building.custom_id,
        email,
        amountNaira: amount,
        method: sel.type === 'bank' ? 'bank' : undefined,
      });
      amountRef.current = amount;
      setSheetTitle(`Add ${naira(amount)}`);
      setAuthUrl(authorizationUrl);
    } catch (e: any) {
      Alert.alert('Failed', e.message ?? 'Could not start checkout.');
    } finally {
      setBusy(false);
    }
  };

  const selCard = sel.type === 'card' ? cards.find((c: any) => c.id === sel.id) : null;
  const ctaLabel = busy
    ? null
    : selCard?.authorization_code
      ? `Charge •••• ${selCard.card_last_four} · ${naira(amount || 0)}`
      : `Continue · ${naira(amount || 0)}`;

  return (
    <>
      <Modal visible animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
        <View style={styles.root}>
          <View style={[styles.header, { paddingTop: insets.top + sp.x2 }]}>
            <Text style={styles.title}>Add funds</Text>
            <Pressable onPress={onClose} style={styles.close} accessibilityRole="button" accessibilityLabel="Close">
              <X size={22} color={colors.text.primary} />
            </Pressable>
          </View>

          <View style={styles.content}>
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

            {/* ── QUICK PAY — user's real instruments ── */}
            <Text style={styles.sectionLabel}>Pay with</Text>

            {cards.map((card: any) => {
              const active = sel.type === 'card' && sel.id === card.id;
              const oneTap = !!card.authorization_code;
              return (
                <Pressable
                  key={card.id}
                  style={[styles.methodRow, active && styles.methodRowActive]}
                  onPress={() => setSel({ type: 'card', id: card.id })}
                  accessibilityRole="button"
                >
                  <View style={styles.methodIcon}>
                    <CreditCard size={16} color={active ? colors.brand[500] : colors.text.secondary} />
                  </View>
                  <View style={styles.methodMain}>
                    <Text style={styles.methodTitle}>{card.card_brand ?? 'Card'} •••• {card.card_last_four}</Text>
                    <View style={styles.methodSubRow}>
                      {oneTap && <Zap size={11} color={colors.brand[400]} />}
                      <Text style={styles.methodSub}>{oneTap ? 'One-tap charge' : 'Via Paystack checkout'}</Text>
                    </View>
                  </View>
                  <View style={[styles.radio, active && styles.radioActive]} />
                </Pressable>
              );
            })}

            {banks.map((bank: any) => {
              const active = sel.type === 'bank' && sel.id === bank.id;
              return (
                <Pressable
                  key={bank.id}
                  style={[styles.methodRow, active && styles.methodRowActive]}
                  onPress={() => setSel({ type: 'bank', id: bank.id })}
                  accessibilityRole="button"
                >
                  <View style={styles.methodIcon}>
                    <Landmark size={16} color={active ? colors.brand[500] : colors.text.secondary} />
                  </View>
                  <View style={styles.methodMain}>
                    <Text style={styles.methodTitle}>{bank.bank_name ?? 'Bank'} •••• {bank.account_last4 ?? bank.account_number?.slice(-4)}</Text>
                    <Text style={styles.methodSub}>Bank transfer via Paystack</Text>
                  </View>
                  <View style={[styles.radio, active && styles.radioActive]} />
                </Pressable>
              );
            })}

            <Pressable
              style={[styles.methodRow, sel.type === 'checkout' && styles.methodRowActive]}
              onPress={() => setSel({ type: 'checkout' })}
              accessibilityRole="button"
            >
              <View style={styles.methodIcon}>
                <Wallet size={16} color={sel.type === 'checkout' ? colors.brand[500] : colors.text.secondary} />
              </View>
              <View style={styles.methodMain}>
                <Text style={styles.methodTitle}>Paystack checkout</Text>
                <Text style={styles.methodSub}>Card · bank · USSD — all options</Text>
              </View>
              <View style={[styles.radio, sel.type === 'checkout' && styles.radioActive]} />
            </Pressable>

            <Pressable
              style={[styles.cta, (!amount || amount < 100 || busy) && styles.ctaDisabled]}
              onPress={start}
              disabled={!amount || amount < 100 || busy}
              accessibilityRole="button"
              accessibilityLabel="Continue to payment"
            >
              {busy ? <ActivityIndicator color={colors.text.inverse} /> : <Text style={styles.ctaLabel}>{ctaLabel}</Text>}
            </Pressable>

            <Text style={styles.note}>Secured by Paystack · card details never touch Trakbin.</Text>
          </View>
        </View>
      </Modal>

      <PaystackSheet
        visible={!!authUrl}
        authorizationUrl={authUrl}
        title={sheetTitle}
        onRedirect={handleRedirect}
        onClose={() => setAuthUrl(null)}
      />
    </>
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
  sectionLabel: { ...text.label, fontSize: 10, color: colors.text.secondary, marginTop: sp.x4, marginBottom: sp.x2 },

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
  },
  nairaSign: { ...text.titleS, color: colors.brand[400], marginRight: sp.x2 },
  customInput: { flex: 1, ...text.bodyL, color: colors.text.primary },

  methodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: sp.x3,
    backgroundColor: colors.material.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.material.border,
    padding: sp.x3,
    marginBottom: sp.x2,
  },
  methodRowActive: { backgroundColor: colors.material.emerald, borderColor: colors.brand[500] },
  methodIcon: {
    width: 36, height: 36, borderRadius: radius.md,
    backgroundColor: colors.material.surfaceStrong,
    alignItems: 'center', justifyContent: 'center',
  },
  methodMain: { flex: 1 },
  methodTitle: { ...text.semibold, fontSize: 13, color: colors.text.primary },
  methodSubRow: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 1 },
  methodSub: { ...text.bodyXs, color: colors.text.muted },
  radio: {
    width: 18, height: 18, borderRadius: 9,
    borderWidth: 1.5, borderColor: colors.material.border,
  },
  radioActive: { borderColor: colors.brand[500], backgroundColor: colors.brand[500] },

  cta: {
    backgroundColor: colors.brand[600],
    borderRadius: radius.xl,
    height: touch.cta,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: sp.x4,
  },
  ctaDisabled: { opacity: 0.45 },
  ctaLabel: { ...text.button, color: colors.text.inverse },
  note: { ...text.bodyS, color: colors.text.muted, textAlign: 'center', marginTop: sp.x4 },
});