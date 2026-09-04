import { useState, useMemo, useEffect } from 'react';
import { View, Text, Pressable, StyleSheet, Dimensions, ScrollView, TextInput, Linking, Alert } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, runOnJS } from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useSessionStore } from '../../store/session';
import { useConsoleStore } from '../../store/ui';
import { NextStopCard } from './NextStopCard';
import { calculateDistanceInMeters } from '../../utils/geo';
import { captureProof } from '../../services/proof';
import { colors, typography, spacing, radius, elevation } from '../../theme/design';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const VISIBLE_IDLE = 44;
const SNAP_VELOCITY = 500;
const SNAP_OFFSET = 60;

export function BottomSheet() {
  const currentStop = useSessionStore((s) => s.currentStop);
  const isArrived = useSessionStore((s) => s.isArrived);
  const isRoutePaused = useSessionStore((s) => s.isRoutePaused);
  const gpsLocation = useSessionStore((s) => s.gpsLocation);
  const completePickup = useSessionStore((s) => s.completePickup);
  const skipStop = useSessionStore((s) => s.skipStop);
  const toggleRoutePause = useSessionStore((s) => s.toggleRoutePause);
  const sheetState = useConsoleStore((s) => s.sheetState);
  const setSheetState = useConsoleStore((s) => s.setSheetState);
  const setPauseModalOpen = useConsoleStore((s) => s.setPauseModalOpen);
  const setReportOpen = useConsoleStore((s) => s.setReportOpen);
  const setEndShiftOpen = useConsoleStore((s) => s.setEndShiftOpen);
  const [skipOpen, setSkipOpen] = useState(false);
  const [skipReason, setSkipReason] = useState('');
  const [sheetHeight, setSheetHeight] = useState(0);

  const mode: 'idle' | 'paused' | 'active' = !currentStop ? 'idle' : isRoutePaused ? 'paused' : 'active';

  const collapsedY = Math.max(0, sheetHeight - VISIBLE_IDLE);
  const maxTranslate = sheetHeight;

  const translateY = useSharedValue(1000);

  useEffect(() => {
    if (sheetHeight === 0) return;
    translateY.value = withSpring(sheetState === 'collapsed' ? collapsedY : 0, {
      damping: 30,
      stiffness: 300,
    });
  }, [sheetState, collapsedY, sheetHeight, translateY]);

  const handleGesture = useMemo(
    () =>
      Gesture.Pan()
        .onUpdate((event) => {
          'worklet';
          const base = sheetState === 'collapsed' ? collapsedY : 0;
          const nextY = base + event.translationY;
          translateY.value = Math.max(0, Math.min(maxTranslate, nextY));
        })
        .onEnd((event) => {
          'worklet';
          const fastUp = event.velocityY < -SNAP_VELOCITY;
          const fastDown = event.velocityY > SNAP_VELOCITY;
          const movedUp = event.translationY < -SNAP_OFFSET;
          const movedDown = event.translationY > SNAP_OFFSET;

          if (fastUp || (movedUp && !fastDown)) {
            runOnJS(setSheetState)('expanded');
          } else if (fastDown || (movedDown && !fastUp)) {
            runOnJS(setSheetState)('collapsed');
          } else {
            translateY.value = withSpring(sheetState === 'collapsed' ? collapsedY : 0, {
              damping: 30,
              stiffness: 300,
            });
          }
        }),
    [sheetState, collapsedY, maxTranslate, translateY, setSheetState]
  );

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const toggleSheet = () => {
    setSheetState(sheetState === 'expanded' ? 'collapsed' : 'expanded');
  };

  const distanceM =
    gpsLocation && currentStop?.latitude != null && currentStop?.longitude != null
      ? calculateDistanceInMeters(gpsLocation.latitude, gpsLocation.longitude, currentStop.latitude, currentStop.longitude)
      : null;
  const etaMin = distanceM != null ? Math.max(1, Math.round((distanceM / 1000 / 25) * 60)) : null;

  const handleNavigate = () => {
    if (!currentStop || currentStop.latitude == null || currentStop.longitude == null) return;
    Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${currentStop.latitude},${currentStop.longitude}`);
    setSheetState('collapsed');
  };

  const handleConfirm = async () => {
    const proofUrl = await captureProof();
    if (proofUrl) {
      await completePickup();
    } else {
      Alert.alert('Evidence required', 'A proof photo is required to confirm pickup.');
    }
  };

  const handleSkip = async () => {
    if (!skipReason.trim()) {
      Alert.alert('Reason required', 'Provide a reason for skipping this stop.');
      return;
    }
    await skipStop(skipReason.trim());
    setSkipOpen(false);
    setSkipReason('');
  };

  return (
    <>
      <Animated.View
        style={[styles.sheet, animatedStyle]}
        onLayout={(e) => setSheetHeight(e.nativeEvent.layout.height)}
      >
        <GestureDetector gesture={handleGesture}>
          <Pressable onPress={toggleSheet} style={styles.handleWrap}>
            <View style={styles.handle} />
          </Pressable>
        </GestureDetector>

        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          {mode === 'idle' && (
            <View style={styles.idleCard}>
              <View style={[styles.dot, { backgroundColor: colors.neutral[40] }]} />
              <View>
                <Text style={styles.idleTitle}>Off shift</Text>
                <Text style={styles.idleBody}>No active stop. Your next stop appears here when dispatch assigns a route.</Text>
              </View>
            </View>
          )}

          {mode === 'paused' && (
            <>
              <View style={styles.pausedCard}>
                <Ionicons name="pause" size={18} color={colors.state.warning} />
                <View>
                  <Text style={styles.pausedTitle}>Route paused</Text>
                  <Text style={styles.pausedBody}>Progress preserved — stops won't be marked late.</Text>
                </View>
              </View>
              <Pressable style={({ pressed }) => [styles.resumeBtn, pressed && styles.pressed]} onPress={() => toggleRoutePause()}>
                <Ionicons name="play" size={16} color={colors.text.inverse} />
                <Text style={styles.resumeText}>RESUME ROUTE</Text>
              </Pressable>
            </>
          )}

          {mode === 'active' && currentStop && (
            <>
              <NextStopCard
                stop={currentStop}
                isArrived={isArrived}
                distanceM={distanceM}
                etaMin={etaMin}
                onNavigate={handleNavigate}
                onConfirm={handleConfirm}
                onSkip={() => setSkipOpen(true)}
              />
              <Pressable style={({ pressed }) => [styles.pauseBtn, pressed && styles.pressed]} onPress={() => setPauseModalOpen(true)}>
                <Ionicons name="pause-outline" size={16} color={colors.state.warning} />
                <Text style={styles.pauseText}>PAUSE ROUTE</Text>
              </Pressable>
            </>
          )}

          {sheetState === 'expanded' && mode === 'active' && (
            <View style={styles.expandedSection}>
              <View style={styles.actionGrid}>
                <Pressable style={({ pressed }) => [styles.evidenceBtn, pressed && styles.pressed]} onPress={handleConfirm}>
                  <Ionicons name="camera-outline" size={16} color={colors.primary[700]} />
                  <Text style={styles.evidenceText}>EVIDENCE</Text>
                </Pressable>
                <Pressable style={({ pressed }) => [styles.reportBtn, pressed && styles.pressed]} onPress={() => setReportOpen(true)}>
                  <Ionicons name="flag-outline" size={16} color={colors.state.danger} />
                  <Text style={styles.reportText}>REPORT</Text>
                </Pressable>
              </View>

              <Pressable style={({ pressed }) => [styles.collapseBtn, pressed && styles.pressed]} onPress={() => setSheetState('collapsed')}>
                <Ionicons name="chevron-down" size={18} color={colors.text.tertiary} />
                <Text style={styles.collapseText}>COLLAPSE</Text>
              </Pressable>
            </View>
          )}

          {sheetState === 'expanded' && (
            <Pressable
              style={({ pressed }) => [styles.endShiftBtn, pressed && styles.pressed]}
              onPress={() => setEndShiftOpen(true)}
            >
              <Ionicons name="power-outline" size={16} color={colors.text.inverse} />
              <Text style={styles.endShiftText}>END SHIFT</Text>
            </Pressable>
          )}
        </ScrollView>
      </Animated.View>

      {skipOpen && (
        <View style={styles.modalBackdrop}>
          <BlurView intensity={90} tint="light" style={styles.modalCard}>
            <Text style={styles.modalTitle}>Skip this stop</Text>
            <View style={styles.skipInput}>
              <Ionicons name="document-text-outline" size={20} color={colors.text.tertiary} />
              <TextInput
                style={styles.input}
                placeholder="Reason (e.g. bin not accessible)"
                placeholderTextColor={colors.text.disabled}
                value={skipReason}
                onChangeText={setSkipReason}
                multiline
              />
            </View>
            <View style={styles.modalActions}>
              <Pressable style={styles.modalCancel} onPress={() => { setSkipOpen(false); setSkipReason(''); }}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </Pressable>
              <Pressable style={styles.modalDanger} onPress={handleSkip}>
                <Text style={styles.modalDangerText}>Skip Stop</Text>
              </Pressable>
            </View>
          </BlurView>
        </View>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 72,
    borderTopLeftRadius: radius.extraLarge,
    borderTopRightRadius: radius.extraLarge,
    backgroundColor: colors.surface.containerHigh,
    ...elevation[4],
    maxHeight: SCREEN_HEIGHT * 0.75,
  },
  handleWrap: { alignItems: 'center', paddingVertical: spacing.x12 },
  handle: { width: 44, height: 5, borderRadius: 3, backgroundColor: colors.neutral[40] },
  content: { flex: 1 },
  contentContainer: { paddingHorizontal: spacing.x16, paddingBottom: spacing.x16 },
  idleCard: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.x12,
    backgroundColor: colors.neutral[10], borderRadius: radius.medium,
    padding: spacing.x16, borderWidth: 1, borderColor: colors.neutral[20],
  },
  dot: { width: 10, height: 10, borderRadius: 5 },
  idleTitle: { ...typography.titleSmall, color: colors.text.primary },
  idleBody: { ...typography.bodySmall, color: colors.text.tertiary, marginTop: 2 },
  pausedCard: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.x12,
    backgroundColor: `${colors.state.warning}15`, borderRadius: radius.medium,
    padding: spacing.x16, borderWidth: 1, borderColor: `${colors.state.warning}40`,
  },
  pausedTitle: { ...typography.titleSmall, color: colors.state.warning },
  pausedBody: { ...typography.bodySmall, color: colors.state.warning, marginTop: 2 },
  resumeBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.x6,
    backgroundColor: colors.primary[600], borderRadius: radius.medium,
    paddingVertical: spacing.x14, marginTop: spacing.x12, ...elevation[1],
  },
  resumeText: { ...typography.labelLarge, color: colors.text.inverse },
  pauseBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.x6,
    backgroundColor: `${colors.state.warning}15`, borderRadius: radius.medium,
    paddingVertical: spacing.x12, marginTop: spacing.x12,
    borderWidth: 1, borderColor: `${colors.state.warning}40`,
  },
  pauseText: { ...typography.labelLarge, color: colors.state.warning },
  expandedSection: { marginTop: spacing.x16, paddingTop: spacing.x16, borderTopWidth: 1, borderTopColor: colors.neutral[20] },
  actionGrid: { flexDirection: 'row', gap: spacing.x6 },
  evidenceBtn: {
    flex: 1, flexDirection: 'column', alignItems: 'center', gap: 4,
    backgroundColor: colors.primary[50], borderRadius: radius.medium,
    paddingVertical: spacing.x12, borderWidth: 1, borderColor: `${colors.primary[600]}40`,
  },
  evidenceText: { ...typography.labelSmall, color: colors.primary[700] },
  reportBtn: {
    flex: 1, flexDirection: 'column', alignItems: 'center', gap: 4,
    backgroundColor: `${colors.state.danger}10`, borderRadius: radius.medium,
    paddingVertical: spacing.x12, borderWidth: 1, borderColor: `${colors.state.danger}40`,
  },
  reportText: { ...typography.labelSmall, color: colors.state.danger },
  collapseBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.x8,
    backgroundColor: colors.neutral[10], borderRadius: radius.medium,
    paddingVertical: spacing.x12, marginTop: spacing.x12,
  },
  collapseText: { ...typography.labelLarge, color: colors.text.tertiary },
  endShiftBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.x8,
    backgroundColor: colors.state.danger, borderRadius: radius.medium,
    paddingVertical: spacing.x12, marginTop: spacing.x12, ...elevation[1],
  },
  endShiftText: { ...typography.labelLarge, color: colors.text.inverse },
  pressed: { transform: [{ scale: 0.98 }], opacity: 0.9 },
  modalBackdrop: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'center', padding: spacing.x20,
  },
  modalCard: { borderRadius: radius.large, padding: spacing.x20, backgroundColor: colors.surface.containerHighest, ...elevation[4] },
  modalTitle: { ...typography.titleMedium, color: colors.primary[900], marginBottom: spacing.x12 },
  skipInput: {
    flexDirection: 'row', alignItems: 'flex-start',
    backgroundColor: colors.neutral[10], borderRadius: radius.medium,
    padding: spacing.x12, minHeight: 80, marginBottom: spacing.x16,
  },
  input: { flex: 1, marginLeft: spacing.x8, fontSize: 16, color: colors.text.primary },
  modalActions: { flexDirection: 'row', gap: spacing.x12 },
  modalCancel: { flex: 1, alignItems: 'center', paddingVertical: spacing.x12, backgroundColor: colors.neutral[20], borderRadius: radius.full },
  modalCancelText: { ...typography.labelLarge, color: colors.text.secondary },
  modalDanger: { flex: 1, alignItems: 'center', paddingVertical: spacing.x12, backgroundColor: colors.state.danger, borderRadius: radius.full },
  modalDangerText: { ...typography.labelLarge, color: colors.text.inverse },
});