import { useMemo, useRef } from 'react';
import { View, Text, Pressable, Modal, ScrollView, Share, StyleSheet } from 'react-native';
import { captureRef } from 'react-native-view-shot';
import { Ionicons } from '@expo/vector-icons';
import { useConsoleStore } from '../../store/ui';
import { collectSnapshot } from '../../services/diagnostics';
import { useLayout } from '../../theme/layout';
import { colors, typography, spacing, radius, elevation } from '../../theme/design';

export function DiagnosticsOverlay({ rootRef }: { rootRef: React.RefObject<View | null> }) {
  const L = useLayout();
  const diagOpen = useConsoleStore((s) => s.diagOpen);
  const setDiagOpen = useConsoleStore((s) => s.setDiagOpen);

  const snap = useMemo(() => (diagOpen ? collectSnapshot() : null), [diagOpen]);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    if (diagOpen) snap?.then(setData);
  }, [diagOpen, snap]);

  const shareText = async () => {
    if (!data) return;
    await Share.share({ message: JSON.stringify(data, null, 2), title: 'Trakbin diagnostics' });
  };

  const captureScreen = async () => {
    try {
      const uri = await captureRef(rootRef.current, {
        format: 'png',
        result: 'tmpfile',
        quality: 1,
      });
      await Share.share({ url: uri, title: 'Trakbin screenshot' });
    } catch (e: any) {
      console.warn('[diag] capture failed:', e?.message);
    }
  };

  return (
    <Modal visible={diagOpen} transparent animationType="fade">
      <View style={[styles.backdrop, { paddingTop: L.insets.top + 16, paddingBottom: L.insets.bottom + 16 }]}>
        <View style={styles.card}>
          <View style={styles.header}>
            <Text style={styles.title}>Diagnostics</Text>
            <Pressable onPress={() => setDiagOpen(false)} style={styles.closeBtn}>
              <Ionicons name="close" size={20} color={colors.text.secondary} />
            </Pressable>
          </View>

          <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
            <Text style={styles.json}>{data ? JSON.stringify(data, null, 2) : 'Collecting…'}</Text>
          </ScrollView>

          <View style={styles.actions}>
            <Pressable style={[styles.btn, styles.btnShare]} onPress={shareText}>
              <Ionicons name="share-outline" size={14} color={colors.text.inverse} />
              <Text style={styles.btnText}>SHARE TEXT</Text>
            </Pressable>
            <Pressable style={[styles.btn, styles.btnShot]} onPress={captureScreen}>
              <Ionicons name="camera-outline" size={14} color={colors.primary[700]} />
              <Text style={[styles.btnText, styles.btnShotText]}>CAPTURE SCREEN</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

import { useEffect, useState } from 'react';

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: spacing.x20,
  },
  card: {
    backgroundColor: colors.surface.containerHighest,
    borderRadius: radius.large,
    maxHeight: '80%',
    ...elevation[4],
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.x16,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[20],
  },
  title: { ...typography.titleMedium, color: colors.primary[900] },
  closeBtn: { padding: spacing.x4 },
  body: { paddingHorizontal: spacing.x16, paddingVertical: spacing.x12, maxHeight: 380 },
  json: { fontFamily: 'monospace', fontSize: 11, color: colors.text.primary, lineHeight: 17 },
  actions: { flexDirection: 'row', gap: spacing.x8, padding: spacing.x16 },
  btn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    borderRadius: radius.medium,
    paddingVertical: spacing.x10,
  },
  btnShare: { backgroundColor: colors.primary[600] },
  btnShot: { backgroundColor: colors.primary[50], borderWidth: 1, borderColor: `${colors.primary[600]}40` },
  btnText: { ...typography.labelSmall, color: colors.text.inverse },
  btnShotText: { color: colors.primary[700] },
});