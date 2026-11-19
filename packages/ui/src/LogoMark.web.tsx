import { useId } from 'react';
import {
  DEEP_PURPLE,
  DREAM_PINK,
  LOGO_BLUE,
  LOGO_CYAN,
  MIDNIGHT_BLACK,
} from '@mira/design-tokens';
import type { LogoMarkProps } from './LogoMark.native';
import {
  LOGO_MARK_VIEW_BOX,
  LOGO_ORBIT_SEGMENTS,
  LOGO_ORBIT_STROKE_WIDTH,
  LOGO_ORBIT_TRANSFORM_CYAN,
  LOGO_ORBIT_TRANSFORM_PURPLE,
  LOGO_STAR_PATH,
} from './LogoMark.geometry';

export function LogoMark({ size, monochrome = false, appIcon = false }: LogoMarkProps) {
  const generatedId = useId();
  const id = generatedId.replace(/[^a-zA-Z0-9_-]/g, '');
  const purpleStart = monochrome ? '#F5F2FA' : DEEP_PURPLE;
  const purpleEnd = monochrome ? '#F5F2FA' : DREAM_PINK;
  const cyanStart = monochrome ? '#F5F2FA' : LOGO_CYAN;
  const blueEnd = monochrome ? '#F5F2FA' : LOGO_BLUE;
  return (
    <svg aria-hidden="true" focusable="false" height={size} viewBox={LOGO_MARK_VIEW_BOX} width={size}>
      <defs>
        <linearGradient
          gradientUnits="userSpaceOnUse"
          id={`${id}-purple-gradient`}
          x1="25"
          x2="75"
          y1="25"
          y2="75"
        >
          <stop offset="0" stopColor={purpleStart} />
          <stop offset="1" stopColor={purpleEnd} />
        </linearGradient>
        <linearGradient
          gradientUnits="userSpaceOnUse"
          id={`${id}-cyan-gradient`}
          x1="75"
          x2="25"
          y1="25"
          y2="75"
        >
          <stop offset="0" stopColor={cyanStart} />
          <stop offset="1" stopColor={blueEnd} />
        </linearGradient>
      </defs>
      {appIcon ? <rect fill={MIDNIGHT_BLACK} height="120" width="120" x="-10" y="-10" /> : null}
      <path
        d={LOGO_ORBIT_SEGMENTS}
        fill="none"
        stroke={`url(#${id}-purple-gradient)`}
        strokeLinecap="butt"
        strokeWidth={LOGO_ORBIT_STROKE_WIDTH}
        transform={LOGO_ORBIT_TRANSFORM_PURPLE}
      />
      <path
        d={LOGO_ORBIT_SEGMENTS}
        fill="none"
        stroke={`url(#${id}-cyan-gradient)`}
        strokeLinecap="butt"
        strokeWidth={LOGO_ORBIT_STROKE_WIDTH}
        transform={LOGO_ORBIT_TRANSFORM_CYAN}
      />
      <path
        d={LOGO_STAR_PATH}
        fill="#FFFFFF"
      />
    </svg>
  );
}
