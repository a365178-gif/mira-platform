import type { SignUpWithPasswordCredentials } from '@supabase/supabase-js';
import { isAtLeast18 } from '../demo-profile';

export interface RegistrationDetails {
  nickname: string;
  dateOfBirth: string;
  gender: string;
  interestedIn: string;
  intention: string;
}

export function validateRegistration(details: RegistrationDetails, today = new Date()): string | null {
  const nickname = details.nickname.trim();
  if (nickname.length < 2 || nickname.length > 20) return '暱稱請輸入 2 至 20 個字。';
  if (!isAtLeast18(details.dateOfBirth, today)) return 'MIRA 僅開放年滿 18 歲的成年人註冊。';
  if (!details.gender || !details.interestedIn || !details.intention) return '請完成性別與交友偏好設定。';
  return null;
}

export function latestAdultBirthDate(today = new Date()): string {
  const year = today.getFullYear() - 18;
  const month = today.getMonth() + 1;
  const day = Math.min(today.getDate(), new Date(year, month, 0).getDate());
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

export function buildRegistrationMetadata(details: RegistrationDetails) {
  return {
    nickname: details.nickname.trim(),
    gender: details.gender,
    interested_in: details.interestedIn,
    intention: details.intention,
  } satisfies NonNullable<SignUpWithPasswordCredentials['options']>['data'];
}
