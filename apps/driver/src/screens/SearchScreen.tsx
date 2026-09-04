import { useEffect, useRef, useState } from 'react';
import { View, Text, TextInput, Pressable, Modal, ScrollView, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSessionStore } from '../store/session';
import { useConsoleStore } from '../store/ui';
import { calculateDistanceInMeters } from '../utils/geo';
import { colors, typography, spacing, radius, elevation } from '../theme/design';

interface GeocodeResult {
  id: string;
  place_name: string;
  center: [number, number]; // [lng, lat]
  type: 'building' | 'place';
}

const MAX_RECENTS = 8;
const keyFor = (driverId: string | null) => `trakbin_driver_recent_searches_${driverId ?? 'anon'}`;

export function SearchScreen() {
  const searchOpen = useConsoleStore((s) => s.searchOpen);
  const setSearchOpen = useConsoleStore((s) => s.setSearchOpen);
  const setSearchDestination = useConsoleStore((s) => s.setSearchDestination);
  const setActiveTab = useConsoleStore((s) => s.setActiveTab);
  const driver = useSessionStore((s) => s.driver);
  const gpsLocation = useSessionStore((s) => s.gpsLocation);
  const routeStops = useSessionStore((s) => s.routeStops);

  const [query, setQuery] = useState('');
  const [recents, setRecents] = useState<GeocodeResult[]>([]);
  const [results, setResults] = useState<GeocodeResult[]>([]);
  const inputRef = useRef<TextInput>(null);

  const driverId = driver?.employee_id || driver?.id || null;

  useEffect(() => {
    if (searchOpen) {
      (async () => {
        try {
          const raw = await AsyncStorage.getItem(keyFor(driverId));
          setRecents(raw ? JSON.parse(raw) : []);
        } catch {
          setRecents([]);
        }
        setTimeout(() => inputRef.current?.focus(), 150);
      })();
    }
  }, [searchOpen, driverId]);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }
    // Simple search: filter routeStops by address or building_id
    const filtered = routeStops
      .filter((s: any) => {
        const q = query.toLowerCase();
        return (
          (s.building_id || '').toLowerCase().includes(q) ||
          (s.address || '').toLowerCase().includes(q)
        );
      })
      .slice(0, 10)
      .map((s: any) => ({
        id: s.id,
        place_name: s.address || s.building_id,
        center: [s.longitude, s.latitude] as [number, number],
        type: 'building' as const,
      }));
    setResults(filtered);
  }, [query, routeStops]);

  const close = () => {
    setSearchOpen(false);
    setQuery('');
  };

  const saveRecent = async (r: GeocodeResult) => {
    const list = [r, ...recents.filter((x) => x.id !== r.id)].slice(0, MAX_RECENTS);
    setRecents(list);
    try {
      await AsyncStorage.setItem(keyFor(driverId), JSON.stringify(list));
    } catch {}
  };

  const clearRecents = async () => {
    setRecents([]);
    try {
      await AsyncStorage.removeItem(keyFor(driverId));
    } catch {}
  };

  const distLabel = (center: [number, number]) => {
    if (!gpsLocation) return null;
    const m = calculateDistanceInMeters(gpsLocation.latitude, gpsLocation.longitude, center[1], center[0]);
    return m >= 1000 ? `${(m / 1000).toFixed(1)} km` : `${Math.round(m)} m`;
  };

  const pick = async (r: GeocodeResult) => {
    await saveRecent(r);
    setSearchDestination({ lat: r.center[1], lng: r.center[0], label: r.place_name });
    setActiveTab('map');
    close();
  };

  const showRecents = !query.trim();

  return (
    <Modal visible={searchOpen} animationType="slide">
      <View style={styles.container}>
        <View style={styles.header}>
          <Pressable onPress={close} style={({ pressed }) => [styles.closeBtn, pressed && styles.pressed]}>
            <Ionicons name="close" size={22} color={colors.text.primary} />
          </Pressable>
          <Text style={styles.title}>Route</Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.inputs}>
          <View style={styles.originRow}>
            <Ionicons name="navigate" size={16} color="#2563eb" />
            <Text style={styles.originText}>Current location</Text>
          </View>

          <View style={styles.searchInput}>
            <Ionicons name="search-outline" size={18} color={colors.text.tertiary} style={styles.searchIcon} />
            <TextInput
              ref={inputRef}
              value={query}
              onChangeText={setQuery}
              placeholder="Dropoff location"
              placeholderTextColor={colors.text.disabled}
              style={styles.input}
            />
          </View>
        </View>

        <ScrollView style={styles.results} showsVerticalScrollIndicator={false}>
          {showRecents ? (
            recents.length === 0 ? (
              <Text style={styles.empty}>Search assigned stops, streets, landmarks…</Text>
            ) : (
              <>
                <View style={styles.recentsHeader}>
                  <Text style={styles.recentsLabel}>RECENT SEARCHES</Text>
                  <Pressable onPress={clearRecents} style={styles.clearBtn}>
                    <Ionicons name="trash-outline" size={12} color={colors.state.danger} />
                    <Text style={styles.clearText}>CLEAR</Text>
                  </Pressable>
                </View>
                {recents.map((r) => (
                  <Pressable key={r.id} onPress={() => pick(r)} style={({ pressed }) => [styles.resultRow, pressed && styles.pressed]}>
                    <Ionicons name="time-outline" size={18} color={colors.text.tertiary} />
                    <View style={styles.resultText}>
                      <Text style={styles.resultLabel} numberOfLines={1}>{r.place_name}</Text>
                      <Text style={styles.resultType}>{r.type === 'building' ? 'Assigned stop' : 'Place'}</Text>
                    </View>
                    {distLabel(r.center) && <Text style={styles.resultDist}>{distLabel(r.center)}</Text>}
                  </Pressable>
                ))}
              </>
            )
          ) : results.length === 0 ? (
            <Text style={styles.empty}>No results found</Text>
          ) : (
            results.map((r) => (
              <Pressable key={r.id} onPress={() => pick(r)} style={({ pressed }) => [styles.resultRow, pressed && styles.pressed]}>
                <Ionicons
                  name={r.type === 'building' ? 'business-outline' : 'location-outline'}
                  size={18}
                  color={r.type === 'building' ? colors.primary[600] : colors.text.secondary}
                />
                <View style={styles.resultText}>
                  <Text style={styles.resultLabel} numberOfLines={1}>{r.place_name}</Text>
                  <Text style={styles.resultType}>{r.type === 'building' ? 'Assigned stop' : 'Place'}</Text>
                </View>
                {distLabel(r.center) && <Text style={styles.resultDist}>{distLabel(r.center)}</Text>}
              </Pressable>
            ))
          )}
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface.containerHighest,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.x16,
    paddingTop: spacing.x48,
    paddingBottom: spacing.x12,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[20],
  },
  closeBtn: {
    padding: spacing.x8,
    borderRadius: radius.medium,
  },
  pressed: {
    backgroundColor: colors.neutral[10],
  },
  title: {
    ...typography.titleMedium,
    color: colors.primary[900],
  },
  inputs: {
    padding: spacing.x16,
    gap: spacing.x12,
  },
  originRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.x12,
    backgroundColor: colors.neutral[10],
    borderRadius: radius.large,
    paddingHorizontal: spacing.x16,
    paddingVertical: spacing.x14,
  },
  originText: {
    ...typography.bodyMedium,
    color: colors.text.secondary,
  },
  searchInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface.container,
    borderRadius: radius.large,
    borderWidth: 2,
    borderColor: colors.primary[600],
    paddingHorizontal: spacing.x16,
    paddingVertical: spacing.x14,
  },
  searchIcon: {
    marginRight: spacing.x12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: colors.text.primary,
  },
  results: {
    flex: 1,
    paddingHorizontal: spacing.x8,
  },
  empty: {
    ...typography.bodyMedium,
    color: colors.text.tertiary,
    textAlign: 'center',
    paddingVertical: spacing.x40,
  },
  recentsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.x16,
    paddingBottom: spacing.x8,
  },
  recentsLabel: {
    ...typography.labelSmall,
    color: colors.text.tertiary,
  },
  clearBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  clearText: {
    ...typography.labelSmall,
    color: colors.state.danger,
    fontSize: 10,
  },
  resultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.x12,
    paddingHorizontal: spacing.x16,
    paddingVertical: spacing.x14,
    borderRadius: radius.medium,
  },
  resultText: {
    flex: 1,
  },
  resultLabel: {
    ...typography.bodyMedium,
    color: colors.text.primary,
  },
  resultType: {
    ...typography.labelSmall,
    color: colors.text.tertiary,
    fontSize: 10,
    marginTop: 2,
  },
  resultDist: {
    ...typography.bodySmall,
    color: colors.text.secondary,
  },
});