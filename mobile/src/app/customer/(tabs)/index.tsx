import { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, ActivityIndicator, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { CalendarPlus, ArrowRight, Plus, Landmark, Bell } from 'lucide-react-native';
import { ProviderCard } from '../../../components/caretaker/ProviderCard';
import { ActivityItem } from '../../../components/caretaker/ActivityItem';
import { StatusCarousel } from '../../../components/caretaker/StatusCarousel';
import { AddFundsSheet } from '../../../components/caretaker/AddFundsSheet';
import { LinkBankSheet } from '../../../components/caretaker/LinkBankSheet';
import { Skeleton } from '../../../components/ui/Skeleton';
import { Rise } from '../../../components/ui/motion';
import { TabScreen } from '../../../components/layout/TabScreen';
import { useCaretakerStore } from '../../../store/caretakerStore';
import { registerPushToken } from '../../../services/push';
import { dateTime, naira } from '../../../services/format';
import { colors } from '../../../theme/colors';
import { radius, sp } from '../../../theme/spacing';
import { text } from '../../../theme/typography';

export default function CaretakerHome() {
  const router = useRouter();
  const { building, collections, invoices, loading, loaded, load } = useCaretakerStore();
  const unreadCount = useCaretakerStore((s: any) => s.unreadCount);
  const [showAddFunds, setShowAddFunds] = useState(false);
  const [showLinkBank, setShowLinkBank] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => { load(); }, []);
  useEffect(() => { if (building?.custom_id) registerPushToken(building.custom_id); }, [building?.custom_id]);

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
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={async () => { setRefreshing(true); await load(true); setRefreshing(false); }}
            tintColor={colors.brand[500]}
            colors={[colors.brand[500]]}
          />
        }
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        style={styles.scrollOuter}
      >
        {!loaded || loading ? (
          <View style={styles.skWrap}>
            <Skeleton style={styles.skProvider} round={radius.xxl} />
            <Skeleton style={styles.skWallet} round={radius.xxl} />
            <Skeleton style={styles.skCarousel} round={radius.xxl} />
            <Skeleton style={styles.skCta} round={radius.xxl} />
          </View>
        ) : !building ? (
          <View style={styles.noBuilding}>
            <Text style={styles.noBuildingTitle}>No building linked</Text>
            <Text style={styles.noBuildingBody}>This account isn't linked to a building yet.</Text>
          </View>
        ) : (
          <>
            <Rise delay={0}>
              <View style={styles.topRow}>
                <Text style={styles.greeting}>Hello, caretaker</Text>
                <Pressable style={styles.bell} onPress={() => router.push('/customer/notifications')} accessibilityRole="button" accessibilityLabel="Notifications">
                  <Bell size={20} color={colors.text.primary} />
                  {unreadCount > 0 ? (
                    <View style={styles.badge}><Text style={styles.badgeLabel}>{unreadCount > 9 ? '9+' : unreadCount}</Text></View>
                  ) : null}
                </Pressable>
              </View>
            </Rise>

            <Rise delay={40}>
              <ProviderCard onPress={() => router.push('/customer/service')} />
            </Rise>

            <Rise delay={110}>
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

  skWrap: { gap: sp.x4, marginTop: sp.x2 },
  skProvider: { height: 96 },
  skWallet: { height: 150 },
  skCarousel: { height: 170 },
  skCta: { height: 72 },

  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: sp.x4 },
  greeting: { ...text.titleM, color: colors.text.primary },
  bell: { width: 42, height: 42, borderRadius: radius.lg, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border.subtle, alignItems: 'center', justifyContent: 'center' },
  badge: { position: 'absolute', top: -5, right: -5, backgroundColor: colors.state.danger, borderRadius: 9, minWidth: 18, height: 18, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 },
  badgeLabel: { ...text.label, fontSize: 9, color: colors.text.inverse },

  noBuilding: { alignItems: 'center', paddingVertical: sp.x12, gap: sp.x2 },
  noBuildingTitle: { ...text.titleM, color: colors.text.primary },
  noBuildingBody: { ...text.bodyM, color: colors.text.muted, textAlign: 'center' },

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

  cta: {
    flexDirection: 'row', alignItems: 'center', gap: sp.x3,
    backgroundColor: 'rgba(16,185,129,0.12)',
    borderRadius: radius.xxl,
    borderWidth: 1,
    borderColor: 'rgba(16,185,129,0.3)',
    paddingVertical: sp.x5, paddingHorizontal: sp.x5, marginTop: sp.x6,
  },
  ctaIcon: { width: 40, height: 40, borderRadius: radius.lg, backgroundColor: 'rgba(16,185,129,0.2)', alignItems: 'center', justifyContent: 'center' },
  ctaLabel: { flex: 1, ...text.button, color: colors.text.inverse },

  sectionTitle: { ...text.label, color: colors.text.muted, marginTop: sp.x7, marginBottom: sp.x4 },
  activityCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xxl,
    paddingHorizontal: sp.x5, paddingVertical: sp.x3,
    borderWidth: 1, borderColor: colors.border.subtle,
  },
  divider: { height: 1, backgroundColor: colors.border.subtle },
  noActivity: { ...text.bodyM, color: colors.text.muted, paddingVertical: sp.x4 },
});