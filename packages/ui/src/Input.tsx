import { StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';
import {
  CARD_BACKGROUND,
  DREAM_PINK,
  radii,
  spacing,
  STAR_PURPLE,
  TEXT_PRIMARY,
  TEXT_SECONDARY,
  typography,
} from '@mira/design-tokens';

export type InputProps = TextInputProps & {
  label: string;
  errorMessage?: string;
};

export function Input({
  label,
  errorMessage,
  accessibilityLabel,
  accessibilityHint,
  placeholderTextColor = TEXT_SECONDARY,
  style,
  ...props
}: InputProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        {...props}
        accessibilityLabel={accessibilityLabel ?? label}
        accessibilityHint={
          errorMessage ? [accessibilityHint, errorMessage].filter(Boolean).join('. ') : accessibilityHint
        }
        placeholderTextColor={placeholderTextColor}
        style={[styles.field, errorMessage && styles.fieldError, style]}
      />
      {errorMessage ? (
        <Text accessibilityLiveRegion="polite" style={styles.error}>
          {errorMessage}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.sm,
  },
  label: {
    color: TEXT_PRIMARY,
    fontSize: typography.captionSize,
    fontWeight: '600',
  },
  field: {
    backgroundColor: CARD_BACKGROUND,
    borderColor: `${STAR_PURPLE}50`,
    borderRadius: radii.md,
    borderWidth: 1,
    color: TEXT_PRIMARY,
    fontSize: typography.bodySize,
    minHeight: 48,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  fieldError: {
    borderColor: DREAM_PINK,
  },
  error: {
    color: DREAM_PINK,
    fontSize: 13,
  },
});
