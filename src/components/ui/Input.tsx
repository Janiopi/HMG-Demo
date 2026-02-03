import React from 'react';
import {
  TextInput as RNTextInput,
  View,
  Text,
  StyleSheet,
  TextInputProps as RNTextInputProps,
  ViewStyle,
} from 'react-native';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS } from '../../utils/constants';

interface InputProps extends RNTextInputProps {
  label?: string;
  error?: string;
  containerStyle?: ViewStyle;
}

export function Input({
  label,
  error,
  containerStyle,
  style,
  ...props
}: InputProps) {
  const hasError = !!error;

  return (
    <View style={[styles.container, containerStyle]}>
      {label && <Text style={styles.label}>{label}</Text>}
      <RNTextInput
        style={[
          styles.input,
          hasError && styles.inputError,
          style,
        ]}
        placeholderTextColor={COLORS.textLight}
        {...props}
      />
      {hasError && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: SPACING.md,
  },
  label: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '500',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  input: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
    minHeight: 48,
  },
  inputError: {
    borderColor: COLORS.error,
  },
  errorText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.error,
    marginTop: SPACING.xs,
  },
});
