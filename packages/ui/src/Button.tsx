import type { ReactNode } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import {
  DEEP_PURPLE,
  DREAM_PINK,
  radii,
  spacing,
  STAR_PURPLE,
  TEXT_PRIMARY,
  typography,
} from '@mira/design-tokens';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost';
export type ButtonSize = 'small' | 'medium' | 'large';

export type ButtonProps = Omit<PressableProps, 'children' | 'style'> & {
  children?: ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  style?: StyleProp<ViewStyle>;
};

export function Button({
  children,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  accessibilityRole,
  style,
  ...props
}: ButtonProps) {
  const content =
    typeof children === 'string' || typeof children === 'number' ? (
      <Text
        style={[
          styles.label,
          variant === 'secondary' && styles.secondaryLabel,
          variant === 'ghost' && styles.ghostLabel,
        ]}
      >
        {children}
      </Text>
    ) : (
      children
    );

  return (
    <Pressable
      {...props}
      accessibilityRole={accessibilityRole ?? 'button'}
      disabled={disabled}
      style={({ pressed }) => [
        styles.base,
        variantStyles[variant],
        sizeStyles[size],
        pressed && !disabled && styles.pressed,
        disabled && styles.disabled,
        style,
      ]}
    >
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    borderRadius: radii.md,
    borderWidth: 1,
    justifyContent: 'center',
  },
  primary: {
    backgroundColor: DEEP_PURPLE,
    borderColor: DEEP_PURPLE,
  },
  secondary: {
    backgroundColor: 'transparent',
    borderColor: DREAM_PINK,
  },
  ghost: {
    backgroundColor: 'transparent',
    borderColor: 'transparent',
  },
  small: {
    minHeight: 44,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  medium: {
    minHeight: 44,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  large: {
    minHeight: 52,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  label: {
    color: TEXT_PRIMARY,
    fontSize: typography.bodySize,
    fontWeight: '600',
    textAlign: 'center',
  },
  secondaryLabel: {
    color: DREAM_PINK,
  },
  ghostLabel: {
    color: STAR_PURPLE,
  },
  pressed: {
    opacity: 0.82,
  },
  disabled: {
    opacity: 0.5,
  },
});

const variantStyles = {
  primary: styles.primary,
  secondary: styles.secondary,
  ghost: styles.ghost,
} satisfies Record<ButtonVariant, ViewStyle>;

const sizeStyles = {
  small: styles.small,
  medium: styles.medium,
  large: styles.large,
} satisfies Record<ButtonSize, ViewStyle>;
