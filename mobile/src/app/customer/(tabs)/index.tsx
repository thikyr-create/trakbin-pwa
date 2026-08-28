import { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { CalendarPlus, ArrowRight, Plus, Landmark } from 'lucide-react-native';
import { ProviderCard } from '../../../components/caretaker/ProviderCard';
import { ActivityItem } from '../../../components/caretaker/ActivityItem';
import { StatusCarousel } from '../../../components/caretaker/StatusCarousel';
import { AddFundsSheet } from '../../../components/caretaker/AddFundsSheet';
import { LinkBankSheet } from '../../../components/caretaker/LinkBankSheet';
import { Rise } from '../../../components/ui/motion';
import { TabScreen } from '../../../components/layout/TabScreen';
import { useCaretakerStore } from '../../../store/caretakerStore';
import { dateTime, naira } from '../../../services/format';
import { colors } from '../../../theme/colors';
import { radius, sp } from '../../../theme/spacing';
import { text } from '../../../theme/typography';

export default function CaretakerHome() {
  const router = useRouter();
  const { building, collections, invoices, loading, loaded, load } = useCaretakerStore();
  const [showAddFunds, setShowAddFunds] = useState(false);
  const [showLinkBank, setShowLinkBank] = useState(false);

  useEffect(() => { load(); }, []);

  const activity = useMemo(() => {
    const cols = collections.slice(0, 3).map((c) => ({
      kind: 'collection' as const,
      title: `Collection ${c.status === 'completed' ? 'completed' : c.status ?? ''}`,
      subtitle: dateTime(c.collection_date),
      at: c.collection_date,
    }));
    const invs = invoices.slice(0, 3).map((i) => ({
      kind: 'invoice' as const,
      title: `Invoice · ${naira(i.amount)}`,
      subtitle: i.status === 'paid' ? `Paid ${dateTime(i.paid_at)}` : `Due ${dateTime(i.due_date)}`,
      at: i.paid_at ?? i.created_at,
    }));
    return [...cols, ...invs].sort((a, b) => (b.at ?? '').localeCompare(a.at ?? '')).slice(0, 4);
  }, [collections, invoices]);

  return (
    <TabScreen>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        style={styles.scrollOuter}
      >
        {!loaded || loading ? (
          <ActivityIndicator size="large" color={colors.brand[500]} style={styles.loader} />
        ) : !building ? (
          <View style={styles.noBuilding}>
            <Text style={styles.noBuildingTitle}>No building linked</Text>
            <Text style={styles.noBuildingBody}>This account isn't linked to a building yet.</Text>
          </View>
        ) : (
          <>
            <Rise delay={0}>
              <ProviderCard onPress={() => router.push('/customer/service')} />
            </Rise>

            {/* Translucent green wallet hub — balance + quick actions */}
            <Rise delay={90}>
              <View style={styles.walletCard}>
                <View style={styles.walletTop}>
                  <Text style={styles.walletEyebrow}>Wallet</Text>
                  <View style={styles.walletChip}>
                    <Landmark size={12} color="rgba(110,231,183,0.9)" />
                    <Text style={styles.walletChipLabel}>NGN</Text>
                  </View>
                </View>
                <Text style={styles.walletBalance}>{naira(building.wallet_balance)}</Text>
                <Text style={styles.walletSub}>Available balance</Text>

                <View style={styles.walletActions}>
                  <Pressable style={styles.actionPrimary} onPress={() => setShowAddFunds(true)} accessibilityRole="button" accessibilityLabel="Add funds">
                    <Plus size={16} color={colors.text.inverse} />
                    <Text style={styles.actionPrimaryLabel}>Add funds</Text>
                  </Pressable>
                  <Pressable style={styles.actionSecondary} onPress={() => setShowLinkBank(true)} accessibilityRole="button" accessibilityLabel="Link bank">
                    <Landmark size={16} color="rgba(110,231,183,0.9)" />
                    <Text style={styles.actionSecondaryLabel}>Link bank</Text>
                  </Pressable>
                </View>
              </View>
            </Rise>

            <Rise delay={180}><StatusCarousel /></Rise>

            {/* Translucent green request-pickup CTA */}
            <Rise delay={250}>
              <Pressable
                style={styles.cta}
                onPress={() => router.push('/customer/requests/create')}
                accessibilityRole="button"
                accessibilityLabel="Request pickup"
              >
                <View style={styles.ctaIcon}><CalendarPlus size={20} color={colors.brand[300]} /></View>
                <Text style={styles.ctaLabel}>Request pickup</Text>
                <ArrowRight size={20} color="rgba(110,231,183,0.8)" />
              </Pressable>
            </Rise>

            <Rise delay={320}>
              <Text style={styles.sectionTitle}>Recent activity</Text>
              <View style={styles.activityCard}>
                {activity.length === 0 ? (
                  <Text style={styles.noActivity}>No activity yet.</Text>
                ) : (
                  activity.map((a, idx) => (
                    <View key={idx}>
                      <ActivityItem kind={a.kind} title={a.title} subtitle={a.subtitle} />
                      {idx < activity.length - 1 ? <View style={styles.divider} /> : null}
                    </View>
                  ))
                )}
              </View>
            </Rise>
          </>
        )}
      </ScrollView>

      {showAddFunds ? <AddFundsSheet onClose={() => setShowAddFunds(false)} onSuccess={() => load(true)} /> : null}
      {showLinkBank ? <LinkBankSheet onClose={() => setShowLinkBank(false)} onSuccess={() => load(true)} /> : null}
    </TabScreen>
  );
}

const styles = StyleSheet.create({
  scrollOuter: { flex: 1 },
  scroll: { paddingBottom: sp.x10 },
  loader: { marginTop: sp.x16 },
  noBuilding: { alignItems: 'center', paddingVertical: sp.x12, gap: sp.x2 },
  noBuildingTitle: { ...text.titleM, color: colors.text.primary },
  noBuildingBody: { ...text.bodyM, color: colors.text.muted, textAlign: 'center' },

  // Translucent green glass wallet hub
  walletCard: {
    backgroundColor: 'rgba(16,185,129,0.12)',
    borderRadius: radius.xxl,
    borderWidth: 1,
    borderColor: 'rgba(16,185,129,0.3)',
    padding: sp.x5,
    marginTop: sp.x5,
  },
  walletTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  walletEyebrow: { ...text.label, fontSize: 11, color: 'rgba(110,231,183,0.8)' },
  walletChip: { flexDirection: 'row', alignItems: 'center', gap: sp.x1, backgroundColor: 'rgba(16,185,129,0.2)', borderRadius: radius.md, paddingHorizontal: sp.x2, paddingVertical: 2 },
  walletChipLabel: { ...text.label, fontSize: 9, color: 'rgba(110,231,183,0.9)' },
  walletBalance: { ...text.display, color: colors.text.inverse, marginTop: sp.x3 },
  walletSub: { ...text.bodyS, color: 'rgba(255,255,255,0.55)', marginTop: sp.x1 },
  walletActions: { flexDirection: 'row', gap: sp.x3, marginTop: sp.x5 },
  actionPrimary: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: sp.x2, backgroundColor: colors.brand[600], borderRadius: radius.lg, paddingVertical: sp.x3 },
  actionPrimaryLabel: { ...text.semibold, fontSize: 13, color: colors.text.inverse },
  actionSecondary: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: sp.x2, backgroundColor: 'rgba(16,185,129,0.18)', borderRadius: radius.lg, paddingVertical: sp.x3, borderWidth: 1, borderColor: 'rgba(16,185,129,0.35)' },
  actionSecondaryLabel: { ...text.semibold, fontSize: 13, color: 'rgba(110,231,183,0.95)' },

  // Translucent green request-pickup CTA
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: sp.x3,
    backgroundColor: 'rgba(16,185,129,0.12)',
    borderRadius: radius.xxl,
    borderWidth: 1,
    borderColor: 'rgba(16,185,129,0.3)',
    paddingVertical: sp.x5,
    paddingHorizontal: sp.x5,
    marginTop: sp.x6,
  },
  ctaIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.lg,
    backgroundColor: 'rgba(16,185,129,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaLabel: { flex: 1, ...text.button, color: colors.text.inverse },

  sectionTitle: { ...text.label, color: colors.text.muted, marginTop: sp.x7, marginBottom: sp.x4 },
  activityCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xxl,
    paddingHorizontal: sp.x5,
    paddingVertical: sp.x3,
    borderWidth: 1,
    borderColor: colors.border.subtle,
  },
  divider: { height: 1, backgroundColor: colors.border.subtle },
  noActivity: { ...text.bodyM, color: colors.text.muted, paddingVertical: sp.x4 },
});