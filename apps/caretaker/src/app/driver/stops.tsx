import { useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable } from 'react-native';
import { Screen } from '../../components/ui/Screen';
import { StatusPill } from '../../components/ui/StatusPill';
import { useDriverStore } from '../../store/driverStore';
import { colors } from '../../theme/colors';
import { gutter, radius, sp } from '../../theme/spacing';
import { text } from '../../theme/typography';

export default function StopsScreen() {
  const { stops, load } = useDriverStore();
  useEffect(() => { load(); }, []);

  const sorted = useMemo(() => [...stops].sort((a, b) => (a.sequence ?? 0) - (b.sequence ?? 0)), [stops]);

  return (
    <Screen padded={false}>
      <View style={styles.head}>
        <Text style={styles.title}>All stops</Text>
        <Text style={styles.sub}>{stops.length} total · {stops.filter((s) => s.status === 'completed').length} done</Text>
      </View>
      <FlatList
        data={sorted}
        keyExtractor={(i) => i.id}
        contentContainerStyle={styles.list}
        renderItem={({ item, index }) => (
          <View style={styles.row}>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{item.sequence ?? index + 1}</Text>
            </View>
            <View style={styles.main}>
              <Text style={styles.id}>{item.building_id}</Text>
              <Text style={styles.addr} numberOfLines={1}>{item.address ?? '—'}</Text>
            </View>
            <StatusPill value={item.status} />
          </View>
        )}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  head: { paddingHorizontal: gutter, paddingTop: sp.x6, paddingBottom: sp.x4 },
  title: { ...text.titleL, color: colors.text.primary },
  sub: { ...text.bodyS, color: colors.text.muted, marginTop: sp.x1 },
  list: { paddingHorizontal: gutter, paddingBottom: sp.x8 },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: sp.x3,
    backgroundColor: colors.surface, borderRadius: radius.xl,
    padding: sp.x4, marginBottom: sp.x3,
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
  },
  badge: { width: 32, height: 32, borderRadius: 16, backgroundColor: colors.brand[100], alignItems: 'center', justifyContent: 'center' },
  badgeText: { ...text.button, fontSize: 14, color: colors.brand[700] },
  main: { flex: 1 },
  id: { ...text.monoBold, color: colors.text.primary },
  addr: { ...text.bodyS, color: colors.text.muted, marginTop: 2 },
});