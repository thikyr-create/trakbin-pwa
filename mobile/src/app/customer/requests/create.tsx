import { useState } from 'react';
import { Text, StyleSheet, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { TabScreen } from '../../../components/layout/TabScreen';
import { ScreenHeader } from '../../../components/ui/ScreenHeader';
import { TextField } from '../../../components/ui/TextField';
import { Button } from '../../../components/ui/Button';
import { useCaretakerStore } from '../../../store/caretakerStore';
import { createServiceRequest } from '../../../services/caretaker';
import { colors } from '../../../theme/colors';
import { sp } from '../../../theme/spacing';
import { text } from '../../../theme/typography';

export default function RequestPickupScreen() {
  const router = useRouter();
  const building = useCaretakerStore((s) => s.building);
  const assignment = useCaretakerStore((s) => s.assignment);

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [remarks, setRemarks] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!building?.custom_id) {
      Alert.alert('No building', 'Your account is not linked to a building yet.');
      return;
    }
    if (!assignment?.company_id && !building.company_id) {
      Alert.alert('No provider yet', 'Pickup requests unlock once a waste company accepts your building.');
      return;
    }
    if (!name.trim() || !phone.trim() || !remarks.trim()) {
      Alert.alert('Missing details', 'Please fill your name, phone and a short note.');
      return;
    }

    setBusy(true);
    const res = await createServiceRequest({
      customId: building.custom_id,
      // Requests route ONLY to the accepting provider — never any other company
      companyId: Number(assignment?.company_id ?? building.company_id) || 0,
      caretaker_name: name.trim(),
      caretaker_phone: phone.trim(),
      remarks: remarks.trim(),
      priority: 'normal',
      address: building.address,
    });
    setBusy(false);

    if (res.ok) {
      Alert.alert('Request sent', 'Your waste provider has been notified.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } else {
      Alert.alert('Failed', res.error ?? 'Could not submit. Try again.');
    }
  };

  return (
    <TabScreen>
      <ScreenHeader eyebrow="Service" title="Request pickup" subtitle="Goes directly to your waste provider" />

      <TextField label="Your name" placeholder="Caretaker name" value={name} onChangeText={setName} />
      <TextField label="Phone" placeholder="+234 ..." keyboardType="phone-pad" value={phone} onChangeText={setPhone} />
      <TextField
        label="Note"
        placeholder="e.g. Bags are out at the gate"
        multiline
        numberOfLines={4}
        value={remarks}
        onChangeText={setRemarks}
        style={styles.area}
      />

      <Button label="Send request" loading={busy} onPress={submit} />

      <Text style={styles.note}>
        Only your assigned waste provider receives this request — no other company can see it.
      </Text>
    </TabScreen>
  );
}

const styles = StyleSheet.create({
  area: { minHeight: 96, textAlignVertical: 'top' },
  note: { ...text.bodyS, color: colors.text.muted, textAlign: 'center', marginTop: sp.x4 },
});