import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { Button, Input, Card } from '@/src/components/ui';
import { createRecord } from '@/src/services/database.service';
import { getRUCError, getClientNameError } from '@/src/utils/validators';
import { COLORS, SPACING, FONT_SIZES } from '@/src/utils/constants';

export default function RegisterScreen() {
  const [ruc, setRuc] = useState('');
  const [clientName, setClientName] = useState('');
  const [errors, setErrors] = useState<{ ruc?: string; clientName?: string }>({});
  const [isLoading, setIsLoading] = useState(false);
  const [lastSaved, setLastSaved] = useState<{ id: number; timestamp: string } | null>(null);

  const validate = (): boolean => {
    const newErrors: { ruc?: string; clientName?: string } = {};

    const rucError = getRUCError(ruc);
    if (rucError) {
      newErrors.ruc = rucError;
    }

    const nameError = getClientNameError(clientName);
    if (nameError) {
      newErrors.clientName = nameError;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) {
      return;
    }

    setIsLoading(true);

    try {
      const record = await createRecord({
        ruc: ruc.trim(),
        clientName: clientName.trim(),
      });

      // Format the timestamp for display
      const timestamp = new Date().toLocaleString('es-PE', {
        dateStyle: 'medium',
        timeStyle: 'medium',
      });

      setLastSaved({ id: record.id, timestamp });

      Alert.alert(
        'Registro Guardado',
        `ID: ${record.id}\nFecha: ${timestamp}\nRUC: ${record.ruc}\nCliente: ${record.clientName}`,
        [
          {
            text: 'Nuevo Registro',
            onPress: () => {
              setRuc('');
              setClientName('');
              setErrors({});
            },
          },
          { text: 'OK' },
        ]
      );
    } catch (error) {
      console.error('Error saving record:', error);
      Alert.alert('Error', 'No se pudo guardar el registro. Intente nuevamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClear = () => {
    setRuc('');
    setClientName('');
    setErrors({});
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        {/* Info Card */}
        <Card variant="elevated" style={styles.infoCard}>
          <Text style={styles.infoTitle}>Registro de Cliente</Text>
          <Text style={styles.infoText}>
            Complete los datos del cliente. El ID y la fecha/hora se generan automáticamente al guardar.
          </Text>
        </Card>

        {/* Last Saved Info */}
        {lastSaved && (
          <Card style={styles.lastSavedCard}>
            <Text style={styles.lastSavedTitle}>Último registro guardado</Text>
            <Text style={styles.lastSavedText}>ID: {lastSaved.id}</Text>
            <Text style={styles.lastSavedText}>{lastSaved.timestamp}</Text>
          </Card>
        )}

        {/* Form */}
        <Card style={styles.formCard}>
          <Input
            label="RUC *"
            placeholder="Ingrese el RUC (11 dígitos)"
            value={ruc}
            onChangeText={(text) => {
              // Only allow numbers
              const numericText = text.replace(/[^0-9]/g, '');
              setRuc(numericText);
              if (errors.ruc) {
                setErrors((prev) => ({ ...prev, ruc: undefined }));
              }
            }}
            keyboardType="numeric"
            maxLength={11}
            error={errors.ruc}
          />

          <Input
            label="Nombre del Cliente *"
            placeholder="Ingrese el nombre del cliente"
            value={clientName}
            onChangeText={(text) => {
              setClientName(text);
              if (errors.clientName) {
                setErrors((prev) => ({ ...prev, clientName: undefined }));
              }
            }}
            autoCapitalize="words"
            error={errors.clientName}
          />

          <View style={styles.buttonRow}>
            <Button
              title="Limpiar"
              onPress={handleClear}
              variant="outline"
              style={styles.clearButton}
            />
            <Button
              title="Guardar"
              onPress={handleSave}
              loading={isLoading}
              style={styles.saveButton}
            />
          </View>
        </Card>

        {/* RUC Help */}
        <Card style={styles.helpCard}>
          <Text style={styles.helpTitle}>Formato de RUC</Text>
          <Text style={styles.helpText}>
            El RUC debe tener 11 dígitos y comenzar con:{'\n'}
            • 10 - Persona natural{'\n'}
            • 15 - Persona jurídica sin fines de lucro{'\n'}
            • 17 - Entidades del estado{'\n'}
            • 20 - Persona jurídica
          </Text>
        </Card>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    padding: SPACING.md,
  },
  infoCard: {
    marginBottom: SPACING.md,
    backgroundColor: '#e0f2fe',
    borderColor: '#7dd3fc',
  },
  infoTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.primary,
    marginBottom: SPACING.xs,
  },
  infoText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.text,
    lineHeight: 20,
  },
  lastSavedCard: {
    marginBottom: SPACING.md,
    backgroundColor: '#dcfce7',
    borderColor: '#86efac',
  },
  lastSavedTitle: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    color: COLORS.success,
    marginBottom: SPACING.xs,
  },
  lastSavedText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.text,
  },
  formCard: {
    marginBottom: SPACING.md,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginTop: SPACING.sm,
  },
  clearButton: {
    flex: 1,
  },
  saveButton: {
    flex: 2,
  },
  helpCard: {
    backgroundColor: COLORS.background,
  },
  helpTitle: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  helpText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
});
