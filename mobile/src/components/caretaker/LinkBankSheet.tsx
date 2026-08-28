import { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, Modal, Pressable, TextInput, ActivityIndicator, ScrollView, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X, Landmark, Check, Search, ChevronDown } from 'lucide-react-native';
import { fetchBanks, resolveBankAccount } from '../../services/wallet';
import { useCaretakerStore } from '../../store/caretakerStore';
import { API_BASE } from '../../services/caretaker';
import { colors } from '../../theme/colors';
import { radius, sp, touch } from '../../theme/spacing';
import { text } from '../../theme/typography';

interface Props { onClose: () => void; onSuccess: () => void; }

export function LinkBankSheet({ onClose, onSuccess }: Props) {
  const insets = useSafeAreaInsets();
  const building = useCaretakerStore((s) => s.building);
  const load = useCaretakerStore((s) => s.load);

  const [banks, setBanks] = useState<{ code: string; name: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [bank, setBank] = useState<{ code: string; name: string } | null>(null);
  const [accountNumber, setAccountNumber] = useState('');
  const [accountName, setAccountName] = useState<string | null>(null);
  const [resolving, setResolving] = useState(false);
  const [verifyError, setVerifyError] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const seqRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const digits = accountNumber.replace(/\D/g, '');
  const canResolve = !!bank && digits.length === 10;
  const canSave = !!bank && !!accountName && digits.length >= 8 && !saving;

    useEffect(() => {
    setLoading(true);
    fetchBanks().then((b) => {
      const seen = new Set<string>();
      const unique = b.filter((x) => {
        const k = String(x.code || '');
        if (seen.has(k)) return false;
        seen.add(k);
        return true;
      });
      setBanks(unique);
      setLoading(false);
    });
  }, []);

  const doResolve = async () => {
    if (!bank || digits.length !== 10) return;
    if (timerRef.current) clearTimeout(timerRef.current);
    const my = ++seqRef.current;
    setResolving(true); setVerifyError(''); setAccountName(null);
    try {
      const res = await resolveBankAccount(bank.code, digits);
      if (my !== seqRef.current) return;
      if (!res.ok || !res.accountName) {
        setVerifyError(res.error ?? 'Could not verify account');
        setAccountName(null);
      } else {
        setAccountName(res.accountName);
      }
    } catch (e: any) {
      if (my !== seqRef.current) return;
      setVerifyError(e?.message ?? 'Could not verify account');
      setAccountName(null);
    } finally {
      if (my === seqRef.current) setResolving(false);
    }
  };

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (canResolve) timerRef.current = setTimeout(() => { doResolve(); }, 600);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [digits, bank?.code]);

  const save = async () => {
    if (!canSave || !bank || !building?.custom_id) return;
    setSaving(true);
    try {
      const res = await fetch(`${API_BASE}/api/payment-methods`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          buildingId: building.custom_id,
          instrumentType: 'bank_account',
          provider: 'paystack',
          country: 'NG',
          currency: 'NGN',
          bankCode: bank.code,
          bankName: bank.name,
          accountNumber: digits,
          accountLast4: digits.slice(-4),
          accountName,
        }),
      });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error ?? 'Could not save account');
      await load(true);
      setSaved(true);
      setTimeout(() => { onSuccess(); onClose(); }, 1500);
    } catch (e: any) {
      Alert.alert('Failed', e.message ?? 'Could not save account');
    } finally {
      setSaving(false);
    }
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return banks;
    return banks.filter((b) => String(b.name || '').toLowerCase().includes(q) || String(b.code || '').includes(q));
  }, [banks, query]);

  return (
    <Modal visible animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={styles.root}>
        <View style={[styles.header, { paddingTop: insets.top + sp.x2 }]}>
          <View style={styles.headerTitle}>
            <Landmark size={16} color={colors.brand[400]} />
            <Text style={styles.headerLabel}>Link bank account</Text>
          </View>
          <Pressable onPress={onClose} style={styles.close} accessibilityRole="button" accessibilityLabel="Close">
            <X size={22} color={colors.text.primary} />
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          {saved ? (
            <View style={styles.savedWrap}>
              <View style={styles.savedIcon}><Check size={30} color={colors.brand[500]} /></View>
              <Text style={styles.savedTitle}>Bank linked</Text>
              <Text style={styles.savedSub}>{bank?.name} •••• {digits.slice(-4)} is ready.</Text>
            </View>
          ) : (
            <>
              {/* Bank picker */}
              <Text style={styles.label}>Bank</Text>
              <Pressable style={styles.bankBtn} onPress={() => setOpen(!open)} disabled={loading} accessibilityRole="button">
                <Text style={styles.bankBtnLabel} numberOfLines={1}>
                  {bank ? bank.name : loading ? 'Loading banks…' : 'Select your bank'}
                </Text>
                <View style={{ transform: [{ rotate: open ? '180deg' : '0deg' }] }}>
                  <ChevronDown size={18} color={colors.text.muted} />
                </View>
              </Pressable>

              {open ? (
                <View style={styles.dropdown}>
                  <View style={styles.searchRow}>
                    <Search size={16} color={colors.text.muted} />
                    <TextInput style={styles.searchInput} value={query} onChangeText={setQuery} placeholder="Search bank…" placeholderTextColor={colors.text.muted} />
                  </View>
                  <ScrollView style={styles.dropdownList} nestedScrollEnabled>
                    {filtered.map((b, idx) => {
                      const code = b.code || `bank-${idx}`;
                      const sel = bank?.code === b.code;
                      return (
                        <Pressable
                                                    key={`${code}-${idx}`}
                          style={[styles.bankItem, sel ? styles.bankItemActive : null]}
                          onPress={() => { setBank(b); setAccountName(null); setVerifyError(''); setOpen(false); setQuery(''); }}
                          accessibilityRole="button"
                        >
                          <Text style={styles.bankItemLabel}>{b.name || 'Unknown Bank'}</Text>
                          {sel ? <Check size={16} color={colors.brand[500]} /> : null}
                        </Pressable>
                      );
                    })}
                  </ScrollView>
                </View>
              ) : null}

              {/* Account number */}
              <Text style={styles.label}>Account number</Text>
              <TextInput
                style={styles.input}
                value={accountNumber}
                onChangeText={(v) => { setAccountNumber(v.replace(/\D/g, '')); setAccountName(null); setVerifyError(''); }}
                placeholder="0123456789"
                keyboardType="number-pad"
                maxLength={10}
                placeholderTextColor={colors.text.muted}
              />
              {digits.length > 0 && digits.length !== 10 ? (
                <Text style={styles.hint}>Nigerian accounts are 10 digits.</Text>
              ) : null}

              {resolving ? (
                <View style={styles.statusRow}>
                  <ActivityIndicator size="small" color={colors.brand[500]} />
                  <Text style={styles.statusLabel}>Verifying account name…</Text>
                </View>
              ) : null}

              {accountName && !resolving ? (
                <View style={styles.verifiedRow}>
                  <Check size={18} color={colors.brand[500]} />
                  <View style={styles.verifiedMain}>
                    <Text style={styles.verifiedLabel}>Account belongs to</Text>
                    <Text style={styles.verifiedName} numberOfLines={1}>{accountName}</Text>
                  </View>
                </View>
              ) : null}

              {verifyError && !resolving ? (
                <Text style={styles.errorLabel}>{verifyError}</Text>
              ) : null}

              <Pressable style={[styles.verifyBtn, !canResolve || resolving ? styles.verifyBtnDisabled : null]} onPress={doResolve} disabled={!canResolve || resolving} accessibilityRole="button">
                {resolving ? <ActivityIndicator color={colors.text.inverse} /> : <Text style={styles.verifyLabel}>{accountName ? 'Verified · re-check' : 'Verify account name'}</Text>}
              </Pressable>
            </>
          )}
        </ScrollView>

        {!saved ? (
          <View style={styles.footer}>
            <Pressable style={[styles.saveBtn, !canSave && styles.saveBtnDisabled]} onPress={save} disabled={!canSave} accessibilityRole="button">
              {saving ? <ActivityIndicator color={colors.text.inverse} /> : <Text style={styles.saveLabel}>Save bank account</Text>}
            </Pressable>
            <Text style={styles.footerNote}>We store the verified name + last-4 for display; the full number stays server-side for execution.</Text>
          </View>
        ) : null}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: sp.x5, paddingBottom: sp.x4, backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border.subtle },
  headerTitle: { flexDirection: 'row', alignItems: 'center', gap: sp.x2 },
  headerLabel: { ...text.semibold, fontSize: 13, color: colors.text.primary },
  close: { padding: sp.x1 },
  content: { padding: sp.x5, paddingBottom: sp.x12 },
  label: { ...text.label, fontSize: 10, color: colors.text.secondary, marginBottom: sp.x2, marginTop: sp.x4 },
  bankBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border.subtle, paddingHorizontal: sp.x4, height: touch.field },
  bankBtnLabel: { flex: 1, ...text.bodyL, color: colors.text.primary },
  dropdown: { backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border.subtle, marginTop: sp.x2, maxHeight: 240 },
  searchRow: { flexDirection: 'row', alignItems: 'center', gap: sp.x2, paddingHorizontal: sp.x4, paddingVertical: sp.x2, borderBottomWidth: 1, borderBottomColor: colors.border.subtle },
  searchInput: { flex: 1, ...text.bodyM, color: colors.text.primary },
  dropdownList: { maxHeight: 180 },
  bankItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: sp.x4, paddingVertical: sp.x3, borderBottomWidth: 1, borderBottomColor: colors.border.subtle },
  bankItemActive: { backgroundColor: colors.material.emerald },
  bankItemLabel: { flex: 1, ...text.semibold, fontSize: 13, color: colors.text.primary },
  input: { backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1.5, borderColor: colors.border.subtle, paddingHorizontal: sp.x4, height: touch.field, ...text.bodyL, color: colors.text.primary },
  hint: { ...text.bodyS, color: colors.state.warning, marginTop: sp.x2 },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: sp.x2, backgroundColor: colors.material.surface, borderRadius: radius.lg, padding: sp.x3, marginTop: sp.x4, borderWidth: 1, borderColor: colors.material.border },
  statusLabel: { ...text.bodyS, color: colors.text.secondary },
  verifiedRow: { flexDirection: 'row', alignItems: 'center', gap: sp.x3, backgroundColor: colors.state.successSoft, borderRadius: radius.xl, padding: sp.x4, marginTop: sp.x4, borderWidth: 1, borderColor: colors.material.emeraldBorder },
  verifiedMain: { flex: 1 },
  verifiedLabel: { ...text.label, fontSize: 9, color: colors.brand[400] },
  verifiedName: { ...text.semibold, color: colors.text.primary, marginTop: 2 },
  errorLabel: { ...text.bodyS, color: colors.state.danger, marginTop: sp.x4 },
  verifyBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: sp.x2, backgroundColor: colors.card.slate, borderRadius: radius.xl, paddingVertical: sp.x3, marginTop: sp.x5 },
  verifyBtnDisabled: { opacity: 0.5 },
  verifyLabel: { ...text.semibold, fontSize: 13, color: colors.text.primary },
  footer: { padding: sp.x5, paddingTop: sp.x4, borderTopWidth: 1, borderTopColor: colors.border.subtle },
  saveBtn: { backgroundColor: colors.brand[600], borderRadius: radius.xl, height: touch.cta, alignItems: 'center', justifyContent: 'center' },
  saveBtnDisabled: { opacity: 0.45 },
  saveLabel: { ...text.button, color: colors.text.inverse },
  footerNote: { ...text.bodyS, color: colors.text.muted, textAlign: 'center', marginTop: sp.x3 },
  savedWrap: { alignItems: 'center', paddingVertical: sp.x10 },
  savedIcon: { width: 64, height: 64, borderRadius: 32, backgroundColor: colors.material.emerald, alignItems: 'center', justifyContent: 'center' },
  savedTitle: { ...text.titleM, color: colors.text.primary, marginTop: sp.x4 },
  savedSub: { ...text.bodyM, color: colors.text.muted, marginTop: sp.x2 },
});