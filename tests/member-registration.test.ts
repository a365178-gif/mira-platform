import { describe, expect, it } from 'vitest';
import {
  buildRegistrationMetadata,
  latestAdultBirthDate,
  validateRegistration,
  type RegistrationDetails,
} from '../apps/web/lib/members/registration';

const eligibleDetails: RegistrationDetails = {
  nickname: '覓然使用者',
  dateOfBirth: '1990-06-15',
  gender: '暫不透露',
  interestedIn: '不限性別',
  intention: '認真交往',
};

describe('MIRA member registration privacy and age gate', () => {
  it('requires an adult, valid birthday and complete profile selections', () => {
    expect(validateRegistration({ ...eligibleDetails, dateOfBirth: '2008-06-16' }, new Date(2026, 5, 15))).toContain('18');
    expect(validateRegistration({ ...eligibleDetails, dateOfBirth: '2020-02-30' }, new Date(2026, 5, 15))).toContain('18');
    expect(validateRegistration(eligibleDetails, new Date(2026, 5, 15))).toBeNull();
    expect(latestAdultBirthDate(new Date(2026, 10, 18))).toBe('2008-11-18');
  });

  it('does not include a birth date in Supabase Auth metadata', () => {
    const metadata = buildRegistrationMetadata(eligibleDetails);
    expect(metadata).toEqual({
      nickname: '覓然使用者',
      gender: '暫不透露',
      interested_in: '不限性別',
      intention: '認真交往',
    });
    expect(metadata).not.toHaveProperty('dateOfBirth');
    expect(metadata).not.toHaveProperty('date_of_birth');
  });
});
