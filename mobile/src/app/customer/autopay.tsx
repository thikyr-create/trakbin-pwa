import { useState } from 'react';
import { View, Text, StyleSheet, Pressable, Alert } from 'react-native';
import { Wallet, CreditCard, Landmark, Check } from 'lucide-react-native';
import { Screen } from '../../components/ui/Screen';
import { Header } from '../../components/ui/Header';
import { Button } from '../../components/ui/Button';
import { LinkBankSheet } from '../../components/caretaker/LinkBankSheet';
import { Rise } from '../../components/ui/motion';
import { useCaretakerStore } from '../../store/caretakerStore';
import { setAutopay, setDefaultMethod } from '../../services/caretaker';
import { colors } from '../../theme/colors';
import { radius, sp } from '../../theme/spacing';
import { text } from '../../theme/typography';

type Source = 'wallet' | 'card' | 'bank';

/**
 * Read real last-4 digits matching the PWA schema:
 * - Cards → `card_last_four` (with 'r')
 * - Banks → `account_last4`
 * - Fallback → slice from `account_number`
 */
const last4 = (m: any) => {
  if (!m) return '';
  if (m.instrument_type === 'card') {
    return String(m.card_last_four ?? '').replace(/\D/g, '').slice(-4);
  }
  return String(m.account_last4 ?? m.account_number ?? '').replace(/\D/g, '').slice(-4);
};

export default function AutopayScreen() {
  const building = useCaretakerStore((s) => s.building);
  const paymentMethods = useCaretakerStore((s) => s.paymentMethods);
  const load = useCaretakerStore((s) => s.load);

  const cards = paymentMethods.filter((m) => m.instrument_type === 'card');
  const banks = paymentMethods.filter((m) => m.instrument_type === 'bank_account');
  const defaultCard = cards.find((c) => c.is_default) ?? cards[0] ?? null;

  const [source, setSource] = useState<Source>((building?.autopay_source as Source) ?? 'wallet');
  const [showLinkBank, setShowLinkBank] = useState(false);
  const [busy, setBusy] = useState(false);

  const enabled = !!building?.autopay_enabled;

  const pickCard = async (id: number | string) => {
    if (!building?.custom_id) return;
    await setDefaultMethod(id, building.custom_id);
    setSource('card');
    await load(true);
  };

  const toggle = async () => {
    if (!building?.custom_id) return;
    if (!enabled && source === 'card' && cards.length === 0) {
      Alert.alert('Add a card', 'Save a card to use it for autopay.');
      return;
    }
    if (!enabled && source === 'bank' && banks.length === 0) {
      Alert.alert('Link a bank', 'Add a bank account to use it for autopay.');
      return;
    }
    setBusy(true);
    const res = await setAutopay(building.custom_id, !enabled, source);
    setBusy(false);
    if (res.ok) {
      await load(true);
      const sourceLabel =
        source === 'card' ? `card •••• ${last4(defaultCard) || '····'}` :
        source === 'bank' ? 'linked bank' :
        'wallet';
      Alert.alert(
        !enabled ? 'Autopay enabled' : 'Autopay disabled',
        !enabled ? `We'll settle monthly from your ${sourceLabel}.` : 'Manual payment required.'
      );
    } else {
      Alert.alert('Failed', res.error ?? 'Try again.');
    }
  };

  const Option = ({
    id, icon, label, sub, available,
  }: { id: Source; icon: React.ReactNode; label: string; sub: string; available: boolean }) => (
    <Pressable
      style={[styles.option, source === id && styles.optionActive, !available && id !== 'bank' && styles.optionDisabled]}
      onPress={() => setSource(id)}
      accessibilityRole="button"
    >
      <View style={styles.optionIcon}>{icon}</View>
      <View style={styles.optionMain}>
        <Text style={styles.optionLabel}>{label}</Text>
        <Text style={styles.optionSub}>{sub}</Text>
      </View>
      {source === id ? <Check size={18} color={colors.brand[400]} /> : null}
    </Pressable>
  );

  return (
    <Screen scroll>
      <Header title="Autopay" subtitle="Automatic monthly settlement" />

      <Rise delay={0}>
        <Text style={styles.section}>Pay from</Text>

        <Option
          id="wallet"
          icon={<Wallet size={18} color={colors.brand[400]} />}
          label="Trakbin wallet"
          sub="Balance auto-debited monthly"
          available
        />

        <Option
          id="card"
          icon={<CreditCard size={18} color={colors.brand[400]} />}
          label="Saved card"
          sub={
            cards.length
              ? `${cards.length} card${cards.length > 1 ? 's' : ''} · default •••• ${last4(defaultCard) || '····'}`
              : 'No card saved yet'
          }
          available={cards.length > 0}
        />

        <Option
          id="bank"
          icon={<Landmark size={18} color={colors.brand[400]} />}
          label="Linked bank account"
          sub={banks.length ? 'Direct debit from bank' : 'No bank linked yet'}
          available={banks.length > 0}
        />

        {/* Card picker — appears when source = card and cards exist */}
        {source === 'card' && cards.length > 0 ? (
          <View style={styles.cardList}>
            <Text style={styles.section}>Choose card</Text>
            {cards.map((c) => (
              <Pressable
                key={c.id}
                style={[styles.cardRow, c.id === defaultCard?.id && styles.cardRowActive]}
                onPress={() => pickCard(c.id)}
                accessibilityRole="button"
              >
                <CreditCard size={16} color={colors.brand[400]} />
                <View style={styles.optionMain}>
                  <Text style={styles.optionLabel}>
                    {c.card_brand ?? c.bank_name ?? 'Card'} •••• {last4(c) || '····'}
                  </Text>
                  <Text style={styles.optionSub}>
                    {c.is_default ? 'Default · used for autopay' : 'Tap to make default'}
                  </Text>
                </View>
                {c.id === defaultCard?.id ? <Check size={16} color={colors.brand[400]} /> : null}
              </Pressable>
            ))}
          </View>
        ) : null}

        {/* Link bank prompt — appears when source = bank and no banks */}
        {source === 'bank' && banks.length === 0 ? (
          <Pressable style={styles.linkBank} onPress={() => setShowLinkBank(true)} accessibilityRole="button">
            <Text style={styles.linkBankLabel}>Link bank account</Text>
          </Pressable>
        ) : null}
      </Rise>

      <Rise delay={90}>
        <Button
          label={enabled ? 'Disable autopay' : 'Enable autopay'}
          loading={busy}
          onPress={toggle}
          style={styles.cta}
        />
        <Text style={styles.note}>
          {enabled ? 'Autopay is ON — invoices settle on the 1st.' : 'Autopay is OFF — you pay manually.'}
        </Text>
      </Rise>

      {showLinkBank ? (
        <LinkBankSheet onClose={() => setShowLinkBank(false)} onSuccess={() => load(true)} />
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  section: { ...text.label, color: colors.text.muted, marginBottom: sp.x3 },

  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: sp.x3,
    backgroundColor: colors.material.surface,
    borderRadius: radius.xl,
    padding: sp.x4,
    marginBottom: sp.x3,
    borderWidth: 1,
    borderColor: colors.material.border,
  },
  optionActive: { borderColor: colors.brand[500], backgroundColor: colors.material.emerald },
  optionDisabled: { opacity: 0.5 },
  optionIcon: {
    width: 38,
    height: 38,
    borderRadius: radius.md,
    backgroundColor: colors.material.surfaceStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionMain: { flex: 1 },
  optionLabel: { ...text.semibold, color: colors.text.primary },
  optionSub: { ...text.bodyS, color: colors.text.muted, marginTop: 1 },

  cardList: {
    marginTop: sp.x2,
    backgroundColor: colors.material.surface,
    borderRadius: radius.xl,
    padding: sp.x4,
    borderWidth: 1,
    borderColor: colors.material.border,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: sp.x3,
    paddingVertical: sp.x3,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.subtle,
  },
  cardRowActive: { borderBottomColor: colors.brand[500] },

  linkBank: {
    alignItems: 'center',
    backgroundColor: colors.material.surface,
    borderRadius: radius.lg,
    paddingVertical: sp.x3,
    marginBottom: sp.x3,
    borderWidth: 1,
    borderColor: colors.material.border,
  },
  linkBankLabel: { ...text.semibold, fontSize: 13, color: colors.brand[400] },

  cta: { marginTop: sp.x4 },
  note: { ...text.bodyS, color: colors.text.muted, textAlign: 'center', marginTop: sp.x4 },
});