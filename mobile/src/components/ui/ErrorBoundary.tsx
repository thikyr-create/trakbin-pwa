import { Component, ReactNode } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { TriangleAlert, RotateCw } from 'lucide-react-native';
import { colors } from '../../theme/colors';
import { radius, sp } from '../../theme/spacing';
import { text } from '../../theme/typography';

interface Props { children: ReactNode; }
interface State { error: Error | null; }

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };
  static getDerivedStateFromError(error: Error): State { return { error }; }
  componentDidCatch(error: Error, info: any) { console.warn('[ErrorBoundary]', error?.message, info?.componentStack); }

  render() {
    if (this.state.error) {
      return (
        <View style={styles.wrap}>
          <View style={styles.icon}><TriangleAlert size={26} color={colors.state.warning} /></View>
          <Text style={styles.title}>Something went wrong</Text>
          <Text style={styles.body} numberOfLines={3}>{this.state.error.message}</Text>
          <Pressable style={styles.retry} onPress={() => this.setState({ error: null })} accessibilityRole="button">
            <RotateCw size={16} color={colors.text.inverse} />
            <Text style={styles.retryLabel}>Try again</Text>
          </Pressable>
        </View>
      );
    }
    return this.props.children;
  }
}

const styles = StyleSheet.create({
  wrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: sp.x6, gap: sp.x3 },
  icon: { width: 56, height: 56, borderRadius: 28, backgroundColor: 'rgba(251,191,36,0.15)', alignItems: 'center', justifyContent: 'center' },
  title: { ...text.titleM, color: colors.text.primary },
  body: { ...text.bodyS, color: colors.text.muted, textAlign: 'center' },
  retry: { flexDirection: 'row', alignItems: 'center', gap: sp.x2, backgroundColor: colors.brand[600], borderRadius: radius.lg, paddingHorizontal: sp.x5, paddingVertical: sp.x3 },
  retryLabel: { ...text.semibold, fontSize: 13, color: colors.text.inverse },
});