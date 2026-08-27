import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowRight, Building2, ShieldCheck, Truck } from 'lucide-react-native';
import { Screen } from '../../components/ui/Screen';
import { Button } from '../../components/ui/Button';
import { TextField } from '../../components/ui/TextField';
import { colors } from '../../theme/colors';
import { gutter, radius, sp } from '../../theme/spacing';
import { text } from '../../theme/typography';
import { useAuthStore } from '../../store/authStore';

type Tab = 'driver' | 'caretaker';

export default function Login() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('driver');
  
  // Driver state
  const [opsId, setOpsId] = useState('');
  const [password, setPassword] = useState('');
  
  // Caretaker state
  const [buildingId, setBuildingId] = useState('');
  const [passcode, setPasscode] = useState('');

  const status = useAuthStore((s) => s.status);
  const busy = useAuthStore((s) => s.busy);
  const error = useAuthStore((s) => s.error);
  const loginDriver = useAuthStore((s) => s.loginDriver);
  const loginCaretaker = useAuthStore((s) => s.loginCaretaker);

  useEffect(() => { 
    if (status === 'signedIn') router.replace('/'); 
  }, [status]);

  const submit = async () => {
    if (tab === 'driver') {
      await loginDriver(opsId, password);
    } else {
      await loginCaretaker(buildingId, passcode);
    }
  };

  return (
    <Screen keyboard scroll padded={false}>
      <View style={styles.inner}>
        {/* Brand Header */}
        <View style={styles.brandRow}>
          <View style={styles.logo}>
            <Text style={styles.logoLetter}>T</Text>
          </View>
          <View>
            <Text style={styles.brandName}>Trakbin</Text>
            <Text style={styles.brandTag}>Operations</Text>
          </View>
        </View>

        {/* Role Segmented Control */}
        <View style={styles.seg}>
          {(['driver', 'caretaker'] as Tab[]).map((r) => (
            <Pressable
              key={r}
              onPress={() => setTab(r)}
              style={[styles.segBtn, tab === r && styles.segActive]}
              accessibilityRole="tab"
              accessibilityState={{ selected: tab === r }}
            >
              {r === 'driver'
                ? <Truck size={18} color={tab === r ? colors.brand[700] : colors.text.muted} />
                : <Building2 size={18} color={tab === r ? colors.brand[700] : colors.text.muted} />}
              <Text style={[styles.segLabel, tab === r && styles.segLabelActive]}>
                {r === 'driver' ? 'Driver' : 'Caretaker'}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Login Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>
            {tab === 'driver' ? 'Operations login' : 'Building login'}
          </Text>
          <Text style={styles.cardSub}>
            {tab === 'driver' 
              ? 'Your Operations ID and password.' 
              : 'Your Building ID and passcode.'}
          </Text>

          {tab === 'driver' ? (
            <>
              <TextField
                label="Operations ID"
                placeholder="DRV-0000"
                autoCapitalize="characters"
                autoCorrect={false}
                mono
                value={opsId}
                onChangeText={setOpsId}
              />
              <TextField
                label="Password"
                placeholder="••••••••"
                secure
                value={password}
                onChangeText={setPassword}
                returnKeyType="go"
                onSubmitEditing={submit}
              />
            </>
          ) : (
            <>
              <TextField
                label="Building ID"
                placeholder="TRK-000000"
                autoCapitalize="characters"
                autoCorrect={false}
                mono
                value={buildingId}
                onChangeText={setBuildingId}
              />
              <TextField
                label="Passcode"
                placeholder="••••"
                secure
                value={passcode}
                onChangeText={setPasscode}
                returnKeyType="go"
                onSubmitEditing={submit}
              />
            </>
          )}

          {error ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <Button
            label="Sign in"
            loading={busy}
            onPress={submit}
            icon={<ArrowRight size={18} color={colors.text.inverse} />}
          />
        </View>

        {/* Footer */}
        <View style={styles.trust}>
          <ShieldCheck size={16} color={colors.brand[700]} />
          <Text style={styles.trustText}>Encrypted, role-scoped sessions.</Text>
        </View>
        <Text style={styles.footer}>v1.0.0 • Building cities, not waste.</Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  inner: { paddingTop: sp.x8 },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: sp.x3,
    paddingHorizontal: gutter,
    marginBottom: sp.x8,
  },
  logo: {
    width: 48,
    height: 48,
    borderRadius: radius.lg,
    backgroundColor: colors.brand[600],
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoLetter: { fontFamily: 'Sora_800ExtraBold', fontSize: 24, color: colors.text.inverse },
  brandName: { ...text.titleL, color: colors.text.primary },
  brandTag: { ...text.label, color: colors.text.muted },
  
  seg: {
    flexDirection: 'row',
    marginHorizontal: gutter,
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.lg,
    padding: sp.x1,
    gap: sp.x1,
    marginBottom: sp.x5,
  },
  segBtn: {
    flex: 1,
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: sp.x2,
    borderRadius: radius.md,
  },
  segActive: {
    backgroundColor: colors.surface,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  segLabel: { ...text.semibold, color: colors.text.muted },
  segLabelActive: { color: colors.brand[700] },
  
  card: {
    marginHorizontal: gutter,
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: sp.x5,
    shadowColor: colors.brand[900],
    shadowOpacity: 0.06,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3,
  },
  cardTitle: { ...text.titleM, color: colors.text.primary, marginBottom: sp.x1 },
  cardSub: { ...text.bodyM, color: colors.text.muted, marginBottom: sp.x5 },
  
  errorBox: {
    backgroundColor: colors.state.dangerSoft,
    borderRadius: radius.md,
    paddingHorizontal: sp.x4,
    paddingVertical: sp.x3,
    marginBottom: sp.x4,
  },
  errorText: { ...text.bodyS, color: colors.state.danger },
  
  trust: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: sp.x2,
    justifyContent: 'center',
    marginTop: sp.x6,
  },
  trustText: { ...text.bodyS, color: colors.text.muted },
  footer: { ...text.bodyS, color: colors.text.muted, textAlign: 'center', marginTop: sp.x3 },
});