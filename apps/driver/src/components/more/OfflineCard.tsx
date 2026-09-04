import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useOfflineStatus } from '../../hooks/useOfflineStatus';
import { colors, typography, spacing, radius, elevation } from '../../theme/design';

export function OfflineCard() {
  const { online, queued } = useOfflineStatus();

  return (
    <View style={[styles.card, online ? styles.cardOnline : styles.cardOffline]}>
      <View style={styles.row}>
        <View style={[styles.iconWrap, online ? styles.iconOnline : styles.iconOffline]}>
          <Ionicons
            name={online ? 'cloud-outline' : 'cloud-offline-outline'}
            size={20}
            color={online ? colors.state.success : colors.state.warning}
          />
        </View>
        <View style={styles.text}>
          <Text style={styles.title}>{online ? 'Online' : 'Offline mode'}</Text>
          <Text style={styles.body}>
            {online
              ? 'Connected — activity syncs in real time.'
              : "You're offline. Data is stored on this device and will sync automatically when you're back online."}
          </Text>
        </View>
        {!online && queued > 0 && (
          <View style={styles.queuedBadge}>
            <Text style={styles.queuedText}>{queued} queued</Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.large,
    padding: spacing.x16,
    ...elevation[1],
  },
  cardOnline: {
    backgroundColor: colors.surface.container,
    borderWidth: 1,
    borderColor: colors.neutral[20],
  },
  cardOffline: {
    backgroundColor: `${colors.state.warning}10`,
    borderWidth: 1,
    borderColor: `${colors.state.warning}40`,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.x12,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: radius.medium,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconOnline: {
    backgroundColor: `${colors.state.success}15`,
  },
  iconOffline: {
    backgroundColor: `${colors.state.warning}30`,
  },
  text: {
    flex: 1,
  },
  title: {
    ...typography.titleSmall,
    color: colors.primary[900],
  },
  body: {
    ...typography.bodySmall,
    color: colors.text.secondary,
    marginTop: 2,
  },
  queuedBadge: {
    paddingHorizontal: spacing.x10,
    paddingVertical: spacing.x4,
    borderRadius: radius.medium,
    backgroundColor: `${colors.state.warning}40`,
  },
  queuedText: {
    ...typography.labelSmall,
    color: colors.state.warning,
  },
});