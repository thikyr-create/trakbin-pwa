import { useMemo, useState, cloneElement, isValidElement, type ReactElement, type ReactNode } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable, Switch, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Lock, Info } from 'lucide-react-native';
import { Screen } from '../../components/ui/Screen';
import { Header } from '../../components/ui/Header';
import { Rise } from '../../components/ui/motion';
import { useCaretakerStore } from '../../store/caretakerStore';
import { initializeCardSave } from '../../services/caretaker';
import { supabase } from '../../services/supabase';
import { colors } from '../../theme/colors';
import { radius, sp, touch } from '../../theme/spacing';
import { text } from '../../theme/typography';

function detectBrand(num: string): string {
  const n = num.replace(/\D/g, '');
  if (/^4/.test(n)) return 'Visa';
  if (/^(5[1-5]|2[2-7])/.test(n)) return 'Mastercard';
  if (/^(506[01]|650[01])/.test(n)) return 'Verve';
  return '';
}

function luhn(num: string): boolean {
  const s = num.replace(/\D/g, '');
  if (!s) return false;
  let sum = 0, dbl = false;
  for (let i = s.length - 1; i >= 0; i--) {
    let d = Number(s[i]);
    if (dbl) { d *= 2; if (d > 9) d -= 9; }
    sum += d; dbl = !dbl;
  }
  return sum % 10 === 0;
}

function expiryError(v: string): string | null {
  if (!v) return null;
  const m = /^(\d{2})\/(\d{2})$/.exec(v);
  if (!m) return 'Use MM/YY';
  const mm = Number(m[1]); const yy = Number(m[2]);
  if (mm < 1 || mm > 12) return 'Invalid month';
  const now = new Date();
  const cy = now.getFullYear() % 100; const cm = now.getMonth() + 1;
  if (yy < cy || (yy === cy && mm < cm)) return 'Card expired';
  return null;
}

const group4 = (v: string) => v.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim();
const formatExpiry = (v: string) => { const d = v.replace(/\D/g, '').slice(0, 4); return d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d; };

export default function AddCardScreen() {
  const router = useRouter();
  const building = useCaretakerStore((s) => s.building);

  const [number, setNumber] = useState('');
  const [holder, setHolder] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [address, setAddress] = useState('');
  const [saveCard, setSaveCard] = useState(true);
  const [busy, setBusy] = useState(false);

  const digits = number.replace(/\D/g, '');
  const brand = detectBrand(number);
  const expErr = expiryError(expiry);
  const numErr = digits.length >= 16 && !luhn(digits) ? 'Invalid card number' : null;
  const cvvErr = cvv.length > 0 && cvv.length < 3 ? '3-digit code' : null;

  // Self-explaining validation: the button tells you what's missing
  const missing: string[] = [];
  if (!(digits.length === 16 && luhn(digits))) missing.push('valid card number');
  if (holder.trim().length < 2) missing.push('cardholder name');
  if (!expiry || expErr) missing.push('valid expiry');
  if (cvv.length < 3) missing.push('CVV');
  if (address.trim().length < 4) missing.push('billing address');
  const valid = missing.length === 0;

  const previewNumber = useMemo(() => {
    const padded = (digits + '••••••••••••••••').slice(0, 16);
    return padded.replace(/(.{4})/g, '$1 ').trim();
  }, [digits]);

  const cvvHelp = () =>
    Alert.alert('CVV', 'The 3-digit security code on the back of your card (4 digits on the front for Amex).');

  const submit = async () => {
    if (!valid || !building?.custom_id) return;
    setBusy(true);
    try {
      const { data } = await supabase.auth.getSession();
      const email = data.session?.user?.email;
      if (!email) { Alert.alert('Session', 'Sign in again to add a card.'); setBusy(false); return; }

      const { authorizationUrl, reference } = await initializeCardSave(building.custom_id, email);
      router.push({
        pathname: '/customer/paystack-checkout',
        params: { reference, authorizationUrl },
      });
    } catch (e: any) {
      Alert.alert('Failed', e.message ?? 'Could not start checkout.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen scroll keyboard>
      <Header title="Add Card" subtitle="Visa · Mastercard · Verve" />

      {/* LIVE CARD PREVIEW */}
      <Rise delay={0}>
        <View style={styles.preview}>
          <View style={styles.previewTop}>
            <View style={styles.chip} />
            <Text style={styles.previewBrand}>{brand || 'CARD'}</Text>
          </View>
          <Text style={styles.previewNumber}>{previewNumber}</Text>
          <View style={styles.previewBottom}>
            <View>
              <Text style={styles.previewLabel}>Card holder</Text>
              <Text style={styles.previewValue} numberOfLines={1}>{holder ? holder.toUpperCase() : 'YOUR NAME'}</Text>
            </View>
            <View>
              <Text style={styles.previewLabel}>Expires</Text>
              <Text style={styles.previewValue}>{expiry || 'MM/YY'}</Text>
            </View>
          </View>
        </View>
      </Rise>

      <Rise delay={80}>
        <Field label="Card number" error={numErr}>
          <TextInput
            style={styles.input}
            value={number}
            onChangeText={(v) => setNumber(group4(v))}
            placeholder="1234 5678 9012 3456"
            placeholderTextColor={colors.text.muted}
            keyboardType="number-pad"
            maxLength={19}
          />
        </Field>

        <Field label="Cardholder name" error={holder.length > 0 && holder.trim().length < 2 ? 'Enter the name on the card' : null}>
          <TextInput
            style={styles.input}
            value={holder}
            onChangeText={setHolder}
            placeholder="Name as on card"
            placeholderTextColor={colors.text.muted}
            autoCapitalize="characters"
          />
        </Field>

        <View style={styles.row}>
          <View style={styles.half}>
            <Field label="Expiry date" error={expErr}>
              <TextInput
                style={styles.input}
                value={expiry}
                onChangeText={(v) => setExpiry(formatExpiry(v))}
                placeholder="MM/YY"
                placeholderTextColor={colors.text.muted}
                keyboardType="number-pad"
                maxLength={5}
              />
            </Field>
          </View>
          <View style={styles.half}>
            <Field
              label="CVV"
              error={cvvErr}
              right={
                <Pressable onPress={cvvHelp} hitSlop={8} accessibilityRole="button" accessibilityLabel="What is CVV?">
                  <Info size={16} color={colors.text.muted} />
                </Pressable>
              }
            >
              <TextInput
                style={styles.input}
                value={cvv}
                onChangeText={(v) => setCvv(v.replace(/\D/g, '').slice(0, 4))}
                placeholder="123"
                placeholderTextColor={colors.text.muted}
                keyboardType="number-pad"
                secureTextEntry
                maxLength={4}
              />
            </Field>
          </View>
        </View>

        <Field label="Billing address" error={null}>
          <TextInput
            style={[styles.input, styles.inputMultiline]}
            value={address}
            onChangeText={setAddress}
            placeholder="Street, city"
            placeholderTextColor={colors.text.muted}
            multiline
          />
        </Field>

        <View style={styles.saveRow}>
          <View style={styles.saveMain}>
            <Text style={styles.saveLabel}>Save card</Text>
            <Text style={styles.saveSub}>Keep this card for future payments</Text>
          </View>
          <Switch value={saveCard} onValueChange={setSaveCard} trackColor={{ true: colors.brand[600], false: colors.surfaceMuted }} thumbColor={colors.text.inverse} />
        </View>
      </Rise>

      <Rise delay={140}>
        <Pressable
          style={[styles.cta, (!valid || busy) && styles.ctaDisabled]}
          onPress={submit}
          disabled={!valid || busy}
          accessibilityRole="button"
          accessibilityLabel="Add card"
        >
          {busy ? <ActivityIndicator color={colors.text.inverse} /> : <Text style={styles.ctaLabel}>Add Card</Text>}
        </Pressable>

        {!valid ? <Text style={styles.missing}>Still needed: {missing.join(' · ')}</Text> : null}

        <View style={styles.secureRow}>
          <Lock size={13} color={colors.text.muted} />
          <Text style={styles.secureText}>Your card details are securely encrypted</Text>
        </View>
      </Rise>
    </Screen>
  );
}

function Field({ label, error, right, children }: { label: string; error: string | null; right?: ReactNode; children: ReactNode }) {
  const [focused, setFocused] = useState(false);

  const child = isValidElement(children)
    ? cloneElement(children as ReactElement<any>, {
        onFocus: (e: any) => { setFocused(true); (children as any)?.props?.onFocus?.(e); },
        onBlur: (e: any) => { setFocused(false); (children as any)?.props?.onBlur?.(e); },
      })
    : children;

  return (
    <View style={styles.fieldWrap}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={[styles.inputBox, focused && styles.inputBoxFocused, !!error && styles.inputBoxError]}>
        <View style={styles.inputInner}>{child}</View>
        {right}
      </View>
      <Text style={styles.errorSlot}>{error ?? ''}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  preview: {
    backgroundColor: colors.brand[800],
    borderRadius: radius.xxl,
    padding: sp.x5,
    marginBottom: sp.x5,
    borderWidth: 1,
    borderColor: colors.brand[600],
    shadowColor: colors.brand[900],
    shadowOpacity: 0.3,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 5,
  },
  previewTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: sp.x5 },
  chip: { width: 34, height: 24, borderRadius: 5, backgroundColor: 'rgba(255,255,255,0.4)' },
  previewBrand: { ...text.titleS, color: colors.text.inverse },
  previewNumber: { ...text.titleM, color: colors.text.inverse, letterSpacing: 1.5 },
  previewBottom: { flexDirection: 'row', justifyContent: 'space-between', marginTop: sp.x5 },
  previewLabel: { ...text.label, fontSize: 9, color: colors.brand[200] },
  previewValue: { ...text.semibold, color: colors.text.inverse, marginTop: 2, maxWidth: 180 },

  fieldWrap: { marginBottom: sp.x1 },
  fieldLabel: { ...text.label, fontSize: 10, color: colors.text.secondary, marginBottom: sp.x1 },
  inputBox: {
    minHeight: touch.field,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: colors.border.subtle,
    paddingHorizontal: sp.x4,
  },
  inputBoxFocused: { borderColor: colors.brand[500] },
  inputBoxError: { borderColor: colors.state.danger },
  inputInner: { flex: 1 },
  input: { ...text.bodyL, color: colors.text.primary, paddingVertical: sp.x3 },
  inputMultiline: { minHeight: 64, textAlignVertical: 'top' },
  errorSlot: { minHeight: 16, ...text.bodyXs, color: colors.state.danger, marginTop: 2 },

  row: { flexDirection: 'row', gap: sp.x3 },
  half: { flex: 1 },

  saveRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.material.surface, borderRadius: radius.lg, padding: sp.x4, marginTop: sp.x3, borderWidth: 1, borderColor: colors.material.border },
  saveMain: { flex: 1 },
  saveLabel: { ...text.semibold, color: colors.text.primary },
  saveSub: { ...text.bodyS, color: colors.text.muted, marginTop: 1 },

  cta: {
    marginTop: sp.x5,
    backgroundColor: colors.brand[600],
    borderRadius: radius.xl,
    paddingVertical: sp.x4,
    alignItems: 'center',
    shadowColor: colors.brand[900],
    shadowOpacity: 0.3,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 5 },
    elevation: 4,
  },
  ctaDisabled: { opacity: 0.45 },
  ctaLabel: { ...text.button, color: colors.text.inverse },

  missing: { ...text.bodyS, color: colors.text.muted, textAlign: 'center', marginTop: sp.x3 },

  secureRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: sp.x1, marginTop: sp.x4 },
  secureText: { ...text.bodyS, color: colors.text.muted },
});