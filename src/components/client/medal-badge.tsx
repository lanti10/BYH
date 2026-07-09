"use client";

import type { ReactNode } from "react";
import type { Medal as MedalType } from "@/lib/medals";
import { useT } from "@/lib/i18n/client";

// Medaglie "BYH Pulse" (design Claude): esagono liquid-glass con gradiente del
// colore accento, riflesso speculare in alto e glyph bianco. Livello oro
// (#FFD60A) con cornice interna e riflesso più marcato. Stato bloccato = vetro
// grigio + lucchetto. Geometria e luce identiche per tutte → sembrano un set.

const HEX = "M50 3 L91 26 L91 74 L50 97 L9 74 L9 26 Z";

// Colore accento → [stop alto, stop basso] del gradiente.
const GRAD: Record<string, [string, string]> = {
  "#FF375F": ["#FF375F", "#B32842"],
  "#FF9F0A": ["#FF9F0A", "#B27007"],
  "#5AC8FA": ["#5AC8FA", "#3F8CAF"],
  "#BF5AF2": ["#BF5AF2", "#853FA9"],
  "#FFD60A": ["#FFE767", "#B2960A"], // oro: alto più chiaro
  "#30D158": ["#30D158", "#21913D"],
};

// Simbolo centrale per ciascun traguardo (chiave = medal.icon).
const GLYPHS: Record<string, ReactNode> = {
  flag: (
    <>
      <path d="M-6,-11 L-6,11" stroke="#FFFFFF" strokeWidth={2.2} strokeLinecap="round" />
      <path d="M-6,-11 L8,-11 L4,-5 L8,1 L-6,1 Z" fill="#FFFFFF" />
    </>
  ),
  flame: (
    <path
      d="M0,-11 C4,-6 6,-2 4,3 C7,1 8,-3 7,-6 C10,-2 11,4 7,8 C9,7 10,5 10,3 C11,9 6,12 0,12 C-6,12 -10,8 -9,2 C-9,5 -8,7 -6,8 C-9,4 -8,-1 -5,-4 C-5,-1 -4,1 -2,2 C-3,-3 -2,-8 0,-11 Z"
      fill="#FFFFFF"
    />
  ),
  medal: (
    <>
      <path d="M-4,-12 L-1,-2 L1,-2 L4,-12" stroke="#FFFFFF" strokeWidth={2} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="0" cy="4" r="8" fill="none" stroke="#FFFFFF" strokeWidth={2.4} />
      <circle cx="0" cy="4" r="3.2" fill="#FFFFFF" />
    </>
  ),
  award: (
    <>
      <circle cx="0" cy="-3" r="7" fill="none" stroke="#FFFFFF" strokeWidth={2.3} />
      <path d="M-4,3 L-7,13 L-1,10 Z" fill="#FFFFFF" />
      <path d="M4,3 L7,13 L1,10 Z" fill="#FFFFFF" />
      <circle cx="0" cy="-3" r="2.6" fill="#FFFFFF" />
    </>
  ),
  trophy: (
    <>
      <path d="M-6,-11 L6,-11 L6,-4 C6,1 3,4 0,4 C-3,4 -6,1 -6,-4 Z" fill="#FFFFFF" />
      <path d="M-6,-9 C-10,-9 -10,-2 -6,-2" stroke="#FFFFFF" strokeWidth={1.8} fill="none" />
      <path d="M6,-9 C10,-9 10,-2 6,-2" stroke="#FFFFFF" strokeWidth={1.8} fill="none" />
      <rect x="-1.5" y="4" width="3" height="4" fill="#FFFFFF" />
      <rect x="-5" y="8" width="10" height="2.4" rx="1" fill="#FFFFFF" />
    </>
  ),
  "calendar-check": (
    <>
      <rect x="-9" y="-9" width="18" height="18" rx="3" fill="none" stroke="#FFFFFF" strokeWidth={2.2} />
      <line x1="-9" y1="-3" x2="9" y2="-3" stroke="#FFFFFF" strokeWidth={2} />
      <line x1="-4.5" y1="-12" x2="-4.5" y2="-9" stroke="#FFFFFF" strokeWidth={2} strokeLinecap="round" />
      <line x1="4.5" y1="-12" x2="4.5" y2="-9" stroke="#FFFFFF" strokeWidth={2} strokeLinecap="round" />
      <path d="M-4,3 L-1,6.5 L5,-1" stroke="#FFFFFF" strokeWidth={2.4} fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
  star: <path d="M0,-12 L3.5,-4.2 L11.4,-3.7 L5.4,1.7 L7.3,9.5 L0,5.1 L-7.3,9.5 L-5.4,1.7 L-11.4,-3.7 L-3.5,-4.2 Z" fill="#FFFFFF" />,
  crown: (
    <>
      <path d="M-9,4 L-9,-3 L-4.5,1 L0,-7 L4.5,1 L9,-3 L9,4 Z" fill="#FFFFFF" />
      <rect x="-9" y="4" width="18" height="3" rx="1" fill="#FFFFFF" />
      <circle cx="-9" cy="-4.5" r="1.6" fill="#FFFFFF" />
      <circle cx="0" cy="-8.5" r="1.8" fill="#FFFFFF" />
      <circle cx="9" cy="-4.5" r="1.6" fill="#FFFFFF" />
    </>
  ),
  zap: <path d="M2,-12 L-8,2 L-1,2 L-3,12 L9,-3 L2,-3 Z" fill="#FFFFFF" />,
  gem: (
    <>
      <path d="M-8,-5 L8,-5 L11,0 L0,12 L-11,0 Z" fill="#FFFFFF" />
      <path d="M-8,-5 L-3,0 L0,12 M8,-5 L3,0 L0,12 M-11,0 L11,0" stroke="rgba(0,0,0,0.15)" strokeWidth={0.8} fill="none" />
      <path d="M-8,-5 L0,-9 L8,-5" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth={0.8} />
    </>
  ),
};

const LOCK_GLYPH = (
  <>
    <rect x="-5.5" y="-1" width="11" height="9" rx="2" fill="#8E8E93" />
    <path d="M-3.5,-1 L-3.5,-4.5 C-3.5,-7 -1.8,-8.5 0,-8.5 C1.8,-8.5 3.5,-7 3.5,-4.5 L3.5,-1" stroke="#8E8E93" strokeWidth={2} fill="none" />
    <circle cx="0" cy="3.2" r="1.4" fill="#F2F2F7" />
  </>
);

export function MedalBadge({ medal, size = 88 }: { medal: MedalType; size?: number }) {
  const { t } = useT();
  const { unlocked } = medal;
  const [g0, g1] = GRAD[medal.color] ?? [medal.color, medal.color];
  const gold = medal.color === "#FFD60A";
  const gradId = `grad-${medal.id}`;
  const clipId = `hex-${medal.id}`;

  return (
    <div className="flex flex-col items-center gap-2 text-center">
      <svg
        viewBox="0 0 100 100"
        width={size}
        height={size}
        style={{ overflow: "visible", filter: "drop-shadow(0 8px 10px rgba(0,0,0,0.35))" }}
      >
        <defs>
          <clipPath id={clipId}>
            <path d={HEX} />
          </clipPath>
          {unlocked && (
            <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={g0} />
              <stop offset="100%" stopColor={g1} />
            </linearGradient>
          )}
        </defs>

        {unlocked ? (
          <>
            <path
              d={HEX}
              fill={`url(#${gradId})`}
              stroke={gold ? "rgba(255,255,255,0.7)" : "rgba(255,255,255,0.55)"}
              strokeWidth={gold ? 2.4 : 2}
            />
            {gold && (
              <path d="M50 6 L88 27 L88 73 L50 94 L12 73 L12 27 Z" fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth={0.8} />
            )}
            <ellipse
              cx="50"
              cy={gold ? 17 : 18}
              rx={gold ? 36 : 34}
              ry={gold ? 15 : 14}
              fill="#FFFFFF"
              opacity={gold ? 0.34 : 0.22}
              clipPath={`url(#${clipId})`}
            />
            <g transform="translate(50,54) scale(1.7)">{GLYPHS[medal.icon] ?? GLYPHS.medal}</g>
          </>
        ) : (
          <>
            <path d={HEX} fill="rgba(142,142,147,0.12)" stroke="rgba(142,142,147,0.4)" strokeWidth={2} />
            <ellipse cx="50" cy="18" rx="34" ry="14" fill="#FFFFFF" opacity={0.05} clipPath={`url(#${clipId})`} />
            <g transform="translate(50,54) scale(1.7)">{LOCK_GLYPH}</g>
          </>
        )}
      </svg>

      <div>
        <p className={`text-xs font-semibold leading-tight ${unlocked ? "text-slate-900" : "text-slate-400"}`}>
          {t(medal.title)}
        </p>
        {!unlocked && medal.target > 1 && (
          <p className="text-[10px] text-slate-400 tnum">
            {medal.current}/{medal.target}
          </p>
        )}
      </div>
    </div>
  );
}
