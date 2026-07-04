"use client";

import {
  Flag, Flame, Medal, Award, Trophy, CalendarCheck, Star, Crown, Zap, Gem, Lock,
} from "lucide-react";
import type { Medal as MedalType } from "@/lib/medals";
import { useT } from "@/lib/i18n/client";

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  flag: Flag,
  flame: Flame,
  medal: Medal,
  award: Award,
  trophy: Trophy,
  "calendar-check": CalendarCheck,
  star: Star,
  crown: Crown,
  zap: Zap,
  gem: Gem,
};

// Esagono medaglia
export function MedalBadge({ medal, size = 76 }: { medal: MedalType; size?: number }) {
  const { t } = useT();
  const Icon = ICONS[medal.icon] ?? Medal;
  const { unlocked } = medal;

  return (
    <div className="flex flex-col items-center gap-2 text-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg viewBox="0 0 100 100" width={size} height={size}>
          <defs>
            <linearGradient id={`g-${medal.id}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={medal.color} />
              <stop offset="100%" stopColor={medal.color} stopOpacity={0.7} />
            </linearGradient>
          </defs>
          <path
            d="M50 3 L91 26 L91 74 L50 97 L9 74 L9 26 Z"
            fill={unlocked ? `url(#g-${medal.id})` : "rgba(120,120,128,.12)"}
            stroke={unlocked ? "rgba(255,255,255,.5)" : "rgba(120,120,128,.2)"}
            strokeWidth={unlocked ? 1.5 : 1}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          {unlocked ? (
            <Icon className="h-7 w-7 text-white drop-shadow" />
          ) : (
            <Lock className="h-6 w-6 text-slate-400" />
          )}
        </div>
      </div>
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
