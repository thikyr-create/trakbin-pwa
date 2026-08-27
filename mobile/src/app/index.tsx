import { useEffect } from 'react';
import { Redirect } from 'expo-router';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import { useAuthStore } from '../store/authStore';
import { colors } from '../theme/colors';

export default function Index() {
  const status = useAuthStore((s) => s.status);
  const role = useAuthStore((s) => s.role);
  const initialize = useAuthStore((s) => s.initialize);

  useEffect(() => {
    initialize();
  }, []);

  if (status === 'loading') {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.brand[600]} />
      </View>
    );
  }

  if (status === 'signedOut') {
    return <Redirect href="/(auth)/login" />;
  }

  if (role === 'driver') {
    return <Redirect href="/driver" />;
  }

  if (role === 'caretaker') {
    return <Redirect href="/customer" />;
  }

  return null;
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});