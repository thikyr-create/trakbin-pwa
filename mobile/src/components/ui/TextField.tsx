import { useState, type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, TextInput, type TextInputProps, View } from 'react-native';
import { Eye, EyeOff } from 'lucide-react-native';
import { colors } from '../../theme/colors';
import { radius, sp, touch } from '../../theme/spacing';
import { text } from '../../theme/typography';

interface Props extends TextInputProps {
  label: string;
  icon?: ReactNode;
  error?: string | null;
  secure?: boolean;
  mono?: boolean;
}

export function TextField({ label, icon, error, secure, mono, onFocus, onBlur, style, ...rest }: Props) {
  const [focused, setFocused] = useState(false);
  const [hidden, setHidden] = useState(!!secure);
  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>
      <View style={[styles.box, focused && styles.boxFocused, !!error && styles.boxError]}>
        {icon ? <View style={styles.icon}>{icon}</View> : null}
        <TextInput
          placeholderTextColor={colors.text.muted}
          style={[styles.input, mono && styles.mono, style]}
          secureTextEntry={hidden}
          onFocus={(e) => { setFocused(true); onFocus?.(e); }}
          onBlur={(e) => { setFocused(false); onBlur?.(e); }}
          {...rest}
        />
        {secure ? (
          <Pressable onPress={() => setHidden((v) => !v)} style={styles.eye} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }} accessibilityRole="button" accessibilityLabel={hidden ? 'Show password' : 'Hide password'}>
            {hidden ? <EyeOff size={20} color={colors.text.muted} /> : <Eye size={20} color={colors.text.muted} />}
          </Pressable>
        ) : null}
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: sp.x4 },
  label: { ...text.label, color: colors.text.secondary, marginBottom: sp.x15 },
  box: {
    minHeight: touch.field, flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.surface, borderWidth: 1.5, borderColor: colors.border.subtle,
    borderRadius: radius.md, paddingHorizontal: sp.x4,
  },
  boxFocused: { borderColor: colors.brand[600] },
  boxError: { borderColor: colors.state.danger },
  icon: { marginRight: sp.x25 ?? 10 },
  input: { flex: 1, ...text.bodyL, color: colors.text.primary, paddingVertical: sp.x3 },
  mono: { ...text.monoBold, letterSpacing: 1 },
  eye: { paddingLeft: sp.x2 },
  error: { ...text.bodyS, color: colors.state.danger, marginTop: sp.x15 },
});