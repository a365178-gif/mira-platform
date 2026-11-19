import { StyleSheet, Text, View } from 'react-native';
import { TEXT_PRIMARY, TEXT_SECONDARY } from '@mira/design-tokens';
import { LogoMark } from './LogoMark';

export type LogoVariant = 'primary' | 'mark' | 'horizontal' | 'monochrome' | 'app-icon';

export interface LogoProps {
  variant?: LogoVariant;
  size?: number;
  accessibilityLabel?: string;
}

export function Logo({
  variant = 'primary',
  size = 56,
  accessibilityLabel = 'MIRA 覓然',
}: LogoProps) {
  const monochrome = variant === 'monochrome';
  const markSize = variant === 'horizontal' ? Math.round(size * 0.8) : size;

  if (variant === 'mark' || variant === 'app-icon') {
    return (
      <View accessible accessibilityLabel={accessibilityLabel} accessibilityRole="image">
        <LogoMark appIcon={variant === 'app-icon'} size={size} />
      </View>
    );
  }

  const isHorizontal = variant === 'horizontal';

  return (
    <View
      accessible
      accessibilityLabel={`${accessibilityLabel}，在茫茫人海，遇見剛好的你。`}
      accessibilityRole="image"
      style={isHorizontal ? styles.horizontal : styles.primary}
    >
      <LogoMark monochrome={monochrome} size={markSize} />
      <View style={styles.wordmark}>
        <Text style={[styles.name, monochrome && styles.monochromeText]}>MIRA｜覓然</Text>
        <Text style={[styles.tagline, monochrome && styles.monochromeTagline]}>
          在茫茫人海，遇見剛好的你。
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  primary: {
    alignItems: 'center',
    gap: 10,
  },
  horizontal: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
  },
  wordmark: {
    alignItems: 'center',
    gap: 4,
  },
  name: {
    color: TEXT_PRIMARY,
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: 1.2,
  },
  tagline: {
    color: TEXT_SECONDARY,
    fontSize: 13,
  },
  monochromeText: {
    color: TEXT_PRIMARY,
  },
  monochromeTagline: {
    color: TEXT_PRIMARY,
  },
});
