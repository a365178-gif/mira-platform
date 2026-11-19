export const DEMO_PROFILE_KEY = 'mira.local-demo-profile';

export interface DemoProfile {
  mode: 'local-demo';
  nickname: string;
  gender: string;
  interestedIn: string;
  intention: string;
  adultConfirmed: true;
  safetyCommitment: true;
  completedAt: string;
}

export function isAtLeast18(dateOfBirth: string, today = new Date()): boolean {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateOfBirth);
  if (!match) return false;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const parsedDate = new Date(year, month - 1, day);

  if (
    parsedDate.getFullYear() !== year ||
    parsedDate.getMonth() !== month - 1 ||
    parsedDate.getDate() !== day ||
    parsedDate > today
  ) {
    return false;
  }

  const age = today.getFullYear() - year;
  const birthdayHasPassed =
    today.getMonth() + 1 > month ||
    (today.getMonth() + 1 === month && today.getDate() >= day);

  return age > 18 || (age === 18 && birthdayHasPassed);
}

export function readDemoProfile(): DemoProfile | null {
  const serialized = window.sessionStorage.getItem(DEMO_PROFILE_KEY);
  if (!serialized) return null;

  let value: unknown;
  try {
    value = JSON.parse(serialized);
  } catch {
    throw new Error('本機示範狀態無法讀取，請重新開始設定。');
  }

  if (!isDemoProfile(value)) {
    throw new Error('本機示範狀態格式不正確，請重新開始設定。');
  }

  return value;
}

export function clearDemoProfile(): void {
  window.sessionStorage.removeItem(DEMO_PROFILE_KEY);
}

export function isLocalDemoProfile(value: unknown): value is DemoProfile {
  return isDemoProfile(value);
}

function isDemoProfile(value: unknown): value is DemoProfile {
  if (typeof value !== 'object' || value === null) return false;
  const profile = value as Partial<DemoProfile>;

  return (
    profile.mode === 'local-demo' &&
    typeof profile.nickname === 'string' &&
    typeof profile.gender === 'string' &&
    typeof profile.interestedIn === 'string' &&
    typeof profile.intention === 'string' &&
    profile.adultConfirmed === true &&
    profile.safetyCommitment === true &&
    typeof profile.completedAt === 'string'
  );
}
