'use client';

import { ScrollView, StyleSheet, Text, View } from 'react-native';
import {
  CARD_BACKGROUND,
  DEEP_PURPLE,
  MIDNIGHT_BLACK,
  radii,
  spacing,
  STAR_PURPLE,
  TEXT_PRIMARY,
  TEXT_SECONDARY,
  typography,
} from '@mira/design-tokens';
import { Button } from './Button';
import { Card } from './Card';
import { Logo } from './Logo';

export interface BrandHomeProps {
  onStartExploration?: () => void;
}

export function BrandHome({ onStartExploration }: BrandHomeProps) {
  return (
    <ScrollView contentContainerStyle={styles.page}>
      <View style={styles.content}>
        <Logo variant="horizontal" size={60} />
        <View style={styles.hero}>
          <Text accessibilityRole="header" style={styles.heading}>
            在茫茫人海，{'\n'}遇見剛好的你。
          </Text>
          <Text style={styles.intro}>
            一段相遇，從自在探索開始。
          </Text>
          {onStartExploration ? (
            <Button onPress={onStartExploration} size="large" style={styles.startButton}>
              開始探索
            </Button>
          ) : null}
        </View>
        <Card style={styles.feature}>
          <View style={styles.featureMark}>
            <Logo accessibilityLabel="交錯雙軌圖形標誌" size={44} variant="mark" />
          </View>
          <Text style={styles.featureTitle}>
            三階探索配對
          </Text>
          <Text style={styles.featureCopy}>
            以層層探索，為每一次相遇留一點時間，也留一點心動。
          </Text>
        </Card>
        <Text style={styles.note}>
          {onStartExploration
            ? '本機示範 · 尚未連接正式驗證或配對服務'
            : 'MIRA｜覓然 · 設計系統預覽'}
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: {
    alignItems: 'center',
    backgroundColor: MIDNIGHT_BLACK,
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xxl,
  },
  content: {
    gap: spacing.xl,
    maxWidth: 760,
    width: '100%',
  },
  hero: {
    gap: spacing.sm,
  },
  startButton: {
    alignSelf: 'flex-start',
    marginTop: spacing.sm,
    minWidth: 200,
  },
  heading: {
    color: TEXT_PRIMARY,
    fontSize: typography.headingSize,
    fontWeight: '700',
    lineHeight: 46,
  },
  intro: {
    color: TEXT_SECONDARY,
    fontSize: typography.bodySize,
    lineHeight: 26,
  },
  feature: {
    alignItems: 'flex-start',
    backgroundColor: CARD_BACKGROUND,
    gap: spacing.sm,
    padding: spacing.lg,
  },
  featureMark: {
    alignItems: 'center',
    backgroundColor: `${DEEP_PURPLE}30`,
    borderRadius: radii.pill,
    height: 56,
    justifyContent: 'center',
    width: 56,
  },
  featureTitle: {
    color: STAR_PURPLE,
    fontSize: 20,
    fontWeight: '600',
  },
  featureCopy: {
    color: TEXT_SECONDARY,
    fontSize: typography.captionSize,
    lineHeight: 24,
  },
  note: {
    color: TEXT_SECONDARY,
    fontSize: 12,
    textAlign: 'center',
  },
});
