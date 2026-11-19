import { describe, expect, it } from 'vitest';
import { colors, LOGO_BLUE, LOGO_CYAN, radii, spacing } from '../packages/design-tokens/src/index';

describe('MIRA design tokens', () => {
  it('keeps the approved brand palette unchanged', () => {
    expect(colors).toEqual({
      MIDNIGHT_BLACK: '#0B0B12',
      DEEP_PURPLE: '#6A3CCF',
      DREAM_PINK: '#FF6FB3',
      STAR_PURPLE: '#B89BFF',
      CARD_BACKGROUND: '#191824',
      TEXT_PRIMARY: '#F5F2FA',
      TEXT_SECONDARY: '#A5A0B2',
    });
  });

  it('provides a consistent spacing and corner-radius scale', () => {
    expect(spacing.md).toBe(16);
    expect(radii.lg).toBe(20);
  });

  it('keeps the cyan and blue logo accents separate from the brand palette', () => {
    expect(LOGO_CYAN).toBe('#35EBD0');
    expect(LOGO_BLUE).toBe('#4B43E8');
    expect(colors).not.toHaveProperty('LOGO_CYAN');
    expect(colors).not.toHaveProperty('LOGO_BLUE');
  });
});
