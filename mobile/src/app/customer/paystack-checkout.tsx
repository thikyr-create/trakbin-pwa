import { useState } from 'react';
import { View, Text, StyleSheet, Pressable, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ShieldCheck } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { verifyPayment } from '../../services/caretaker';
import { useCaretakerStore } from '../../store/caretakerStore';
import { Rise } from '../../components/ui/motion';
import PaystackSheet from '../../components/payments/PaystackSheet';
import { colors } from '../../theme/colors';
import { radius, sp, touch } from '../../theme/spacing';
import { text } from '../../theme/typography';

export default function PaystackCheckoutScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const load = useCaretakerStore((s) => s.load);
  const { authorizationUrl } = useLocalSearchParams<{ authorizationUrl: string }>();

  const [verifying, setVerifying] = useState(false);
  const [sheetTitle, setSheetTitle] = useState<string>('Secure checkout');

  const handleRedirect = async (reference: string) => {
    setVerifying(true);
    try {
      const res = await verifyPayment(reference);
      if (res.ok) {
        await load(true);
        Alert.alert('Card added', 'Your card is saved and ready for payments.', [
          { text: 'OK', onPress: () => router.back() },
        ]);
      } else {
        setVerifying(false);
        Alert.alert('Not confirmed yet', 'Paystack may still be processing. Wait a few seconds and try again.');
      }
    } catch {
      setVerifying(false);
      Alert.alert('Network error', 'Check your connection and try again.');
    }
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top + sp.x4 }]}>
      <Rise delay={0}>
        <View style={styles.card}>
          <View style={styles.iconWrap}><ShieldCheck size={24} color={colors.brand[400]} /></View>
          <Text style={styles.title}>Secure checkout</Text>
          <Text style={styles.body}>
            Enter your card details in the secure Paystack window. Your details never touch Trakbin.
          </Text>

          <Pressable
            style={[styles.primaryBtn, !authorizationUrl && styles.btnDisabled]}
            onPress={() => setSheetTitle('Secure checkout')}
            disabled={!authorizationUrl}
            accessibilityRole="button"
            accessibilityLabel="Open checkout"
          >
            <Text style={styles.primaryLabel}>{verifying ? 'Verifying…' : 'Open secure checkout'}</Text>
          </Pressable>

          <Pressable style={styles.tertiaryBtn} onPress={() => router.back()} accessibilityRole="button" accessibilityLabel="Cancel">
            <Text style={styles.tertiaryLabel}>Cancel</Text>
          </Pressable>
        </View>
      </Rise>

      <PaystackSheet
        visible={!!authorizationUrl}
        authorizationUrl={authorizationUrl}
        title={sheetTitle}
        onRedirect={handleRedirect}
        onClose={() => router.back()}
      />
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

  primaryBtn: {
    backgroundColor: colors.brand[600],
    borderRadius: radius.xl,
    height: touch.cta,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: sp.x6,
    width: '100%',
  },
  btnDisabled: { opacity: 0.45 },
  primaryLabel: { ...text.button, color: colors.text.inverse },

  tertiaryBtn: { paddingVertical: sp.x3, marginTop: sp.x2 },
  tertiaryLabel: { ...text.semibold, fontSize: 13, color: colors.text.muted },
});