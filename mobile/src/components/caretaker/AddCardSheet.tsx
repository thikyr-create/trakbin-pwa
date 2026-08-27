import { useState } from 'react';
import { View, Text, StyleSheet, Modal, Pressable, ScrollView, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X, CreditCard, MapPin } from 'lucide-react-native';
import { TextField } from '../ui/TextField';
import { Button } from '../ui/Button';
import { addCardMethod } from '../../services/caretaker';
import { useCaretakerStore } from '../../store/caretakerStore';
import { colors } from '../../theme/colors';
import { radius, sp } from '../../theme/spacing';
import { text } from '../../theme/typography';

function detectBrand(num: string): string {
  const n = num.replace(/\D/g, '');
  if (/^4/.test(n)) return 'Visa';
  if (/^(5[1-5]|2[2-7])/.test(n)) return 'Mastercard';
  if (/^(506[01]|650[01])/.test(n)) return 'Verve';
  return 'Card';
}

const BRAND_BG: Record<string, string> = {
  Visa: '#1A1F71',
  Mastercard: '#232323',
  Verve: '#007A4D',
  Card: '#334155',
};

const formatExpiry = (v: string) => {
  const d = v.replace(/\D/g, '').slice(0, 4);
  return d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d;
};

interface Props { onClose: () => void; onSuccess: () => void; }

export function AddCardSheet({ onClose, onSuccess }: Props) {
  const insets = useSafeAreaInsets();
  const building = useCaretakerStore((s) => s.building);
  const [number, setNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [holder, setHolder] = useState('');
  const [address, setAddress] = useState('');
  const [busy, setBusy] = useState(false);

  const brand = detectBrand(number);
  const last4 = number.replace(/\D/g, '').slice(-4);

  const save = async () => {
    if (!building?.custom_id) { Alert.alert('No building', 'Link a building first.'); return; }
    if (number.replace(/\D/g, '').length < 12) { Alert.alert('Check card', 'Enter a valid card number.'); return; }
    if (!/^\d{2}\/\d{2}$/.test(expiry)) { Alert.alert('Check expiry', 'Use MM/YY format.'); return; }
    if (cvv.length < 3) { Alert.alert('Check CVV', 'Enter the 3–4 digit CVV.'); return; }
    if (!holder.trim()) { Alert.alert('Card holder', 'Enter the name on the card.'); return; }
    if (!address.trim()) { Alert.alert('Billing address', 'Enter your billing address for verification.'); return; }

    setBusy(true);
    const res = await addCardMethod({
      buildingId: building.custom_id,
      companyId: Number(building.company_id) || 0,
      brand, last4, holder: holder.trim(),
    });
    setBusy(false);
    if (res.ok) { Alert.alert('Card saved', `${brand} •••• ${last4} added.`); onSuccess(); onClose(); }
    else Alert.alert('Failed', res.error ?? 'Could not save card.');
  };

  return (
    <Modal visible animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={styles.root}>
        <View style={[styles.header, { paddingTop: insets.top + sp.x2 }]}>
          <Text style={styles.title}>Add card</Text>
          <Pressable onPress={onClose} style={styles.close} accessibilityRole="button" accessibilityLabel="Close">
            <X size={22} color={colors.text.primary} />
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          {/* Card number + live virtual card */}
          <View style={styles.cardRow}>
            <View style={[styles.miniCard, { backgroundColor: BRAND_BG[brand] }]}>
              <View style={styles.chip} />
              <Text style={styles.miniBrand}>{brand}</Text>
              <Text style={styles.miniLast}>{last4 ? `•••• ${last4}` : '•••• ••••'}</Text>
            </View>
            <View style={styles.cardInput}>
              <TextField label="Card number" placeholder="0000 0000 0000 0000" keyboardType="number-pad" value={number} onChangeText={(v) => setNumber(v.replace(/[^\d ]/g, ''))} />
            </View>
          </View>

          {/* Roomy expiry + CVV */}
          <TextField label="Expiry (MM/YY)" placeholder="MM/YY" keyboardType="number-pad" value={expiry} onChangeText={(v) => setExpiry(formatExpiry(v))} />
          <TextField label="CVV" placeholder="123" keyboardType="number-pad" value={cvv} onChangeText={(v) => setCvv(v.replace(/\D/g, ''))} />

          {/* Required holder + billing address */}
          <TextField label="Card holder" placeholder="Name on card" value={holder} onChangeText={setHolder} />
          <TextField label="Billing address" placeholder="Street, city" value={address} onChangeText={setAddress} multiline numberOfLines={2} style={styles.area} />

          <Button label="Save card" loading={busy} onPress={save} />
          <Text style={styles.note}>Visa · Mastercard · Verve — credit & debit. Billing address is used for payment verification. Secured by Paystack.</Text>
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: sp.x5, paddingBottom: sp.x4, backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border.subtle },
  title: { ...text.titleM, color: colors.text.primary },
  close: { padding: sp.x1 },
  content: { padding: sp.x5, paddingBottom: sp.x12 },

  cardRow: { flexDirection: 'row', gap: sp.x3, alignItems: 'flex-start', marginBottom: sp.x1 },
  miniCard: {
    width: 104,
    height: 66,
    borderRadius: radius.md,
    padding: sp.x2,
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
    marginTop: sp.x6,
  },
  chip: { width: 20, height: 14, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.5)' },
  miniBrand: { ...text.label, fontSize: 9, color: colors.text.inverse },
  miniLast: { ...text.mono, fontSize: 10, color: 'rgba(255,255,255,0.9)' },
  cardInput: { flex: 1 },

  area: { minHeight: 56, textAlignVertical: 'top' },
  note: { ...text.bodyS, color: colors.text.muted, textAlign: 'center', marginTop: sp.x4 },
});