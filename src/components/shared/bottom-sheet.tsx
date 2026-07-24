"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { X } from "lucide-react";
import { useT } from "@/lib/i18n/client";

// Tendina dal basso con trascinamento reale: la maniglia segue il dito e,
// se la trascini giù oltre una soglia, si chiude. Blocca lo scroll del body.
export function BottomSheet({ onClose, children }: { onClose: () => void; children: ReactNode }) {
  const { t } = useT();
  const [dragY, setDragY] = useState(0);
  const [dragging, setDragging] = useState(false);
  const startY = useRef<number | null>(null);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  function onDown(e: React.PointerEvent) {
    startY.current = e.clientY;
    setDragging(true);
    e.currentTarget.setPointerCapture(e.pointerId);
  }
  function onMove(e: React.PointerEvent) {
    if (startY.current == null) return;
    const dy = e.clientY - startY.current;
    setDragY(dy > 0 ? dy : 0); // solo verso il basso
  }
  function onUp() {
    if (startY.current == null) return;
    const dy = dragY;
    startY.current = null;
    setDragging(false);
    if (dy > 110) onClose();
    else setDragY(0);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div
        className="relative w-full max-w-md max-h-[90dvh] overflow-y-auto rounded-t-3xl glass-prominent px-4 pb-8"
        style={{
          transform: `translateY(${dragY}px)`,
          transition: dragging ? "none" : "transform 0.25s ease",
        }}
      >
        {/* Zona di trascinamento: la maniglia + area intorno */}
        <div
          className="sticky top-0 -mx-4 flex touch-none cursor-grab justify-center px-4 pb-2 pt-3 active:cursor-grabbing"
          onPointerDown={onDown}
          onPointerMove={onMove}
          onPointerUp={onUp}
          onPointerCancel={onUp}
        >
          <div className="h-1.5 w-10 rounded-full bg-slate-300" />
        </div>
        <button
          onClick={onClose}
          aria-label={t("common.close")}
          className="absolute right-4 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-500"
        >
          <X className="h-4 w-4" />
        </button>
        {children}
      </div>
    </div>
  );
}
