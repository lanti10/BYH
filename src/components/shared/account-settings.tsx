"use client";

import { useEffect, useRef, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { Camera, Loader2, Check, AlertCircle } from "lucide-react";
import { useT } from "@/lib/i18n/client";

export function AccountSettings() {
  const { user, isLoaded } = useUser();
  const { t } = useT();
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
      setMsg({ type: "ok", text: t("acct.nameOk") });
    } catch {
      setMsg({ type: "err", text: t("acct.nameErr") });
    } finally {
      setSavingName(false);
    }
  }

  // Converte qualsiasi immagine (anche HEIC di iPhone) in un JPEG ridimensionato.
  // Il browser decodifica il file in un <img>, lo ridisegna su canvas a max 512px
  // e lo riesporta come JPEG: risolve formato non supportato + file troppo grandi.
  async function toJpeg(file: File): Promise<File> {
    const dataUrl: string = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error("read failed"));
      reader.readAsDataURL(file);
    });
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const i = new Image();
      i.onload = () => resolve(i);
      i.onerror = () => reject(new Error("image decode failed"));
      i.src = dataUrl;
    });
    const max = 512;
    const scale = Math.min(1, max / Math.max(img.width, img.height));
    const w = Math.max(1, Math.round(img.width * scale));
    const h = Math.max(1, Math.round(img.height * scale));
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("canvas unavailable");
    ctx.drawImage(img, 0, 0, w, h);
    const blob: Blob = await new Promise((resolve, reject) => {
      canvas.toBlob(
        (b) => (b ? resolve(b) : reject(new Error("encode failed"))),
        "image/jpeg",
        0.9
      );
    });
    return new File([blob], "avatar.jpg", { type: "image/jpeg" });
  }

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploading(true);
    setMsg(null);
    try {
      const jpeg = await toJpeg(file);
      await user.setProfileImage({ file: jpeg });
      await user.reload();
      router.refresh();
      setMsg({ type: "ok", text: t("acct.photoOk") });
    } catch (err) {
      console.error("Profile image upload failed:", err);
      setMsg({ type: "err", text: t("acct.photoErr") });
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  if (!isLoaded || !user) {
    return <div className="h-40 rounded-3xl bg-white border border-slate-100 animate-pulse" />;
  }

  return (
    <div className="rounded-3xl glass p-5 sm:p-6 shadow-sm space-y-5">
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
            className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full bg-brand text-white shadow-md hover:bg-brand-hover disabled:opacity-60"
            aria-label="Cambia foto"
          >
            {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
          </button>
          <input ref={fileRef} type="file" accept="image/*" hidden onChange={onFile} />
        </div>
        <div>
          <p className="font-semibold text-slate-900">{t("acct.photo")}</p>
          <button
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="text-sm font-medium text-brand hover:underline disabled:opacity-60"
          >
            {uploading ? t("acct.uploading") : t("acct.change")}
          </button>
        </div>
      </div>

      {/* Nome */}
      <div className="grid grid-cols-2 gap-3">
        <label className="flex flex-col">
          <span className="text-sm text-slate-500 mb-1.5">{t("acct.first")}</span>
          <input
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-brand"
          />
        </label>
        <label className="flex flex-col">
          <span className="text-sm text-slate-500 mb-1.5">{t("acct.last")}</span>
          <input
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-brand"
          />
        </label>
      </div>

      {msg && (
        <p
          className={`flex items-center gap-2 text-sm ${
            msg.type === "ok" ? "text-emerald-600" : "text-brand"
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
        {savingName ? t("session.saving") : t("acct.saveName")}
      </button>

      <p className="text-xs text-slate-400">
        {t("acct.note")}
      </p>
    </div>
  );
}
