"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { SessionTracker, type SessionDay } from "@/components/client/session-tracker";
import { ActiveSessionBar } from "./active-session-bar";
import { clearSession, readActiveSession, writeSession } from "@/lib/session-store";

// L'allenamento vive QUI, dentro l'app, e non su una pagina a sé.
// Motivo: abbassando la tendina si deve rivedere subito la schermata da cui sei
// partito. Con una rotta separata dietro non c'è niente (schermo nero) e tornare
// indietro significa navigare, quindi aspettare. Da overlay invece l'app resta
// sotto, viva, e ridurre è istantaneo.
//
// Il tracker resta MONTATO anche da ridotto (solo nascosto): così sopravvivono la
// fascia cardio collegata e i dati già caricati.

type Ctx = {
  activeDayId: string | null;
  start: (dayId: string, dayName: string) => void;
  open: () => void;
  minimize: () => void;
};

const WorkoutSessionCtx = createContext<Ctx | null>(null);

export function useWorkoutSession() {
  return useContext(WorkoutSessionCtx);
}

export function WorkoutSessionProvider({ children }: { children: React.ReactNode }) {
  const [activeDayId, setActiveDayId] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [day, setDay] = useState<SessionDay | null>(null);
  const [loading, setLoading] = useState(false);

  // Riprendi un allenamento già in corso (ricarico la pagina, riapro l'app...)
  useEffect(() => {
    const s = readActiveSession();
    if (s) setActiveDayId(s.dayId);
  }, []);

  // Carica i dati del giorno quando serve
  useEffect(() => {
    if (!activeDayId || day?.dayId === activeDayId) return;
    let cancelled = false;
    setLoading(true);
    fetch(`/api/workout-day/${activeDayId}`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d: SessionDay) => {
        if (!cancelled) setDay(d);
      })
      .catch(() => {
        // Giorno sparito (scheda cambiata): chiudi tutto invece di restare appesi
        if (!cancelled) {
          clearSession(activeDayId);
          setActiveDayId(null);
        }
      })
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [activeDayId, day?.dayId]);

  const start = useCallback((dayId: string, dayName: string) => {
    // Riprendi la sessione di questo giorno se già in corso; altrimenti avviane una
    // nuova, chiudendo quella di un altro giorno (non ci si allena su due schede insieme).
    const now = Date.now();
    const existing = readActiveSession();
    if (!existing || existing.dayId !== dayId) {
      if (existing) clearSession(existing.dayId);
      writeSession({
        dayId,
        dayName,
        startedAt: now,
        accumulatedMs: 0,
        runningSince: now,
        done: [],
      });
    }
    setActiveDayId(dayId);
    setExpanded(true);
  }, []);

  const open = useCallback(() => setExpanded(true), []);
  const minimize = useCallback(() => setExpanded(false), []);

  const finish = useCallback(() => {
    if (activeDayId) clearSession(activeDayId);
    setExpanded(false);
    setActiveDayId(null);
    setDay(null);
  }, [activeDayId]);

  return (
    <WorkoutSessionCtx.Provider value={{ activeDayId, start, open, minimize }}>
      {children}

      {activeDayId && day && (
        <SessionTracker
          key={day.dayId}
          day={day}
          expanded={expanded}
          onMinimize={minimize}
          onFinished={finish}
        />
      )}

      {/* Ridotto: la barra in fondo all'app. Toccala per rialzare la tendina. */}
      {activeDayId && !expanded && !loading && <ActiveSessionBar onOpen={open} />}
    </WorkoutSessionCtx.Provider>
  );
}
