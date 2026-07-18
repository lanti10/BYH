"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { Play, Pause, Square, Heart, Flame, Timer, Check, X, Info, StickyNote, ChevronDown } from "lucide-react";
import { useT } from "@/lib/i18n/client";
import type { PlanType } from "@/components/trainer/plan-type-picker";
import { clearSession, fmtDuration as fmt, readSession, writeSession } from "@/lib/session-store";
import { ExerciseWeightEditor, type WeightEntry } from "@/components/shared/exercise-weight-editor";

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

// Dati del giorno da allenare (dall'API /api/workout-day/[dayId])
export type SessionDay = {
  dayId: string;
  dayName: string;
  planType: PlanType;
  weightKg: number;
  doneHref: string; // dove andare a fine allenamento (dipende dal ruolo)
  exercises: Ex[];
  weightHistory?: Record<string, WeightEntry[]>;
};

export function SessionTracker({
  day,
  expanded,
  onMinimize,
  onFinished,
}: {
  day: SessionDay;
  expanded: boolean; // false = tendina abbassata: resta montato ma nascosto
  onMinimize: () => void;
  onFinished: () => void;
}) {
  const { dayId, dayName, exercises, weightKg, planType, doneHref, weightHistory } = day;
  const router = useRouter();
  const { t } = useT();
  const [elapsed, setElapsed] = useState(0);
  const [running, setRunning] = useState(true);
  const [done, setDone] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);
  const [confirmEnd, setConfirmEnd] = useState(false);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [logs, setLogs] = useState<Record<string, WeightEntry[]>>(weightHistory ?? {});
  const showWeight = planType === "WEIGHTS";
  const detail = exercises.find((e) => e.id === detailId) ?? null;
  // Peso da mostrare: quello aggiornato durante l'allenamento, se c'è
  const currentWeight = (ex: Ex) => logs[ex.name]?.[0]?.weight ?? ex.weight;

  // Battito (Web Bluetooth, se supportato)
  const [bpm, setBpm] = useState<number | null>(null);
  const [hrConnected, setHrConnected] = useState(false);
  const hrStats = useRef({ sum: 0, count: 0, max: 0 });
  const touchStartY = useRef<number | null>(null);
  const draggedRef = useRef(false); // distingue il trascinamento dal tocco sulla maniglia
  const [dragY, setDragY] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [closing, setClosing] = useState(false);
  const hrSupported = typeof navigator !== "undefined" && "bluetooth" in navigator;

  // ── Cronometro basato sull'orologio reale ──
  // iOS congela i timer JS quando il telefono è bloccato/in background: contare i secondi
  // perderebbe il tempo trascorso. Teniamo invece i timestamp e ricalcoliamo il tempo REALE,
  // persistendolo così sopravvive a schermo spento o app chiusa e riaperta.
  const stateRef = useRef<{ startedAt: number; accumulatedMs: number; runningSince: number | null }>({
    startedAt: Date.now(),
    accumulatedMs: 0,
    runningSince: Date.now(),
  });
  // Le spunte vanno persistite come il cronometro: sopravvivono a un ricaricamento
  // dell'app o alla chiusura della scheda del browser.
  const doneRef = useRef<Set<string>>(new Set());

  const persist = useCallback(() => {
    const s = stateRef.current;
    writeSession({
      dayId,
      dayName,
      startedAt: s.startedAt,
      accumulatedMs: s.accumulatedMs,
      runningSince: s.runningSince,
      done: [...doneRef.current],
    });
  }, [dayId, dayName]);

  const computeSec = useCallback(() => {
    const s = stateRef.current;
    const ms = s.accumulatedMs + (s.runningSince != null ? Date.now() - s.runningSince : 0);
    return Math.max(0, Math.floor(ms / 1000));
  }, []);

  // Ripristina (o avvia) la sessione al mount: serve quando l'app viene riaperta
  // con un allenamento già in corso.
  useEffect(() => {
    const p = readSession(dayId);
    if (p) {
      stateRef.current = {
        startedAt: p.startedAt,
        accumulatedMs: p.accumulatedMs,
        runningSince: p.runningSince,
      };
      doneRef.current = new Set(p.done);
      setDone(new Set(p.done));
    }
    setRunning(stateRef.current.runningSince != null);
    setElapsed(computeSec());
    persist();
  }, [dayId, computeSec, persist]);

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
    const next = new Set(doneRef.current);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    doneRef.current = next;
    setDone(next);
    persist();
  }

  // ── Tendina ──
  // Ridurre non smonta niente e non naviga: nasconde soltanto questo overlay, con
  // l'app già viva sotto. Il cronometro continua comunque (si calcola dai timestamp).
  // Il trascinamento segue il dito: la schermata scende e rimpicciolisce in modo
  // progressivo, poi o torna su di scatto o completa la chiusura.
  const DISMISS_PX = 110; // oltre questa trascinata, si chiude

  function minimize() {
    persist();
    setClosing(true);
    // Lascia finire l'animazione, poi nascondi. Nessuna navigazione: l'app è già
    // sotto, quindi ricompare all'istante — niente schermo nero, niente attesa.
    setTimeout(() => {
      onMinimize();
      setClosing(false);
      setDragY(0);
    }, 240);
  }

  function onDragStart(y: number) {
    touchStartY.current = y;
    draggedRef.current = false;
    setDragging(true);
  }

  function onDragMove(y: number) {
    const start = touchStartY.current;
    if (start == null) return;
    const raw = y - start;
    if (raw > 4) draggedRef.current = true;
    // segue il dito 1:1 verso il basso; verso l'alto non si muove
    setDragY(Math.max(0, raw));
  }

  function onDragEnd() {
    const shouldClose = dragY > DISMISS_PX;
    touchStartY.current = null;
    setDragging(false);
    if (shouldClose) minimize();
    else setDragY(0); // torna su
  }

  // Quanto la schermata è "scesa": 0 = piena, 1 = chiusa
  const dragP = Math.min(dragY / 420, 1);
  const sheetStyle: React.CSSProperties = closing
    ? { transform: "translateY(100%) scale(0.85)", opacity: 0, borderRadius: 28 }
    : {
        transform: `translateY(${dragY}px) scale(${1 - dragP * 0.22})`,
        borderRadius: dragY > 0 ? Math.min(dragY / 3, 28) : 0,
        opacity: 1 - dragP * 0.25,
      };

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
      clearSession(dayId);
      onFinished();
      router.push(doneHref);
      router.refresh();
    } catch {
      setSaving(false);
    }
  }

  // Ridotto: resta montato (fascia cardio e dati restano vivi) ma sparisce dalla vista.
  return (
    <div className={expanded || closing ? "" : "hidden"}>
    {/* Velo scuro: si dissolve mentre trascini, così sotto riappare l'app da cui sei
        partito. È l'app vera, non uno sfondo: non deve ricaricare nulla. */}
    <div
      className="fixed inset-0 z-40 bg-black/50"
      style={{
        opacity: closing ? 0 : 1 - dragP,
        transition: dragging ? "none" : "opacity .32s ease",
        pointerEvents: "none",
      }}
    />
    <div
      className="fixed inset-0 z-50 flex flex-col overflow-y-auto overflow-x-hidden bg-depth-dark text-white will-change-transform"
      style={{
        ...sheetStyle,
        transformOrigin: "50% 50%",
        // mentre il dito è giù nessuna transizione: deve seguirlo 1:1
        transition: dragging
          ? "none"
          : "transform .32s cubic-bezier(.32,.72,0,1), opacity .32s ease, border-radius .32s ease",
      }}
    >
      {/* Tendina: trascina giù (o tocca) per ridurre e continuare a navigare.
          L'allenamento resta in corso e si riapre dalla barra in fondo. */}
      <div
        style={{ touchAction: "none" }}
        onTouchStart={(e) => onDragStart(e.touches[0].clientY)}
        onTouchMove={(e) => onDragMove(e.touches[0].clientY)}
        onTouchEnd={onDragEnd}
        onTouchCancel={onDragEnd}
      >
        <button
          onClick={() => {
            // un trascinamento non deve valere anche come clic sulla maniglia
            if (!draggedRef.current) minimize();
          }}
          aria-label={t("session.minimize")}
          className="flex w-full flex-col items-center gap-1 px-5 pt-3 pb-1"
        >
          <span className="h-1.5 w-12 rounded-full bg-white/25" />
          <ChevronDown className="h-4 w-4 text-white/40" />
        </button>

        {/* Header */}
        <div className="px-5 pt-2 pb-4 text-center">
          <p className="text-sm text-white/50">{dayName || t("session.workout")}</p>
          <p className="mt-1 text-xs font-medium text-emerald-400">
            {running ? t("session.inProgress") : t("session.paused")}
          </p>
        </div>
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
                onClick={() => setDetailId(ex.id)}
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
                    {showWeight && currentWeight(ex) != null ? ` · ${currentWeight(ex)} kg` : ""}
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

      {/* Sheet dettaglio esercizio (scuro). Montato su <body>: la schermata qui sopra
          ha un transform, che renderebbe `position: fixed` relativo a lei invece
          che allo schermo (finirebbe fuori posto appena la lista è scrollata). */}
      {detail && typeof document !== "undefined" && createPortal(
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 p-0 sm:p-4"
          onClick={() => setDetailId(null)}
        >
          <div
            className="w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl glass-dark-prominent p-6 pb-8 max-h-[85vh] overflow-y-auto text-white"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3 mb-5">
              <h3 className="text-lg font-bold">{detail.name}</h3>
              <button
                onClick={() => setDetailId(null)}
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

                { label: t("wb.rest"), value: `${detail.restSeconds}` },
              ].map((s) => (
                <div key={s.label} className="rounded-2xl bg-white/8 px-4 py-3">
                  <p className="text-xs text-white/50">{s.label}</p>
                  <p className="text-lg font-bold tnum">{s.value}</p>
                </div>
              ))}
            </div>

            {/* Peso modificabile qui, mentre ti alleni: è il momento in cui scopri
                che il carico non va più bene. Salva subito, senza uscire. */}
            {showWeight && (
              <ExerciseWeightEditor
                exerciseId={detail.id}
                coachWeight={detail.weight}
                history={logs[detail.name] ?? []}
                tone="dark"
                onSaved={(entry) =>
                  setLogs((m) => ({ ...m, [detail.name]: [entry, ...(m[detail.name] ?? [])] }))
                }
              />
            )}

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
        </div>,
        document.body
      )}
    </div>
    </div>
  );
}
