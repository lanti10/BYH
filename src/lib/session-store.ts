// Stato dell'allenamento in corso, condiviso tra il tracker a schermo intero
// (che lo scrive) e la barra "allenamento in corso" del layout (che lo legge).
//
// Vive in localStorage e NON conta i tick: tiene i timestamp. Così il tempo continua
// a maturare anche quando il tracker è smontato — cioè quando l'utente abbassa la
// tendina e naviga altrove — oltre che a schermo spento o ad app chiusa e riaperta.

export const SESSION_KEY_PREFIX = "byh-session-";
const MAX_AGE_MS = 12 * 60 * 60 * 1000; // oltre = sessione abbandonata

export type StoredSession = {
  dayId: string;
  dayName: string;
  startedAt: number;
  accumulatedMs: number;
  runningSince: number | null; // null = in pausa
  done: string[]; // id esercizi completati
};

export const sessionKey = (dayId: string) => `${SESSION_KEY_PREFIX}${dayId}`;

export function elapsedSec(s: Pick<StoredSession, "accumulatedMs" | "runningSince">) {
  const ms = s.accumulatedMs + (s.runningSince != null ? Date.now() - s.runningSince : 0);
  return Math.max(0, Math.floor(ms / 1000));
}

export function fmtDuration(sec: number) {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
}

function parse(raw: string, key: string): StoredSession | null {
  try {
    const p = JSON.parse(raw);
    if (typeof p?.startedAt !== "number" || typeof p?.accumulatedMs !== "number") return null;
    return {
      dayId: typeof p.dayId === "string" ? p.dayId : key.slice(SESSION_KEY_PREFIX.length),
      dayName: typeof p.dayName === "string" ? p.dayName : "",
      startedAt: p.startedAt,
      accumulatedMs: p.accumulatedMs,
      runningSince: typeof p.runningSince === "number" ? p.runningSince : null,
      done: Array.isArray(p.done) ? p.done.filter((x: unknown) => typeof x === "string") : [],
    };
  } catch {
    return null;
  }
}

// Sessione salvata per un giorno specifico (usata dal tracker al mount).
export function readSession(dayId: string): StoredSession | null {
  try {
    const key = sessionKey(dayId);
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const s = parse(raw, key);
    if (!s) return null;
    if (Date.now() - s.startedAt > MAX_AGE_MS) {
      localStorage.removeItem(key);
      return null;
    }
    return s;
  } catch {
    return null;
  }
}

// La sessione attiva più recente, qualunque sia il giorno (usata dalla barra del layout).
// Ripulisce per strada quelle abbandonate.
export function readActiveSession(): StoredSession | null {
  try {
    let best: StoredSession | null = null;
    const stale: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key?.startsWith(SESSION_KEY_PREFIX)) continue;
      const raw = localStorage.getItem(key);
      if (!raw) continue;
      const s = parse(raw, key);
      if (!s) continue;
      if (Date.now() - s.startedAt > MAX_AGE_MS) {
        stale.push(key);
        continue;
      }
      if (!best || s.startedAt > best.startedAt) best = s;
    }
    stale.forEach((k) => localStorage.removeItem(k));
    return best;
  } catch {
    return null;
  }
}

export function writeSession(s: StoredSession) {
  try {
    localStorage.setItem(sessionKey(s.dayId), JSON.stringify(s));
  } catch {
    /* storage non disponibile */
  }
}

export function clearSession(dayId: string) {
  try {
    localStorage.removeItem(sessionKey(dayId));
  } catch {
    /* ignora */
  }
}
