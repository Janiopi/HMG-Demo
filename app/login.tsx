import { Button, Input } from '@/src/components/ui';
import { useAuthStore } from '@/src/stores/auth.store';
import { COLORS, FONT_SIZES, SPACING } from '@/src/utils/constants';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

export default function LoginScreen() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{
    username?: string;
    password?: string;
  }>({});

  const { login, isLoading } = useAuthStore();

  const validate = (): boolean => {
    const newErrors: { username?: string; password?: string } = {};

    if (!username.trim()) {
      newErrors.username = 'El usuario es requerido';
    } else if (username.trim().length < 3) {
      newErrors.username = 'El usuario debe tener al menos 3 caracteres';
    }

    if (!password) {
      newErrors.password = 'La contraseña es requerida';
    } else if (password.length < 4) {
      newErrors.password = 'La contraseña debe tener al menos 4 caracteres';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    if (!validate()) {
      return;
    }

    const success = await login(username.trim(), password);

    if (success) {
      router.replace('/(auth)');
    } else {
      Alert.alert(
        'Error de autenticación',
        'Usuario o contraseña incorrectos',
        [{ text: 'OK' }],
      );
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Text style={styles.title}>HMG Demo</Text>
          <Text style={styles.subtitle}>Inicia sesión para continuar</Text>
        </View>

        <View style={styles.form}>
          <Input
            label="Usuario"
            placeholder="Ingresa tu usuario"
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
            autoCorrect={false}
            error={errors.username}
          />

          <Input
            label="Contraseña"
            placeholder="Ingresa tu contraseña"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            error={errors.password}
          />

          <Button
            title="Iniciar Sesión"
            onPress={handleLogin}
            loading={isLoading}
            style={styles.button}
          />

          <Text style={styles.subtitle}>
            ¿No tienes cuenta? Registrate{' '}
            <Text
              style={styles.link}
              onPress={() => {
                router.push('/register');
              }}
            >
              aquí
            </Text>
          </Text>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Credenciales demo: admin / admin123
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: SPACING.lg,
  },
  header: {
    alignItems: 'center',
    marginBottom: SPACING.xxl,
  },
  title: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: SPACING.sm,
  },
  subtitle: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
  },
  form: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: SPACING.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  button: {
    marginTop: SPACING.md,
  },
  footer: {
    marginTop: SPACING.xl,
    alignItems: 'center',
  },
  footerText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textLight,
  },
  link: {
    color: COLORS.primary,
    textDecorationLine: 'underline',
  },
});
