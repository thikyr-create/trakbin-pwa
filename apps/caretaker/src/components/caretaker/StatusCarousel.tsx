import { useRef, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, useWindowDimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { Calendar, Clock, MapPin, ReceiptText, Wallet, ArrowRight } from 'lucide-react-native';
import { StatusPill } from '../ui/StatusPill';
import { useCaretakerStore } from '../../store/caretakerStore';
import { dayLabel, naira, nextPickupISO } from '../../services/format';
import { colors } from '../../theme/colors';
import { gutter, radius, sp } from '../../theme/spacing';
import { text } from '../../theme/typography';

const PEEK = 12;
const GAP = 12;

export function StatusCarousel() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const building = useCaretakerStore((s) => s.building);
  const assignment = useCaretakerStore((s) => s.assignment);
  const schedules = useCaretakerStore((s) => s.schedules);
  const outstandingTotal = useCaretakerStore((s) => s.outstandingTotal);
  const invoiceCount = useCaretakerStore((s) => s.invoiceCount);
  const nextDueDate = useCaretakerStore((s) => s.nextDueDate);

  const cardWidth = width - gutter * 2 - PEEK;
  const snapInterval = cardWidth + GAP;

  const nextDate = nextPickupISO(assignment, schedules);
  const nextSchedule = schedules.find((s) => s.status !== 'paused') ?? schedules[0] ?? null;

  const cards = [
    {
      id: 'collection',
      kind: 'collection' as const,
      eyebrow: 'NEXT COLLECTION',
      title: dayLabel(nextDate),
      subtitle: assignment?.time_window ?? nextSchedule?.time_window ?? 'Not scheduled',
      statusValue: nextSchedule?.status ?? 'scheduled',
      meta: building?.estate ?? building?.address ?? '—',
    },
    {
      id: 'billing',
      kind: 'billing' as const,
      eyebrow: 'INVOICE',
      title: naira(outstandingTotal),
      subtitle: nextDueDate ? `Due ${dayLabel(nextDueDate)}` : 'Nothing due',
      statusValue: outstandingTotal > 0 ? 'pending' : 'paid',
      meta: `${invoiceCount.paid} paid · ${invoiceCount.due} outstanding`,
    },
  ];

  const [active, setActive] = useState(0);
  const ref = useRef<FlatList>(null);

  return (
    <View style={styles.wrap}>
      <FlatList
        ref={ref}
        data={cards}
        horizontal
        decelerationRate="fast"
        snapToInterval={snapInterval}
        snapToAlignment="start"
        showsHorizontalScrollIndicator={false}
        keyExtractor={(i) => i.id}
        contentContainerStyle={styles.list}
        onScroll={(e) => {
          const idx = Math.round(e.nativeEvent.contentOffset.x / snapInterval);
          if (idx !== active) setActive(idx);
        }}
        scrollEventThrottle={16}
        renderItem={({ item, index }) => {
          const isCollection = item.kind === 'collection';
          const isBilling = item.kind === 'billing';
          const Icon = isCollection ? Calendar : ReceiptText;

          const content = (
            <>
              <View style={styles.cardTop}>
                <View style={[styles.iconWrap, !isCollection && styles.iconWrapInverse]}>
                  <Icon size={18} color={isCollection ? colors.brand[700] : 'rgba(255,255,255,0.85)'} />
                </View>
                <Text style={[styles.eyebrow, !isCollection && styles.eyebrowInverse]}>
                  {item.eyebrow}
                </Text>
                {isBilling ? (
                  <>
                    <View style={styles.spacer} />
                    <ArrowRight size={16} color="rgba(255,255,255,0.6)" />
                  </>
                ) : null}
              </View>

              <Text style={[styles.title, !isCollection && styles.titleInverse]}>
                {item.title}
              </Text>

              <View style={styles.row}>
                {isCollection ? (
                  <Clock size={14} color={colors.text.muted} />
                ) : (
                  <Wallet size={14} color={colors.brand[200]} />
                )}
                <Text style={[styles.subtitle, !isCollection && styles.subtitleInverse]}>
                  {item.subtitle}
                </Text>
              </View>

              <View style={styles.footer}>
                <StatusPill value={item.statusValue} />
                <View style={styles.meta}>
                  {isCollection ? (
                    <>
                      <MapPin size={12} color={colors.text.muted} />
                      <Text style={styles.metaText} numberOfLines={1}>{item.meta}</Text>
                    </>
                  ) : (
                    <Text style={styles.metaTextInverse}>{item.meta}</Text>
                  )}
                </View>
              </View>
            </>
          );

          const base = [styles.card, { width: cardWidth, marginRight: index === cards.length - 1 ? 0 : GAP }];

          // Billing slide = glass Invoice card, pressable → Billing tab
          if (isBilling) {
            return (
              <Pressable
                style={[...base, styles.cardGlass]}
                onPress={() => router.push('/customer/(tabs)/statement')}
                accessibilityRole="button"
                accessibilityLabel="Open billing"
              >
                {content}
              </Pressable>
            );
          }

          return <View style={[...base, styles.cardCollection]}>{content}</View>;
        }}
      />

      <View style={styles.dots}>
        {cards.map((_, i) => (
          <View key={i} style={[styles.dot, i === active && styles.dotActive]} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginVertical: sp.x2 },
  list: { paddingLeft: gutter, paddingRight: PEEK },
  card: {
    borderRadius: radius.xxl,
    padding: sp.x6,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  cardCollection: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border.subtle },

  // Translucent glass "smoke" — replaces the old amber billing card
  cardGlass: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },

  cardTop: { flexDirection: 'row', alignItems: 'center', gap: sp.x2, marginBottom: sp.x4 },
  spacer: { flex: 1 },
  iconWrap: { width: 32, height: 32, borderRadius: radius.md, backgroundColor: colors.brand[50], alignItems: 'center', justifyContent: 'center' },
  iconWrapInverse: { backgroundColor: 'rgba(255,255,255,0.15)' },
  eyebrow: { ...text.eyebrow, color: colors.text.muted },
  eyebrowInverse: { color: 'rgba(255,255,255,0.75)' },
  title: { ...text.display, color: colors.text.primary, marginBottom: sp.x1 },
  titleInverse: { color: colors.text.inverse },
  row: { flexDirection: 'row', alignItems: 'center', gap: sp.x1, marginBottom: sp.x5 },
  subtitle: { ...text.titleS, color: colors.text.secondary },
  subtitleInverse: { color: 'rgba(255,255,255,0.9)' },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: sp.x2 },
  meta: { flexDirection: 'row', alignItems: 'center', gap: sp.x1, flex: 1, justifyContent: 'flex-end' },
  metaText: { ...text.bodyS, color: colors.text.muted, maxWidth: '70%' },
  metaTextInverse: { ...text.bodyS, color: 'rgba(255,255,255,0.8)' },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: sp.x2, marginTop: sp.x3, paddingTop: sp.x1 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.border.strong },
  dotActive: { backgroundColor: colors.brand[700], width: 18 },
});