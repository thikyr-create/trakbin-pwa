// mobile/app/driver/route.tsx
import { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking, Alert, TextInput, Image } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Navigation, MapPin, ArrowLeft, Camera } from 'lucide-react-native';
import { useDriverStore } from '../../store/driverStore';
import { captureProof } from '../../services/proof';
import { colors } from '../../theme/colors';
import { text } from '../../theme/typography';
import { spacing } from '../../theme/spacing';
import { radius } from '../../theme/radius';
import { shadows } from '../../theme/shadows';

export default function RouteScreen() {
  const { route, stops, completeStop, skipStop } = useDriverStore();
  const [position, setPosition] = useState<{ latitude: number; longitude: number } | null>(null);
  const [arrived, setArrived] = useState(false);
  const [note, setNote] = useState('');
  const [proofUrl, setProofUrl] = useState<string | null>(null);

  useEffect(() => {
    let sub: Location.LocationSubscription | null = null;
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;
      const loc = await Location.getCurrentPositionAsync({});
      setPosition({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });
      sub = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.High, timeInterval: 3000, distanceInterval: 5 },
        (u) => setPosition({ latitude: u.coords.latitude, longitude: u.coords.longitude })
      );
    })();
    return () => { sub?.remove(); };
  }, []);

  const pending = useMemo(() => stops.filter((s) => s.status === 'pending'), [stops]);
  const next = pending[0] ?? null;
  const completed = stops.filter((s) => s.status === 'completed').length;

  const navigate = () => {
    if (next?.latitude == null || next?.longitude == null) return;
    Linking.openURL(`google.navigation:q=${next.latitude},${next.longitude}`);
  };

  const onComplete = async () => {
    if (!next) return;
    await completeStop(next.id, { proof_url: proofUrl, note: note.trim() || null });
    setArrived(false); setNote(''); setProofUrl(null);
    if (pending.length <= 1) {
      Alert.alert('Route completed', 'All stops handled. Safe drive back.');
      router.back();
    }
  };

  const onSkip = () => {
    if (!next) return;
    Alert.alert('Skip this stop?', 'Dispatch sees the reason instantly.', [
      { text: 'No waste', onPress: () => { skipStop(next.id, 'no_waste'); setArrived(false); } },
      { text: 'Blocked access', onPress: () => { skipStop(next.id, 'blocked'); setArrived(false); } },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const initialRegion = next?.latitude != null && next?.longitude != null
    ? { latitude: next.latitude, longitude: next.longitude, latitudeDelta: 0.012, longitudeDelta: 0.012 }
    : { latitude: 6.2106, longitude: 7.0686, latitudeDelta: 0.05, longitudeDelta: 0.05 };

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.back}><ArrowLeft size={18} color={colors.textPrimary} /></TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={[text.eyebrow, { color: colors.textFaint }]}>ROUTE · {route?.zone_id ?? '—'}</Text>
          <Text style={styles.progress}>{completed} / {stops.length} stops</Text>
        </View>
      </View>

      <MapView style={styles.map} provider={PROVIDER_GOOGLE} initialRegion={initialRegion} showsUserLocation={!!position} showsMyLocationButton>
        {stops.filter((s) => s.latitude != null && s.longitude != null).map((s) => (
          <Marker
            key={s.id}
            coordinate={{ latitude: s.latitude!, longitude: s.longitude! }}
            pinColor={s.status === 'completed' ? colors.success : s.status === 'skipped' ? colors.warningDot : colors.primary}
            title={s.building_id}
            description={s.address ?? undefined}
          />
        ))}
      </MapView>

      <View style={styles.sheet}>
        {next ? (
          <>
            <Text style={[text.eyebrow, { color: colors.textFaint }]}>NEXT STOP · #{next.sequence}</Text>
            <Text style={styles.stopId}>{next.building_id}</Text>
            <Text style={styles.addr} numberOfLines={1}>{next.address ?? '—'}</Text>

            <View style={styles.btnRow}>
              <TouchableOpacity style={styles.navBtn} onPress={navigate}>
                <Navigation size={15} color="#fff" />
                <Text style={styles.navLabel}> Navigate</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.arriveBtn} onPress={() => setArrived(true)}>
                <MapPin size={15} color={colors.primary} />
                <Text style={styles.arriveLabel}> Arrived</Text>
              </TouchableOpacity>
            </View>

            {arrived && (
              <View style={{ marginTop: spacing.x3 }}>
                <TextInput
                  style={styles.noteInput}
                  placeholder="Collection note (optional)"
                  placeholderTextColor={colors.textFaint}
                  value={note}
                  onChangeText={setNote}
                />
                <View style={[styles.btnRow, { marginTop: spacing.x2, alignItems: 'center' }]}>
                  <TouchableOpacity style={styles.camBtn} onPress={async () => { const url = await captureProof(); if (url) setProofUrl(url); }}>
                    <Camera size={16} color={colors.textSecondary} />
                    <Text style={styles.camLabel}>{proofUrl ? 'Retake photo' : 'Add proof photo'}</Text>
                  </TouchableOpacity>
                  {proofUrl ? <Image source={{ uri: proofUrl }} style={styles.thumb} /> : null}
                </View>
                <View style={[styles.btnRow, { marginTop: spacing.x2 }]}>
                  <TouchableOpacity style={styles.doneBtn} onPress={onComplete}>
                    <Text style={styles.doneLabel}>Collection completed</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.skipBtn} onPress={onSkip}>
                    <Text style={styles.skipLabel}>Failed</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </>
        ) : (
          <Text style={styles.doneAll}>All stops handled. Route complete.</Text>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.x3, paddingHorizontal: spacing.x4, paddingVertical: spacing.x3, backgroundColor: colors.card },
  back: { padding: spacing.x2, borderRadius: radius.sm, backgroundColor: colors.inputBg },
  progress: { ...text.bodySm, color: colors.textPrimary, fontWeight: '800' },
  map: { flex: 1 },
  sheet: { backgroundColor: colors.card, borderTopLeftRadius: radius.card, borderTopRightRadius: radius.card, padding: spacing.x5, paddingBottom: spacing.x6, ...shadows.dock },
  stopId: { ...text.headingL, color: colors.textPrimary, marginTop: spacing.x1 },
  addr: { ...text.bodyXs, color: colors.textMuted, marginTop: 2, marginBottom: spacing.x4 },
  btnRow: { flexDirection: 'row', gap: spacing.x3 },
  navBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primary, borderRadius: radius.button, paddingVertical: 14, ...shadows.button },
  navLabel: { color: '#fff', ...text.bodySm, fontWeight: '800' },
  arriveBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primarySoft, borderRadius: radius.button, paddingVertical: 14 },
  arriveLabel: { color: colors.primary, ...text.bodySm, fontWeight: '800' },
  noteInput: { backgroundColor: colors.inputBg, borderWidth: 1, borderColor: colors.border, borderRadius: radius.input, paddingHorizontal: spacing.x4, paddingVertical: 10, ...text.bodyXs, color: colors.textPrimary },
  camBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: colors.inputBg, borderRadius: radius.button, paddingVertical: 12 },
  camLabel: { color: colors.textSecondary, ...text.bodyXs, fontWeight: '700' },
  thumb: { width: 44, height: 44, borderRadius: radius.sm, backgroundColor: colors.inputBg },
  doneBtn: { flex: 2, alignItems: 'center', backgroundColor: colors.success, borderRadius: radius.button, paddingVertical: 14 },
  doneLabel: { color: '#fff', ...text.bodySm, fontWeight: '800' },
  skipBtn: { flex: 1, alignItems: 'center', backgroundColor: colors.dangerBg, borderRadius: radius.button, paddingVertical: 14 },
  skipLabel: { color: colors.danger, ...text.bodySm, fontWeight: '800' },
  doneAll: { ...text.headingM, color: colors.success, textAlign: 'center', paddingVertical: spacing.x3 },
});