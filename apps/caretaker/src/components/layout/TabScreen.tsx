import type { ReactNode } from 'react';
import { View, ScrollView, StyleSheet, Platform, StatusBar } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { gutter, sp } from '../../theme/spacing';
import { colors } from '../../theme/colors';

interface Props {
  children: ReactNode;
  scroll?: boolean;
  padded?: boolean;
}

/**
 * Global wrapper for tab screens — consistent top padding, gutter, safe area.
 */
export function TabScreen({ children, scroll = true, padded = true }: Props) {
  const insets = useSafeAreaInsets();
  const topSafe = insets.top > 0
    ? insets.top
    : Platform.OS === 'android'
      ? (StatusBar.currentHeight ?? 24)
      : 0;
  const topPad = topSafe + sp.x6;

  if (scroll) {
    return (
      <ScrollView
        style={[styles.root, { paddingTop: topPad }]}
        contentContainerStyle={[styles.scroll, padded && styles.padded]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {children}
      </ScrollView>
    );
  }

  return <View style={[styles.root, { paddingTop: topPad }, padded && styles.padded]}>{children}</View>;
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  scroll: { paddingBottom: sp.x16 },
  padded: { paddingHorizontal: gutter },
});