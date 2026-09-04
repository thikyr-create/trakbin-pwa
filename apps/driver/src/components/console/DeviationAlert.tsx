import { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { deviationEvents } from '../../services/events';
import { colors, typography, spacing, radius, elevation } from '../../theme/design';

export function DeviationAlert() {
  const [distance, setDistance] = useState<number | null>(null);

  useEffect(() => {
    const off = deviationEvents.on((d) => {
      setDistance(d.distanceM);
      setTimeout(() => setDistance(null), 5000);
    });
    return () => { off(); };
  }, []);

  if (distance == null) return null;

  return (
    <View style={styles.alert}>
      <Ionicons name="alert-circle" size={20} color={colors.text.inverse} />
      <Text style={styles.text}>Off route by {distance} m — return to planned route</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  alert: {
    position: 'absolute',
    top: 96,
    left: spacing.x16,
    right: spacing.x16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.x8,
    backgroundColor: colors.state.warning,
    borderRadius: radius.medium,
    padding: spacing.x12,
    ...elevation[3],
  },
  text: {
    ...typography.labelLarge,
    color: colors.text.inverse,
    flex: 1,
  },
});