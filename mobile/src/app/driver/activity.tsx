import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator } from 'react-native';
import { Activity as ActivityIcon } from 'lucide-react-native';
import { Screen } from '../../components/ui/Screen';
import { StatusPill } from '../../components/ui/StatusPill';
import { EmptyState } from '../../components/ui/EmptyState';
import { supabase } from '../../services/supabase';
import { useAuthStore } from '../../store/authStore';
import { colors } from '../../theme/colors';
import { gutter, radius, sp } from '../../theme/spacing';
import { text } from '../../theme/typography';

interface ActivityItem {
  id: string;
  building_id: string;
  status: string;
  completion_time?: string | null;
  skip_reason?: string | null;
}

export default function ActivityScreen() {
  const [items, setItems] = useState<ActivityItem[]>([]);
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
        .from('route_stops')
        .select('*')
        .eq('company_id', c)
        .in('route_id', ids)
        .in('status', ['completed', 'skipped'])
        .order('completion_time', { ascending: false })
        .limit(30);

      setItems((data as ActivityItem[]) || []);
      setLoading(false);
    })();
  }, []);

  return (
    <Screen padded={false}>
      <View style={styles.head}>
        <Text style={styles.title}>Activity</Text>
        <Text style={styles.sub}>Recent stops</Text>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.brand[600]} />
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(i) => i.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <EmptyState
              icon={<ActivityIcon size={36} color={colors.text.muted} />}
              title="No activity yet"
              body="Completed and skipped stops will appear here."
            />
          }
          renderItem={({ item }) => (
            <View style={styles.row}>
              <View style={styles.main}>
                <Text style={styles.id}>{item.building_id}</Text>
                <Text style={styles.when} numberOfLines={1}>
                  {item.completion_time
                    ? new Date(item.completion_time).toLocaleString()
                    : item.skip_reason
                      ? `Skipped · ${item.skip_reason.replace(/_/g, ' ')}`
                      : ''}
                </Text>
              </View>
              <StatusPill value={item.status} />
            </View>
          )}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  head: { paddingHorizontal: gutter, paddingTop: sp.x6, paddingBottom: sp.x4 },
  title: { ...text.titleL, color: colors.text.primary },
  sub: { ...text.bodyS, color: colors.text.muted, marginTop: sp.x1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list: { paddingHorizontal: gutter, paddingBottom: sp.x8 },
  row: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.surface, borderRadius: radius.xl,
    padding: sp.x4, marginBottom: sp.x3,
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 10, elevation: 2,
  },
  main: { flex: 1, marginRight: sp.x3 },
  id: { ...text.monoBold, color: colors.text.primary },
  when: { ...text.bodyS, color: colors.text.muted, marginTop: 2 },
});