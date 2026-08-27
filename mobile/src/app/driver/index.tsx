import { useEffect, useMemo, useRef, useState } from 'react';
import { View, StyleSheet, Linking, Alert } from 'react-native';
import * as Location from 'expo-location';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DriverMap } from '../../components/driver/DriverMap';
import { ShiftBar } from '../../components/driver/ShiftBar';
import { GpsChip } from '../../components/driver/GpsChip';
import { MapFabs } from '../../components/driver/MapFabs';
import { StopSheet, SHEET_PEEK } from '../../components/driver/StopSheet';
import { useAuthStore } from '../../store/authStore';
import { useDriverStore } from '../../store/driverStore';
import { captureProof } from '../../services/proof';
import { ARRIVAL_RADIUS_M, haversineM } from '../../services/geo';
import { colors } from '../../theme/colors';
import { sp } from '../../theme/spacing';

export default function MapConsole() {
  const insets = useSafeAreaInsets();
  const mapRef = useRef<any>(null);
  const signOut = useAuthStore((s) => s.signOut);
  const {
    route, stops, loading, load,
    startRoute, pauseRoute, resumeRoute, completeStop, skipStop,
  } = useDriverStore();

  const [position, setPosition] = useState<{ latitude: number; longitude: number; accuracy?: number } | null>(null);
  const [gpsLive, setGpsLive] = useState(false);
  const [mapType, setMapType] = useState<'satellite' | 'standard'>('satellite');
  const [expanded, setExpanded] = useState(false);
  const [proofUrl, setProofUrl] = useState<string | null>(null);

  useEffect(() => { load(); }, []);

  useEffect(() => {
    let sub: Location.LocationSubscription | null = null;
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;
      const loc = await Location.getCurrentPositionAsync({});
      setPosition({ latitude: loc.coords.latitude, longitude: loc.coords.longitude, accuracy: loc.coords.accuracy ?? undefined });
      setGpsLive(true);
      sub = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.High, timeInterval: 3000, distanceInterval: 5 },
        (u) => setPosition({ latitude: u.coords.latitude, longitude: u.coords.longitude, accuracy: u.coords.accuracy ?? undefined })
      );
    })();
    return () => { sub?.remove(); };
  }, []);

  const pending = useMemo(() => stops.filter((s) => s.status === 'pending'), [stops]);
  const next = pending[0] ?? null;

  const distM = position && next?.latitude != null && next?.longitude != null
    ? haversineM(position, { latitude: next.latitude, longitude: next.longitude })
    : null;
  const inZone = distM != null && distM <= ARRIVAL_RADIUS_M;

  const navigate = () => {
    if (next?.latitude == null || next?.longitude == null) return;
    Linking.openURL(`google.navigation:q=${next.latitude},${next.longitude}`);
  };

  const confirm = async () => {
    if (!next) return;
    if (route?.status === 'assigned') await startRoute();
    await completeStop(next.id, { proof_url: proofUrl, note: null });
    setProofUrl(null);
    if (pending.length <= 1) Alert.alert('Route completed', 'All stops handled. Safe drive back.');
  };

  const skip = () => {
    if (!next) return;
    Alert.alert('Skip this stop?', 'Dispatch sees the reason instantly.', [
      { text: 'No waste', onPress: () => skipStop(next.id, 'no_waste') },
      { text: 'Blocked access', onPress: () => skipStop(next.id, 'blocked') },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const locate = () => {
    if (!position || !mapRef.current) return;
    mapRef.current.animateToRegion(
      { latitude: position.latitude, longitude: position.longitude, latitudeDelta: 0.012, longitudeDelta: 0.012 },
      500
    );
  };

  const initialRegion = next?.latitude != null && next?.longitude != null
    ? { latitude: next.latitude, longitude: next.longitude, latitudeDelta: 0.012, longitudeDelta: 0.012 }
    : position
      ? { latitude: position.latitude, longitude: position.longitude, latitudeDelta: 0.05, longitudeDelta: 0.05 }
      : { latitude: 6.2106, longitude: 7.0686, latitudeDelta: 0.05, longitudeDelta: 0.05 };

  const floatBottom = SHEET_PEEK + insets.bottom + sp.x3;

  return (
    <View style={styles.root}>
      <DriverMap
        mapRef={mapRef}
        mapType={mapType}
        initialRegion={initialRegion}
        hasPosition={!!position}
        stops={stops}
      />

      <ShiftBar status={route?.status} onSignOut={signOut} topInset={insets.top} />
      <GpsChip live={gpsLive} accuracy={position?.accuracy} bottom={floatBottom} />
      <MapFabs
        onLocate={locate}
        onToggleLayer={() => setMapType((m) => (m === 'satellite' ? 'standard' : 'satellite'))}
        bottom={floatBottom}
      />
      <StopSheet
        loading={loading}
        next={next}
        routeStatus={route?.status}
        expanded={expanded}
        onToggle={setExpanded}
        distM={distM}
        inZone={inZone}
        proofUrl={proofUrl}
        onNavigate={navigate}
        onSkip={skip}
        onConfirm={confirm}
        onPauseToggle={route?.status === 'paused' ? resumeRoute : pauseRoute}
        onCapture={async () => { const u = await captureProof(); if (u) setProofUrl(u); }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
});