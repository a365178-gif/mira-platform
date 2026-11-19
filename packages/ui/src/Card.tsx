import { StyleSheet, View, type ViewProps } from 'react-native';
import { CARD_BACKGROUND, radii, spacing, STAR_PURPLE } from '@mira/design-tokens';

export type CardProps = ViewProps;

export function Card({ accessibilityRole, style, ...props }: CardProps) {
  return (
    <View
      {...props}
      accessibilityRole={accessibilityRole ?? 'group'}
      style={[styles.card, style]}
    />
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: CARD_BACKGROUND,
    borderColor: `${STAR_PURPLE}24`,
    borderRadius: radii.lg,
    borderWidth: 1,
    padding: spacing.lg,
  },
});
