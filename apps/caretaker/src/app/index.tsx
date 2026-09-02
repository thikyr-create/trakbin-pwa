import { useEffect, useState } from 'react';
import { Redirect } from 'expo-router';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import { supabase } from '../services/supabase';
import { colors } from '../theme/colors';

export default function RootGate() {
  const [checked, setChecked] = useState(false);
  const [hasSession, setHasSession] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setHasSession(!!session);
      setChecked(true);
    })();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setHasSession(!!session);
    });
    return () => subscription.unsubscribe();
  }, []);

  if (!checked) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.brand[500]} />
      </View>
    );
  }

  return <Redirect href={hasSession ? '/customer/(tabs)' : '/auth'} />;
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg },
});