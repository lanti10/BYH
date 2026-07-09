"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Play, Pause, Square, Heart, Flame, Timer, Check, X, Info, StickyNote } from "lucide-react";
import { useT } from "@/lib/i18n/client";
import type { PlanType } from "@/components/trainer/plan-type-picker";

type Ex = {
  id: string;
  name: string;
  sets: number;
  reps: string;
  weight: number | null;
  restSeconds: number;
  notes?: string | null;
};

// MET (dispendio energetico) per tipo di scheda
const MET_BY_TYPE: Record<PlanType, number> = {
  WEIGHTS: 6, // pesi (moderato-intenso)
  BODYWEIGHT: 5, // corpo libero
  SWIMMING: 8, // nuoto
};

function fmt(sec: number) {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
}

export function SessionTracker({
  dayId,
  dayName,
  exercises,
  weightKg,
  planType = "WEIGHTS",
}: {
  dayId: string;
  dayName: string;
  exercises: Ex[];
  weightKg: number;
  planType?: PlanType;
}) {
  const router = useRouter();
  const { t } = useT();
  const [elapsed, setElapsed] = useState(0);
  const [running, setRunning] = useState(true);
  const [done, setDone] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);
  const [confirmEnd, setConfirmEnd] = useState(false);
  const [detail, setDetail] = useState<Ex | null>(null);
  const showWeight = planType === "WEIGHTS";

  // Battito (Web Bluetooth, se supportato)
  const [bpm, setBpm] = useState<number | null>(null);
  const [hrConnected, setHrConnected] = useState(false);
  const hrStats = useRef({ sum: 0, count: 0, max: 0 });
  const hrSupported = typeof navigator !== "undefined" && "bluetooth" in navigator;

  // ── Cronometro basato sull'orologio reale ──
  // iOS congela i timer JS quando il telefono è bloccato/in background: contare i secondi
  // perderebbe il tempo trascorso. Teniamo invece i timestamp e ricalcoliamo il tempo REALE,
  // persistendolo così sopravvive a schermo spento o app chiusa e riaperta.
  const storageKey = `byh-session-${dayId}`;
  const stateRef = useRef<{ startedAt: number; accumulatedMs: number; runningSince: number | null }>({
    startedAt: Date.now(),
    accumulatedMs: 0,
    runningSince: Date.now(),
  });

  const persist = useCallback(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(stateRef.current));
    } catch {
      /* storage non disponibile */
    }
  }, [storageKey]);

  const computeSec = useCallback(() => {
    const s = stateRef.current;
    const ms = s.accumulatedMs + (s.runningSince != null ? Date.now() - s.runningSince : 0);
    return Math.max(0, Math.floor(ms / 1000));
  }, []);

  // Ripristina (o avvia) la sessione al mount
  useEffect(() => {
    let s = stateRef.current;
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const p = JSON.parse(raw);
        // Scarta sessioni troppo vecchie (>12h): verosimilmente abbandonate
        if (
          typeof p.accumulatedMs === "number" &&
          typeof p.startedAt === "number" &&
          Date.now() - p.startedAt < 12 * 60 * 60 * 1000
        ) {
          s = {
            startedAt: p.startedAt,
            accumulatedMs: p.accumulatedMs,
            runningSince: typeof p.runningSince === "number" ? p.runningSince : null,
          };
        }
      }
    } catch {
      /* ignora */
    }
    stateRef.current = s;
    setRunning(s.runningSince != null);
    setElapsed(computeSec());
    persist();
  }, [storageKey, computeSec, persist]);

  // Aggiorna il display ogni secondo + subito al ritorno in primo piano (recupera il tempo in background)
  useEffect(() => {
    const tick = () => setElapsed(computeSec());
    const id = setInterval(tick, 1000);
    const onVisible = () => {
      if (!document.hidden) tick();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [computeSec]);

  function togglePause() {
    const s = stateRef.current;
    if (s.runningSince != null) {
      s.accumulatedMs += Date.now() - s.runningSince; // congela il tempo maturato
      s.runningSince = null;
      setRunning(false);
    } else {
      s.runningSince = Date.now();
      setRunning(true);
    }
    persist();
    setElapsed(computeSec());
  }

  // Tieni acceso lo schermo se possibile
  useEffect(() => {
    let lock: WakeLockSentinel | null = null;
    const anyNav = navigator as Navigator & { wakeLock?: { request: (t: string) => Promise<WakeLockSentinel> } };
    if (anyNav.wakeLock) {
      anyNav.wakeLock.request("screen").then((l) => (lock = l)).catch(() => {});
    }
    return () => {
      lock?.release?.().catch(() => {});
    };
  }, []);

  const calories = Math.round((MET_BY_TYPE[planType] * 3.5 * weightKg) / 200 * (elapsed / 60));

  async function connectHr() {
    try {
      const anyNav = navigator as unknown as { bluetooth: { requestDevice: (o: unknown) => Promise<{ gatt?: { connect: () => Promise<{ getPrimaryService: (s: string) => Promise<{ getCharacteristic: (c: string) => Promise<{ startNotifications: () => Promise<unknown>; addEventListener: (t: string, cb: (e: Event) => void) => void }> }> }> } }> } };
      const device = await anyNav.bluetooth.requestDevice({
        filters: [{ services: ["heart_rate"] }],
      });
      const server = await device.gatt!.connect();
      const service = await server.getPrimaryService("heart_rate");
      const ch = await service.getCharacteristic("heart_rate_measurement");
      await ch.startNotifications();
      ch.addEventListener("characteristicvaluechanged", (e: Event) => {
        const dv = (e.target as unknown as { value: DataView }).value;
        const flags = dv.getUint8(0);
        const value = flags & 0x01 ? dv.getUint16(1, true) : dv.getUint8(1);
        setBpm(value);
        const st = hrStats.current;
        st.sum += value;
        st.count += 1;
        if (value > st.max) st.max = value;
      });
      setHrConnected(true);
    } catch {
      /* annullato o non disponibile */
    }
  }

  function toggleDone(id: string) {
    setDone((d) => {
      const next = new Set(d);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function end() {
    setSaving(true);
    // Congela il tempo finale reale
    const s = stateRef.current;
    if (s.runningSince != null) {
      s.accumulatedMs += Date.now() - s.runningSince;
      s.runningSince = null;
    }
    const finalSec = Math.max(0, Math.floor(s.accumulatedMs / 1000));
    const finalCalories = Math.round((MET_BY_TYPE[planType] * 3.5 * weightKg) / 200 * (finalSec / 60));
    setRunning(false);
    const st = hrStats.current;
    try {
      await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workoutDayId: dayId,
          durationSec: finalSec,
          calories: finalCalories,
          avgHeartRate: st.count ? Math.round(st.sum / st.count) : null,
          maxHeartRate: st.max || null,
        }),
      });
      try {
        localStorage.removeItem(storageKey);
      } catch {
        /* ignora */
      }
      router.push("/client/progress");
      router.refresh();
    } catch {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-depth-dark text-white flex flex-col">
      {/* Header */}
      <div className="px-5 pt-6 pb-4 text-center">
        <p className="text-sm text-white/50">{dayName || t("session.workout")}</p>
        <p className="mt-1 text-xs font-medium text-emerald-400">
          {running ? t("session.inProgress") : t("session.paused")}
        </p>
      </div>

      {/* Timer grande */}
      <div className="flex flex-col items-center py-4">
        <div className="flex items-center gap-2 text-white/40 text-sm mb-1">
          <Timer className="h-4 w-4" /> {t("session.duration")}
        </div>
        <p className="text-6xl font-bold tnum tracking-tight">{fmt(elapsed)}</p>
      </div>

      {/* Metriche stile anelli */}
      <div className="grid grid-cols-2 gap-3 px-5 mt-2">
        <div className="rounded-3xl glass-dark p-5">
          <div className="flex items-center gap-2 text-orange-400 mb-2">
            <Flame className="h-5 w-5" />
            <span className="text-sm font-medium">{t("session.calories")}</span>
          </div>
          <p className="text-3xl font-bold tnum">{calories}</p>
          <p className="text-xs text-white/40">{t("session.estKcal")}</p>
        </div>
        <div className="rounded-3xl glass-dark p-5">
          <div className="flex items-center gap-2 text-red-400 mb-2">
            <Heart className="h-5 w-5" />
            <span className="text-sm font-medium">{t("session.heart")}</span>
          </div>
          {hrConnected ? (
            <>
              <p className="text-3xl font-bold tnum">{bpm ?? "--"}</p>
              <p className="text-xs text-white/40">bpm</p>
            </>
          ) : hrSupported ? (
            <button
              onClick={connectHr}
              className="mt-1 rounded-full bg-white/10 px-3 py-1.5 text-xs font-medium hover:bg-white/20"
            >
              {t("session.connect")}
            </button>
          ) : (
            <>
              <p className="text-3xl font-bold tnum">--</p>
              <p className="text-xs text-white/40">{t("session.na")}</p>
            </>
          )}
        </div>
      </div>

      {/* Esercizi */}
      <div className="flex-1 px-5 mt-5">
        <p className="text-sm font-semibold text-white/60 mb-2">
          {t("session.exercises")} ({done.size}/{exercises.length})
        </p>
        <div className="overflow-hidden rounded-3xl glass-dark mb-4">
          {exercises.map((ex, i) => {
            const isDone = done.has(ex.id);
            return (
              <div
                key={ex.id}
                onClick={() => setDetail(ex)}
                className={`flex w-full cursor-pointer items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-white/[0.03] ${
                  i < exercises.length - 1 ? "border-b border-white/8" : ""
                }`}
              >
                <div
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-[13px] font-bold tnum ${
                    isDone ? "bg-white/8 text-white/50" : "bg-brand/15 text-[#ff6b61]"
                  }`}
                >
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`flex items-center gap-1.5 text-sm font-semibold ${isDone ? "text-white/50" : "text-white"}`}>
                    <span className="truncate">{ex.name}</span>
                    {ex.notes?.trim() && <StickyNote className="h-3 w-3 shrink-0 text-white/40" />}
                  </p>
                  <p className="text-xs text-white/50 tnum">
                    {ex.sets} × {ex.reps}
                    {showWeight && ex.weight != null ? ` · ${ex.weight} kg` : ""}
                  </p>
                </div>
                {/* Info: apre il dettaglio (esplicito, oltre al tap sulla riga) */}
                <Info className="h-4 w-4 shrink-0 text-white/30" />
                {/* Cerchio: seleziona il completamento dell'esercizio */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleDone(ex.id);
                  }}
                  aria-label={t("session.markDone")}
                  className={`flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
                    isDone ? "border-emerald-500 bg-emerald-500" : "border-white/30 hover:border-white/60"
                  }`}
                >
                  {isDone && <Check className="h-3.5 w-3.5 text-white" strokeWidth={3} />}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Barra azioni */}
      <div className="sticky bottom-0 border-t border-white/10 bg-[#0a0a0c]/90 backdrop-blur-xl p-4">
        {confirmEnd ? (
          <div className="flex items-center gap-3">
            <p className="flex-1 text-sm text-white/70">{t("session.confirmEnd")}</p>
            <button
              onClick={() => setConfirmEnd(false)}
              className="rounded-full bg-white/10 px-4 py-2.5 text-sm font-medium"
            >
              <X className="h-4 w-4" />
            </button>
            <button
              onClick={end}
              disabled={saving}
              className="rounded-full bg-brand shadow-cta px-5 py-2.5 text-sm font-bold disabled:opacity-60"
            >
              {saving ? t("session.saving") : t("session.yesEnd")}
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <button
              onClick={togglePause}
              className="flex flex-1 items-center justify-center gap-2 rounded-full bg-white/10 py-3.5 font-semibold hover:bg-white/20"
            >
              {running ? (
                <>
                  <Pause className="h-5 w-5" /> {t("session.pause")}
                </>
              ) : (
                <>
                  <Play className="h-5 w-5" /> {t("session.resume")}
                </>
              )}
            </button>
            <button
              onClick={() => setConfirmEnd(true)}
              className="flex flex-1 items-center justify-center gap-2 rounded-full bg-brand py-3.5 font-semibold hover:bg-brand-hover"
            >
              <Square className="h-5 w-5" /> {t("session.finish")}
            </button>
          </div>
        )}
      </div>

      {/* Sheet dettaglio esercizio (scuro) */}
      {detail && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 p-0 sm:p-4"
          onClick={() => setDetail(null)}
        >
          <div
            className="w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl glass-dark-prominent p-6 pb-8 max-h-[85vh] overflow-y-auto text-white"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3 mb-5">
              <h3 className="text-lg font-bold">{detail.name}</h3>
              <button
                onClick={() => setDetail(null)}
                className="shrink-0 rounded-full bg-white/10 p-1.5 text-white/70 hover:bg-white/20"
                aria-label={t("common.close")}
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              {[
                { label: t("wb.sets"), value: String(detail.sets) },
                { label: t("wb.reps"), value: detail.reps },
                ...(showWeight
                  ? [{ label: t("wb.weight"), value: detail.weight != null ? `${detail.weight}` : "—" }]
                  : []),
                { label: t("wb.rest"), value: `${detail.restSeconds}` },
              ].map((s) => (
                <div key={s.label} className="rounded-2xl bg-white/8 px-4 py-3">
                  <p className="text-xs text-white/50">{s.label}</p>
                  <p className="text-lg font-bold tnum">{s.value}</p>
                </div>
              ))}
            </div>

            <div className="mt-4">
              <div className="flex items-center gap-1.5 mb-1.5 text-sm font-semibold text-white/80">
                <StickyNote className="h-4 w-4 text-[#ff6b61]" /> {t("plan.notes")}
              </div>
              {detail.notes?.trim() ? (
                <p className="rounded-2xl bg-white/8 p-4 text-sm text-white/70 whitespace-pre-wrap">
                  {detail.notes}
                </p>
              ) : (
                <p className="text-sm text-white/40">{t("plan.noNotes")}</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
