import { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Alert, AppState, Pressable, Linking } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ShieldCheck, ExternalLink, RefreshCw, CheckCircle2 } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { verifyPayment } from '../../services/caretaker';
import { useCaretakerStore } from '../../store/caretakerStore';
import { Rise } from '../../components/ui/motion';
import { colors } from '../../theme/colors';
import { radius, sp, touch } from '../../theme/spacing';
import { text } from '../../theme/typography';

export default function PaystackCheckoutScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const load = useCaretakerStore((s) => s.load);
  const { reference, authorizationUrl } = useLocalSearchParams<{ reference: string; authorizationUrl: string }>();

  const [verifying, setVerifying] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const opened = useRef(false);
  const verifyingRef = useRef(false);

  const verify = async (silent = false) => {
    if (verifyingRef.current) return;
    verifyingRef.current = true;
    setVerifying(true);
    setNote(null);
    try {
      const res = await verifyPayment(reference);
      if (res.ok) {
        await load(true);
        Alert.alert('Card added', 'Your card is saved and ready for payments.', [
          { text: 'OK', onPress: () => router.back() },
        ]);
      } else if (!silent) {
        setNote('Not confirmed yet — Paystack may still be processing. Wait a few seconds and try again.');
      }
    } catch {
      if (!silent) setNote('Network error. Check your connection and try again.');
    }
    verifyingRef.current = false;
    setVerifying(false);
  };

  // Open the secure checkout in the browser once on mount
  useEffect(() => {
    if (!opened.current && authorizationUrl) {
      opened.current = true;
      Linking.openURL(authorizationUrl);
    }
  }, [authorizationUrl]);

  // When the user returns from the browser, verify automatically
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') setTimeout(() => verify(true), 1500);
    });
    return () => sub.remove();
  }, [reference]);

  return (
    <View style={[styles.root, { paddingTop: insets.top + sp.x4 }]}>
      <Rise delay={0}>
        <View style={styles.card}>
          <View style={styles.iconWrap}><ShieldCheck size={24} color={colors.brand[400]} /></View>
          <Text style={styles.title}>Complete payment in your browser</Text>
          <Text style={styles.body}>
            Paystack's secure page opened in your browser. Enter your card there — your details never touch Trakbin.
            Return here when done.
          </Text>

          {note ? <Text style={styles.note}>{note}</Text> : null}

          <Pressable style={styles.primaryBtn} onPress={() => verify(false)} disabled={verifying} accessibilityRole="button" accessibilityLabel="I have completed payment">
            {verifying ? <ActivityIndicator color={colors.text.inverse} /> : <CheckCircle2 size={18} color={colors.text.inverse} />}
            <Text style={styles.primaryLabel}>{verifying ? 'Verifying…' : "I've completed payment"}</Text>
          </Pressable>

          <Pressable style={styles.secondaryBtn} onPress={() => authorizationUrl && Linking.openURL(authorizationUrl)} accessibilityRole="button" accessibilityLabel="Reopen checkout">
            <ExternalLink size={16} color={colors.text.primary} />
            <Text style={styles.secondaryLabel}>Reopen checkout</Text>
          </Pressable>

          <Pressable style={styles.tertiaryBtn} onPress={() => router.back()} accessibilityRole="button" accessibilityLabel="Cancel">
            <Text style={styles.tertiaryLabel}>Cancel</Text>
          </Pressable>
        </View>
      </Rise>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg, paddingHorizontal: sp.x5 },
  card: {
    backgroundColor: colors.material.surface,
    borderRadius: radius.xxl,
    borderWidth: 1,
    borderColor: colors.material.border,
    padding: sp.x6,
    alignItems: 'center',
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.material.emerald,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: sp.x4,
  },
  title: { ...text.titleM, color: colors.text.primary, textAlign: 'center' },
  body: { ...text.bodyM, color: colors.text.muted, textAlign: 'center', marginTop: sp.x3 },
  note: { ...text.bodyS, color: colors.state.warning, textAlign: 'center', marginTop: sp.x4 },

  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: sp.x2,
    backgroundColor: colors.brand[600],
    borderRadius: radius.xl,
    height: touch.cta,
    marginTop: sp.x6,
    width: '100%',
  },
  primaryLabel: { ...text.button, color: colors.text.inverse },

  secondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: sp.x2,
    backgroundColor: colors.material.surfaceStrong,
    borderRadius: radius.xl,
    height: touch.field,
    marginTop: sp.x3,
    width: '100%',
  },
  secondaryLabel: { ...text.semibold, fontSize: 14, color: colors.text.primary },

  tertiaryBtn: { paddingVertical: sp.x3, marginTop: sp.x2 },
  tertiaryLabel: { ...text.semibold, fontSize: 13, color: colors.text.muted },
});