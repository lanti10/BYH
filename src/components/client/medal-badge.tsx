"use client";

import type { Medal as MedalType } from "@/lib/medals";
import { useT } from "@/lib/i18n/client";
import { GRAD, HEX_INNER_PATH, HEX_PATH, LOCK_GLYPH, glyphFor, type Prim } from "@/lib/medal-art";

// Medaglie "BYH Pulse" (design Claude): esagono liquid-glass con gradiente del
// colore accento, riflesso speculare in alto e glyph bianco. Livello oro
// (#FFD60A) con cornice interna e riflesso più marcato. Stato bloccato = vetro
// grigio + lucchetto. Geometria e luce identiche per tutte → sembrano un set.

// Le forme vivono in src/lib/medal-art.ts, condivise con la card da condividere
// sui social (disegnata su canvas): un solo posto, nessuna versione che diverge.
function Glyph({ prims }: { prims: Prim[] }) {
  return (
    <>
      {prims.map((p, i) => {
        if (p.k === "path")
          return (
            <path
              key={i}
              d={p.d}
              fill={p.fill ?? "none"}
              stroke={p.stroke}
              strokeWidth={p.w}
              strokeLinecap={p.round ? "round" : undefined}
              strokeLinejoin={p.round ? "round" : undefined}
            />
          );
        if (p.k === "circle")
          return <circle key={i} cx={p.cx} cy={p.cy} r={p.r} fill={p.fill ?? "none"} stroke={p.stroke} strokeWidth={p.w} />;
        if (p.k === "rect")
          return (
            <rect key={i} x={p.x} y={p.y} width={p.w} height={p.h} rx={p.r} fill={p.fill ?? "none"} stroke={p.stroke} strokeWidth={p.sw} />
          );
        return (
          <line
            key={i}
            x1={p.x1}
            y1={p.y1}
            x2={p.x2}
            y2={p.y2}
            stroke={p.stroke}
            strokeWidth={p.w}
            strokeLinecap={p.round ? "round" : undefined}
          />
        );
      })}
    </>
  );
}

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
            <path d={HEX_PATH} />
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
              d={HEX_PATH}
              fill={`url(#${gradId})`}
              stroke={gold ? "rgba(255,255,255,0.7)" : "rgba(255,255,255,0.55)"}
              strokeWidth={gold ? 2.4 : 2}
            />
            {gold && (
              <path d={HEX_INNER_PATH} fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth={0.8} />
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
            <g transform="translate(50,54) scale(1.7)"><Glyph prims={glyphFor(medal.icon)} /></g>
          </>
        ) : (
          <>
            <path d={HEX_PATH} fill="rgba(142,142,147,0.12)" stroke="rgba(142,142,147,0.4)" strokeWidth={2} />
            <ellipse cx="50" cy="18" rx="34" ry="14" fill="#FFFFFF" opacity={0.05} clipPath={`url(#${clipId})`} />
            <g transform="translate(50,54) scale(1.7)"><Glyph prims={LOCK_GLYPH} /></g>
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
