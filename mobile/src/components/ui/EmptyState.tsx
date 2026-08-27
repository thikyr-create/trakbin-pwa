// EmptyState.tsx
import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../../theme/colors';
import { sp } from '../../theme/spacing';
import { text } from '../../theme/typography';

export function EmptyState({ icon, title, body }: { icon: ReactNode; title: string; body?: string }) {
  return (
    <View style={styles.wrap}>
      <View style={styles.icon}>{icon}</View>
      <Text style={styles.title}>{title}</Text>
      {body ? <Text style={styles.body}>{body}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', paddingVertical: sp.x12, paddingHorizontal: sp.x6 },
  icon: { marginBottom: sp.x3 },
  title: { ...text.titleS, color: colors.text.primary, textAlign: 'center' },
  body: { ...text.bodyM, color: colors.text.muted, textAlign: 'center', marginTop: sp.x1 },
});