import { useState } from 'react';
import { Text, StyleSheet, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen } from '../../components/ui/Screen';
import { Header } from '../../components/ui/Header';
import { TextField } from '../../components/ui/TextField';
import { Button } from '../../components/ui/Button';
import { Rise } from '../../components/ui/motion';
import { useCaretakerStore } from '../../store/caretakerStore';
import { createServiceRequest } from '../../services/caretaker';
import { colors } from '../../theme/colors';
import { sp } from '../../theme/spacing';
import { text } from '../../theme/typography';

export default function ReportScreen() {
  const router = useRouter();
  const building = useCaretakerStore((s) => s.building);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [remarks, setRemarks] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!building?.custom_id) { Alert.alert('No building', 'Your account is not linked to a building yet.'); return; }
    if (!name.trim() || !phone.trim() || !remarks.trim()) { Alert.alert('Missing details', 'Please fill your name, phone and a short description.'); return; }
    setBusy(true);
    const res = await createServiceRequest({
      customId: building.custom_id,
      companyId: Number(building.company_id) || 0,
      caretaker_name: name.trim(),
      caretaker_phone: phone.trim(),
      remarks: remarks.trim(),
      priority: 'high',
      address: building.address,
    });
    setBusy(false);
    if (res.ok) {
      Alert.alert('Reported', 'Your issue was sent. Dispatch will review it shortly.', [{ text: 'OK', onPress: () => router.back() }]);
    } else {
      Alert.alert('Failed', res.error ?? 'Could not submit. Try again.');
    }
  };

  return (
    <Screen scroll keyboard>
      <Header title="Report an issue" subtitle="Flag a missed pickup or problem" />
      <Rise delay={0}>
        <TextField label="Your name" placeholder="Caretaker name" value={name} onChangeText={setName} />
        <TextField label="Phone" placeholder="+234 ..." keyboardType="phone-pad" value={phone} onChangeText={setPhone} />
        <TextField label="Describe the issue" placeholder="e.g. Missed pickup, overflow..." multiline numberOfLines={4} value={remarks} onChangeText={setRemarks} style={styles.area} />
        <Button label="Submit report" loading={busy} onPress={submit} />
        <Text style={styles.note}>Dispatch sees your report instantly with your building ID attached.</Text>
      </Rise>
    </Screen>
  );
}

const styles = StyleSheet.create({
  area: { minHeight: 96, textAlignVertical: 'top' },
  note: { ...text.bodyS, color: colors.text.muted, textAlign: 'center', marginTop: sp.x4 },
});