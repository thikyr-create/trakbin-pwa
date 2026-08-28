import { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, TextInput, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { TriangleAlert, CalendarX, MapPin, Navigation, Camera, CircleCheck, ShieldCheck, X } from 'lucide-react-native';
import { Screen } from '../../components/ui/Screen';

import { StatusPill } from '../../components/ui/StatusPill';
import { Rise } from '../../components/ui/motion';
import { useCaretakerStore } from '../../store/caretakerStore';
import { createEnvironmentalIssue, fetchEnvironmentalIssues } from '../../services/caretaker';
import { colors } from '../../theme/colors';
import { radius, sp, touch } from '../../theme/spacing';
import { text } from '../../theme/typography';

type Kind = 'dump' | 'miss' | null;

const getLocationModule = () => { try { return require('expo-location'); } catch { return null; } };
const getImagePicker = () => { try { return require('expo-image-picker'); } catch { return null; } };

function relTime(iso?: string) {
  if (!iso) return '';
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return 'just now';
  const m = Math.floor(s / 60); if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60); if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export default function ReportScreen() {
  const router = useRouter();
  const building = useCaretakerStore((s: any) => s.building);
  const assignment = useCaretakerStore((s: any) => s.assignment);

  const [kind, setKind] = useState<Kind>(null);
  const [dumpLocation, setDumpLocation] = useState('');
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [locBusy, setLocBusy] = useState(false);
  const [dumpNote, setDumpNote] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [missedDate, setMissedDate] = useState('');
  const [missWindow, setMissWindow] = useState('');
  const [missNote, setMissNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [issues, setIssues] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const provider = assignment?.company_name || 'your waste provider';
  const scheduledWindow = assignment?.time_window ?? '';
  const todayISO = new Date().toISOString().slice(0, 10);
  const canDump = dumpLocation.trim().length > 0 && !submitting;
  const canMiss = !!missedDate && !submitting;
  const assigned = !!building?.company_id;

  const loadHistory = async () => {
    if (!building?.custom_id) return;
    setLoadingHistory(true);
    const data = await fetchEnvironmentalIssues(building.custom_id);
    setIssues(data);
    setLoadingHistory(false);
  };

  useEffect(() => { loadHistory(); }, [building?.custom_id]);

  const openCount = useMemo(
    () => issues.filter((i) => !['resolved', 'closed'].includes(String(i.status || '').toLowerCase())).length,
    [issues]
  );

  const useMyLocation = async () => {
    const Loc = getLocationModule();
    if (!Loc) { Alert.alert('Location', 'Type the address manually — location module not available.'); return; }
    setLocBusy(true);
    try {
      const { status } = await Loc.requestForegroundPermissionsAsync();
      if (status !== 'granted') { setLocBusy(false); Alert.alert('Permission', 'Location access denied. Type the address.'); return; }
      const pos = await Loc.getCurrentPositionAsync({ accuracy: Loc.Accuracy.High, timeout: 8000 });
      const lat = pos.coords.latitude, lng = pos.coords.longitude;
      setCoords({ lat, lng });
      if (!dumpLocation.trim()) setDumpLocation(`${lat.toFixed(6)}, ${lng.toFixed(6)}`);
      Alert.alert('Captured', 'GPS coordinates pinned.');
       } catch {
      Alert.alert('Location', "Couldn't read location — type the spot instead.");
    } finally { setLocBusy(false); }
  };

  const pickPhoto = async () => {
    const IP = getImagePicker();
    if (!IP) { Alert.alert('Camera', 'Camera module not available yet. Submit the report without a photo.'); return; }
    try {
      const { status } = await IP.requestCameraPermissionsAsync();
      if (status !== 'granted') { Alert.alert('Permission', 'Camera access denied.'); return; }
      const result = await IP.launchCameraAsync({ mediaTypes: ['images'], quality: 0.8, allowsMultipleSelection: true, selectionLimit: 4 - photos.length });
      if (!result.canceled && result.assets?.length) {
        const next = result.assets.map((a: any) => a.uri).slice(0, 4 - photos.length);
        setPhotos((p) => [...p, ...next].slice(0, 4));
      }
    } catch {}
  };

  const removePhoto = (idx: number) => setPhotos((p) => p.filter((_, i) => i !== idx));

  const reset = () => {
    setPhotos([]); setDumpLocation(''); setCoords(null); setDumpNote('');
    setMissedDate(''); setMissWindow(''); setMissNote(''); setKind(null);
  };

  const submitDump = async () => {
    if (!canDump || !building?.custom_id) return;
    setSubmitting(true);
    try {
      const lines = ['Illegal dumping reported.', `Location: ${dumpLocation.trim()}`];
      if (coords) lines.push(`Coordinates: ${coords.lat.toFixed(6)}, ${coords.lng.toFixed(6)}`);
      if (dumpNote.trim()) lines.push(`Note: ${dumpNote.trim()}`);
      if (photos.length) lines.push(`Attachments: ${photos.length} photo${photos.length === 1 ? '' : 's'} (on device)`);
      const res = await createEnvironmentalIssue({
        buildingId: building.custom_id,
        companyId: Number(building.company_id) || null,
        issue_type: 'illegal_dumping',
        description: lines.join('\n'),
        location: dumpLocation.trim(),
        latitude: coords?.lat,
        longitude: coords?.lng,
      });
      if (res.ok) {
        Alert.alert('Reported', `Dumping reported. Issue ${res.issue_number}`);
        reset();
        await loadHistory();
      } else Alert.alert('Failed', res.error ?? 'Could not submit.');
    } catch (e: any) {
      Alert.alert('Failed', e.message ?? 'Could not submit.');
    } finally { setSubmitting(false); }
  };

  const submitMiss = async () => {
    if (!canMiss || !building?.custom_id) return;
    setSubmitting(true);
    try {
      const wd = new Date(missedDate + 'T00:00:00').toLocaleDateString('en-NG', { weekday: 'long' });
      const win = missWindow.trim() || scheduledWindow || '';
      const lines = ['Missed collection reported.', `Date missed: ${missedDate} (${wd})`];
      if (win) lines.push(`Time window: ${win}`);
      if (missNote.trim()) lines.push(`Note: ${missNote.trim()}`);
      const res = await createEnvironmentalIssue({
        buildingId: building.custom_id,
        companyId: Number(building.company_id) || null,
        issue_type: 'missed_collection',
        description: lines.join('\n'),
        missed_date: missedDate,
        missed_window: win || null,
      });
      if (res.ok) {
        Alert.alert('Reported', `Missed collection reported. Issue ${res.issue_number}`);
        reset();
        await loadHistory();
      } else Alert.alert('Failed', res.error ?? 'Could not submit.');
    } catch (e: any) {
      Alert.alert('Failed', e.message ?? 'Could not submit.');
    } finally { setSubmitting(false); }
  };

  return (
        <Screen scroll keyboard>
      

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {!assigned ? (
          <Rise delay={0}>
            <View style={styles.unassignedCard}>
              <ShieldCheck size={28} color={colors.text.muted} />
              <Text style={styles.unassignedTitle}>No waste company assigned yet</Text>
              <Text style={styles.unassignedBody}>You'll be able to report illegal dumping and missed collections as soon as a waste company activates your building.</Text>
            </View>
          </Rise>
        ) : (
          <>
            <Rise delay={0}>
              <View style={styles.hero}>
                <Text style={styles.heroEyebrow}>Community watch · {provider}</Text>
                <Text style={styles.heroTitle}>Report a problem</Text>
                <Text style={styles.heroBody}>Two things, two quick paths. Tell us about illegal dumping or a collection that never happened — we route it straight to your hauler.</Text>
                <View style={styles.heroPill}>
                  <View style={[styles.heroDot, openCount > 0 ? styles.heroDotActive : null]} />
                  <Text style={styles.heroPillText}>{openCount > 0 ? `${openCount} open near you` : 'all clear'}</Text>
                </View>
              </View>
            </Rise>

            <Rise delay={80}>
              <View style={styles.chooser}>
                <Pressable
                  style={[styles.choice, kind === 'dump' ? styles.choiceActiveDump : null]}
                  onPress={() => setKind(kind === 'dump' ? null : 'dump')}
                  accessibilityRole="button"
                >
                  <View style={[styles.choiceIcon, kind === 'dump' ? styles.choiceIconSolidDump : styles.choiceIconSoftDump]}>
                    <TriangleAlert size={20} color={kind === 'dump' ? colors.text.inverse : colors.state.warning} />
                  </View>
                  <Text style={styles.choiceTitle}>Illegal dumping</Text>
                  <Text style={styles.choiceSub}>Photograph the site</Text>
                  {kind === 'dump' ? <View style={styles.choiceCheck}><CircleCheck size={14} color={colors.state.warning} /></View> : null}
                </Pressable>

                <Pressable
                  style={[styles.choice, kind === 'miss' ? styles.choiceActiveMiss : null]}
                  onPress={() => setKind(kind === 'miss' ? null : 'miss')}
                  accessibilityRole="button"
                >
                  <View style={[styles.choiceIcon, kind === 'miss' ? styles.choiceIconSolidMiss : styles.choiceIconSoftMiss]}>
                    <CalendarX size={20} color={kind === 'miss' ? colors.text.inverse : colors.state.danger} />
                  </View>
                  <Text style={styles.choiceTitle}>Missed collection</Text>
                  <Text style={styles.choiceSub}>The truck didn't come</Text>
                  {kind === 'miss' ? <View style={styles.choiceCheck}><CircleCheck size={14} color={colors.state.danger} /></View> : null}
                </Pressable>
              </View>
            </Rise>

            {kind === 'dump' ? (
              <Rise delay={140}>
                <View style={[styles.composer, styles.composerDump]}>
                  <Text style={[styles.composerLabel, { color: colors.state.warning }]}>ILLEGAL DUMPING</Text>
                  <Text style={styles.composerTitle}>Where is the dump?</Text>
                  <Text style={styles.composerSub}>That's all we need. Add a photo if you can.</Text>

                  <Text style={styles.fieldLabel}>Location of the dump</Text>
                  <View style={styles.locRow}>
                    <TextInput
                      style={[styles.input, { flex: 1 }]}
                      value={dumpLocation}
                      onChangeText={setDumpLocation}
                      placeholder="e.g. behind 12 Oka St"
                      placeholderTextColor={colors.text.muted}
                    />
                    <Pressable style={styles.gpsBtn} onPress={useMyLocation} disabled={locBusy} accessibilityRole="button">
                      {locBusy ? <ActivityIndicator size="small" color={colors.text.inverse} /> : <Navigation size={16} color={colors.text.inverse} />}
                    </Pressable>
                  </View>
                  {coords ? (
                    <Text style={styles.gpsPinned}>GPS pinned · {coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}</Text>
                  ) : null}

                  <Text style={styles.fieldLabel}>Note (optional)</Text>
                  <TextInput
                    style={[styles.input, styles.area]}
                    value={dumpNote}
                    onChangeText={setDumpNote}
                    placeholder="What's dumped, how long it's been there…"
                    placeholderTextColor={colors.text.muted}
                    multiline
                  />

                  <Text style={styles.fieldLabel}>Photo (optional · up to 4)</Text>
                  <View style={styles.photoRow}>
                    <Pressable style={styles.photoPick} onPress={pickPhoto} accessibilityRole="button">
                      <Camera size={16} color={colors.text.inverse} />
                      <Text style={styles.photoPickLabel}>Take photo</Text>
                    </Pressable>
                    {photos.map((uri, i) => (
                      <View key={i} style={styles.photoThumb}>
                        <Text style={styles.photoThumbLabel}>{i + 1}</Text>
                        <Pressable style={styles.photoRemove} onPress={() => removePhoto(i)} accessibilityRole="button">
                          <X size={12} color={colors.text.inverse} />
                        </Pressable>
                      </View>
                    ))}
                  </View>

                  <Pressable style={[styles.submitBtn, !canDump && styles.submitBtnDisabled]} onPress={submitDump} disabled={!canDump} accessibilityRole="button">
                    {submitting ? <ActivityIndicator color={colors.text.inverse} /> : <Text style={styles.submitLabel}>Submit dumping report</Text>}
                  </Pressable>
                </View>
              </Rise>
            ) : null}

            {kind === 'miss' ? (
              <Rise delay={140}>
                <View style={[styles.composer, styles.composerMiss]}>
                  <Text style={[styles.composerLabel, { color: colors.state.danger }]}>MISSED COLLECTION</Text>
                  <Text style={styles.composerTitle}>Which pickup was missed?</Text>
                  <Text style={styles.composerSub}>Enter the date the truck didn't show. No photo needed.</Text>

                  <Text style={styles.fieldLabel}>Date missed *</Text>
                  <TextInput
                    style={styles.input}
                    value={missedDate}
                    onChangeText={setMissedDate}
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor={colors.text.muted}
                  />
                  <Text style={styles.fieldHint}>Type today's date or the missed date. Max: {todayISO}</Text>

                  <Text style={styles.fieldLabel}>Time window (optional)</Text>
                  <TextInput
                    style={styles.input}
                    value={missWindow}
                    onChangeText={setMissWindow}
                    placeholder={scheduledWindow || 'e.g. 08:00 AM – 11:00 AM'}
                    placeholderTextColor={colors.text.muted}
                  />

                  <Text style={styles.fieldLabel}>Note (optional)</Text>
                  <TextInput
                    style={[styles.input, styles.area]}
                    value={missNote}
                    onChangeText={setMissNote}
                    placeholder="Bins still full, no notice left…"
                    placeholderTextColor={colors.text.muted}
                    multiline
                  />

                  <Pressable style={[styles.submitBtn, styles.submitBtnMiss, !canMiss && styles.submitBtnDisabled]} onPress={submitMiss} disabled={!canMiss} accessibilityRole="button">
                    {submitting ? <ActivityIndicator color={colors.text.inverse} /> : <Text style={styles.submitLabel}>Report missed collection</Text>}
                  </Pressable>
                </View>
              </Rise>
            ) : null}

            <Rise delay={200}>
              <View style={styles.historyCard}>
                <View style={styles.historyHeader}>
                  <View style={styles.historyHeaderLeft}>
                    <ShieldCheck size={16} color={colors.text.secondary} />
                    <Text style={styles.historyTitle}>Your reports</Text>
                  </View>
                  <Text style={styles.historyCount}>{issues.length} filed</Text>
                </View>

                {loadingHistory ? (
                  <ActivityIndicator size="small" color={colors.brand[500]} style={{ paddingVertical: sp.x6 }} />
                ) : issues.length === 0 ? (
                  <View style={styles.historyEmpty}>
                    <CircleCheck size={28} color={colors.text.muted} />
                    <Text style={styles.historyEmptyTitle}>No reports yet</Text>
                    <Text style={styles.historyEmptyBody}>When you flag dumping or a missed collection, it shows up here with its status.</Text>
                  </View>
                ) : (
                  <View style={styles.historyList}>
                    {issues.map((it, i) => {
                      const isDump = it.issue_type === 'illegal_dumping';
                      const locMatch = String(it.description || '').match(/Location:\s*([^\n]+)/);
                      const missMatch = String(it.description || '').match(/Date missed:\s*([^\n]+)/);
                      return (
                        <View key={it.id ?? i} style={styles.historyRow}>
                          <View style={[styles.historyRail, isDump ? styles.historyRailDump : styles.historyRailMiss]} />
                          <View style={styles.historyIconWrap}>
                            <View style={[styles.historyIcon, isDump ? styles.historyIconDump : styles.historyIconMiss]}>
                              {isDump ? <TriangleAlert size={16} color={colors.state.warning} /> : <CalendarX size={16} color={colors.state.danger} />}
                            </View>
                          </View>
                          <View style={styles.historyMain}>
                            <View style={styles.historyRowTop}>
                              <Text style={styles.historyRowTitle}>{isDump ? 'Illegal dumping' : 'Missed collection'}</Text>
                              <StatusPill value={String(it.status || 'open')} />
                            </View>
                            <Text style={styles.historyRowMeta}>{it.issue_number} · {relTime(it.created_at)}</Text>
                            {isDump && locMatch ? (
                              <View style={styles.historyDetail}><MapPin size={12} color={colors.state.warning} /><Text style={styles.historyDetailText}>{locMatch[1].trim()}</Text></View>
                            ) : null}
                            {!isDump && missMatch ? (
                              <View style={styles.historyDetail}><CalendarX size={12} color={colors.state.danger} /><Text style={styles.historyDetailText}>{missMatch[1].trim()}</Text></View>
                            ) : null}
                          </View>
                        </View>
                      );
                    })}
                  </View>
                )}
              </View>
            </Rise>
          </>
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingBottom: sp.x10, paddingTop: sp.x2 },

  unassignedCard: { alignItems: 'center', paddingVertical: sp.x12, paddingHorizontal: sp.x6, gap: sp.x3 },
  unassignedTitle: { ...text.titleM, color: colors.text.primary },
  unassignedBody: { ...text.bodyM, color: colors.text.muted, textAlign: 'center' },

  hero: { backgroundColor: 'rgba(251,191,36,0.12)', borderRadius: radius.xxl, padding: sp.x6, borderWidth: 1, borderColor: 'rgba(251,191,36,0.28)' },
  heroEyebrow: { ...text.label, fontSize: 10, color: 'rgba(251,191,36,0.85)' },
  heroTitle: { ...text.display, color: colors.text.primary, marginTop: sp.x2 },
  heroBody: { ...text.bodyM, color: colors.text.muted, marginTop: sp.x2 },
  heroPill: { flexDirection: 'row', alignItems: 'center', gap: sp.x2, alignSelf: 'flex-start', marginTop: sp.x4, backgroundColor: 'rgba(255,255,255,0.6)', borderRadius: radius.xl, paddingHorizontal: sp.x3, paddingVertical: sp.x2 },
  heroDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.state.success },
  heroDotActive: { backgroundColor: colors.state.warning },
  heroPillText: { ...text.label, fontSize: 10, color: colors.text.secondary },

  chooser: { flexDirection: 'row', gap: sp.x3, marginTop: sp.x5 },
  choice: { flex: 1, backgroundColor: colors.surface, borderRadius: radius.xxl, padding: sp.x4, borderWidth: 2, borderColor: colors.border.subtle },
  choiceActiveDump: { borderColor: colors.state.warning, backgroundColor: 'rgba(251,191,36,0.08)' },
  choiceActiveMiss: { borderColor: colors.state.danger, backgroundColor: 'rgba(244,63,94,0.08)' },
  choiceIcon: { width: 44, height: 44, borderRadius: radius.lg, alignItems: 'center', justifyContent: 'center' },
  choiceIconSoftDump: { backgroundColor: 'rgba(251,191,36,0.15)' },
  choiceIconSoftMiss: { backgroundColor: 'rgba(244,63,94,0.15)' },
  choiceIconSolidDump: { backgroundColor: colors.state.warning },
  choiceIconSolidMiss: { backgroundColor: colors.state.danger },
  choiceTitle: { ...text.semibold, color: colors.text.primary, marginTop: sp.x3 },
  choiceSub: { ...text.bodyS, color: colors.text.muted, marginTop: 2 },
  choiceCheck: { marginTop: sp.x3 },

  composer: { borderRadius: radius.xxl, padding: sp.x5, marginTop: sp.x5, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border.subtle },
  composerDump: { borderLeftWidth: 4, borderLeftColor: colors.state.warning },
  composerMiss: { borderLeftWidth: 4, borderLeftColor: colors.state.danger },
  composerLabel: { ...text.label, fontSize: 10 },
  composerTitle: { ...text.titleM, color: colors.text.primary, marginTop: sp.x2 },
  composerSub: { ...text.bodyS, color: colors.text.muted, marginTop: sp.x1 },

  fieldLabel: { ...text.label, fontSize: 10, color: colors.text.secondary, marginTop: sp.x4, marginBottom: sp.x2 },
  fieldHint: { ...text.bodyXs, color: colors.text.muted, marginTop: 2 },
  input: { backgroundColor: colors.material.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.material.border, paddingHorizontal: sp.x4, height: touch.field, ...text.bodyM, color: colors.text.primary },
  area: { minHeight: 72, textAlignVertical: 'top', paddingVertical: sp.x3 },

  locRow: { flexDirection: 'row', gap: sp.x2 },
  gpsBtn: { width: touch.field, backgroundColor: colors.card.slate, borderRadius: radius.lg, alignItems: 'center', justifyContent: 'center' },
  gpsPinned: { ...text.bodyS, color: colors.state.success, marginTop: sp.x2 },

  photoRow: { flexDirection: 'row', flexWrap: 'wrap', gap: sp.x2 },
  photoPick: { flexDirection: 'row', alignItems: 'center', gap: sp.x2, backgroundColor: colors.state.warning, borderRadius: radius.lg, paddingHorizontal: sp.x3, paddingVertical: sp.x3 },
  photoPickLabel: { ...text.semibold, fontSize: 12, color: colors.text.inverse },
  photoThumb: { width: 48, height: 48, borderRadius: radius.md, backgroundColor: colors.card.slate, alignItems: 'center', justifyContent: 'center' },
  photoThumbLabel: { ...text.semibold, fontSize: 14, color: colors.text.primary },
  photoRemove: { position: 'absolute', top: -6, right: -6, width: 20, height: 20, borderRadius: 10, backgroundColor: colors.state.danger, alignItems: 'center', justifyContent: 'center' },

  submitBtn: { marginTop: sp.x5, backgroundColor: colors.state.warning, borderRadius: radius.xl, height: touch.cta, alignItems: 'center', justifyContent: 'center' },
  submitBtnMiss: { backgroundColor: colors.state.danger },
  submitBtnDisabled: { opacity: 0.45 },
  submitLabel: { ...text.button, color: colors.text.inverse },

  historyCard: { backgroundColor: colors.surface, borderRadius: radius.xxl, marginTop: sp.x6, borderWidth: 1, borderColor: colors.border.subtle, overflow: 'hidden' },
  historyHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: sp.x5, paddingVertical: sp.x4, borderBottomWidth: 1, borderBottomColor: colors.border.subtle },
  historyHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: sp.x2 },
  historyTitle: { ...text.semibold, color: colors.text.primary },
  historyCount: { ...text.label, fontSize: 10, color: colors.text.muted },
  historyEmpty: { alignItems: 'center', paddingVertical: sp.x10, gap: sp.x2 },
  historyEmptyTitle: { ...text.semibold, color: colors.text.primary },
  historyEmptyBody: { ...text.bodyS, color: colors.text.muted, textAlign: 'center', maxWidth: 260 },
  historyList: { padding: sp.x3 },
  historyRow: { flexDirection: 'row', gap: sp.x3, paddingVertical: sp.x4, paddingHorizontal: sp.x3, borderBottomWidth: 1, borderBottomColor: colors.border.subtle },
  historyRail: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, borderRadius: 2 },
  historyRailDump: { backgroundColor: colors.state.warning },
  historyRailMiss: { backgroundColor: colors.state.danger },
  historyIconWrap: { paddingTop: 2 },
  historyIcon: { width: 36, height: 36, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  historyIconDump: { backgroundColor: 'rgba(251,191,36,0.15)' },
  historyIconMiss: { backgroundColor: 'rgba(244,63,94,0.15)' },
  historyMain: { flex: 1 },
  historyRowTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: sp.x2 },
  historyRowTitle: { ...text.semibold, color: colors.text.primary },
  historyRowMeta: { ...text.label, fontSize: 9, color: colors.text.muted, marginTop: 2 },
  historyDetail: { flexDirection: 'row', alignItems: 'center', gap: sp.x1, marginTop: sp.x2 },
  historyDetailText: { ...text.bodyS, color: colors.text.secondary, flex: 1 },
});