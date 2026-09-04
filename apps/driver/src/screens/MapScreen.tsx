import { useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { useSessionStore } from '../store/session';
import { useConsoleStore } from '../store/ui';
import { GpsChip } from '../components/console/GpsChip';
import { MapControls } from '../components/console/MapControls';
import { DeviationAlert } from '../components/console/DeviationAlert';
import { MAP_CONFIG } from '../constants/config';
import { calculateDistanceInMeters } from '../utils/geo';
import { colors, typography, spacing, radius, elevation } from '../theme/design';
import type { RouteBuilding } from '../types/routes';

const GOOGLE_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_KEY ?? null;

export function MapScreen() {
  const mapRef = useRef<MapView>(null);
  const route = useSessionStore((s) => s.route);
  const routeStops = useSessionStore((s) => s.routeStops);
  const currentStop = useSessionStore((s) => s.currentStop);
  const gpsLocation = useSessionStore((s) => s.gpsLocation);
  const searchDestination = useConsoleStore((s) => s.searchDestination);
  const [satellite, setSatellite] = useState(true);

  const stopsWithCoords = useMemo(
    () => routeStops.filter((s: RouteBuilding) => s.latitude != null && s.longitude != null),
    [routeStops]
  );

  const initialRegion = useMemo(() => {
    const focus =
      currentStop?.latitude != null
        ? { latitude: currentStop.latitude, longitude: currentStop.longitude }
        : stopsWithCoords.length
          ? { latitude: stopsWithCoords[0].latitude!, longitude: stopsWithCoords[0].longitude! }
          : { latitude: MAP_CONFIG.defaultCenter[0], longitude: MAP_CONFIG.defaultCenter[1] };
    return { ...focus, latitudeDelta: 0.01, longitudeDelta: 0.01 };
  }, [currentStop, stopsWithCoords]);

  const routeGeometry = useMemo(
    () =>
      Array.isArray(route?.geometry)
        ? route.geometry.map((g: any) => ({ latitude: g.lat, longitude: g.lng }))
        : [],
    [route]
  );

  return (
    <View style={styles.root}>
      {GOOGLE_KEY ? (
        <MapView
          ref={mapRef}
          style={StyleSheet.absoluteFill}
          mapType={satellite ? 'hybrid' : 'standard'}
          initialRegion={initialRegion}
          minZoomLevel={MAP_CONFIG.minZoom}
          maxZoomLevel={MAP_CONFIG.maxZoom}
          showsUserLocation
          showsMyLocationButton={false}
          rotateEnabled
        >
          {stopsWithCoords.map((s: RouteBuilding) => (
            <Marker key={s.id} coordinate={{ latitude: s.latitude!, longitude: s.longitude! }}>
              <StopBadge stop={s} isCurrent={s.id === currentStop?.id} />
            </Marker>
          ))}
          {routeGeometry.length > 1 && (
            <Polyline coordinates={routeGeometry} strokeColor={colors.primary[600]} strokeWidth={3} />
          )}
          {searchDestination && (
            <Marker
              coordinate={{ latitude: searchDestination.lat, longitude: searchDestination.lng }}
              pinColor={colors.state.warning}
            />
          )}
        </MapView>
      ) : (
        <PlaceholderCanvas stops={stopsWithCoords} currentStopId={currentStop?.id ?? null} gps={gpsLocation} />
      )}

      <MapControls mapRef={mapRef} satellite={satellite} onToggleStyle={() => setSatellite((v) => !v)} />
      
      <DeviationAlert />

      <View style={styles.gpsWrap}>
        <GpsChip />
      </View>
    </View>
  );
}

function StopBadge({ stop, isCurrent }: { stop: RouteBuilding; isCurrent: boolean }) {
  return (
    <View style={[
      styles.marker,
      stop.status === 'completed' && styles.markerCompleted,
      stop.status === 'skipped' && styles.markerSkipped,
      isCurrent && styles.markerCurrent,
    ]}>
      <Text style={styles.markerText}>{stop.sequence}</Text>
    </View>
  );
}

function PlaceholderCanvas({ stops, currentStopId, gps }: {
  stops: RouteBuilding[];
  currentStopId: string | null;
  gps: { latitude: number; longitude: number } | null;
}) {
  return (
    <View style={styles.placeholder}>
      <BlurView intensity={70} tint="light" style={styles.card}>
        <Ionicons name="map-outline" size={44} color={colors.primary[400]} />
        <Text style={styles.cardTitle}>Live map awaiting provider key</Text>
        <Text style={styles.cardBody}>
          Add EXPO_PUBLIC_GOOGLE_MAPS_KEY to activate the render layer.{'\n'}Route telemetry below is live.
        </Text>
      </BlurView>

      <ScrollView style={styles.strip} contentContainerStyle={styles.stripContent}>
        {stops.length === 0 && <Text style={styles.cardBody}>No geocoded stops on this route.</Text>}
        {stops.map((s: RouteBuilding) => {
          const dist = gps ? calculateDistanceInMeters(gps.latitude, gps.longitude, s.latitude!, s.longitude!) : null;
          return (
            <View key={s.id} style={[styles.stripRow, s.id === currentStopId && styles.stripRowCurrent]}>
              <StopBadge stop={s} isCurrent={s.id === currentStopId} />
              <View style={styles.stripInfo}>
                <Text style={styles.stripAddress} numberOfLines={1}>{s.address || s.building_id}</Text>
                <Text style={styles.stripSub}>
                  {s.status}{dist != null ? ` · ${(dist / 1000).toFixed(1)} km away` : ''}
                </Text>
              </View>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { ...StyleSheet.absoluteFill, backgroundColor: colors.primary[100] },
  placeholder: { flex: 1, paddingTop: 110, paddingHorizontal: spacing.x16 },
  card: {
    borderRadius: radius.large, padding: spacing.x20, alignItems: 'center',
    backgroundColor: colors.surface.container, ...elevation[2], overflow: 'hidden',
    marginBottom: spacing.x12,
  },
  cardTitle: { ...typography.titleSmall, color: colors.primary[900], marginTop: spacing.x8, textAlign: 'center' },
  cardBody: { ...typography.bodySmall, color: colors.text.secondary, textAlign: 'center', marginTop: spacing.x4 },
  strip: { flex: 1 },
  stripContent: { paddingBottom: 220 },
  stripRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.surface.container, borderRadius: radius.large,
    padding: spacing.x12, marginBottom: spacing.x8, ...elevation[1],
  },
  stripRowCurrent: { borderWidth: 1.5, borderColor: colors.primary[500] },
  stripInfo: { flex: 1, marginLeft: spacing.x12 },
  stripAddress: { ...typography.titleSmall, color: colors.text.primary },
  stripSub: { ...typography.bodySmall, color: colors.text.tertiary, marginTop: 2 },
  marker: {
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: colors.primary[600], borderWidth: 2, borderColor: colors.surface.containerHighest,
    alignItems: 'center', justifyContent: 'center', ...elevation[2],
  },
  markerCompleted: { backgroundColor: colors.state.success },
  markerSkipped: { backgroundColor: colors.state.warning },
  markerCurrent: { backgroundColor: colors.primary[700], transform: [{ scale: 1.15 }] },
  markerText: { ...typography.labelLarge, color: colors.text.inverse },
  gpsWrap: { position: 'absolute', left: spacing.x16, bottom: 180 },
});