import { useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Plus, Landmark, Wallet } from 'lucide-react-native';
import { AddFundsSheet } from './AddFundsSheet';
import { LinkBankSheet } from './LinkBankSheet';
import { naira } from '../../services/format';
import { colors } from '../../theme/colors';
import { radius, sp, touch } from '../../theme/spacing';
import { text } from '../../theme/typography';

interface Props {
  balance: number | null;
  autopayEnabled: boolean | null;
  onRefresh: () => void;
}

export function WalletCard({ balance, autopayEnabled, onRefresh }: Props) {
  const [showAddFunds, setShowAddFunds] = useState(false);
  const [showLinkBank, setShowLinkBank] = useState(false);

  return (
    <>
      <View style={styles.card}>
        <View style={styles.top}>
          <View style={styles.iconWrap}><Wallet size={18} color={colors.text.inverse} /></View>
          <Text style={styles.label}>Wallet balance</Text>
          {autopayEnabled ? (
            <View style={styles.autopayPill}><Text style={styles.autopayText}>Autopay on</Text></View>
          ) : null}
        </View>

        <Text style={styles.value}>{naira(balance)}</Text>
        <Text style={styles.sub}>
          {autopayEnabled ? 'Funds settle invoices automatically.' : 'Top up to enable autopay settlement.'}
        </Text>

        <View style={styles.actions}>
          <Pressable
            style={styles.actionBtn}
            onPress={() => setShowAddFunds(true)}
            accessibilityRole="button"
            accessibilityLabel="Add funds"
          >
            <Plus size={17} color={colors.brand[700]} />
            <Text style={styles.actionLabel}>Add funds</Text>
          </Pressable>
          <Pressable
            style={styles.actionBtn}
            onPress={() => setShowLinkBank(true)}
            accessibilityRole="button"
            accessibilityLabel="Link bank"
          >
            <Landmark size={17} color={colors.brand[700]} />
            <Text style={styles.actionLabel}>Link bank</Text>
          </Pressable>
        </View>
      </View>

      {showAddFunds ? <AddFundsSheet onClose={() => setShowAddFunds(false)} onSuccess={onRefresh} /> : null}
      {showLinkBank ? <LinkBankSheet onClose={() => setShowLinkBank(false)} onSuccess={onRefresh} /> : null}
    </>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card.emerald,
    borderRadius: radius.xxl,
    padding: sp.x5,
    shadowColor: colors.card.emerald,
    shadowOpacity: 0.4,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  top: { flexDirection: 'row', alignItems: 'center', gap: sp.x2 },
  iconWrap: {
    width: 34,
    height: 34,
    borderRadius: radius.md,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: { ...text.label, fontSize: 10, color: colors.brand[100], flex: 1 },
  autopayPill: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: radius.full,
    paddingHorizontal: sp.x3,
    paddingVertical: sp.x1,
  },
  autopayText: { ...text.label, fontSize: 9, color: colors.text.inverse },
  value: { ...text.display, color: colors.text.inverse, marginTop: sp.x3 },
  sub: { ...text.bodyS, color: colors.brand[100], marginTop: sp.x1 },
  actions: { flexDirection: 'row', gap: sp.x3, marginTop: sp.x4 },
  actionBtn: {
    flex: 1,
    height: touch.field,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: sp.x2,
    backgroundColor: 'rgba(255,255,255,0.96)',
    borderRadius: radius.lg,
  },
  actionLabel: { ...text.semibold, fontSize: 14, color: colors.brand[700] },
});