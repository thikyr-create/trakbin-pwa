import { StyleSheet, Text, View } from 'react-native';

export default function Index() {
  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>Trakbin Driver</Text>
      <Text style={styles.sub}>Shell online — Phase 2 complete</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: '#F5F0E6', alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 24, fontWeight: '700', color: '#064e3b' },
  sub: { marginTop: 8, color: '#10b981' },
});