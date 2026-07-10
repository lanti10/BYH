"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

// Vero tasto "indietro": torna alla pagina precedente reale (profilo cliente,
// lista conversazioni, ecc.). Se non c'è cronologia (deep-link/refresh) usa il fallback.
export function BackButton({
  fallbackHref,
  className,
  label,
}: {
  fallbackHref: string;
  className?: string;
  label?: string;
}) {
  const router = useRouter();
  return (
    <button
      type="button"
      aria-label={label ?? "Back"}
      onClick={() => {
        if (typeof window !== "undefined" && window.history.length > 1) router.back();
        else router.push(fallbackHref);
      }}
      className={className}
    >
      <ArrowLeft className="h-5 w-5" />
    </button>
  );
}
