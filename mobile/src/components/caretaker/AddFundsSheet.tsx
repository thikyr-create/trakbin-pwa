import { useRef, useState } from 'react';
import {
  View, Text, StyleSheet, Modal, Pressable, Alert,
  ActivityIndicator, TextInput,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X, Landmark, CreditCard, CheckCircle } from 'lucide-react-native';
import { initializeWalletTopUp, verifyTopUp, topUpWithSavedCard } from '../../services/wallet';
import { useCaretakerStore } from '../../store/caretakerStore';
import { supabase } from '../../services/supabase';
import { naira } from '../../services/format';
import { colors } from '../../theme/colors';
import { radius, sp, touch } from '../../theme/spacing';
import { text } from '../../theme/typography';
import PaystackSheet from '../payments/PaystackSheet';

const AMOUNTS = [1000, 2500, 5000, 10000, 20000];

interface Props { onClose: () => void; onSuccess: () => void; }

export function AddFundsSheet({ onClose, onSuccess }: Props) {
  const insets = useSafeAreaInsets();
  const building = useCaretakerStore((s) => s.building);
  const paymentMethods = useCaretakerStore((s) => s.paymentMethods);
  const load = useCaretakerStore((s) => s.load);

  const savedCard = paymentMethods.find((m) => m.instrument_type === 'card' && m.authorization_code);
  const hasBank = paymentMethods.some((m) => m.instrument_type === 'bank_account');

  const [chip, setChip] = useState<number | null>(5000);
  const [custom, setCustom] = useState('');
  const [busy, setBusy] = useState(false);
  const [authUrl, setAuthUrl] = useState<string | null>(null);
  const [sheetTitle, setSheetTitle] = useState<string>('Secure checkout');
  const amountRef = useRef(0);

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

  const chargeSavedCard = async () => {
    if (!amount || amount < 100) { Alert.alert('Enter amount', 'Minimum top-up is ₦100.'); return; }
    if (!building?.custom_id) { Alert.alert('No building', 'Link a building first.'); return; }
    if (!savedCard) return;

    setBusy(true);
    try {
      const { data } = await supabase.auth.getSession();
      const email = data.session?.user?.email;
      if (!email) { Alert.alert('Session', 'Sign in again to add funds.'); setBusy(false); return; }

      const res = await topUpWithSavedCard({
        buildingId: building.custom_id,
        amountNaira: amount,
        authorizationCode: savedCard.authorization_code,
        email,
      });

      if (res.ok) {
        await load(true);
        Alert.alert('Wallet funded', `${naira(amount)} added to your wallet.`, [
          { text: 'OK', onPress: () => { onSuccess(); onClose(); } },
        ]);
      } else {
        Alert.alert('Payment failed', res.error || 'Could not charge saved card. Try Paystack checkout.');
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

    // If saved card exists, charge it directly
    if (savedCard) {
      await chargeSavedCard();
      return;
    }

    // Otherwise, open Paystack checkout
    setBusy(true);
    try {
      const { data } = await supabase.auth.getSession();
      const email = data.session?.user?.email;
      if (!email) { Alert.alert('Session', 'Sign in again to add funds.'); setBusy(false); return; }

      const { authorizationUrl } = await initializeWalletTopUp({
  buildingId: building.custom_id,
  email,
  amountNaira: amount,
  // REMOVED: method: hasBank ? 'bank' : undefined,
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

            {/* Payment source detection */}
            <View style={styles.sourceRow}>
              {savedCard ? (
                <>
                  <CreditCard size={16} color={colors.brand[400]} />
                  <Text style={styles.sourceText}>
                    Saved card ending in {savedCard.card_last_four} — tap to charge directly.
                  </Text>
                </>
              ) : hasBank ? (
                <>
                  <Landmark size={16} color={colors.brand[400]} />
                  <Text style={styles.sourceText}>
                    Linked bank detected — bank transfer is primary.
                  </Text>
                </>
              ) : (
                <>
                  <CreditCard size={16} color={colors.brand[400]} />
                  <Text style={styles.sourceText}>
                    No saved card — you'll pay via Paystack checkout (card / bank / ussd).
                  </Text>
                </>
              )}
            </View>

            <Pressable
              style={[styles.cta, (!amount || amount < 100 || busy) && styles.ctaDisabled]}
              onPress={start}
              disabled={!amount || amount < 100 || busy}
              accessibilityRole="button"
              accessibilityLabel={savedCard ? 'Charge saved card' : 'Continue to Paystack'}
            >
              {busy ? (
                <ActivityIndicator color={colors.text.inverse} />
              ) : (
                <>
                  {savedCard && <CheckCircle size={16} color={colors.text.inverse} />}
                  <Text style={styles.ctaLabel}>
                    {savedCard ? 'Charge saved card' : 'Continue'} · {naira(amount || 0)}
                  </Text>
                </>
              )}
            </Pressable>

            <Text style={styles.note}>
              {savedCard
                ? 'Charges your saved card directly · secured by Paystack.'
                : 'Checkout opens here · secured by Paystack · card details never touch Trakbin.'}
            </Text>
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: sp.x2,
    backgroundColor: colors.brand[600],
    borderRadius: radius.xl,
    height: touch.cta,
  },
  ctaDisabled: { opacity: 0.45 },
  ctaLabel: { ...text.button, color: colors.text.inverse },
  note: { ...text.bodyS, color: colors.text.muted, textAlign: 'center', marginTop: sp.x4 },
});