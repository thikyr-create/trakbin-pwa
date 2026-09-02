import { Tabs } from 'expo-router';
import { Home, History, Building2, CreditCard, Headset } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Platform, StatusBar } from 'react-native';
import { colors } from '../../../theme/colors';
import { sp } from '../../../theme/spacing';

export default function CaretakerTabsLayout() {
  const insets = useSafeAreaInsets();
  const bottom = insets.bottom > 0 ? insets.bottom : Platform.OS === 'android' ? 8 : 0;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,           // icons only
        tabBarActiveTintColor: colors.brand[400],
        tabBarInactiveTintColor: colors.text.muted,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopWidth: 1,
          borderTopColor: colors.border.subtle,
          height: 56 + bottom,
          paddingTop: sp.x2,
          paddingBottom: bottom,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <Home size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="records"
        options={{
          title: 'History',
          tabBarIcon: ({ color }) => <History size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="statement"
        options={{
          title: 'Billing',
          tabBarIcon: ({ color }) => <CreditCard size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="service"
        options={{
          title: 'Service',
          tabBarIcon: ({ color }) => <Headset size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="building"
        options={{
          title: 'Building',
          tabBarIcon: ({ color }) => <Building2 size={22} color={color} />,
        }}
      />
    </Tabs>
  );
}