import { describe, expect, it } from 'vitest';
import { calculateCompatibility, mockProfiles, valueQuestions } from '../apps/web/app/explore/mockProfiles';

describe('MIRA three-stage local exploration demo', () => {
  it('provides four adult mock profiles and three value questions', () => {
    expect(mockProfiles).toHaveLength(4);
    expect(mockProfiles.every((profile) => profile.age >= 18)).toBe(true);
    expect(valueQuestions).toHaveLength(3);
  });

  it('unlocks stage two at two matching answers out of three', () => {
    const profile = mockProfiles[0];
    const result = calculateCompatibility(profile, {
      weekend: profile.valueAnswers.weekend,
      relationship: profile.valueAnswers.relationship,
      difference: 'talk',
    });

    expect(result).toMatchObject({
      answeredCount: 3,
      matchedCount: 2,
      percentage: 67,
      reached: true,
    });
  });

  it('does not unlock before all answers or below the threshold', () => {
    const profile = mockProfiles[0];

    expect(
      calculateCompatibility(profile, {
        weekend: profile.valueAnswers.weekend,
        relationship: profile.valueAnswers.relationship,
      }).reached,
    ).toBe(false);
    expect(
      calculateCompatibility(profile, {
        weekend: 'wander',
        relationship: 'space',
        difference: 'talk',
      }).reached,
    ).toBe(false);
  });
});
