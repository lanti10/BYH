"use client";

import { useEffect, useRef, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { Camera, Loader2, Check, AlertCircle, Mail, Ticket, Users, CalendarDays, Pencil, X } from "lucide-react";
import { useT } from "@/lib/i18n/client";
import { syncMyEmail } from "@/app/(dashboard)/trainer/profile/actions";

export function TrainerProfileCard({
  referralCode,
  clientCount,
  memberSince,
}: {
  referralCode: string;
  clientCount: number;
  memberSince: string;
}) {
  const { user, isLoaded } = useUser();
  const { t } = useT();
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [savingName, setSavingName] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  // Cambio email (richiede verifica via codice, gestita da Clerk)
  const [emailMode, setEmailMode] = useState<"view" | "edit" | "verify">("view");
  const [newEmail, setNewEmail] = useState("");
  const [code, setCode] = useState("");
  const [emailBusy, setEmailBusy] = useState(false);
  const [emailMsg, setEmailMsg] = useState<{ type: "ok" | "err" | "info"; text: string } | null>(null);
  const pendingEmailId = useRef<string | null>(null);

  useEffect(() => {
    if (user) {
      setFirstName(user.firstName ?? "");
      setLastName(user.lastName ?? "");
    }
  }, [user]);

  const email = user?.primaryEmailAddress?.emailAddress ?? "—";

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
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("encode failed"))), "image/jpeg", 0.9);
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

  // 1) crea la nuova email su Clerk e invia il codice di verifica
  async function sendEmailCode() {
    if (!user) return;
    const target = newEmail.trim().toLowerCase();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(target)) {
      setEmailMsg({ type: "err", text: t("acct.emailInvalid") });
      return;
    }
    setEmailBusy(true);
    setEmailMsg(null);
    try {
      const ea = await user.createEmailAddress({ email: target });
      await ea.prepareVerification({ strategy: "email_code" });
      pendingEmailId.current = ea.id;
      setEmailMode("verify");
      setEmailMsg({ type: "info", text: t("acct.codeSent") });
    } catch {
      setEmailMsg({ type: "err", text: t("acct.emailErr") });
    } finally {
      setEmailBusy(false);
    }
  }

  // 2) verifica il codice, imposta come primaria e rimuove le vecchie
  async function verifyEmailCode() {
    if (!user || !pendingEmailId.current) return;
    setEmailBusy(true);
    setEmailMsg(null);
    try {
      await user.reload();
      const ea = user.emailAddresses.find((e) => e.id === pendingEmailId.current);
      if (!ea) throw new Error("email non trovata");
      await ea.attemptVerification({ code: code.trim() });
      await user.update({ primaryEmailAddressId: ea.id });
      // rimuovi le altre email
      for (const other of user.emailAddresses) {
        if (other.id !== ea.id) {
          try {
            await other.destroy();
          } catch {
            /* ignora */
          }
        }
      }
      await user.reload();
      await syncMyEmail(ea.emailAddress);
      router.refresh();
      setEmailMode("view");
      setNewEmail("");
      setCode("");
      pendingEmailId.current = null;
      setEmailMsg({ type: "ok", text: t("acct.emailOk") });
    } catch {
      setEmailMsg({ type: "err", text: t("acct.codeErr") });
    } finally {
      setEmailBusy(false);
    }
  }

  function cancelEmail() {
    setEmailMode("view");
    setNewEmail("");
    setCode("");
    pendingEmailId.current = null;
    setEmailMsg(null);
  }

  if (!isLoaded || !user) {
    return <div className="h-96 rounded-3xl glass animate-pulse" />;
  }

  const infoRows = [
    { icon: Ticket, label: t("pf.referralCode"), value: referralCode },
    { icon: Users, label: t("pf.clientsCount"), value: String(clientCount) },
    { icon: CalendarDays, label: t("pf.memberSince"), value: memberSince },
  ];

  return (
    <div className="rounded-3xl glass p-5 sm:p-6 space-y-5">
      {/* Intestazione: avatar (con cambio foto) + nome + ruolo */}
      <div className="flex items-center gap-4">
        <div className="relative shrink-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={user.imageUrl}
            alt={user.fullName ?? "Avatar"}
            className="h-20 w-20 rounded-full object-cover ring-2 ring-slate-100"
          />
          <button
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full bg-brand text-white shadow-md hover:bg-brand-hover disabled:opacity-60"
            aria-label={t("acct.change")}
          >
            {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
          </button>
          <input ref={fileRef} type="file" accept="image/*" hidden onChange={onFile} />
        </div>
        <div className="min-w-0">
          <p className="text-lg font-bold text-slate-900 truncate">{user.fullName || email}</p>
          <p className="text-sm text-slate-500">{t("role.trainer")}</p>
        </div>
      </div>

      {/* Info: email (modificabile) + referral + clienti + iscrizione */}
      <div className="divide-y divide-slate-100 overflow-hidden rounded-2xl bg-slate-50">
        {/* Email */}
        <div className="px-4 py-3">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand/10 text-brand">
              <Mail className="h-4 w-4" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-xs text-slate-400">{t("pf.email")}</p>
              <p className="text-sm font-semibold text-slate-900 truncate">{email}</p>
            </div>
            {emailMode === "view" && (
              <button
                onClick={() => {
                  setEmailMode("edit");
                  setEmailMsg(null);
                }}
                className="shrink-0 inline-flex items-center gap-1 rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-brand hover:bg-slate-100"
              >
                <Pencil className="h-3 w-3" /> {t("acct.editEmail")}
              </button>
            )}
            {emailMode !== "view" && (
              <button
                onClick={cancelEmail}
                className="shrink-0 rounded-full bg-white p-1.5 text-slate-400 hover:text-slate-700"
                aria-label={t("common.cancel")}
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Passo 1: nuova email */}
          {emailMode === "edit" && (
            <div className="mt-3 space-y-2">
              <input
                type="email"
                inputMode="email"
                autoCapitalize="off"
                autoCorrect="off"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder={t("acct.newEmail")}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-base outline-none focus:border-brand"
              />
              <button
                onClick={sendEmailCode}
                disabled={emailBusy}
                className="w-full rounded-full bg-brand py-2.5 text-sm font-semibold text-white shadow-cta hover:bg-brand-hover disabled:opacity-60"
              >
                {emailBusy ? t("session.saving") : t("acct.sendCode")}
              </button>
            </div>
          )}

          {/* Passo 2: codice di verifica */}
          {emailMode === "verify" && (
            <div className="mt-3 space-y-2">
              <input
                inputMode="numeric"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder={t("acct.code")}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-base tracking-widest outline-none focus:border-brand"
              />
              <button
                onClick={verifyEmailCode}
                disabled={emailBusy}
                className="w-full rounded-full bg-brand py-2.5 text-sm font-semibold text-white shadow-cta hover:bg-brand-hover disabled:opacity-60"
              >
                {emailBusy ? t("session.saving") : t("acct.verify")}
              </button>
            </div>
          )}

          {emailMsg && (
            <p
              className={`mt-2 flex items-center gap-1.5 text-xs ${
                emailMsg.type === "ok"
                  ? "text-emerald-600"
                  : emailMsg.type === "err"
                    ? "text-brand"
                    : "text-slate-500"
              }`}
            >
              {emailMsg.type === "ok" ? (
                <Check className="h-3.5 w-3.5" />
              ) : emailMsg.type === "err" ? (
                <AlertCircle className="h-3.5 w-3.5" />
              ) : (
                <Mail className="h-3.5 w-3.5" />
              )}
              {emailMsg.text}
            </p>
          )}
        </div>

        {/* Altre info */}
        {infoRows.map((r) => (
          <div key={r.label} className="flex items-center gap-3 px-4 py-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand/10 text-brand">
              <r.icon className="h-4 w-4" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-xs text-slate-400">{r.label}</p>
              <p className="text-sm font-semibold text-slate-900 truncate">{r.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Modifica nome */}
      <div className="grid grid-cols-2 gap-3">
        <label className="flex flex-col">
          <span className="text-sm text-slate-500 mb-1.5">{t("acct.first")}</span>
          <input
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-base outline-none focus:border-brand"
          />
        </label>
        <label className="flex flex-col">
          <span className="text-sm text-slate-500 mb-1.5">{t("acct.last")}</span>
          <input
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-base outline-none focus:border-brand"
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
        className="w-full rounded-full bg-slate-900 py-3 font-semibold text-white transition-colors hover:bg-slate-700 disabled:opacity-60"
      >
        {savingName ? t("session.saving") : t("acct.saveName")}
      </button>

      <p className="text-xs text-slate-400">{t("acct.note")}</p>
    </div>
  );
}
