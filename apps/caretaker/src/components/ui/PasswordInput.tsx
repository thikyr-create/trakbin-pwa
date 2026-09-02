import { useState } from 'react';
import { View, TextInput, Pressable, StyleSheet } from 'react-native';
import { Eye, EyeOff } from 'lucide-react-native';
import { colors } from '../../theme/colors';
import { radius, sp, touch } from '../../theme/spacing';
import { text } from '../../theme/typography';

interface PasswordInputProps {
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  secureTextEntry?: boolean;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  style?: any;
}

export function PasswordInput({
  value,
  onChangeText,
  placeholder = 'Password',
  autoCapitalize = 'none',
  style,
}: PasswordInputProps) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <View style={[styles.container, style]}>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.text.muted}
        secureTextEntry={!showPassword}
        autoCapitalize={autoCapitalize}
      />
      <Pressable
        style={styles.toggle}
        onPress={() => setShowPassword(!showPassword)}
        hitSlop={8}
      >
        {showPassword ? (
          <EyeOff size={18} color={colors.text.muted} />
        ) : (
          <Eye size={18} color={colors.text.muted} />
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.material.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.material.border,
    paddingHorizontal: sp.x4,
    marginBottom: sp.x3,
  },
  input: {
    flex: 1,
    height: touch.field,
    ...text.bodyM,
    color: colors.text.primary,
  },
  toggle: {
    padding: sp.x2,
  },
});