import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useConsoleStore } from '../../store/ui';
import { CONSOLE_TABS } from '../../constants/console';
import { colors, typography, spacing, radius } from '../../theme/design';

export function BottomTabBar() {
  const activeTab = useConsoleStore((s) => s.activeTab);
  const setActiveTab = useConsoleStore((s) => s.setActiveTab);

  return (
    <View style={styles.bar}>
      {CONSOLE_TABS.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <Pressable
            key={tab.id}
            onPress={() => setActiveTab(tab.id)}
            style={({ pressed }) => [
              styles.tab,
              pressed && styles.pressed,
              isActive && styles.tabActive,
            ]}
          >
            <Ionicons
              name={tab.icon}
              size={20}
              color={isActive ? colors.primary[600] : colors.text.tertiary}
            />
            <Text style={[styles.label, isActive && styles.labelActive]}>{tab.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 72,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: spacing.x8,
    paddingVertical: spacing.x8,
    backgroundColor: colors.surface.containerHighest,
    borderTopWidth: 1,
    borderTopColor: colors.neutral[20],
  },
  tab: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.x4,
    paddingHorizontal: spacing.x16,
    paddingVertical: spacing.x8,
    borderRadius: radius.medium,
  },
  tabActive: {
    backgroundColor: colors.primary[50],
  },
  pressed: {
    opacity: 0.8,
  },
  label: {
    ...typography.labelSmall,
    color: colors.text.tertiary,
  },
  labelActive: {
    color: colors.primary[600],
  },
});