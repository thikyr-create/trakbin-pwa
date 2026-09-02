import { Tabs } from 'expo-router';
import { Activity, ListOrdered, Map as MapIcon, MoreHorizontal, TrendingUp } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../theme/colors';
import { sp } from '../../theme/spacing';

export default function DriverLayout() {
  const insets = useSafeAreaInsets();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.brand[700],
        tabBarInactiveTintColor: colors.text.muted,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopWidth: 1,
          borderTopColor: colors.border.subtle,
          height: 64 + insets.bottom,
          paddingTop: sp.x2,
          paddingBottom: insets.bottom,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontFamily: 'PlusJakartaSans_700Bold',
          letterSpacing: 0.6,
          textTransform: 'uppercase',
        },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Map', tabBarIcon: ({ color }) => <MapIcon size={22} color={color} /> }} />
      <Tabs.Screen name="stops" options={{ title: 'Stops', tabBarIcon: ({ color }) => <ListOrdered size={22} color={color} /> }} />
      <Tabs.Screen name="progress" options={{ title: 'Progress', tabBarIcon: ({ color }) => <TrendingUp size={22} color={color} /> }} />
      <Tabs.Screen name="activity" options={{ title: 'Activity', tabBarIcon: ({ color }) => <Activity size={22} color={color} /> }} />
      <Tabs.Screen name="more" options={{ title: 'More', tabBarIcon: ({ color }) => <MoreHorizontal size={22} color={color} /> }} />
    </Tabs>
  );
}