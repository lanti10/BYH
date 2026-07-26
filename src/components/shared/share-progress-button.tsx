"use client";

// Bottone che apre il foglio di condivisione. Vive sulle dashboard: recupera chi
// non ha condiviso subito a fine allenamento.

import { useState } from "react";
import { Share2 } from "lucide-react";
import { ShareSheet, type ShareInput } from "@/components/shared/share-sheet";
import type { ShareVariant } from "@/lib/share-card";

export function ShareProgressButton({
  input,
  variants,
  shareText,
  label,
  className,
}: {
  input: ShareInput;
  variants: ShareVariant[];
  shareText: string;
  label: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button onClick={() => setOpen(true)} className={className}>
        <Share2 className="h-5 w-5" /> {label}
      </button>
      {open && (
        <ShareSheet input={input} variants={variants} shareText={shareText} onClose={() => setOpen(false)} />
      )}
    </>
  );
}
