import type { MockProfile } from './mockProfiles';
import styles from '../flow.module.css';

export function Portrait({ profile }: { profile: MockProfile }) {
  const gradientId = `portrait-${profile.id}`;

  return (
    <svg
      aria-label={`${profile.name}的示意插畫頭像，非真實照片`}
      className={styles.portrait}
      role="img"
      viewBox="0 0 280 340"
    >
      <defs>
        <linearGradient id={`${gradientId}-background`} x1="0" x2="1" y1="0" y2="1">
          <stop offset="0" stopColor={profile.auraColor} stopOpacity=".78" />
          <stop offset="1" stopColor="#191824" />
        </linearGradient>
        <linearGradient id={`${gradientId}-shirt`} x1="0" x2="1" y1="0" y2="1">
          <stop offset="0" stopColor={profile.clothingColor} />
          <stop offset="1" stopColor={profile.accentColor} />
        </linearGradient>
      </defs>
      <rect fill={`url(#${gradientId}-background)`} height="340" rx="28" width="280" />
      <circle cx="224" cy="68" fill={profile.accentColor} opacity=".22" r="44" />
      <path
        d="M35 340c5-67 42-105 105-105s100 38 105 105H35Z"
        fill={`url(#${gradientId}-shirt)`}
      />
      <path
        d={
          profile.portrait === 'long'
            ? 'M78 129c0-63 25-92 65-92s67 32 67 95v75c-10 42-31 63-67 63s-56-21-65-63v-78Z'
            : profile.portrait === 'curly'
              ? 'M73 130c-7-60 22-97 69-97 48 0 75 37 66 99l-5 75c-8 39-29 59-62 59-37 0-58-20-64-60l-4-76Z'
              : 'M79 129c0-59 24-91 61-91 43 0 64 30 64 91v78c-9 39-29 57-63 57-35 0-54-19-62-58v-77Z'
        }
        fill={profile.hairColor}
      />
      <path
        d="M91 125c0-39 17-64 49-64s49 25 49 64v50c0 38-20 62-49 62s-49-24-49-62v-50Z"
        fill={profile.skinColor}
      />
      <path
        d={
          profile.portrait === 'short'
            ? 'M83 125c-5-51 17-87 59-87 31 0 54 18 62 52-17-10-33-19-51-23-14 23-38 36-70 41v17Z'
            : profile.portrait === 'curly'
              ? 'M83 122c-11-46 12-84 52-89 38-5 63 18 68 57-12-11-20-15-28-19-14 18-38 31-73 35l-19 16Z'
              : 'M86 125c-8-50 13-84 54-87 35-3 58 20 61 62-12-7-19-13-25-23-22 21-45 31-90 32v16Z'
        }
        fill={profile.hairColor}
      />
      <path d="M111 145h3m51 0h3" fill="none" stroke="#382C2A" strokeLinecap="round" strokeWidth="5" />
      <path d="M139 151v24" fill="none" stroke="#A97560" strokeLinecap="round" strokeWidth="3" />
      <path d="M126 190c8 7 19 7 27 0" fill="none" stroke="#8F514E" strokeLinecap="round" strokeWidth="3" />
      <path d="M101 250c11-18 25-27 39-27s29 9 40 27" fill="none" stroke="#F5F2FA" strokeOpacity=".36" strokeWidth="3" />
      {profile.portrait === 'long' ? (
        <path d="M88 128c-10 44-5 99 14 131l-18-11c-16-40-18-92-9-124l13 4Zm101 0c10 44 5 99-14 131l18-11c16-40 18-92 9-124l-13 4Z" fill={profile.hairColor} />
      ) : null}
      {profile.portrait === 'curly' ? (
        <g fill={profile.hairColor}>
          <circle cx="88" cy="77" r="15" />
          <circle cx="111" cy="48" r="16" />
          <circle cx="142" cy="39" r="16" />
          <circle cx="174" cy="53" r="16" />
          <circle cx="194" cy="81" r="15" />
        </g>
      ) : null}
    </svg>
  );
}
