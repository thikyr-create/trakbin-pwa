import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { OfflineCard } from '../components/more/OfflineCard';
import { AccountCard } from '../components/more/AccountCard';
import { colors, typography, spacing } from '../theme/design';

export function MoreScreen() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>More</Text>
        <Text style={styles.subtitle}>Tools, connectivity & account</Text>
      </View>

      <View style={styles.cards}>
        <OfflineCard />
        
        <AccountCard />
      </View>

      <Text style={styles.footer}>Trakbin Driver Console</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.primary[50],
  },
  content: {
    paddingTop: 110,
    paddingHorizontal: spacing.x16,
    paddingBottom: 100,
  },
  header: {
    marginBottom: spacing.x16,
  },
  title: {
    ...typography.titleLarge,
    color: colors.primary[900],
  },
  subtitle: {
    ...typography.bodySmall,
    color: colors.text.secondary,
    marginTop: 2,
  },
  cards: {
    gap: spacing.x12,
  },
  footer: {
    ...typography.labelSmall,
    color: colors.neutral[40],
    textAlign: 'center',
    paddingTop: spacing.x8,
  },
});