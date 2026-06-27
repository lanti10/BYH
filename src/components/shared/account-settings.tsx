"use client";

import { useEffect, useRef, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { Camera, Loader2, Check, AlertCircle } from "lucide-react";

export function AccountSettings() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [savingName, setSavingName] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  useEffect(() => {
    if (user) {
      setFirstName(user.firstName ?? "");
      setLastName(user.lastName ?? "");
    }
  }, [user]);

  async function saveName() {
    if (!user) return;
    setSavingName(true);
    setMsg(null);
    try {
      await user.update({ firstName, lastName });
      router.refresh();
      setMsg({ type: "ok", text: "Nome aggiornato." });
    } catch {
      setMsg({ type: "err", text: "Errore nell'aggiornamento del nome." });
    } finally {
      setSavingName(false);
    }
  }

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploading(true);
    setMsg(null);
    try {
      await user.setProfileImage({ file });
      router.refresh();
      setMsg({ type: "ok", text: "Foto profilo aggiornata." });
    } catch {
      setMsg({ type: "err", text: "Errore nel caricamento della foto." });
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  if (!isLoaded || !user) {
    return <div className="h-40 rounded-3xl bg-white border border-slate-100 animate-pulse" />;
  }

  return (
    <div className="rounded-3xl border border-slate-100 bg-white p-5 sm:p-6 shadow-sm space-y-5">
      {/* Foto */}
      <div className="flex items-center gap-4">
        <div className="relative">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={user.imageUrl}
            alt="Foto profilo"
            className="h-20 w-20 rounded-full object-cover ring-2 ring-slate-100"
          />
          <button
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full bg-[#D42B27] text-white shadow-md hover:bg-[#b8231f] disabled:opacity-60"
            aria-label="Cambia foto"
          >
            {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
          </button>
          <input ref={fileRef} type="file" accept="image/*" hidden onChange={onFile} />
        </div>
        <div>
          <p className="font-semibold text-slate-900">Foto profilo</p>
          <button
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="text-sm font-medium text-[#D42B27] hover:underline disabled:opacity-60"
          >
            {uploading ? "Caricamento..." : "Cambia foto"}
          </button>
        </div>
      </div>

      {/* Nome */}
      <div className="grid grid-cols-2 gap-3">
        <label className="flex flex-col">
          <span className="text-sm text-slate-500 mb-1.5">Nome</span>
          <input
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-[#D42B27]"
          />
        </label>
        <label className="flex flex-col">
          <span className="text-sm text-slate-500 mb-1.5">Cognome</span>
          <input
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-[#D42B27]"
          />
        </label>
      </div>

      {msg && (
        <p
          className={`flex items-center gap-2 text-sm ${
            msg.type === "ok" ? "text-emerald-600" : "text-[#D42B27]"
          }`}
        >
          {msg.type === "ok" ? <Check className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
          {msg.text}
        </p>
      )}

      <button
        onClick={saveName}
        disabled={savingName}
        className="rounded-2xl bg-slate-900 px-6 py-3 font-semibold text-white transition-colors hover:bg-slate-700 disabled:opacity-60"
      >
        {savingName ? "Salvataggio..." : "Salva nome"}
      </button>

      <p className="text-xs text-slate-400">
        L&apos;email e la password si gestiscono dall&apos;icona account in basso nel menu.
      </p>
    </div>
  );
}
