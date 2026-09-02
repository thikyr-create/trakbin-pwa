import type { ReactNode } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, type StyleProp, type ViewStyle } from 'react-native';
import { colors } from '../../theme/colors';
import { radius, sp, touch } from '../../theme/spacing';
import { text } from '../../theme/typography';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';

interface Props {
  label: string;
  onPress: () => void;
  variant?: Variant;
  loading?: boolean;
  disabled?: boolean;
  icon?: ReactNode;
  style?: StyleProp<ViewStyle>;
}

export function Button({ label, onPress, variant = 'primary', loading, disabled, icon, style }: Props) {
  const fg = variant === 'primary' || variant === 'danger' ? colors.text.inverse : colors.brand[700];
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [
        styles.base,
        styles[variant],
        pressed && styles.pressed,
        (disabled || loading) && styles.disabled,
        style,
      ]}
    >
      {loading ? <ActivityIndicator color={fg} /> : (
        <>
          {icon}
          <Text style={[text.button, { color: fg, marginLeft: icon ? sp.x2 : 0 }]}>{label}</Text>
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    height: touch.cta, borderRadius: radius.lg, flexDirection: 'row',
    alignItems: 'center', justifyContent: 'center', paddingHorizontal: sp.x5,
  },
  primary: { backgroundColor: colors.brand[600], shadowColor: colors.brand[900], shadowOpacity: 0.25, shadowRadius: 12, shadowOffset: { width: 0, height: 6 }, elevation: 4 },
  secondary: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border.strong },
  ghost: { backgroundColor: 'transparent' },
  danger: { backgroundColor: colors.state.danger },
  pressed: { opacity: 0.85, transform: [{ scale: 0.985 }] },
  disabled: { opacity: 0.5 },
});