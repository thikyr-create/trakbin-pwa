import { useEffect, useRef, useState } from 'react';
import { Animated, Image, Pressable, StyleSheet, Text, View, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Camera, CheckCircle2, ChevronDown, Navigation, Pause, Play, SkipForward } from 'lucide-react-native';
import { Chip } from '../ui/Chip';
import { InfoCell } from '../ui/InfoCell';
import { ARRIVAL_RADIUS_M, etaMinutes } from '../../services/geo';
import { colors } from '../../theme/colors';
import { gutter, radius, sp } from '../../theme/spacing';
import { text } from '../../theme/typography';

export const SHEET_PEEK = 200;

interface Props {
  loading: boolean;
  next: any | null;
  routeStatus?: string;
  expanded: boolean;
  onToggle: (v: boolean) => void;
  distM: number | null;
  inZone: boolean;
  proofUrl: string | null;
  onNavigate: () => void;
  onSkip: () => void;
  onConfirm: () => void;
  onPauseToggle: () => void;
  onCapture: () => void;
}

export function StopSheet(p: Props) {
  const insets = useSafeAreaInsets();
  const [contentH, setContentH] = useState(0);
  const hidden = Math.max(contentH - SHEET_PEEK, 0);
  const ty = useRef(new Animated.Value(600)).current;

  useEffect(() => {
    Animated.spring(ty, { toValue: p.expanded ? 0 : hidden, useNativeDriver: true, damping: 22, stiffness: 260 }).start();
  }, [p.expanded, hidden]);

  const paused = p.routeStatus === 'paused';

  return (
    <Animated.View
      style={[styles.sheet, { paddingBottom: insets.bottom + sp.x3, transform: [{ translateY: ty }] }]}
      onLayout={(e) => setContentH(e.nativeEvent.layout.height)}
    >
      <Pressable onPress={() => p.onToggle(!p.expanded)} style={styles.handleWrap} accessibilityRole="button" accessibilityLabel={p.expanded ? 'Collapse' : 'Expand'}>
        <View style={styles.handle} />
      </Pressable>

      {p.loading ? (
        <ActivityIndicator color={colors.brand[600]} style={{ marginVertical: sp.x6 }} />
      ) : !p.next ? (
        <View style={styles.doneWrap}>
          <Text style={styles.doneAll}>All stops handled. Route complete.</Text>
        </View>
      ) : (
        <>
          <View style={styles.nextRow}>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{p.next.sequence ?? 1}</Text>
            </View>
            <View style={styles.nextMain}>
              <Text style={styles.nextLabel}>Next stop</Text>
              <Text style={styles.stopId}>{p.next.building_id}</Text>
              <Text style={styles.addr} numberOfLines={1}>{p.next.address ?? '—'}</Text>
            </View>
            <View style={styles.nextRight}>
              <Text style={styles.dist}>{p.distM != null ? `${(p.distM / 1000).toFixed(1)} km` : '—'}</Text>
              {p.distM != null ? <Text style={styles.eta}>{etaMinutes(p.distM)} min</Text> : null}
            </View>
          </View>

          <View style={styles.chips}>
            {p.next.type ? <Chip label={p.next.type} /> : null}
            {p.next.estate ? <Chip label={p.next.estate} /> : null}
          </View>

          <View style={styles.btnRow}>
            <Pressable style={[styles.actBtn, { backgroundColor: colors.state.info }]} onPress={p.onNavigate}>
              <Navigation size={17} color="#fff" />
              <Text style={styles.actLabelW}>Navigate</Text>
            </Pressable>
            <Pressable style={[styles.actBtn, { backgroundColor: '#F59E0B' }]} onPress={p.onSkip}>
              <SkipForward size={17} color="#fff" />
              <Text style={styles.actLabelW}>Skip</Text>
            </Pressable>
            <Pressable
              style={[styles.actBtn, p.inZone ? { backgroundColor: colors.brand[600] } : { backgroundColor: colors.surfaceMuted }]}
              disabled={!p.inZone}
              onPress={p.onConfirm}
            >
              <CheckCircle2 size={17} color={p.inZone ? '#fff' : colors.text.muted} />
              <Text style={[styles.actLabelW, !p.inZone && { color: colors.text.muted }]}>Confirm</Text>
            </Pressable>
          </View>

          <Text style={styles.helper}>
            {p.inZone
              ? 'Inside arrival zone — confirm enabled.'
              : `Confirm unlocks inside ${ARRIVAL_RADIUS_M} m of the stop.`}
          </Text>

          <Pressable style={styles.pauseBtn} onPress={p.onPauseToggle}>
            {paused ? <Play size={16} color={colors.state.warning} /> : <Pause size={16} color={colors.state.warning} />}
            <Text style={styles.pauseLabel}>{paused ? 'Resume route' : 'Pause route'}</Text>
          </Pressable>

          <View style={styles.grid}>
            <InfoCell label="Address" value={p.next.address ?? '—'} wide />
            <InfoCell label="Estate" value={p.next.estate ?? '—'} />
            <InfoCell label="Type" value={p.next.type ?? '—'} />
            <InfoCell label="Units" value={`${p.next.units ?? 1} unit`} />
            <InfoCell label="Payment" value={String(p.next.payment_status ?? 'paid').toUpperCase()} valueColor={colors.state.success} />
          </View>

          <View style={styles.evidenceRow}>
            <Pressable style={styles.evidenceBtn} onPress={p.onCapture}>
              <Camera size={18} color={colors.brand[700]} />
              <Text style={styles.evidenceLabel}>{p.proofUrl ? 'Retake evidence' : 'Add evidence'}</Text>
            </Pressable>
            {p.proofUrl ? <Image source={{ uri: p.proofUrl }} style={styles.thumb} /> : null}
          </View>

          <Pressable style={styles.collapseBtn} onPress={() => p.onToggle(false)}>
            <ChevronDown size={18} color={colors.text.secondary} />
            <Text style={styles.collapseLabel}>Collapse</Text>
          </Pressable>
        </>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  sheet: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xxl, borderTopRightRadius: radius.xxl,
    paddingHorizontal: gutter, paddingTop: sp.x2,
    shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 20,
    shadowOffset: { width: 0, height: -4 }, elevation: 8,
  },
  handleWrap: { alignItems: 'center', paddingVertical: sp.x2 },
  handle: { width: 44, height: 4, borderRadius: radius.full, backgroundColor: colors.border.strong },
  doneWrap: { paddingVertical: sp.x6 },
  doneAll: { ...text.titleM, color: colors.state.success, textAlign: 'center' },
  nextRow: { flexDirection: 'row', gap: sp.x3, alignItems: 'flex-start' },
  badge: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.brand[600], alignItems: 'center', justifyContent: 'center', marginTop: sp.x2 },
  badgeText: { ...text.button, color: colors.text.inverse },
  nextMain: { flex: 1 },
  nextLabel: { ...text.label, color: colors.text.muted },
  stopId: { ...text.titleL, color: colors.text.primary },
  addr: { ...text.bodyS, color: colors.text.muted, marginTop: 2 },
  nextRight: { alignItems: 'flex-end' },
  dist: { ...text.titleS, color: colors.text.primary },
  eta: { ...text.bodyS, color: colors.brand[700], marginTop: 2 },
  chips: { flexDirection: 'row', gap: sp.x2, marginVertical: sp.x3 },
  btnRow: { flexDirection: 'row', gap: sp.x2, marginBottom: sp.x2 },
  actBtn: { flex: 1, height: 52, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: sp.x2, borderRadius: radius.md },
  actLabelW: { ...text.button, fontSize: 14, color: '#fff' },
  helper: { ...text.bodyS, color: colors.text.muted, textAlign: 'center', marginBottom: sp.x3 },
  pauseBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: sp.x2, backgroundColor: colors.state.warningSoft, borderRadius: radius.md, paddingVertical: sp.x3, marginBottom: sp.x4 },
  pauseLabel: { ...text.button, fontSize: 14, color: colors.state.warning },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: sp.x2, marginBottom: sp.x4 },
  evidenceRow: { flexDirection: 'row', alignItems: 'center', gap: sp.x3, marginBottom: sp.x3 },
  evidenceBtn: { flex: 1, height: 52, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: sp.x2, backgroundColor: colors.brand[50], borderWidth: 1, borderColor: colors.brand[200], borderRadius: radius.md },
  evidenceLabel: { ...text.button, fontSize: 14, color: colors.brand[700] },
  thumb: { width: 52, height: 52, borderRadius: radius.md, backgroundColor: colors.surfaceMuted },
  collapseBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: sp.x2, backgroundColor: colors.surfaceMuted, borderRadius: radius.md, paddingVertical: sp.x3 },
  collapseLabel: { ...text.button, fontSize: 14, color: colors.text.secondary },
});