import { View, Text, StyleSheet, Pressable, Alert, Linking } from 'react-native';
import { LogOut, Copy, ExternalLink, MapPin, Radio, Users, CalendarDays, ShieldCheck, Building2 } from 'lucide-react-native';
import { TabScreen } from '../../../components/layout/TabScreen';
import { StatusPill } from '../../../components/ui/StatusPill';
import { Rise } from '../../../components/ui/motion';
import { useCaretakerStore } from '../../../store/caretakerStore';
import { useAuthStore } from '../../../store/authStore';
import { colors } from '../../../theme/colors';
import { radius, sp } from '../../../theme/spacing';
import { text } from '../../../theme/typography';

const fmtDate = (iso?: string | null) =>
  iso ? new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';

export default function BuildingScreen() {
  const building = useCaretakerStore((s) => s.building);
  const company = useCaretakerStore((s) => s.company);
  const signOut = useAuthStore((s) => s.signOut);

  const providerName: string =
    company?.business_name ?? company?.name ?? company?.company_name ?? company?.trading_name ?? '—';

  const lat = building?.latitude != null ? Number(building.latitude) : null;
  const lng = building?.longitude != null ? Number(building.longitude) : null;
  const coords = lat != null && lng != null ? `${lat}, ${lng}` : '—';

  const copyCoords = async () => {
    try {
      const Clipboard = require('expo-clipboard');
      await Clipboard.setStringAsync(coords);
      Alert.alert('Copied', 'GPS coordinates copied to clipboard.');
    } catch {
      Alert.alert('Copy unavailable', 'Clipboard needs a native rebuild. Use the map button instead.');
    }
  };

  const openMap = () => {
    if (lat == null || lng == null) return;
    Linking.openURL(`https://www.google.com/maps?q=${lat},${lng}`);
  };

  const handleSignOut = () => {
    Alert.alert('Sign out?', 'You will need your Building ID and passcode to sign back in.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign out', style: 'destructive', onPress: signOut },
    ]);
  };

  return (
    <TabScreen>
      {/* IDENTITY HERO — emerald-tinted material */}
      <Rise delay={0}>
        <View style={styles.hero}>
          <View style={styles.heroTop}>
            <View style={styles.heroIcon}><Building2 size={20} color={colors.brand[400]} /></View>
            <View style={styles.heroMain}>
              <Text style={styles.heroId}>{building?.custom_id ?? '—'}</Text>
              <Text style={styles.heroSub}>{building?.unit_type ?? building?.building_type ?? '—'}</Text>
            </View>
            <StatusPill value={building?.status ?? 'active'} />
          </View>
        </View>
      </Rise>

      {/* OCCUPANCY + REGISTERED — half tiles */}
      <Rise delay={70}>
        <View style={styles.row}>
          <View style={styles.tileHalf}>
            <Users size={15} color={colors.brand[400]} />
            <Text style={styles.tileLabel}>Occupancy</Text>
            <Text style={styles.tileValue}>{building?.number_of_units ?? 1} unit{(building?.number_of_units ?? 1) > 1 ? 's' : ''}</Text>
          </View>
          <View style={styles.tileHalf}>
            <CalendarDays size={15} color={colors.brand[400]} />
            <Text style={styles.tileLabel}>Registered</Text>
            <Text style={styles.tileValue}>{fmtDate(building?.created_at)}</Text>
          </View>
        </View>
      </Rise>

      {/* OFFICIAL ADDRESS */}
      <Rise delay={140}>
        <View style={styles.tile}>
          <View style={styles.tileHead}>
            <MapPin size={15} color={colors.brand[400]} />
            <Text style={styles.tileLabel}>Official address</Text>
          </View>
          <Text style={styles.tileBody}>{building?.address ?? '—'}</Text>
        </View>
      </Rise>

      {/* DETECTED MAP LOCATION */}
      <Rise delay={180}>
        <View style={styles.tile}>
          <View style={styles.tileHead}>
            <Radio size={15} color={colors.brand[400]} />
            <Text style={styles.tileLabel}>Detected map location</Text>
          </View>
          <Text style={styles.tileBody}>{building?.gps_location_address ?? '—'}</Text>
        </View>
      </Rise>

      {/* GPS COORDINATES + actions */}
      <Rise delay={220}>
        <View style={styles.tile}>
          <View style={styles.tileHead}>
            <MapPin size={15} color={colors.brand[400]} />
            <Text style={styles.tileLabel}>GPS coordinates</Text>
          </View>
          <View style={styles.coordsRow}>
            <Text style={styles.coords} numberOfLines={1}>{coords}</Text>
            <Pressable style={styles.coordBtn} onPress={copyCoords} accessibilityRole="button" accessibilityLabel="Copy coordinates">
              <Copy size={15} color={colors.text.secondary} />
            </Pressable>
            <Pressable style={styles.coordBtn} onPress={openMap} accessibilityRole="button" accessibilityLabel="Open in maps">
              <ExternalLink size={15} color={colors.text.secondary} />
            </Pressable>
          </View>
        </View>
      </Rise>

      {/* SERVICE */}
      <Rise delay={260}>
        <View style={styles.tile}>
          <View style={styles.tileHead}>
            <ShieldCheck size={15} color={colors.brand[400]} />
            <Text style={styles.tileLabel}>Service</Text>
          </View>
          <View style={styles.serviceRow}>
            <Text style={styles.tileBody} numberOfLines={1}>{providerName}</Text>
            <StatusPill value={building?.status ?? 'active'} />
          </View>
        </View>
      </Rise>

      <Rise delay={300}>
        <Pressable style={styles.signOutBtn} onPress={handleSignOut} accessibilityRole="button">
  <Text style={styles.signOutLabel}>Sign out</Text>
</Pressable>
        <Text style={styles.note}>Building ID and provider relationships are managed by your waste company.</Text>
      </Rise>
    </TabScreen>
  );
}

const styles = StyleSheet.create({
  // Emerald-tinted frosted hero
  hero: {
    backgroundColor: colors.material.emerald,
    borderRadius: radius.xxl,
    borderWidth: 1,
    borderColor: colors.material.emeraldBorder,
    padding: sp.x5,
  },
  heroTop: { flexDirection: 'row', alignItems: 'center', gap: sp.x3 },
  heroIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.lg,
    backgroundColor: colors.material.surfaceStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroMain: { flex: 1 },
  heroId: { ...text.display, color: colors.text.primary },
  heroSub: { ...text.bodyM, color: colors.text.secondary, marginTop: 2 },

  row: { flexDirection: 'row', gap: sp.x3, marginTop: sp.x4 },
  tileHalf: {
    flex: 1,
    backgroundColor: colors.material.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.material.border,
    padding: sp.x4,
  },

  tile: {
    backgroundColor: colors.material.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.material.border,
    padding: sp.x4,
    marginTop: sp.x3,
  },
  tileHead: { flexDirection: 'row', alignItems: 'center', gap: sp.x2, marginBottom: sp.x2 },
  tileLabel: { ...text.label, fontSize: 10, color: colors.text.muted },
  tileValue: { ...text.headingM, color: colors.text.primary, marginTop: sp.x2 },
  tileBody: { ...text.bodyL, color: colors.text.primary },

  coordsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: sp.x2,
    backgroundColor: colors.material.surfaceStrong,
    borderRadius: radius.lg,
    paddingHorizontal: sp.x3,
    paddingVertical: sp.x2,
  },
  coords: { flex: 1, ...text.mono, color: colors.text.primary },
  coordBtn: {
    width: 34,
    height: 34,
    borderRadius: radius.md,
    backgroundColor: colors.material.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.material.border,
  },

  serviceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: sp.x2 },

  signOutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: sp.x2,
    backgroundColor: colors.state.dangerSoft,
    borderRadius: radius.lg,
    paddingVertical: sp.x4,
    marginTop: sp.x6,
  },
  signOutLabel: { ...text.button, color: colors.state.danger },
  note: { ...text.bodyS, color: colors.text.muted, textAlign: 'center', marginTop: sp.x4 },
});