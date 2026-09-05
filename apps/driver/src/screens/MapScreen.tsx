import { useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { useSessionStore } from '../store/session';
import { useConsoleStore } from '../store/ui';
import { GpsChip } from '../components/console/GpsChip';
import { MapControls } from '../components/console/MapControls';
import { DeviationAlert } from '../components/console/DeviationAlert';
import { MAP_CONFIG } from '../constants/config';
import { useLayout } from '../theme/layout';
import { colors, typography, spacing, radius, elevation } from '../theme/design';
import type { RouteBuilding } from '../types/routes';

const GOOGLE_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_KEY ?? null;

export function MapScreen() {
  const L = useLayout();
  const mapRef = useRef<MapView>(null);
  const route = useSessionStore((s) => s.route);
  const routeStops = useSessionStore((s) => s.routeStops);
  const currentStop = useSessionStore((s) => s.currentStop);
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
        <PlaceholderCanvas screenTop={L.screenTop} />
      )}

      <MapControls mapRef={mapRef} satellite={satellite} onToggleStyle={() => setSatellite((v) => !v)} />

      <DeviationAlert />

      <View style={[styles.gpsWrap, { bottom: L.chipBottom }]}>
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

function PlaceholderCanvas({ screenTop }: { screenTop: number }) {
  return (
    <View style={[styles.placeholder, { paddingTop: screenTop }]}>
      <BlurView intensity={70} tint="light" style={styles.card}>
        <Ionicons name="map-outline" size={44} color={colors.primary[400]} />
        <Text style={styles.cardTitle}>Live map awaiting provider key</Text>
        <Text style={styles.cardBody}>
          Add EXPO_PUBLIC_GOOGLE_MAPS_KEY to activate the render layer.
        </Text>
      </BlurView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { ...StyleSheet.absoluteFill, backgroundColor: colors.primary[100] },
  placeholder: { flex: 1, paddingHorizontal: spacing.x16 },
  card: {
    borderRadius: radius.large,
    padding: spacing.x20,
    alignItems: 'center',
    backgroundColor: colors.surface.container,
    ...elevation[2],
    overflow: 'hidden',
  },
  cardTitle: { ...typography.titleSmall, color: colors.primary[900], marginTop: spacing.x8, textAlign: 'center' },
  cardBody: { ...typography.bodySmall, color: colors.text.secondary, textAlign: 'center', marginTop: spacing.x4 },
  marker: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.primary[600],
    borderWidth: 2,
    borderColor: colors.surface.containerHighest,
    alignItems: 'center',
    justifyContent: 'center',
    ...elevation[2],
  },
  markerCompleted: { backgroundColor: colors.state.success },
  markerSkipped: { backgroundColor: colors.state.warning },
  markerCurrent: { backgroundColor: colors.primary[700], transform: [{ scale: 1.15 }] },
  markerText: { ...typography.labelLarge, color: colors.text.inverse },
  gpsWrap: { position: 'absolute', left: spacing.x16 },
});