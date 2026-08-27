import { useState } from 'react';
import { View, Text, StyleSheet, Pressable, Alert } from 'react-native';
import { Wallet, CreditCard, Landmark, Check } from 'lucide-react-native';
import { Screen } from '../../components/ui/Screen';
import { Header } from '../../components/ui/Header';
import { Button } from '../../components/ui/Button';
import { LinkBankSheet } from '../../components/caretaker/LinkBankSheet';
import { Rise } from '../../components/ui/motion';
import { useCaretakerStore } from '../../store/caretakerStore';
import { setAutopay } from '../../services/caretaker';
import { colors } from '../../theme/colors';
import { radius, sp } from '../../theme/spacing';
import { text } from '../../theme/typography';

type Source = 'wallet' | 'card' | 'bank';

export default function AutopayScreen() {
  const building = useCaretakerStore((s) => s.building);
  const paymentMethods = useCaretakerStore((s) => s.paymentMethods);
  const load = useCaretakerStore((s) => s.load);

  const hasCard = paymentMethods.some((m) => m.instrument_type === 'card');
  const hasBank = paymentMethods.some((m) => m.instrument_type === 'bank_account');

  const [source, setSource] = useState<Source>((building?.autopay_source as Source) ?? 'wallet');
  const [showLinkBank, setShowLinkBank] = useState(false);
  const [busy, setBusy] = useState(false);

  const enabled = !!building?.autopay_enabled;

  const toggle = async () => {
    if (!building?.custom_id) return;
    if (!enabled && source === 'bank' && !hasBank) { Alert.alert('Link a bank', 'Add a bank account to use it for autopay.'); return; }
    if (!enabled && source === 'card' && !hasCard) { Alert.alert('Add a card', 'Save a card to use it for autopay.'); return; }
    setBusy(true);
    const res = await setAutopay(building.custom_id, !enabled, source);
    setBusy(false);
    if (res.ok) { await load(true); Alert.alert(!enabled ? 'Autopay enabled' : 'Autopay disabled', !enabled ? `We'll settle monthly from your ${source}.` : 'Manual payment required.'); }
    else Alert.alert('Failed', res.error ?? 'Try again.');
  };

  const Option = ({ id, icon, label, sub, available }: { id: Source; icon: any; label: string; sub: string; available: boolean }) => (
    <Pressable
      style={[styles.option, source === id && styles.optionActive, !available && styles.optionDisabled]}
      onPress={() => setSource(id)}
      disabled={!available && id !== 'bank'}
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
        <Option id="wallet" icon={<Wallet size={18} color={colors.brand[400]} />} label="Trakbin wallet" sub={`Balance auto-debited monthly`} available />
        <Option id="card" icon={<CreditCard size={18} color={colors.brand[400]} />} label="Saved card" sub={hasCard ? 'Recurring-enabled card' : 'No card saved yet'} available={hasCard} />

        <Option id="bank" icon={<Landmark size={18} color={colors.brand[400]} />} label="Linked bank account" sub={hasBank ? 'Direct debit from bank' : 'No bank linked yet'} available={hasBank} />

        {source === 'bank' && !hasBank ? (
          <Pressable style={styles.linkBank} onPress={() => setShowLinkBank(true)} accessibilityRole="button">
            <Text style={styles.linkBankLabel}>Link bank account</Text>
          </Pressable>
        ) : null}
      </Rise>

      <Rise delay={90}>
        <Button label={enabled ? 'Disable autopay' : 'Enable autopay'} loading={busy} onPress={toggle} style={styles.cta} />
        <Text style={styles.note}>{enabled ? 'Autopay is ON — invoices settle on the 1st.' : 'Autopay is OFF — you pay manually.'}</Text>
      </Rise>

      {showLinkBank ? <LinkBankSheet onClose={() => setShowLinkBank(false)} onSuccess={() => load(true)} /> : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  section: { ...text.label, color: colors.text.muted, marginBottom: sp.x3 },
  option: { flexDirection: 'row', alignItems: 'center', gap: sp.x3, backgroundColor: colors.material.surface, borderRadius: radius.xl, padding: sp.x4, marginBottom: sp.x3, borderWidth: 1, borderColor: colors.material.border },
  optionActive: { borderColor: colors.brand[500], backgroundColor: colors.material.emerald },
  optionDisabled: { opacity: 0.5 },
  optionIcon: { width: 38, height: 38, borderRadius: radius.md, backgroundColor: colors.material.surfaceStrong, alignItems: 'center', justifyContent: 'center' },
  optionMain: { flex: 1 },
  optionLabel: { ...text.semibold, color: colors.text.primary },
  optionSub: { ...text.bodyS, color: colors.text.muted, marginTop: 1 },
  linkBank: { alignItems: 'center', backgroundColor: colors.material.surface, borderRadius: radius.lg, paddingVertical: sp.x3, marginBottom: sp.x3, borderWidth: 1, borderColor: colors.material.border },
  linkBankLabel: { ...text.semibold, fontSize: 13, color: colors.brand[400] },
  cta: { marginTop: sp.x4 },
  note: { ...text.bodyS, color: colors.text.muted, textAlign: 'center', marginTop: sp.x4 },
});