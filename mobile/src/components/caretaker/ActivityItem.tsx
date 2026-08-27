import { Text, View, StyleSheet } from 'react-native';
import { CheckCircle2, ReceiptText } from 'lucide-react-native';
import { colors } from '../../theme/colors';
import { radius, sp } from '../../theme/spacing';
import { text } from '../../theme/typography';

interface Props {
  kind: 'collection' | 'invoice';
  title: string;
  subtitle: string;
}

export function ActivityItem({ kind, title, subtitle }: Props) {
  const isCol = kind === 'collection';
  return (
    <View style={styles.row}>
      <View style={[styles.icon, { backgroundColor: isCol ? colors.card.navy : colors.surfaceMuted }]}>
        {isCol
          ? <CheckCircle2 size={17} color={colors.brand[400]} />
          : <ReceiptText size={17} color={colors.brand[300]} />}
      </View>
      <View style={styles.main}>
        <Text style={styles.title} numberOfLines={1}>{title}</Text>
        <Text style={styles.sub} numberOfLines={1}>{subtitle}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: sp.x3, paddingVertical: sp.x3 },
  icon: {
    width: 38,
    height: 38,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  main: { flex: 1 },
  title: { ...text.semibold, color: colors.text.primary },
  sub: { ...text.bodyS, color: colors.text.muted, marginTop: 1 },
});