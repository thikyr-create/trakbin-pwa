import { useState } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Building2 } from 'lucide-react-native';
import { caretakerLogin, resetCaretakerPasscode } from '../../services/auth';
import { colors } from '../../theme/colors';
import { radius, sp, touch } from '../../theme/spacing';
import { text } from '../../theme/typography';
import { PasswordInput } from '../../components/ui/PasswordInput';

type Mode = 'login' | 'recover';

export default function AuthScreen() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>('login');
  const [buildingId, setBuildingId] = useState('');
  const [passcode, setPasscode] = useState('');
  const [recAddress, setRecAddress] = useState('');
  const [newPasscode, setNewPasscode] = useState('');
  const [loading, setLoading] = useState(false);

  const buildingIdValid = buildingId.length === 0 || /^TRK-[A-Z0-9]{6}$/.test(buildingId.toUpperCase());

  const submitLogin = async () => {
    if (!buildingIdValid) { Alert.alert('Invalid format', 'Building ID must be TRK-XXXXXX (e.g., TRK-ABC123)'); return; }
    if (!buildingId.trim() || !passcode.trim()) { Alert.alert('Missing fields', 'Enter your Building ID and passcode.'); return; }
    setLoading(true);
    const res = await caretakerLogin(buildingId.trim().toUpperCase(), passcode.trim());
    setLoading(false);
    if (res.ok) router.replace('/customer/(tabs)');
    else Alert.alert('Login failed', res.message || 'Invalid Building ID or passcode.');
  };

  const submitRecover = async () => {
    if (!buildingId.trim() || !recAddress.trim() || !newPasscode.trim()) { Alert.alert('Missing fields', 'Enter Building ID, official address, and new passcode.'); return; }
    setLoading(true);
    const res = await resetCaretakerPasscode(buildingId.trim().toUpperCase(), recAddress.trim(), newPasscode.trim());
    setLoading(false);
    if (res.ok) {
      Alert.alert('Passcode updated', 'Sign in with your new passcode.', [
        { text: 'OK', onPress: () => { setMode('login'); setPasscode(''); setNewPasscode(''); } },
      ]);
    } else {
      Alert.alert('Recovery failed', res.message || 'Building ID and address do not match our records.');
    }
  };

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.container}>
        {mode === 'login' ? (
          <>
            <View style={styles.brand}>
              <View style={styles.brandIcon}><Text style={styles.brandLetter}>T</Text></View>
              <Text style={styles.brandName}>Trakbin</Text>
            </View>
            
            <Text style={styles.subtitle}>Sign in with your Building ID</Text>

            <View style={styles.field}>
              <Building2 size={16} color={colors.text.muted} style={styles.fieldIcon} />
              <TextInput
                style={[styles.input, !buildingIdValid && buildingId.length > 0 && styles.inputError]}
                value={buildingId}
                onChangeText={(v) => setBuildingId(v.toUpperCase())}
                placeholder="Building ID (e.g., TRK-ABC123)"
                placeholderTextColor={colors.text.muted}
                autoCapitalize="characters"
              />
            </View>
            {!buildingIdValid && buildingId.length > 0 ? (
              <Text style={styles.hint}>Format: TRK-XXXXXX (6 characters after dash)</Text>
            ) : null}

            <PasswordInput value={passcode} onChangeText={setPasscode} placeholder="Passcode" />

            <Pressable style={styles.recoverLink} onPress={() => { setMode('recover'); setBuildingId(''); }}>
              <Text style={styles.recoverLinkLabel}>Forgot passcode?</Text>
            </Pressable>

            <Pressable style={[styles.cta, loading && styles.ctaDisabled]} onPress={submitLogin} disabled={loading}>
              {loading ? <ActivityIndicator color={colors.text.inverse} /> : <Text style={styles.ctaLabel}>Sign in</Text>}
            </Pressable>

            <Pressable style={styles.switchLink} onPress={() => router.push('/auth/register')}>
              <Text style={styles.switchLabel}>New building?</Text>
              <Text style={styles.switchAction}> Register →</Text>
            </Pressable>
          </>
        ) : (
          <>
            <Text style={styles.title}>Reset passcode</Text>
            <Text style={styles.subtitle}>Enter your Building ID and the official address you registered with.</Text>

            <View style={styles.field}>
              <Building2 size={16} color={colors.text.muted} style={styles.fieldIcon} />
              <TextInput
                style={styles.input}
                value={buildingId}
                onChangeText={(v) => setBuildingId(v.toUpperCase())}
                placeholder="Building ID"
                placeholderTextColor={colors.text.muted}
                autoCapitalize="characters"
              />
            </View>

            <TextInput
              style={styles.area}
              value={recAddress}
              onChangeText={setRecAddress}
              placeholder="Official building address (as registered)"
              placeholderTextColor={colors.text.muted}
              multiline
              numberOfLines={2}
            />

            <PasswordInput value={newPasscode} onChangeText={setNewPasscode} placeholder="New passcode" />

            <Pressable style={[styles.cta, loading && styles.ctaDisabled]} onPress={submitRecover} disabled={loading}>
              {loading ? <ActivityIndicator color={colors.text.inverse} /> : <Text style={styles.ctaLabel}>Set new passcode</Text>}
            </Pressable>

            <Pressable style={styles.switchLink} onPress={() => { setMode('login'); setNewPasscode(''); }}>
              <Text style={styles.switchAction}>← Back to login</Text>
            </Pressable>
          </>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  container: { flex: 1, justifyContent: 'center', padding: sp.x6 },
  brand: { flexDirection: 'row', alignItems: 'center', gap: sp.x3, marginBottom: sp.x5 },
  brandIcon: { width: 48, height: 48, borderRadius: radius.lg, backgroundColor: colors.brand[500], alignItems: 'center', justifyContent: 'center' },
  brandLetter: { fontFamily: 'Sora_800ExtraBold', fontSize: 24, color: colors.text.inverse },
  brandName: { ...text.titleL, color: colors.text.primary },
  title: { ...text.display, color: colors.text.primary, marginBottom: sp.x2 },
  subtitle: { ...text.bodyM, color: colors.text.muted, marginBottom: sp.x6 },
  field: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.material.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.material.border, marginBottom: sp.x3, paddingHorizontal: sp.x3 },
  fieldIcon: { marginRight: sp.x2 },
  input: { flex: 1, height: touch.field, ...text.bodyM, color: colors.text.primary },
  inputError: { borderColor: colors.state.danger, backgroundColor: 'rgba(244,63,94,0.08)' },
  area: { minHeight: 80, textAlignVertical: 'top', paddingVertical: sp.x3, backgroundColor: colors.material.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.material.border, paddingHorizontal: sp.x4, marginBottom: sp.x3, ...text.bodyM, color: colors.text.primary },
  hint: { ...text.bodyS, color: colors.state.danger, marginBottom: sp.x2 },
  recoverLink: { alignSelf: 'flex-end', marginBottom: sp.x5 },
  recoverLinkLabel: { ...text.semibold, fontSize: 12, color: colors.brand[500] },
  cta: { backgroundColor: colors.brand[600], borderRadius: radius.xl, height: touch.cta, alignItems: 'center', justifyContent: 'center', marginTop: sp.x3 },
  ctaDisabled: { opacity: 0.55 },
  ctaLabel: { ...text.button, color: colors.text.inverse },
  switchLink: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: sp.x5 },
  switchLabel: { ...text.bodyM, color: colors.text.muted },
  switchAction: { ...text.bodyM, color: colors.brand[500], fontWeight: '600' },
});