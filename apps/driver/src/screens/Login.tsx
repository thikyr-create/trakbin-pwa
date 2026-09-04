import { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { driverLogin } from '../services/auth';
import { useSessionStore } from '../store/session';
import { colors, typography, spacing, elevation, radius } from '../theme/design';

export default function Login() {
  const [employeeId, setEmployeeId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!employeeId.trim() || !password) {
      setError('Please enter Employee ID and password');
      return;
    }
    setError('');
    setLoading(true);
    const result = await driverLogin(employeeId.trim(), password);
    setLoading(false);
    if (result.ok) {
      useSessionStore.getState().initializeSession();
      // Auth state change in index.tsx will trigger re-render with Console
    } else {
      setError(result.message || 'Login failed');
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.background} />
      
      <BlurView intensity={80} tint="light" style={styles.card}>
        <View style={styles.iconContainer}>
          <Ionicons name="leaf" size={48} color={colors.primary[600]} />
        </View>
        
        <Text style={styles.title}>Trakbin Driver</Text>
        <Text style={styles.subtitle}>Sign in to start your shift</Text>

        <View style={styles.inputContainer}>
          <Ionicons name="person-outline" size={20} color={colors.text.tertiary} style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Employee ID"
            placeholderTextColor={colors.text.disabled}
            value={employeeId}
            onChangeText={setEmployeeId}
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>

        <View style={styles.inputContainer}>
          <Ionicons name="lock-closed-outline" size={20} color={colors.text.tertiary} style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor={colors.text.disabled}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoCapitalize="none"
          />
        </View>

        {error ? (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle" size={16} color={colors.state.danger} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        <Pressable
          style={({ pressed }) => [
            styles.button,
            pressed && styles.buttonPressed,
            loading && styles.buttonDisabled,
          ]}
          onPress={handleLogin}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={colors.text.inverse} />
          ) : (
            <>
              <Text style={styles.buttonText}>Sign In</Text>
              <Ionicons name="arrow-forward" size={20} color={colors.text.inverse} style={styles.buttonIcon} />
            </>
          )}
        </Pressable>
      </BlurView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.primary[50],
    justifyContent: 'center',
    padding: spacing.x20,
  },
  background: {
    ...StyleSheet.absoluteFill,
    backgroundColor: `linear-gradient(135deg, ${colors.primary[100]} 0%, ${colors.primary[50]} 100%)`,
  },
  card: {
    borderRadius: radius.large,
    padding: spacing.x32,
    overflow: 'hidden',
    backgroundColor: colors.surface.containerHigh,
    ...elevation[3],
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: radius.full,
    backgroundColor: colors.primary[100],
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: spacing.x24,
  },
  title: {
    ...typography.headlineLarge,
    color: colors.primary[900],
    textAlign: 'center',
    marginBottom: spacing.x8,
  },
  subtitle: {
    ...typography.bodyMedium,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: spacing.x32,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface.container,
    borderRadius: radius.medium,
    borderWidth: 1.5,
    borderColor: colors.neutral[30],
    marginBottom: spacing.x16,
    paddingLeft: spacing.x16,
  },
  inputIcon: {
    marginRight: spacing.x12,
  },
  input: {
    flex: 1,
    height: 56,
    fontSize: 16,
    color: colors.text.primary,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${colors.state.danger}10`,
    borderRadius: radius.small,
    padding: spacing.x12,
    marginBottom: spacing.x16,
  },
  errorText: {
    ...typography.bodySmall,
    color: colors.state.danger,
    marginLeft: spacing.x8,
    flex: 1,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary[600],
    borderRadius: radius.full,
    height: 56,
    marginTop: spacing.x8,
    ...elevation[2],
  },
  buttonPressed: {
    backgroundColor: colors.primary[700],
    transform: [{ scale: 0.98 }],
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    ...typography.labelLarge,
    color: colors.text.inverse,
    marginRight: spacing.x8,
  },
  buttonIcon: {
    marginLeft: spacing.x4,
  },
});