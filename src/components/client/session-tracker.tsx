"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Play, Pause, Square, Heart, Flame, Timer, Check, X, ChevronRight } from "lucide-react";
import { useT } from "@/lib/i18n/client";

type Ex = { id: string; name: string; sets: number; reps: string; weight: number | null };

const MET = 6; // allenamento con pesi (moderato-intenso)

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
}: {
  dayId: string;
  dayName: string;
  exercises: Ex[];
  weightKg: number;
}) {
  const router = useRouter();
  const { t } = useT();
  const [elapsed, setElapsed] = useState(0);
  const [running, setRunning] = useState(true);
  const [done, setDone] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);
  const [confirmEnd, setConfirmEnd] = useState(false);

  // Battito (Web Bluetooth, se supportato)
  const [bpm, setBpm] = useState<number | null>(null);
  const [hrConnected, setHrConnected] = useState(false);
  const hrStats = useRef({ sum: 0, count: 0, max: 0 });
  const hrSupported = typeof navigator !== "undefined" && "bluetooth" in navigator;

  // Cronometro
  useEffect(() => {
    if (!running) return;
    const t = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(t);
  }, [running]);

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

  const calories = Math.round((MET * 3.5 * weightKg) / 200 * (elapsed / 60));

  async function connectHr() {
    try {
      const anyNav = navigator as unknown as { bluetooth: { requestDevice: (o: unknown) => Promise<BluetoothDevice> } };
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
    setRunning(false);
    const st = hrStats.current;
    try {
      await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workoutDayId: dayId,
          durationSec: elapsed,
          calories,
          avgHeartRate: st.count ? Math.round(st.sum / st.count) : null,
          maxHeartRate: st.max || null,
        }),
      });
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
              <button
                key={ex.id}
                onClick={() => toggleDone(ex.id)}
                className={`flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors ${
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
                  <p className={`text-sm font-semibold truncate ${isDone ? "text-white/50" : "text-white"}`}>
                    {ex.name}
                  </p>
                  <p className="text-xs text-white/50 tnum">
                    {ex.sets} × {ex.reps}
                    {ex.weight != null ? ` · ${ex.weight} kg` : ""}
                  </p>
                </div>
                {isDone ? (
                  <span className="flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full bg-emerald-500">
                    <Check className="h-3 w-3 text-white" strokeWidth={3} />
                  </span>
                ) : (
                  <ChevronRight className="h-4 w-4 shrink-0 text-white/30" />
                )}
              </button>
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
              onClick={() => setRunning((r) => !r)}
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
    </div>
  );
}
