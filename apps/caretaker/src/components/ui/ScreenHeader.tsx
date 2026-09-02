import type { ReactNode } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../../theme/colors';
import { sp } from '../../theme/spacing';
import { text } from '../../theme/typography';

interface Props {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  right?: ReactNode;
}

export function ScreenHeader({ eyebrow, title, subtitle, right }: Props) {
  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        <View style={styles.titles}>
          {eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}
          <Text style={styles.title}>{title}</Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        </View>
        {right}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingTop: sp.x2, marginBottom: sp.x5 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  titles: { flex: 1 },
  eyebrow: { ...text.label, color: colors.brand[700], marginBottom: sp.x1 },
  title: { ...text.titleL, color: colors.text.primary },
  subtitle: { ...text.bodyS, color: colors.text.muted, marginTop: 2 },
});