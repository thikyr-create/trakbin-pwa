import type { ReactNode } from 'react';
import { View, ScrollView, StyleSheet, KeyboardAvoidingView, Platform, StatusBar } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../theme/colors';
import { gutter, sp } from '../../theme/spacing';

interface ScreenProps {
  children: ReactNode;
  scroll?: boolean;
  padded?: boolean;
  keyboard?: boolean;
  style?: any;
}

/**
 * Single layout primitive for stack screens.
 * Apple Safe-Area contract: background edge-to-edge, content inside safe area.
 * Android fallback via StatusBar.currentHeight so it can never read 0.
 */
export function Screen({ children, scroll = false, padded = true, keyboard = false, style }: ScreenProps) {
  const insets = useSafeAreaInsets();
  const topSafe = insets.top > 0
    ? insets.top
    : Platform.OS === 'android'
      ? (StatusBar.currentHeight ?? 24)
      : 0;
  const bottomSafe = insets.bottom;

  const framed = (
    <View style={[styles.fill, { paddingTop: topSafe, paddingBottom: bottomSafe }]}>
      {scroll ? (
        <ScrollView
          style={styles.fill}
          contentContainerStyle={[padded && styles.padded, { paddingBottom: sp.x16 }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {children}
        </ScrollView>
      ) : (
        <View style={[styles.fill, padded && styles.padded, style]}>{children}</View>
      )}
    </View>
  );

  if (keyboard) {
    return (
      <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {framed}
      </KeyboardAvoidingView>
    );
  }

  return <View style={styles.root}>{framed}</View>;
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  fill: { flex: 1 },
  padded: { paddingHorizontal: gutter },
});