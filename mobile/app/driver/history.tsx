// mobile/app/driver/history.tsx
import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { supabase } from '../../services/supabase';
import { useAuthStore } from '../../store/authStore';
import { colors } from '../../theme/colors';
import { text } from '../../theme/typography';
import { spacing } from '../../theme/spacing';
import { radius } from '../../theme/radius';
import { shadows } from '../../theme/shadows';

export default function HistoryScreen() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const driver = useAuthStore.getState().driver;
      const c = Number(driver?.company_id) || null;
      if (!driver || !c) { setLoading(false); return; }
      const { data: routes } = await supabase.from('routes').select('id').eq('company_id', c).eq('driver_id', String(driver.id));
      const ids = (routes || []).map((r: any) => r.id);
      if (!ids.length) { setLoading(false); return; }
      const { data } = await supabase
        .from('route_stops').select('*')
        .eq('company_id', c).in('route_id', ids)
        .in('status', ['completed', 'skipped'])
        .order('completion_time', { ascending: false })
        .limit(50);
      setItems(data || []);
      setLoading(false);
    })();
  }, []);

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.back}><ArrowLeft size={18} color={colors.textPrimary} /></TouchableOpacity>
        <Text style={styles.title}>Collection History</Text>
      </View>
      {loading ? (
        <ActivityIndicator style={{ marginTop: 48 }} color={colors.primary} />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(i) => i.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={<Text style={styles.empty}>No collections yet.</Text>}
          renderItem={({ item }) => (
            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <Text style={styles.stopId}>{item.building_id}</Text>
                <Text style={styles.when}>{item.completion_time ? new Date(item.completion_time).toLocaleString() : item.skip_reason ? `Skipped · ${item.skip_reason}` : ''}</Text>
              </View>
              <Text style={[styles.chip, item.status === 'completed' ? styles.chipDone : styles.chipSkip]}>
                {item.status === 'completed' ? 'DONE' : 'SKIPPED'}
              </Text>
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.x3, paddingHorizontal: spacing.x4, paddingVertical: spacing.x3, backgroundColor: colors.card },
  back: { padding: spacing.x2, borderRadius: radius.sm, backgroundColor: colors.inputBg },
  title: { ...text.headingM, color: colors.textPrimary },
  list: { padding: spacing.x4 },
  empty: { ...text.bodyXs, color: colors.textMuted, textAlign: 'center', marginTop: 48 },
  row: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card, borderRadius: radius.input, padding: spacing.x4, marginBottom: spacing.x3, ...shadows.card },
  stopId: { ...text.bodySm, color: colors.textPrimary, fontWeight: '800' },
  when: { ...text.caption, color: colors.textMuted, marginTop: 2 },
  chip: { ...text.caption, fontWeight: '800', paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.chip, overflow: 'hidden' },
  chipDone: { backgroundColor: colors.successBg, color: colors.success },
  chipSkip: { backgroundColor: colors.warningBg, color: colors.warning },
});