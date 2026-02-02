import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { Button, Input } from '@/src/components/ui';
import { useAuthStore } from '@/src/stores/auth.store';
import { COLORS, SPACING, FONT_SIZES } from '@/src/utils/constants';

export default function RegisterScreen() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<{
    username?: string;
    password?: string;
    confirmPassword?: string;
  }>({});

  const { register, isLoading } = useAuthStore();

  const validate = (): boolean => {
    const newErrors: {
      username?: string;
      password?: string;
      confirmPassword?: string;
    } = {};

    // Validate username
    if (!username.trim()) {
      newErrors.username = 'El usuario es requerido';
    } else if (username.trim().length < 3) {
      newErrors.username = 'El usuario debe tener al menos 3 caracteres';
    } else if (username.trim().length > 50) {
      newErrors.username = 'El usuario no puede exceder 50 caracteres';
    } else if (!/^[a-zA-Z0-9_]+$/.test(username.trim())) {
      newErrors.username = 'Solo se permiten letras, números y guion bajo';
    }

    // Validate password
    if (!password) {
      newErrors.password = 'La contraseña es requerida';
    } else if (password.length < 4) {
      newErrors.password = 'La contraseña debe tener al menos 4 caracteres';
    } else if (password.length > 100) {
      newErrors.password = 'La contraseña no puede exceder 100 caracteres';
    }

    // Validate confirm password
    if (!confirmPassword) {
      newErrors.confirmPassword = 'Confirma tu contraseña';
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Las contraseñas no coinciden';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async () => {
    if (!validate()) {
      return;
    }

    const success = await register(username.trim(), password);

    if (success) {
      Alert.alert(
        'Registro Exitoso',
        `Bienvenido, ${username.trim()}!`,
        [
          {
            text: 'Continuar',
            onPress: () => router.replace('/(auth)'),
          },
        ]
      );
    } else {
      Alert.alert(
        'Error de Registro',
        'El nombre de usuario ya está en uso. Por favor, elige otro.',
        [{ text: 'OK' }]
      );
    }
  };

  const handleGoToLogin = () => {
    router.back();
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
          <Text style={styles.title}>Crear Cuenta</Text>
          <Text style={styles.subtitle}>Regístrate para comenzar</Text>
        </View>

        <View style={styles.form}>
          <Input
            label="Usuario"
            placeholder="Elige un nombre de usuario"
            value={username}
            onChangeText={(text) => {
              setUsername(text);
              if (errors.username) {
                setErrors((prev) => ({ ...prev, username: undefined }));
              }
            }}
            autoCapitalize="none"
            autoCorrect={false}
            error={errors.username}
          />

          <Input
            label="Contraseña"
            placeholder="Crea una contraseña"
            value={password}
            onChangeText={(text) => {
              setPassword(text);
              if (errors.password) {
                setErrors((prev) => ({ ...prev, password: undefined }));
              }
            }}
            secureTextEntry
            error={errors.password}
          />

          <Input
            label="Confirmar Contraseña"
            placeholder="Repite tu contraseña"
            value={confirmPassword}
            onChangeText={(text) => {
              setConfirmPassword(text);
              if (errors.confirmPassword) {
                setErrors((prev) => ({ ...prev, confirmPassword: undefined }));
              }
            }}
            secureTextEntry
            error={errors.confirmPassword}
          />

          <Button
            title="Registrarme"
            onPress={handleRegister}
            loading={isLoading}
            style={styles.button}
          />

          <View style={styles.loginLinkContainer}>
            <Text style={styles.loginText}>
              ¿Ya tienes cuenta?{' '}
              <Text style={styles.link} onPress={handleGoToLogin}>
                Inicia sesión
              </Text>
            </Text>
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Al registrarte, aceptas los términos de uso
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
  loginLinkContainer: {
    marginTop: SPACING.lg,
    alignItems: 'center',
  },
  loginText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
  },
  link: {
    color: COLORS.primary,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  footer: {
    marginTop: SPACING.xl,
    alignItems: 'center',
  },
  footerText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textLight,
    textAlign: 'center',
  },
});
