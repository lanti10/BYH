"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Play, Pause, Square, Heart, Flame, Timer, Check, X } from "lucide-react";

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
        <p className="text-sm text-white/50">{dayName || "Allenamento"}</p>
        <p className="mt-1 text-xs font-medium text-emerald-400">
          {running ? "In corso" : "In pausa"}
        </p>
      </div>

      {/* Timer grande */}
      <div className="flex flex-col items-center py-4">
        <div className="flex items-center gap-2 text-white/40 text-sm mb-1">
          <Timer className="h-4 w-4" /> Durata
        </div>
        <p className="text-6xl font-bold tnum tracking-tight">{fmt(elapsed)}</p>
      </div>

      {/* Metriche stile anelli */}
      <div className="grid grid-cols-2 gap-3 px-5 mt-2">
        <div className="rounded-3xl glass-dark p-5">
          <div className="flex items-center gap-2 text-orange-400 mb-2">
            <Flame className="h-5 w-5" />
            <span className="text-sm font-medium">Calorie</span>
          </div>
          <p className="text-3xl font-bold tnum">{calories}</p>
          <p className="text-xs text-white/40">kcal stimate</p>
        </div>
        <div className="rounded-3xl glass-dark p-5">
          <div className="flex items-center gap-2 text-red-400 mb-2">
            <Heart className="h-5 w-5" />
            <span className="text-sm font-medium">Battito</span>
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
              Collega fascia
            </button>
          ) : (
            <>
              <p className="text-3xl font-bold tnum">--</p>
              <p className="text-xs text-white/40">non disponibile</p>
            </>
          )}
        </div>
      </div>

      {/* Esercizi */}
      <div className="flex-1 px-5 mt-5">
        <p className="text-sm font-semibold text-white/60 mb-2">
          Esercizi ({done.size}/{exercises.length})
        </p>
        <div className="space-y-2 pb-4">
          {exercises.map((ex) => {
            const isDone = done.has(ex.id);
            return (
              <button
                key={ex.id}
                onClick={() => toggleDone(ex.id)}
                className={`flex w-full items-center gap-3 rounded-2xl p-3 text-left transition-colors ${
                  isDone ? "bg-emerald-600/20" : "bg-white/5"
                }`}
              >
                <div
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 ${
                    isDone ? "border-emerald-500 bg-emerald-500" : "border-white/30"
                  }`}
                >
                  {isDone && <Check className="h-4 w-4 text-white" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`font-semibold truncate ${isDone ? "text-white/60 line-through" : ""}`}>
                    {ex.name}
                  </p>
                  <p className="text-xs text-white/40">
                    {ex.sets} × {ex.reps}
                    {ex.weight != null ? ` · ${ex.weight} kg` : ""}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Barra azioni */}
      <div className="sticky bottom-0 border-t border-white/10 bg-[#0a0a0c]/90 backdrop-blur-xl p-4">
        {confirmEnd ? (
          <div className="flex items-center gap-3">
            <p className="flex-1 text-sm text-white/70">Terminare l&apos;allenamento?</p>
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
              {saving ? "Salvataggio..." : "Sì, termina"}
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
                  <Pause className="h-5 w-5" /> Pausa
                </>
              ) : (
                <>
                  <Play className="h-5 w-5" /> Riprendi
                </>
              )}
            </button>
            <button
              onClick={() => setConfirmEnd(true)}
              className="flex flex-1 items-center justify-center gap-2 rounded-full bg-brand py-3.5 font-semibold hover:bg-brand-hover"
            >
              <Square className="h-5 w-5" /> Fine
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
