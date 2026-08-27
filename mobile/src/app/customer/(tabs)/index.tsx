import { useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CalendarPlus, ArrowRight } from 'lucide-react-native';
import { ProviderCard } from '../../../components/caretaker/ProviderCard';
import { WalletCard } from '../../../components/caretaker/WalletCard';
import { ActivityItem } from '../../../components/caretaker/ActivityItem';
import { StatusCarousel } from '../../../components/caretaker/StatusCarousel';
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
      {/* Brand header — graphite stage */}
      <Rise delay={0}>
        <View style={styles.header}>
          <View style={styles.logo}><Text style={styles.logoLetter}>T</Text></View>
          <View>
            <Text style={styles.brand}>Trakbin</Text>
            <Text style={styles.brandTag}>Operations</Text>
          </View>
        </View>
      </Rise>

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
            <Rise delay={70}>
              <ProviderCard onPress={() => router.push('/customer/service')} />
            </Rise>

            <Rise delay={140}>
              <View style={styles.gap}>
                <WalletCard
                  balance={building.wallet_balance}
                  autopayEnabled={building.autopay_enabled}
                  onRefresh={() => load(true)}
                />
              </View>
            </Rise>

            <Rise delay={210}><StatusCarousel /></Rise>

            <Rise delay={280}>
              <Pressable
                style={styles.cta}
                onPress={() => router.push('/customer/requests/create')}
                accessibilityRole="button"
                accessibilityLabel="Request pickup"
              >
                <View style={styles.ctaIcon}><CalendarPlus size={20} color={colors.brand[700]} /></View>
                <Text style={styles.ctaLabel}>Request pickup</Text>
                <ArrowRight size={20} color={colors.text.inverse} />
              </Pressable>
            </Rise>

            <Rise delay={350}>
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
    </TabScreen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: sp.x3, paddingBottom: sp.x5 },
  logo: {
    width: 48, height: 48, borderRadius: radius.lg,
    backgroundColor: colors.card.emerald,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: colors.brand[600], shadowOpacity: 0.5,
    shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 4,
  },
  logoLetter: { fontFamily: 'Sora_800ExtraBold', fontSize: 24, color: colors.text.inverse },
  brand: { ...text.titleL, color: colors.text.primary },
  brandTag: { ...text.label, color: colors.text.muted },
  scrollOuter: { flex: 1 },
  scroll: { paddingBottom: sp.x10 },
  loader: { marginTop: sp.x16 },
  noBuilding: { alignItems: 'center', paddingVertical: sp.x12, gap: sp.x2 },
  noBuildingTitle: { ...text.titleM, color: colors.text.primary },
  noBuildingBody: { ...text.bodyM, color: colors.text.muted, textAlign: 'center' },
  gap: { marginTop: sp.x5 },
  cta: {
    flexDirection: 'row', alignItems: 'center', gap: sp.x3,
    backgroundColor: colors.card.slate,
    borderRadius: radius.xxl,
    paddingVertical: sp.x5, paddingHorizontal: sp.x5, marginTop: sp.x6,
    shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 }, elevation: 5,
  },
  ctaIcon: {
    width: 40, height: 40, borderRadius: radius.lg,
    backgroundColor: colors.brand[50],
    alignItems: 'center', justifyContent: 'center',
  },
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