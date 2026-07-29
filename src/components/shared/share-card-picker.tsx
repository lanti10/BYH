"use client";

// Anteprime dei tagli disponibili: si vede subito cosa si sta per pubblicare e si
// sceglie, invece di ricevere una card sola e prenderla o lasciarla.

import { useEffect, useRef } from "react";
import { Camera } from "lucide-react";
import { useT } from "@/lib/i18n/client";
import { drawShareCard, type ShareCardData, type ShareLabels, type ShareVariant } from "@/lib/share-card";
import type { ShareInput } from "@/components/shared/share-sheet";

const THUMB_W = 240; // pixel reali della miniatura: nitida su schermi retina

function Thumb({ data, width }: { data: ShareCardData; width: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    if (ref.current) drawShareCard(ref.current, data, width);
  }, [data, width]);
  return <canvas ref={ref} className="h-full w-full object-cover" />;
}

export function ShareCardPicker({
  input,
  variants,
  labels,
  selected,
  onSelect,
}: {
  input: ShareInput;
  variants: ShareVariant[];
  labels: ShareLabels;
  selected: ShareVariant | null;
  onSelect: (v: ShareVariant) => void;
}) {
  const { t } = useT();

  return (
    <div className="w-full">
      <p className="mb-3 text-center text-[11px] font-semibold uppercase tracking-[1.2px] text-white/40">
        {t("share.choose")}
      </p>
      {/* Scorre in orizzontale: i tagli possono essere due o quattro a seconda di
          cosa è successo nell'allenamento. */}
      <div className="flex gap-3 overflow-x-auto px-1 pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {variants.map((v) => (
          <button
            key={v}
            onClick={() => onSelect(v)}
            className={`shrink-0 rounded-2xl p-0.5 transition-all ${
              selected === v ? "bg-brand" : "bg-white/10"
            }`}
          >
            <span className="relative block h-[142px] w-20 overflow-hidden rounded-[14px] bg-black">
              <Thumb data={{ ...input, variant: v, labels }} width={THUMB_W} />
              {/* La foto non c'è ancora: l'anteprima da sola sarebbe un rettangolo
                  grigio muto, l'icona dice che ce ne vuole una tua. */}
              {v === "photo" && (
                <span className="absolute inset-0 flex items-center justify-center">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-black/55 backdrop-blur-sm">
                    <Camera className="h-4 w-4 text-white" />
                  </span>
                </span>
              )}
            </span>
            <span className="block py-1.5 text-[11px] font-semibold text-white">
              {t(`share.variant.${v}`)}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
