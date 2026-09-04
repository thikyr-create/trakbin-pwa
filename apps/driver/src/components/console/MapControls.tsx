import { View, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSessionStore } from '../../store/session';
import { colors, spacing, radius, elevation } from '../../theme/design';

interface MapControlsProps {
  mapRef: any; // MapView ref from react-native-maps
  satellite: boolean;
  onToggleStyle: () => void;
}

export function MapControls({ mapRef, satellite, onToggleStyle }: MapControlsProps) {
  const gpsLocation = useSessionStore((s) => s.gpsLocation);

  const recenter = () => {
    if (!gpsLocation || !mapRef.current) return;
    mapRef.current.animateToRegion(
      {
        latitude: gpsLocation.latitude,
        longitude: gpsLocation.longitude,
        latitudeDelta: 0.003,
        longitudeDelta: 0.003,
      },
      900
    );
  };

  return (
    <View style={styles.controls}>
      <Pressable
        style={styles.controlBtn}
        onPress={recenter}
        accessibilityRole="button"
        accessibilityLabel="Re-center on my location"
      >
        <Ionicons name="locate" size={22} color={colors.primary[700]} />
      </Pressable>
      <Pressable
        style={styles.controlBtn}
        onPress={onToggleStyle}
        accessibilityRole="button"
        accessibilityLabel="Switch map style"
      >
        <Ionicons name="layers-outline" size={22} color={colors.text.secondary} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  controls: {
    position: 'absolute',
    right: spacing.x16,
    top: '42%',
    gap: spacing.x12,
  },
  controlBtn: {
    width: 48,
    height: 48,
    borderRadius: radius.medium,
    backgroundColor: colors.surface.containerHighest,
    alignItems: 'center',
    justifyContent: 'center',
    ...elevation[2],
  },
});