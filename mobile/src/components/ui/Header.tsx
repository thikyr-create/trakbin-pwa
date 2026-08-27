import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ChevronLeft } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { colors } from '../../theme/colors';
import { gutter, sp, touch } from '../../theme/spacing';
import { text } from '../../theme/typography';

interface Props { title: string; subtitle?: string; right?: ReactNode; onBack?: () => void; }

export function Header({ title, subtitle, right, onBack }: Props) {
  const router = useRouter();
  return (
    <View style={styles.row}>
      <Pressable onPress={onBack ?? (() => router.back())} style={styles.back} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }} accessibilityRole="button" accessibilityLabel="Back">
        <ChevronLeft size={26} color={colors.text.primary} />
      </Pressable>
      <View style={styles.titles}>
        <Text style={styles.title} numberOfLines={1}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle} numberOfLines={1}>{subtitle}</Text> : null}
      </View>
      <View style={styles.right}>{right}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: gutter, paddingVertical: sp.x3, gap: sp.x2 },
  back: { width: touch.min, height: touch.min, alignItems: 'center', justifyContent: 'center', marginLeft: -sp.x2 },
  titles: { flex: 1 },
  title: { ...text.titleM, color: colors.text.primary },
  subtitle: { ...text.bodyS, color: colors.text.muted },
  right: { flexDirection: 'row', gap: sp.x2 },
});