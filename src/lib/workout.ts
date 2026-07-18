// Logica di progressione: quale giorno della scheda tocca oggi.
// I giorni sono ordinati (dayOfWeek = indice 0..N-1). Dopo l'ultimo si ricomincia dal primo.

type DayRef = { id: string };
type SessionRef = { workoutDayId: string | null; completedAt: Date };

export function getNextDayIndex(
  days: DayRef[],
  sessions: SessionRef[]
): { nextIndex: number; doneToday: boolean } {
  if (days.length === 0) return { nextIndex: 0, doneToday: false };

  const dayIds = new Set(days.map((d) => d.id));
  const planSessions = sessions
    .filter((s) => s.workoutDayId != null && dayIds.has(s.workoutDayId))
    .sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime());

  const last = planSessions[0];
  if (!last) return { nextIndex: 0, doneToday: false };

  const lastIdx = days.findIndex((d) => d.id === last.workoutDayId);
  const nextIndex = ((lastIdx === -1 ? -1 : lastIdx) + 1) % days.length;

  const now = new Date();
  const lastDate = new Date(last.completedAt);
  const doneToday =
    lastDate.getFullYear() === now.getFullYear() &&
    lastDate.getMonth() === now.getMonth() &&
    lastDate.getDate() === now.getDate();

  return { nextIndex, doneToday };
}

// Scheda pianificata per giorni fissi della settimana (scheduledWeekday 1=Lun..7=Dom).
// Ritorna null se la scheda NON è pianificata (nessun giorno ha un weekday) → si usa la
// progressione ciclica. Altrimenti dice quale giorno tocca oggi (o il prossimo se oggi è riposo).
export function getScheduledTodayIndex(
  days: { scheduledWeekday?: number | null }[]
): { index: number; restToday: boolean } | null {
  if (!days.some((d) => d.scheduledWeekday != null)) return null;

  const todayW = ((new Date().getDay() + 6) % 7) + 1; // JS: 0=Dom → 1=Lun..7=Dom
  const todayIdx = days.findIndex((d) => d.scheduledWeekday === todayW);
  if (todayIdx !== -1) return { index: todayIdx, restToday: false };

  // Oggi è riposo: trova il prossimo giorno pianificato (nella settimana, ciclico)
  let best = -1;
  let bestDelta = 8;
  days.forEach((d, i) => {
    if (d.scheduledWeekday == null) return;
    let delta = (d.scheduledWeekday - todayW + 7) % 7;
    if (delta === 0) delta = 7;
    if (delta < bestDelta) {
      bestDelta = delta;
      best = i;
    }
  });
  return { index: best === -1 ? 0 : best, restToday: true };
}

// True se in `sessions` esiste un allenamento del giorno `dayId` completato oggi
export function isDayDoneToday(dayId: string, sessions: { workoutDayId: string | null; completedAt: Date }[]): boolean {
  const now = new Date();
  return sessions.some((s) => {
    if (s.workoutDayId !== dayId) return false;
    const d = new Date(s.completedAt);
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate();
  });
}

// Durata stimata di un giorno di allenamento (minuti): ~45s per serie + recupero
export function estimateDuration(
  exercises: { sets: number; restSeconds: number }[]
): number {
  const sec = exercises.reduce((s, e) => s + e.sets * (45 + e.restSeconds), 0);
  return Math.max(5, Math.round(sec / 60));
}

// Streak: giorni consecutivi con allenamento, contando da oggi (o ieri) all'indietro
export function getStreak(sessions: { completedAt: Date }[]): number {
  if (sessions.length === 0) return 0;
  const daySet = new Set(
    sessions.map((s) => {
      const d = new Date(s.completedAt);
      return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    })
  );
  const key = (d: Date) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;

  const cursor = new Date();
  // La streak può partire da oggi oppure da ieri (oggi non ancora allenato)
  if (!daySet.has(key(cursor))) cursor.setDate(cursor.getDate() - 1);
  if (!daySet.has(key(cursor))) return 0;

  let streak = 0;
  while (daySet.has(key(cursor))) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}
