import { describe, expect, it } from 'vitest';
import { isAtLeast18 } from '../apps/web/lib/demo-profile';

describe('MIRA local demo 18+ gate', () => {
  const today = new Date(2026, 10, 18);

  it('accepts a user on or after their 18th birthday', () => {
    expect(isAtLeast18('2008-11-18', today)).toBe(true);
    expect(isAtLeast18('2008-11-17', today)).toBe(true);
  });

  it('rejects users one day short of 18, future dates, and invalid dates', () => {
    expect(isAtLeast18('2008-11-19', today)).toBe(false);
    expect(isAtLeast18('2027-01-01', today)).toBe(false);
    expect(isAtLeast18('2008-02-30', today)).toBe(false);
    expect(isAtLeast18('', today)).toBe(false);
  });
});
