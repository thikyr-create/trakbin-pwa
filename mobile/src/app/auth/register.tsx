import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable, ActivityIndicator, Alert, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Building2, MapPin, ArrowLeft, CheckCircle, AlertCircle, Navigation } from 'lucide-react-native';
import { registerCaretaker } from '../../services/auth';
import { colors } from '../../theme/colors';
import { radius, sp, touch } from '../../theme/spacing';
import { text } from '../../theme/typography';

const BUILDING_TYPES = [
  { value: 'Residential Single Unit', label: 'Residential Single Unit' },
  { value: 'Residential Multi-Unit', label: 'Residential Multi-Unit (Apartment)' },
  { value: 'Commercial', label: 'Commercial Building' },
  { value: 'Industrial', label: 'Industrial Complex' },
];

const getLocationModule = () => { try { return require('expo-location'); } catch { return null; } };

export default function RegisterScreen() {
  const router = useRouter();
  const [passcode, setPasscode] = useState('');
  const [confirmPasscode, setConfirmPasscode] = useState('');
  const [buildingType, setBuildingType] = useState(BUILDING_TYPES[0].value);
  const [numberOfFlats, setNumberOfFlats] = useState('');
  const [numberOfShops, setNumberOfShops] = useState('');
  const [officialAddress, setOfficialAddress] = useState('');
  const [estate, setEstate] = useState('');
  const [gpsAddress, setGpsAddress] = useState('');
  const [coords, setCoords] = useState<{ lat: number; lon: number } | null>(null);
  const [gpsStatus, setGpsStatus] = useState<'idle' | 'requesting' | 'captured' | 'error'>('idle');
  const [loading, setLoading] = useState(false);
  const [showIdCard, setShowIdCard] = useState<null | { id: string; passcode: string; address: string }>(null);

  const passcodeMismatch = confirmPasscode.length > 0 && passcode !== confirmPasscode;
  const canSubmit = !loading && !passcodeMismatch && passcode.length > 0 && gpsStatus === 'captured' && officialAddress.trim().length > 0 &&
    (buildingType !== 'Residential Multi-Unit' || !!numberOfFlats) &&
    (buildingType !== 'Commercial' || !!numberOfShops);

  useEffect(() => {
    requestGps();
  }, []);

  const requestGps = async () => {
    const Loc = getLocationModule();
    if (!Loc) { setGpsStatus('error'); Alert.alert('GPS unavailable', 'Location module not available. Build the app with `npx expo install expo-location` to enable GPS.'); return; }
    setGpsStatus('requesting');
    try {
      const { status } = await Loc.requestForegroundPermissionsAsync();
      if (status !== 'granted') { setGpsStatus('error'); Alert.alert('Permission denied', 'Enable location in settings to register.'); return; }
      const pos = await Loc.getCurrentPositionAsync({ accuracy: Loc.Accuracy.High });
      const lat = pos.coords.latitude;
      const lon = pos.coords.longitude;
      setCoords({ lat, lon });
      setGpsAddress(`${lat.toFixed(6)}, ${lon.toFixed(6)}`);
      setGpsStatus('captured');
    } catch {
      setGpsStatus('error');
    }
  };

  const submit = async () => {
    if (!canSubmit || !coords) return;
    if (buildingType === 'Residential Multi-Unit' && !numberOfFlats) { Alert.alert('Missing', 'Select number of flats.'); return; }
    if (buildingType === 'Commercial' && !numberOfShops) { Alert.alert('Missing', 'Select number of shops.'); return; }

    setLoading(true);
    const res = await registerCaretaker({
      passcode,
      buildingType,
      officialAddress: officialAddress.trim(),
      estate: estate.trim() || null,
      gpsAddress,
      latitude: coords.lat,
      longitude: coords.lon,
      numberOfFlats: buildingType === 'Residential Multi-Unit' ? numberOfFlats : null,
      numberOfShops: buildingType === 'Commercial' ? numberOfShops : null,
    });
    setLoading(false);
    if (res.ok && res.buildingId) {
      setShowIdCard({ id: res.buildingId, passcode, address: officialAddress.trim() });
    } else {
      Alert.alert('Registration failed', res.message || 'Could not register. Try again.');
    }
  };

  if (showIdCard) {
    return (
      <View style={styles.screen}>
        <View style={styles.idCardWrap}>
          <View style={styles.idCard}>
            <View style={styles.idCardHeader}>
              <Text style={styles.idCardBrand}>T · Trakbin</Text>
              <Text style={styles.idCardRole}>CARETAKER</Text>
            </View>
            <Text style={styles.idCardLabel}>Building ID</Text>
            <Text style={styles.idCardValue}>{showIdCard.id}</Text>
            <View style={styles.idCardPasscodeWrap}>
              <Text style={styles.idCardLabel}>Passcode</Text>
              <Text style={styles.idCardPasscode}>{showIdCard.passcode}</Text>
            </View>
            <Text style={styles.idCardLabel}>Address</Text>
            <Text style={styles.idCardBody}>{showIdCard.address}</Text>
            <Text style={styles.idCardFooter}>Use these credentials to sign in</Text>
          </View>

          <Text style={styles.idCardWarning}>⚠️ Save this card. You need it to log in.</Text>

          <Pressable style={styles.idCardCta} onPress={() => router.replace('/auth')}>
            <Text style={styles.idCardCtaLabel}>I've saved my card →</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Pressable style={styles.backBtn} onPress={() => router.replace('/auth')}>
          <ArrowLeft size={16} color={colors.text.secondary} />
          <Text style={styles.backLabel}>Back to login</Text>
        </Pressable>

        
        {/* GPS status */}
        <View style={[styles.gpsCard, gpsStatus === 'captured' ? styles.gpsCardOk : styles.gpsCardNeutral]}>
          <View style={styles.gpsRow}>
            {gpsStatus === 'requesting' ? <ActivityIndicator size="small" color={colors.brand[500]} /> : null}
            {gpsStatus === 'captured' ? <CheckCircle size={18} color={colors.state.success} /> : null}
            {gpsStatus === 'error' ? <AlertCircle size={18} color={colors.state.danger} /> : null}
            {gpsStatus === 'idle' ? <MapPin size={18} color={colors.text.muted} /> : null}
            <Text style={styles.gpsLabel}>
              {gpsStatus === 'requesting' ? 'Locating…' : gpsStatus === 'captured' ? 'Location locked' : gpsStatus === 'error' ? 'Location unavailable' : 'Waiting for GPS'}
            </Text>
            {gpsStatus !== 'requesting' ? (
              <Pressable onPress={requestGps}>
                <Text style={styles.gpsRefresh}>Refresh</Text>
              </Pressable>
            ) : null}
          </View>
          {gpsAddress ? <Text style={styles.gpsAddress} numberOfLines={2}>{gpsAddress}</Text> : null}
        </View>

        {/* Passcode */}
        <Text style={styles.fieldLabel}>Passcode</Text>
        <TextInput style={styles.input} value={passcode} onChangeText={setPasscode} placeholder="Create a passcode" placeholderTextColor={colors.text.muted} secureTextEntry />
        <TextInput style={[styles.input, passcodeMismatch && styles.inputError]} value={confirmPasscode} onChangeText={setConfirmPasscode} placeholder="Confirm passcode" placeholderTextColor={colors.text.muted} secureTextEntry />
        {passcodeMismatch ? <Text style={styles.errorLabel}>Passcodes do not match.</Text> : null}

        {/* Building type */}
        <Text style={styles.fieldLabel}>Building type</Text>
        <View style={styles.pickerRow}>
          {BUILDING_TYPES.map((bt) => (
            <Pressable key={bt.value} style={[styles.pill, buildingType === bt.value && styles.pillActive]} onPress={() => { setBuildingType(bt.value); setNumberOfFlats(''); setNumberOfShops(''); }}>
              <Text style={[styles.pillLabel, buildingType === bt.value && styles.pillLabelActive]}>{bt.label}</Text>
            </Pressable>
          ))}
        </View>

        {buildingType === 'Residential Multi-Unit' ? (
          <>
            <Text style={styles.fieldLabel}>Number of flats</Text>
            <TextInput style={styles.input} value={numberOfFlats} onChangeText={setNumberOfFlats} placeholder="e.g. 12" keyboardType="number-pad" placeholderTextColor={colors.text.muted} />
          </>
        ) : null}
        {buildingType === 'Commercial' ? (
          <>
            <Text style={styles.fieldLabel}>Number of shops</Text>
            <TextInput style={styles.input} value={numberOfShops} onChangeText={setNumberOfShops} placeholder="e.g. 8" keyboardType="number-pad" placeholderTextColor={colors.text.muted} />
          </>
        ) : null}

        {/* Address */}
        <Text style={styles.fieldLabel}>Official building address</Text>
        <TextInput style={[styles.input, styles.area]} value={officialAddress} onChangeText={setOfficialAddress} placeholder="e.g. House 12, Nsugbe Road" placeholderTextColor={colors.text.muted} multiline numberOfLines={2} />

        <Text style={styles.fieldLabel}>Estate / street <Text style={styles.hintInline}>(helps auto-match a provider)</Text></Text>
        <TextInput style={styles.input} value={estate} onChangeText={setEstate} placeholder="e.g. Independence Estate" placeholderTextColor={colors.text.muted} />

        <Pressable style={[styles.cta, !canSubmit && styles.ctaDisabled]} onPress={submit} disabled={!canSubmit}>
          {loading ? <ActivityIndicator color={colors.text.inverse} /> : <Text style={styles.ctaLabel}>Register</Text>}
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: sp.x5, paddingBottom: sp.x12 },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: sp.x2, marginBottom: sp.x4 },
  backLabel: { ...text.semibold, fontSize: 12, color: colors.text.secondary },
  title: { ...text.display, color: colors.text.primary, marginBottom: sp.x1 },
  subtitle: { ...text.bodyM, color: colors.text.muted, marginBottom: sp.x5 },

  gpsCard: { borderRadius: radius.lg, padding: sp.x4, marginBottom: sp.x5, borderWidth: 1 },
  gpsCardOk: { backgroundColor: 'rgba(16,185,129,0.08)', borderColor: colors.state.success },
  gpsCardNeutral: { backgroundColor: colors.material.surface, borderColor: colors.material.border },
  gpsRow: { flexDirection: 'row', alignItems: 'center', gap: sp.x2 },
  gpsLabel: { flex: 1, ...text.semibold, color: colors.text.primary },
  gpsRefresh: { ...text.semibold, fontSize: 12, color: colors.brand[500] },
  gpsAddress: { ...text.bodyS, color: colors.text.secondary, marginTop: sp.x2 },

  fieldLabel: { ...text.label, fontSize: 10, color: colors.text.secondary, marginBottom: sp.x2, marginTop: sp.x2 },
  input: { backgroundColor: colors.material.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.material.border, paddingHorizontal: sp.x4, height: touch.field, ...text.bodyM, color: colors.text.primary, marginBottom: sp.x3 },
  inputError: { borderColor: colors.state.danger, backgroundColor: 'rgba(244,63,94,0.08)' },
  area: { minHeight: 72, textAlignVertical: 'top', paddingVertical: sp.x3 },
  errorLabel: { ...text.bodyS, color: colors.state.danger, marginTop: -sp.x2, marginBottom: sp.x3 },
  hintInline: { color: colors.text.muted, fontStyle: 'italic' },

  pickerRow: { flexDirection: 'row', flexWrap: 'wrap', gap: sp.x2, marginBottom: sp.x3 },
  pill: { paddingHorizontal: sp.x3, paddingVertical: sp.x2, borderRadius: radius.md, backgroundColor: colors.material.surface, borderWidth: 1, borderColor: colors.material.border },
  pillActive: { backgroundColor: colors.material.emerald, borderColor: colors.brand[500] },
  pillLabel: { ...text.bodyS, color: colors.text.secondary },
  pillLabelActive: { color: colors.text.primary, fontWeight: '600' },

  cta: { backgroundColor: colors.brand[600], borderRadius: radius.xl, height: touch.cta, alignItems: 'center', justifyContent: 'center', marginTop: sp.x6 },
  ctaDisabled: { opacity: 0.45 },
  ctaLabel: { ...text.button, color: colors.text.inverse },

  idCardWrap: { flex: 1, justifyContent: 'center', padding: sp.x6 },
  idCard: { backgroundColor: colors.brand[600], borderRadius: radius.xxl, padding: sp.x6, shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 16, shadowOffset: { width: 0, height: 8 }, elevation: 8 },
  idCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: sp.x5, paddingBottom: sp.x3, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.2)' },
  idCardBrand: { ...text.semibold, color: colors.text.inverse },
  idCardRole: { ...text.label, fontSize: 10, color: colors.text.inverse, backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: sp.x2, paddingVertical: 2, borderRadius: radius.md },
  idCardLabel: { ...text.label, fontSize: 10, color: 'rgba(255,255,255,0.7)', marginTop: sp.x3 },
  idCardValue: { ...text.display, color: colors.text.inverse, marginTop: 2 },
  idCardPasscodeWrap: { backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: radius.lg, padding: sp.x3, marginTop: sp.x2 },
  idCardPasscode: { ...text.titleM, color: colors.text.inverse, marginTop: 2 },
  idCardBody: { ...text.bodyM, color: colors.text.inverse, marginTop: 2 },
  idCardFooter: { ...text.bodyS, color: 'rgba(255,255,255,0.75)', textAlign: 'center', marginTop: sp.x5, paddingTop: sp.x3, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.2)' },
  idCardWarning: { ...text.bodyS, color: colors.text.muted, textAlign: 'center', marginTop: sp.x4 },
  idCardCta: { backgroundColor: colors.brand[600], borderRadius: radius.xl, height: touch.cta, alignItems: 'center', justifyContent: 'center', marginTop: sp.x5 },
  idCardCtaLabel: { ...text.button, color: colors.text.inverse },
});