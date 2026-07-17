"use client";

import { Play } from "lucide-react";
import { useWorkoutSession } from "./workout-session-provider";

// Avvia l'allenamento come overlay sopra l'app (non naviga): così abbassando poi
// la tendina si ritrova questa stessa schermata, viva e senza ricaricare.
export function StartWorkoutButton({
  dayId,
  dayName,
  label,
  className = "",
}: {
  dayId: string;
  dayName: string;
  label: string;
  className?: string;
}) {
  const session = useWorkoutSession();
  if (!session) return null;

  return (
    <button onClick={() => session.start(dayId, dayName)} className={className}>
      <Play className="h-5 w-5 fill-white" />
      {label}
    </button>
  );
}
