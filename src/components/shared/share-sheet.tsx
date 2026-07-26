"use client";

// Foglio di condivisione: mostra la card, lascia cambiare taglio e scattare una foto,
// poi passa l'immagine al menu di condivisione del telefono (Instagram, WhatsApp…).
//
// La card è disegnata QUI, sul dispositivo: la foto appena scattata non viene mai
// caricata da nessuna parte.

import { useCallback, useEffect, useRef, useState } from "react";
import { Camera, Download, Share2, X, Check } from "lucide-react";
import { useT } from "@/lib/i18n/client";
import {
  CARD_H,
  CARD_W,
  cardToBlob,
  drawShareCard,
  type ShareCardData,
  type ShareLabels,
  type ShareVariant,
} from "@/lib/share-card";

/** Tutto tranne le etichette, che il foglio traduce da sé. */
export type ShareInput = Omit<ShareCardData, "labels" | "variant" | "photo">;

export function ShareSheet({
  input,
  variants,
  shareText,
  onClose,
}: {
  input: ShareInput;
  /** Tagli disponibili, nell'ordine in cui compaiono. Il primo è quello aperto. */
  variants: ShareVariant[];
  shareText: string;
  onClose: () => void;
}) {
  const { t } = useT();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [variant, setVariant] = useState<ShareVariant>(variants[0]);
  const [photo, setPhoto] = useState<HTMLImageElement | null>(null);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  // navigator non esiste durante il render sul server: si legge solo dopo il mount.
  const [canShareFiles, setCanShareFiles] = useState(false);
  useEffect(() => {
    setCanShareFiles(typeof navigator !== "undefined" && typeof navigator.canShare === "function");
  }, []);

  const labels: ShareLabels = {
    joinUs: t("share.joinUs"),
    daysInARow: t("share.daysInARow"),
    min: t("dash.min"),
    exercises: t("session.exercises").toLowerCase(),
    tons: t("share.tons"),
    newRecord: t("share.newRecord"),
    previous: t("share.previous"),
    medalUnlocked: t("share.medalUnlocked"),
    workouts: t("share.workouts"),
    hours: t("share.hours"),
    athletes: t("share.athletes"),
  };

  const data: ShareCardData = { ...input, variant, photo: photo ?? undefined, labels };

  useEffect(() => {
    if (canvasRef.current) drawShareCard(canvasRef.current, data);
    // Ridisegna a ogni cambio di taglio o foto.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [variant, photo, input]);

  // Scatto: su telefono `capture` apre direttamente la fotocamera.
  function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const img = new Image();
    img.onload = () => {
      setPhoto(img);
      setVariant("photo");
      URL.revokeObjectURL(img.src);
    };
    img.src = URL.createObjectURL(file);
  }

  const share = useCallback(async () => {
    const canvas = canvasRef.current;
    if (!canvas || busy) return;
    setBusy(true);
    try {
      const blob = await cardToBlob(canvas);
      if (!blob) return;
      const file = new File([blob], "byh.png", { type: "image/png" });
      const payload = { files: [file], text: shareText };
      // canShare({files}) è l'unico controllo affidabile: su desktop share esiste
      // ma rifiuta i file.
      if (navigator.canShare?.(payload)) {
        await navigator.share(payload);
      } else {
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = "byh.png";
        a.click();
        URL.revokeObjectURL(a.href);
        await navigator.clipboard?.writeText(shareText).catch(() => {});
        setSaved(true);
        setTimeout(() => setSaved(false), 2600);
      }
    } catch {
      // Annullare la condivisione non è un errore: non mostriamo nulla.
    } finally {
      setBusy(false);
    }
  }, [busy, shareText]);

  return (
    <div className="fixed inset-0 z-[60] flex flex-col bg-black/80 backdrop-blur-sm">
      <div className="flex items-center justify-between px-5 pt-4 pb-2">
        <p className="text-sm font-semibold text-white">{t("share.title")}</p>
        <button
          onClick={onClose}
          aria-label={t("common.close")}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="flex flex-1 items-center justify-center overflow-hidden px-6">
        <canvas
          ref={canvasRef}
          width={CARD_W}
          height={CARD_H}
          className="max-h-full w-auto rounded-3xl shadow-2xl"
          style={{ aspectRatio: "9 / 16", maxWidth: "min(100%, 300px)" }}
        />
      </div>

      {variants.length > 1 && (
        <div className="flex justify-center gap-2 px-5 pt-4">
          {variants.map((v) => (
            <button
              key={v}
              onClick={() => setVariant(v)}
              className={`rounded-full px-4 py-2 text-xs font-semibold transition-colors ${
                variant === v ? "bg-white text-slate-900" : "bg-white/10 text-white/70"
              }`}
            >
              {t(`share.variant.${v}`)}
            </button>
          ))}
        </div>
      )}

      <div className="flex items-center gap-3 px-5 pb-8 pt-4">
        <input ref={fileRef} type="file" accept="image/*" capture="environment" onChange={onPick} className="hidden" />
        <button
          onClick={() => fileRef.current?.click()}
          className="flex h-[50px] flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-full bg-white/10 text-sm font-semibold text-white"
        >
          <Camera className="h-5 w-5 shrink-0" /> {photo ? t("share.retake") : t("share.takePhoto")}
        </button>
        <button
          onClick={share}
          disabled={busy}
          className="flex h-[50px] flex-[1.4] items-center justify-center gap-2 whitespace-nowrap rounded-full bg-brand font-semibold text-white shadow-cta transition-colors hover:bg-brand-hover disabled:opacity-60"
        >
          {saved ? <Check className="h-5 w-5" /> : canShareFiles ? <Share2 className="h-5 w-5" /> : <Download className="h-5 w-5" />}
          {saved ? t("share.saved") : t("share.share")}
        </button>
      </div>
    </div>
  );
}
