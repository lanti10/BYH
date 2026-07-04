// Medagliere: traguardi calcolati dalle sessioni di allenamento.

export type Medal = {
  id: string;
  title: string;
  description: string;
  icon: string; // chiave mappata a icona lucide nel componente
  color: string;
  unlocked: boolean;
  current: number;
  target: number;
};

type Sess = { completedAt: Date };

function startOfDayMs(d: Date): number {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x.getTime();
}
function mondayOf(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  x.setDate(x.getDate() - ((x.getDay() + 6) % 7));
  return x;
}

export function maxStreak(sessions: Sess[]): number {
  const dayKeys = [...new Set(sessions.map((s) => startOfDayMs(s.completedAt)))].sort((a, b) => a - b);
  let max = 0;
  let cur = 0;
  let prev: number | null = null;
  const DAY = 86400000;
  for (const t of dayKeys) {
    cur = prev !== null && t - prev === DAY ? cur + 1 : 1;
    if (cur > max) max = cur;
    prev = t;
  }
  return max;
}

// Numero di settimane in cui sono stati fatti almeno `goal` giorni distinti di allenamento
export function completeWeeks(sessions: Sess[], goal: number): number {
  const byWeek = new Map<string, Set<number>>();
  for (const s of sessions) {
    const key = mondayOf(s.completedAt).toISOString().slice(0, 10);
    if (!byWeek.has(key)) byWeek.set(key, new Set());
    byWeek.get(key)!.add(startOfDayMs(s.completedAt));
  }
  let n = 0;
  for (const [, days] of byWeek) if (days.size >= goal) n++;
  return n;
}

export function computeMedals(sessions: Sess[], weeklyGoal: number): Medal[] {
  const total = sessions.length;
  const streak = maxStreak(sessions);
  const weeks = completeWeeks(sessions, Math.max(1, weeklyGoal));

  const defs: Omit<Medal, "unlocked" | "current">[] = [
    { id: "first", title: "medal.first", description: "medal.first.d", icon: "flag", color: "#FF375F", target: 1 },
    { id: "s10", title: "medal.s10", description: "medal.s10.d", icon: "flame", color: "#FF9F0A", target: 10 },
    { id: "s25", title: "medal.s25", description: "medal.s25.d", icon: "medal", color: "#5AC8FA", target: 25 },
    { id: "s50", title: "medal.s50", description: "medal.s50.d", icon: "award", color: "#BF5AF2", target: 50 },
    { id: "s100", title: "medal.s100", description: "medal.s100.d", icon: "trophy", color: "#FFD60A", target: 100 },
    { id: "week1", title: "medal.week1", description: "medal.week1.d", icon: "calendar-check", color: "#30D158", target: 1 },
    { id: "week4", title: "medal.week4", description: "medal.week4.d", icon: "star", color: "#FF375F", target: 4 },
    { id: "week12", title: "medal.week12", description: "medal.week12.d", icon: "crown", color: "#FFD60A", target: 12 },
    { id: "streak7", title: "medal.streak7", description: "medal.streak7.d", icon: "zap", color: "#FF9F0A", target: 7 },
    { id: "streak30", title: "medal.streak30", description: "medal.streak30.d", icon: "gem", color: "#5AC8FA", target: 30 },
  ];

  const valueFor = (id: string): number => {
    if (id.startsWith("s")) return total;
    if (id.startsWith("week")) return weeks;
    if (id.startsWith("streak")) return streak;
    if (id === "first") return total;
    return 0;
  };

  return defs.map((d) => {
    const current = valueFor(d.id);
    return { ...d, current: Math.min(current, d.target), unlocked: current >= d.target };
  });
}
