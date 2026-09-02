import { View, Text, StyleSheet } from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import { Map as MapIcon } from 'lucide-react-native';
import { colors } from '../../theme/colors';
import { sp } from '../../theme/spacing';
import { text } from '../../theme/typography';

interface Props {
  mapRef: React.MutableRefObject<any>;
  mapType: 'satellite' | 'standard';
  initialRegion: {
    latitude: number;
    longitude: number;
    latitudeDelta: number;
    longitudeDelta: number;
  };
  hasPosition: boolean;
  stops: any[];
}

export function DriverMap({ mapRef, mapType, initialRegion, hasPosition, stops }: Props) {
  const key = process.env.EXPO_PUBLIC_GOOGLE_MAPS_KEY;

  if (!key) {
    return (
      <View style={styles.fallback}>
        <MapIcon size={40} color={colors.text.muted} />
        <Text style={styles.fallbackTitle}>Live map unavailable</Text>
        <Text style={styles.fallbackBody}>
          Add EXPO_PUBLIC_GOOGLE_MAPS_KEY to mobile/.env and restart Metro to enable Google Maps.
        </Text>
      </View>
    );
  }

  const coords = stops
    .filter((s) => s.latitude != null && s.longitude != null)
    .sort((a: any, b: any) => (a.sequence ?? 0) - (b.sequence ?? 0))
    .map((s) => ({ latitude: s.latitude!, longitude: s.longitude! }));

  return (
    <MapView
      ref={mapRef}
      style={StyleSheet.absoluteFill}
      provider={PROVIDER_GOOGLE}
      mapType={mapType}
      initialRegion={initialRegion}
      showsUserLocation={hasPosition}
      showsMyLocationButton={false}
    >
      {coords.length > 1 ? (
        <Polyline coordinates={coords} strokeColor={colors.map.route} strokeWidth={4} />
      ) : null}
      {stops
        .filter((s) => s.latitude != null && s.longitude != null)
        .map((s) => (
          <Marker
            key={s.id}
            coordinate={{ latitude: s.latitude!, longitude: s.longitude! }}
            pinColor={
              s.status === 'completed'
                ? colors.state.success
                : s.status === 'skipped'
                  ? colors.state.warning
                  : colors.brand[600]
            }
            title={s.building_id}
            description={s.address ?? undefined}
          />
        ))}
    </MapView>
  );
}

const styles = StyleSheet.create({
  fallback: {
    ...StyleSheet.absoluteFill,
    backgroundColor: colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
    padding: sp.x6,
    gap: sp.x2,
  },
  fallbackTitle: { ...text.titleM, color: colors.text.primary },
  fallbackBody: { ...text.bodyM, color: colors.text.muted, textAlign: 'center' },
});