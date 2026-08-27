import { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  ScrollView,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X, Check, Search, ShieldCheck } from 'lucide-react-native';
import { TextField } from '../ui/TextField';
import { Button } from '../ui/Button';
import { fetchBanks, resolveBankAccount, addPaymentMethod } from '../../services/wallet';
import { useCaretakerStore } from '../../store/caretakerStore';
import { colors } from '../../theme/colors';
import { radius, sp } from '../../theme/spacing';
import { text } from '../../theme/typography';

const NG_ACCOUNT_LENGTH = 10;

interface Props {
  onClose: () => void;
  onSuccess: () => void;
}

interface Bank { code: string; name: string; }

export function LinkBankSheet({ onClose, onSuccess }: Props) {
  const insets = useSafeAreaInsets();
  const building = useCaretakerStore((s) => s.building);

  const [allBanks, setAllBanks] = useState<Bank[]>([]);
  const [loadingBanks, setLoadingBanks] = useState(true);
  const [search, setSearch] = useState('');

  const [selectedBank, setSelectedBank] = useState<Bank | null>(null);
  const [accountNumber, setAccountNumber] = useState('');
  const [accountName, setAccountName] = useState('');

  const [resolving, setResolving] = useState(false);
  const [resolveError, setResolveError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const list = await fetchBanks();
      // De-duplicate by code to prevent duplicate-key render crash
      const seen = new Set<string>();
      const unique = list.filter((b) => {
        if (seen.has(b.code)) return false;
        seen.add(b.code);
        return true;
      });
      setAllBanks(unique);
      setLoadingBanks(false);
    })();
  }, []);

  const filteredBanks = useMemo(() => {
    if (!search.trim()) return allBanks;
    const q = search.toLowerCase();
    return allBanks.filter((b) => b.name.toLowerCase().includes(q) || b.code.toLowerCase().includes(q));
  }, [allBanks, search]);

  // Auto-resolve when account number hits NG standard (10 digits)
  useEffect(() => {
    let cancelled = false;
    if (!selectedBank || accountNumber.length !== NG_ACCOUNT_LENGTH) {
      if (accountName && accountNumber.length !== NG_ACCOUNT_LENGTH) setAccountName('');
      return;
    }
    setResolving(true);
    setResolveError(null);
    resolveBankAccount(accountNumber, selectedBank.code).then((resolved) => {
      if (cancelled) return;
      setResolving(false);
      if (resolved && resolved.accountName) {
        setAccountName(resolved.accountName);
      } else {
        setAccountName('');
        setResolveError('Could not verify this account. Check the number.');
      }
    });
    return () => { cancelled = true; };
  }, [accountNumber, selectedBank]);

  const handleSave = async () => {
    if (!building?.custom_id || !selectedBank || !accountName) return;
    setSaving(true);
    await addPaymentMethod({
      buildingId: building.custom_id,
      instrumentType: 'bank_account',
      provider: 'paystack',
      country: 'NG',
      currency: 'NGN',
      bankCode: selectedBank.code,
      bankName: selectedBank.name,
      accountNumber,
      accountName,
      isDefault: true,
    });
    setSaving(false);
    onSuccess();
    onClose();
  };

  return (
    <Modal visible animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={styles.root}>
        <View style={[styles.header, { paddingTop: insets.top + sp.x2 }]}>
          <Text style={styles.title}>Link bank account</Text>
          <Pressable onPress={onClose} style={styles.close} accessibilityRole="button" accessibilityLabel="Close">
            <X size={22} color={colors.text.primary} />
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          {!selectedBank ? (
            <>
              <View style={styles.searchWrap}>
                <Search size={16} color={colors.text.muted} style={styles.searchIcon} />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search bank name or code"
                  placeholderTextColor={colors.text.muted}
                  value={search}
                  onChangeText={setSearch}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>

              <Text style={styles.section}>
                {loadingBanks ? 'Loading banks…' : `${filteredBanks.length} banks`}
              </Text>

              {loadingBanks ? (
                <ActivityIndicator size="large" color={colors.brand[600]} style={styles.loader} />
              ) : filteredBanks.length === 0 ? (
                <Text style={styles.empty}>No banks match "{search}".</Text>
              ) : (
                filteredBanks.map((b) => (
                  <Pressable
                    key={b.code}
                    style={styles.bankRow}
                    onPress={() => setSelectedBank(b)}
                    accessibilityRole="button"
                  >
                    <Text style={styles.bankName} numberOfLines={1}>{b.name}</Text>
                    <Text style={styles.bankCode}>{b.code}</Text>
                  </Pressable>
                ))
              )}
            </>
          ) : (
            <>
              <Pressable onPress={() => { setSelectedBank(null); setAccountNumber(''); setAccountName(''); setResolveError(null); }} style={styles.backLink} accessibilityRole="button">
                <Text style={styles.backLinkText}>← Change bank</Text>
              </Pressable>

              <View style={styles.selectedChip}>
                <Check size={14} color={colors.brand[700]} />
                <Text style={styles.selectedChipText}>{selectedBank.name}</Text>
              </View>

              <TextField
                label="Account number"
                placeholder="10-digit account number"
                keyboardType="number-pad"
                value={accountNumber}
                onChangeText={(v) => setAccountNumber(v.replace(/\D/g, '').slice(0, NG_ACCOUNT_LENGTH))}
                maxLength={NG_ACCOUNT_LENGTH}
                error={resolveError}
              />

              {resolving ? (
                <View style={styles.resolveRow}>
                  <ActivityIndicator size="small" color={colors.brand[600]} />
                  <Text style={styles.resolveText}>Verifying account…</Text>
                </View>
              ) : accountName ? (
                <View style={styles.resolvedCard}>
                  <Text style={styles.resolvedLabel}>Account name</Text>
                  <Text style={styles.resolvedValue}>{accountName}</Text>
                  <View style={styles.resolvedBadge}>
                    <ShieldCheck size={12} color={colors.brand[700]} />
                    <Text style={styles.resolvedBadgeText}>Verified against bank records</Text>
                  </View>
                </View>
              ) : accountNumber.length > 0 ? (
                <Text style={styles.resolveHint}>
                  {accountNumber.length < NG_ACCOUNT_LENGTH
                    ? `Enter ${NG_ACCOUNT_LENGTH - accountNumber.length} more digit${NG_ACCOUNT_LENGTH - accountNumber.length === 1 ? '' : 's'} to auto-verify`
                    : ''}
                </Text>
              ) : null}

              <Button
                label="Save bank account"
                onPress={handleSave}
                loading={saving}
                disabled={!accountName || saving}
                style={styles.saveBtn}
              />

              <Text style={styles.note}>
                Saved to your building for future autopay and top-ups. Secured by Paystack.
              </Text>
            </>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: sp.x5,
    paddingBottom: sp.x4,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.subtle,
  },
  title: { ...text.titleM, color: colors.text.primary },
  close: { padding: sp.x1 },
  content: { padding: sp.x5, paddingBottom: sp.x12 },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    paddingHorizontal: sp.x4,
    height: 48,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    marginBottom: sp.x4,
  },
  searchIcon: { marginRight: sp.x2 },
  searchInput: { flex: 1, ...text.bodyM, color: colors.text.primary, padding: 0 },
  section: { ...text.label, color: colors.text.muted, marginBottom: sp.x3 },
  loader: { marginTop: sp.x8 },
  empty: { ...text.bodyM, color: colors.text.muted, marginTop: sp.x4 },
  bankRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: sp.x4,
    marginBottom: sp.x2,
    borderWidth: 1,
    borderColor: colors.border.subtle,
  },
  bankName: { flex: 1, ...text.semibold, color: colors.text.primary, marginRight: sp.x2 },
  bankCode: { ...text.mono, fontSize: 11, color: colors.text.muted },
  backLink: { marginBottom: sp.x3 },
  backLinkText: { ...text.semibold, color: colors.brand[700] },
  selectedChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: sp.x2,
    alignSelf: 'flex-start',
    backgroundColor: colors.brand[50],
    borderRadius: radius.full,
    paddingHorizontal: sp.x3,
    paddingVertical: sp.x2,
    marginBottom: sp.x4,
  },
  selectedChipText: { ...text.semibold, fontSize: 13, color: colors.brand[700] },
  resolveRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: sp.x2,
    marginTop: sp.x3,
  },
  resolveText: { ...text.bodyS, color: colors.text.muted },
  resolveHint: { ...text.bodyS, color: colors.text.muted, marginTop: sp.x2 },
  resolvedCard: {
    backgroundColor: colors.brand[50],
    borderRadius: radius.xl,
    padding: sp.x4,
    marginTop: sp.x3,
    borderWidth: 1,
    borderColor: colors.brand[200],
  },
  resolvedLabel: { ...text.label, color: colors.text.muted },
  resolvedValue: { ...text.titleS, color: colors.text.primary, marginTop: sp.x1 },
  resolvedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: sp.x1,
    marginTop: sp.x3,
  },
  resolvedBadgeText: { ...text.bodyS, fontSize: 11, color: colors.brand[700] },
  saveBtn: { marginTop: sp.x5 },
  note: { ...text.bodyS, color: colors.text.muted, textAlign: 'center', marginTop: sp.x4 },
});