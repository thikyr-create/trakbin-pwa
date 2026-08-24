// mobile/app/(auth)/login.tsx
import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Eye, EyeOff, LogIn } from 'lucide-react-native';
import { useAuthStore } from '../../store/authStore';
import { colors } from '../../theme/colors';
import { fonts, text } from '../../theme/typography';
import { spacing } from '../../theme/spacing';
import { radius } from '../../theme/radius';
import { shadows } from '../../theme/shadows';

type Role = 'driver' | 'caretaker';

export default function LoginScreen() {
  const [role, setRole] = useState<Role>('driver');
  const [id, setId] = useState('');
  const [secret, setSecret] = useState('');
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const loginDriver = useAuthStore((s) => s.loginDriver);
  const loginCaretaker = useAuthStore((s) => s.loginCaretaker);
  const notice = useAuthStore((s) => s.notice);

  const submit = async () => {
    setLoading(true); setError('');
    const res = role === 'driver' ? await loginDriver(id.trim(), secret) : await loginCaretaker(id.trim().toUpperCase(), secret);
    setLoading(false);
    if (!res.ok) setError(res.message || 'Login failed');
  };

  return (
    <SafeAreaView style={styles.root}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.brandRow}>
            <View style={styles.logo}><Text style={styles.logoT}>T</Text></View>
            <View>
              <Text style={styles.brandName}>Trakbin</Text>
              <Text style={[text.eyebrow, { color: colors.textFaint }]}>operations</Text>
            </View>
          </View>

          <View style={styles.card}>
            <Text style={[text.eyebrow, { color: colors.textFaint, marginBottom: spacing.x2 }]}>LOGIN AS</Text>
            <View style={styles.segment}>
              {(['driver', 'caretaker'] as Role[]).map((r) => (
                <TouchableOpacity key={r} onPress={() => { setRole(r); setError(''); }} style={[styles.segmentBtn, role === r && styles.segmentBtnActive]}>
                  <Text style={[styles.segmentLabel, role === r && styles.segmentLabelActive]}>
                    {r === 'driver' ? 'Driver' : 'Caretaker'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.title}>{role === 'driver' ? 'Operations Login' : 'Caretaker Login'}</Text>

            <TextInput
              style={styles.input}
              placeholder={role === 'driver' ? 'Employee ID (DRV-XXXX)' : 'Building ID (TRK-XXXXXX)'}
              placeholderTextColor={colors.textFaint}
              value={id}
              onChangeText={(v) => setId(v)}
              autoCapitalize="characters"
              autoCorrect={false}
            />
            <View style={styles.secretWrap}>
              <TextInput
                style={styles.secretInput}
                placeholder={role === 'driver' ? 'Password' : 'Passcode'}
                placeholderTextColor={colors.textFaint}
                value={secret}
                onChangeText={setSecret}
                secureTextEntry={!show}
              />
              <TouchableOpacity onPress={() => setShow(!show)} style={styles.eye}>{show ? <EyeOff size={18} color={colors.textFaint} /> : <Eye size={18} color={colors.textFaint} />}</TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.cta} onPress={submit} disabled={loading} activeOpacity={0.85}>
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.ctaLabel}>Sign In</Text>}
            </TouchableOpacity>

            {(error || notice) ? <Text style={styles.error}>{error || notice}</Text> : null}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: spacing.x5, paddingTop: spacing.x8 },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.x3, marginBottom: spacing.x6 },
  logo: { width: 40, height: 40, borderRadius: radius.input, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', ...shadows.button },
  logoT: { fontFamily: fonts.displayHeavy, fontSize: 20, color: '#fff' },
  brandName: { ...text.headingL, color: colors.textPrimary },
  card: { backgroundColor: colors.card, borderRadius: radius.cardLg, padding: spacing.x5, ...shadows.card },
  segment: { flexDirection: 'row', backgroundColor: colors.inputBg, borderRadius: radius.input, padding: 4, marginBottom: spacing.x5 },
  segmentBtn: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center' },
  segmentBtnActive: { backgroundColor: colors.card, ...shadows.card },
  segmentLabel: { ...text.bodyXs, color: colors.textMuted, fontWeight: '700' },
  segmentLabelActive: { color: colors.primary },
  title: { ...text.headingM, color: colors.textPrimary, marginBottom: spacing.x4 },
  input: { backgroundColor: colors.inputBg, borderWidth: 1, borderColor: colors.border, borderRadius: radius.input, paddingHorizontal: spacing.x4, paddingVertical: 14, ...text.bodySm, color: colors.textPrimary, marginBottom: spacing.x3 },
  secretWrap: { position: 'relative', marginBottom: spacing.x5 },
  secretInput: { backgroundColor: colors.inputBg, borderWidth: 1, borderColor: colors.border, borderRadius: radius.input, paddingHorizontal: spacing.x4, paddingVertical: 14, paddingRight: 48, ...text.bodySm, color: colors.textPrimary },
  eye: { position: 'absolute', right: 14, top: 0, bottom: 0, justifyContent: 'center' },
  cta: { backgroundColor: colors.primary, borderRadius: radius.button, paddingVertical: 15, alignItems: 'center', ...shadows.button },
  ctaLabel: { color: '#fff', ...text.bodySm, fontWeight: '800' },
  error: { marginTop: spacing.x3, color: colors.danger, ...text.bodyXs, fontWeight: '600' },
});